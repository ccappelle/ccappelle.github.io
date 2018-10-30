
class Ants extends SuperModel{
    constructor( scene ){
        super( scene );

        this.size = 10;

        this.ants = [];


        this.scale = 0.25;
        this.worldScale = 0.5;
        this.worldSize = 10;

        this.pause = true;

        this.ups = 10;

        this.decayPerUpdate = 0.1;

        this.addAnt = ( e ) => this.addAntInternal( scene );


        this.gui.add( this, 'pause' );

        this.gui.add( this, 'addAnt' );

        this.gui.add( this, 'ups' ).min( 1 ).max( 60 ).step( 1 );
        this.gui.add( this, 'decayPerUpdate').min( 0 ).max( 1.0 ).step( 0.01 );

        this.gui.add( this, 'scale' ).min( 0.1 ).max( 2.0 ).step( 0.1 );

        // for ( var i = 0; i < 10; i++ ){
        //     this.addAntInternal( scene ); 
        // }

        // home mesh
        var homeMaterial = new THREE.MeshStandardMaterial( { color : 0x000000 } );
        var homeGeom = new THREE.BoxGeometry( );
        var homeMesh = new THREE.Mesh( homeGeom, homeMaterial );
        homeMesh.scale.set( this.worldScale, this.worldScale, this.worldScale );
        this.addMesh( scene, homeMesh );

        this.updateTimer = 0.0;

        this.pathData = {};
        this.nodeData = {};

        this.addFoodSphereInternal( scene );

        this.trackCount = 0;
    }

    animate( scene, camera, dt ){

        for ( var i = 0; i < this.ants.length; i++ ){
            this.ants[i].mesh.scale.set( this.scale, this.scale, this.scale );
        }

        if ( this.pause ){
            return;
        }

        this.updateTimer += dt;


        if ( this.updateTimer > 1 / this.ups ){
            this.antsChooseDirection();
            // position ants on current position
            // facing current direction
            for ( var i = 0; i < this.ants.length; i++ ){
                // set position of meshes
                this.ants[i].mesh.position.set( this.ants[i].position.x * this.worldScale,
                                                this.ants[i].position.y * this.worldScale,
                                                this.ants[i].position.z * this.worldScale)

                this.ants[i].previousPosition.copy( this.ants[i].position );
                // move ants actual position towards direction
                this.ants[i].position.addScaledVector( this.ants[i].direction, 1 );

                this.incrementPath( scene, this.ants[i].position, this.ants[i].previousPosition );

                if ( this.ants[i].position.x == 0 &&
                     this.ants[i].position.y == 0 &&
                     this.ants[i].position.z == 0 ){
                    this.ants[i].hasFood = false;
                    // drop off food

                    this.ants[i].mesh.material.color.setHex( 0xff0000 );
                }

                // check for food
                if ( this.ants[i].hasFood == false &&
                     this.getNodeFoodCount( this.ants[i].position ) > 0 ){
                    this.ants[i].hasFood = true;
                    
                    this.ants[i].mesh.material.color.setHex( 0x999900 );
                }
            }
            
            this.decayPaths( scene );
            this.updateTimer = 0.0;
            this.trackCount = 0;
        } else{ // interpolate ants position
            for ( var i = 0; i < this.ants.length; i++ ){
                var lerpedPosition = new THREE.Vector3();

                lerpedPosition.lerpVectors( this.ants[i].previousPosition,
                                            this.ants[i].position,
                                            this.updateTimer * this.ups );
                this.ants[i].mesh.position.set( lerpedPosition.x * this.worldScale,
                                                lerpedPosition.y * this.worldScale,
                                                lerpedPosition.z * this.worldScale);
            }

            this.trackCount += 1;
        }
    }

    addFoodSphereInternal( scene ){

        var color = 0xffff00;

        var radius = 3; // can only be odd
        var position = new THREE.Vector3( 9, 5, 0 );
        var richness = 10;

        var radiusSquared = radius * radius;

        for ( var x = -radius; x <= radius; x++ ){
            if ( Math.abs( x + position.x ) > this.worldSize ){
                continue;
            }

            var xSquared = x * x;

            for ( var y = -radius; y <= radius; y++ ){
                if ( Math.abs( y + position.y ) > this.worldSize ){
                    continue;
                }

                var ySquared = y * y;

                if ( xSquared + ySquared > radiusSquared ){
                    continue;
                }

                for ( var z = -radius; z <= radius; z++){
                    if ( Math.abs( z + position.z ) > this.worldSize ){
                        continue;
                    }

                    var zSquared = z * z;

                    if ( xSquared + ySquared + zSquared > radiusSquared ){
                        continue;
                    } else {
                        // add food at x,y,z
                        var nodePosition = new THREE.Vector3( x, y, z );
                        nodePosition.add( position );
                        this.addFoodToNode( scene,
                                            nodePosition, richness );
                    }

                }
            }
        }
    }

    addFoodToNode( scene, position, amount ){
        var key = this.getNodeKey( position );

        if ( key in this.nodeData ){
            this.nodeData[key] += amount;
        } else {
            // create node entry
            this.nodeData[key] = amount;

            // create food mesh
            var mesh = new THREE.Mesh( new THREE.BoxGeometry(), new THREE.MeshStandardMaterial( { color: 0xffff00, transparent : true } ) );
            mesh.position.set( position.x * this.worldScale,
                               position.y * this.worldScale,
                               position.z * this.worldScale);
            mesh.scale.set( this.worldScale, this.worldScale, this.worldScale );
            // add mesh
            this.addMesh( scene, mesh );
        }

    }

    addAntInternal( scene ){

        var color = 0xff0000;

        var ant = {
            position : new THREE.Vector3( 0, 0, 0 ),
            direction : new THREE.Vector3( 1, 0, 0 ),
            path : [],
            previousPosition : new THREE.Vector3( 0, 0, 0 ),
            hasFood : false,
            color : color,
            mesh : new THREE.Mesh( antGeom(), new THREE.MeshStandardMaterial( { color : color } ) )
        }

        ant.mesh.scale.set( this.scale, this.scale, this.scale );
        this.ants.push( ant );
        this.addMesh( scene, ant.mesh );
    }

    incrementPath( scene, point1, point2 ){
        var pathStrings = this.getPathStrings( point1, point2 );

        var key1 = pathStrings[0];
        var key2 = pathStrings[1];

        if ( ! ( key1 in this.pathData ) ){
            this.pathData[key1] = {};
        }

        if ( ! ( key2 in this.pathData[key1] ) ){
            var lineGeom = new THREE.Geometry();
            lineGeom.vertices.push( point1.clone().multiplyScalar( this.worldScale ),
                                    point2.clone().multiplyScalar( this.worldScale ));

            var lineMaterial = new THREE.LineBasicMaterial( { color : 0x005500 } );
            var mesh = new THREE.Line( lineGeom, lineMaterial );
            this.pathData[key1][key2] = { 
                count : 0,
                mesh  : mesh
            }

            this.addMesh( scene, mesh );
        }

        this.pathData[key1][key2].count += 1;
    }

    decayPaths( scene ){
        var toDelete = [];

        for (const [ key1, subdict ] of Object.entries( this.pathData ) ){
            for ( const [ key2, pathInfo ] of Object.entries( this.pathData[key1] ) ){
                this.pathData[key1][key2].count -= this.decayPerUpdate;
                if ( this.pathData[key1][key2].count <= 0 ){
                    // remove path
                    toDelete.push( [ key1, key2  ] );
                }
            }
        }

        for ( var i = 0; i < toDelete.length; i++ ){
            var [ key1, key2 ] = toDelete[i];
            this.removeMesh( scene, this.pathData[key1][key2].mesh );
            delete this.pathData[key1][key2];
        }
    }

    getPathInfo( point1, point2 ){


    }

    getNodeFoodCount( point ){
        var key = this.getNodeKey( point );

        if ( key in this.nodeData ){
            return this.nodeData[key];
        } else {
            return 0;
        }
    }

    getNodeKey( point ){
        var key = point.x.toString() + ',' +
                  point.y.toString() + ',' +
                  point.z.toString();

        return key;
    }

    getPathStrings( point1, point2 ){
        var firstPoint;
        var secondPoint;

        if ( point1.x < point2.x ){
            firstPoint = point1;
            secondPoint = point2;
        } else if ( point1.x > point2.x ){
            firstPoint = point2;
            secondPoint = point1;
        } else{
            if ( point1.y < point2.y ){
                firstPoint = point1;
                secondPoint = point2;
            } else if ( point1.y > point2.y ){
                firstPoint = point2;
                secondPoint = point1;
            } else {
                if ( point1.z < point2.z ){
                    firstPoint = point1;
                    secondPoint = point2;
                } else if ( point1.z > point2.z ){
                    firstPoint = point2;
                    secondPoint = point1;
                } else {
                    firstPoint = point1;
                    secondPoint = point2;
                }
            }
        }

        var firstPointString  = firstPoint.x.toString() + ',' + firstPoint.y.toString() + ',' + firstPoint.z.toString();
        var secondPointString = secondPoint.x.toString() + ',' + secondPoint.y.toString() + ',' + secondPoint.z.toString();

        var toReturn = [ firstPointString, secondPointString ];
        return toReturn;
    }

    antsChooseDirection( ){


        for ( var i = 0; i < this.ants.length; i++ ){
            var ant = this.ants[i];

            if ( ant.hasFood ){
                ant.direction.set( -Math.sign( ant.position.x ),
                                   -Math.sign( ant.position.y ),
                                   -Math.sign( ant.position.z ) );
                continue;
            }


            var validDirections = [];

            ant.direction.set( 0, 0, 0 );

            // check if food is in any direction
            var dirToFoodFound = false;

            // assemble valid movement options
            for ( var x = -1; x <= 1; x++ ){
                if ( (ant.position.x + x > this.worldSize) || (ant.position.x + x < -this.worldSize) ){
                    continue;
                }

                for ( var y = -1; y <= 1; y++ ){
                    if ( (ant.position.y + y > this.worldSize) || (ant.position.y + y < -this.worldSize) ){
                        continue;
                    }

                    for ( var z = -1; z <= 1; z++ ){
                        if ( (ant.position.z + z > this.worldSize) || (ant.position.z + z < -this.worldSize) ){
                            continue;
                        }
                        if ( x == 0 && y == 0 && z == 0 ){
                            continue;
                        }

                        var potentialNewDirection = new THREE.Vector3( x, y, z );
                        var potentialSpot = ant.position.clone().add( potentialNewDirection );

                        if( potentialSpot.equals( ant.previousPosition ) ){
                            continue;
                        }

                        if ( this.getNodeFoodCount( potentialSpot ) > 0 ){
                            ant.direction.copy( potentialNewDirection );
                            dirToFoodFound = true;
                            break;
                        }

                        validDirections.push( potentialNewDirection );
                    }

                    if ( dirToFoodFound === true ){
                            break
                        }
                }
                if ( dirToFoodFound === true ){
                            break
                    }
            }

            if ( dirToFoodFound === false ){
                // pick random integer between 0 and length
                var randomIndex = Math.floor( Math.random() * validDirections.length );
                ant.direction.copy( validDirections[randomIndex] );                
            }

        }
    }
}