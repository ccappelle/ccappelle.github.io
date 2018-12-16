
class BHTree extends Octree {
    constructor( point1, point2, depth = 0, limitPerNode = 1, depthLimit = 20 ){
        // add variables to track the center of mass and total mass
        super( point1, point2, depth, limitPerNode, depthLimit );
        this.unweightedCOM = new THREE.Vector3( 0.0, 0.0, 0.0 );
        this.mass = 0;
    }

    push( entry ){
        // push a planet on the octree
        this.mass += entry.mass;
        this.unweightedCOM.addScaledVector( entry.position, entry.mass );
        super.push( entry );
    }

    createChild( point1, point2, depth, nodeLimit, depthLimit ){
        return new BHTree( point1, point2, depth, nodeLimit, depthLimit );
    }

    calculateForceOnBody( body, G, theta = 0.5 ){
        var force = new THREE.Vector3();

        if ( this.nEntries == 1 ){
            // only one entry in tree, compare forces directly
            force.add( NBody.calcForceFromAtoB( body, this.entries[0], G ) );
        } else {
            // calculate min width

            var s = Math.min( Math.abs( this.point1.x - this.point2.x ),
                              Math.abs( this.point1.y - this.point2.y ),
                              Math.abs( this.point1.z - this.point2.z ) );
            var distanceVector = body.position.clone();
            var com = this.unweightedCOM.clone();
            com.divideScalar( this.nEntries );
            var d = Math.abs( distanceVector.distanceTo( com ) );

            if ( s / d >= theta ){ // node is to close, go deeper
                
            } else { // node is close use it instead of body
                var dirVector = new THREE.Vector3();
                dirVector.subVectors( com, body.position );
                var rSquared = dirVector.lengthSq();
                dirVector.normalize();
                var magnitude = G * body.mass * this.mass / rSquared;

                force.addScaledVector( dirVector, magnitude );    
            }
        }


        // d = get distance from body to center of mass
        // s = get width of the region

        return force;
    }
}

class NBody extends SuperModel{
    constructor( scene ){
        super( scene );
        this.maxBoxes = 100;
        this.showOctree = true;

        this.scale = 1.0;
        this.G = 1;
        this.pause = true;

        this.keepCentered = false;
        this.keepScaled = false;
        this.showMovementVectors = false;

        this.gui.add( this, 'pause' );
        this.gui.add( this, 'showOctree' );
        this.gui.add( this, 'keepCentered' );
        this.gui.add( this, 'showMovementVectors' );
        this.gui.add( this, 'G' );
        // this.gui.add( this, 'keepScaled' );

        // set up planet vectors to track velocity and force
        this.vectorGeometry = new THREE.Geometry();
        this.vectorGeometry.vertices.push ( new THREE.Vector3( 0, 0, 0 ),
                                            new THREE.Vector3( 1, 0, 0 ) );

        this.forceMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        this.velocityMaterial = new THREE.LineBasicMaterial( { color : 0x0000ff } );

        this.bodies = [];
        // add twenty random bodies
        for ( var i = 0; i < 20; i++ ){
            this.addRandomBodyInternal( scene );
        }
        
        // this.addBody( scene, new THREE.Vector3(), new THREE.Vector3(), 10 );
        // for ( var i = 0; i < 2; i++ ){
        //     var position = new THREE.Vector3( i * 2 + 2, 0, 0 );
        //     var velocity = new THREE.Vector3( 0, 0, 1);
        //     this.addBody( scene, position, velocity, 1 );
        // }

        // create the octree visualization geom and material
        var treeboxGeometry = new THREE.EdgesGeometry( new THREE.BoxBufferGeometry( 1, 1, 1 ) );
        var treeboxMaterial = new THREE.LineBasicMaterial( { color : 0x00aa00 } );

        this.treeboxes = [];
        // set up max boxes 
        for ( var i = 0; i < this.maxBoxes; i++ ){
            var treebox = new THREE.LineSegments( treeboxGeometry, treeboxMaterial );
            this.treeboxes.push( treebox );
            treebox.visible = false;

            this.addMesh( scene, treebox );
        }

        this.selectedBody = null;
        this.highlitedBody = null;
    }

    removeBodyByIndex( scene, index ){
        
    }

    addRandomBodyInternal( scene ){
        // add a random body to the scene
        var body = this.createRandomBody();
        var radius = Math.log10( body.mass ) * 0.1 + 0.1;
        body.mesh.scale.set( radius, radius, radius );

        this.bodies.push( body );
        this.addMesh( scene, body.mesh );
        this.addMesh( scene, body.velocityLine );
        this.addMesh( scene, body.forceLine );       
    }

    addBodyInternal( scene, position, velocity, mass ){
        // add a body with specified position velocity and mass
        var body = this.createBody( position, velocity, mass );
        var radius = Math.log10( mass ) * 0.1 + 0.1;
        body.mesh.scale.set( radius, radius, radius );


        this.bodies.push( body );
        this.addMesh( scene, body.mesh );
        this.addMesh( scene, body.velocityLine );
        this.addMesh( scene, body.forceLine );
    }

    animate( scene, camera, dt ){

        // find max and min points points
        var minPoint, maxPoint;
        [ minPoint, maxPoint ] = this.findEndPoints();

        var globalTranslation = new THREE.Vector3();

        if ( this.keepCentered ){
            globalTranslation.addVectors( minPoint, maxPoint );
            globalTranslation.multiplyScalar( 0.5 );
        }

        // construct octree
        var octree = new BHTree( minPoint.clone(),
                                 maxPoint.clone()
                               );
        for ( var i = 0; i < this.bodies.length; i++ ){
            octree.push( this.bodies[i] );

            // clear forces
            this.bodies[i].force.set( 0, 0, 0 );
        }


        this.calcForces( octree );

        this.updateOctreeDisplay( octree, globalTranslation );
        this.udpateBodies( globalTranslation, dt );
    }

    static calcForceFromAtoB( body1, body2, G ){
        var dirVector = new THREE.Vector3();
        dirVector.subVectors( body2.position, body1.position );
        var rSquared = dirVector.lengthSq();
        dirVector.normalize();
        var magnitude = G * body1.mass * body2.mass / rSquared;

        var forceVector = new THREE.Vector3();
        forceVector.addScaledVector( dirVector, magnitude );
        return forceVector;
    }

    calcForces( octree ){
        // calc forces using direct method
        // for ( var i = 0; i < this.bodies.length; i++ ){
        //     for ( var j = i + 1; j < this.bodies.length; j++ ){
        //         // var dirVector = new THREE.Vector3();
        //         // dirVector.subVectors( this.bodies[i].position, this.bodies[j].position ); // vector from i to j
        //         // var rSquared = dirVector.lengthSq();
        //         // dirVector.normalize();
        //         // var magnitude = this.G * this.bodies[i].mass * this.bodies[j].mass / rSquared;
        //         // this.bodies[i].force.addScaledVector( dirVector, -magnitude );
        //         // this.bodies[j].force.addScaledVector( dirVector, magnitude );
        //         var force = NBody.calcForceFromAtoB( this.bodies[i], this.bodies[j], this.G );
        //         this.bodies[i].force.add( force );
        //         this.bodies[j].force.sub( force );
        //     }
        // }

        // calc forces using octree
        for ( var i = 0; i < this.bodies.length; i++ ){
            var force = octree.calculateForceOnBody( this.bodies[i], this.G );
            this.bodies[i].force.add( force );
        }
    }

    udpateBodies( globalTranslation, dt ){
        for ( var i = 0; i < this.bodies.length; i++ ){
            var body = this.bodies[i];

            if ( !this.pause ){
                // only update dynamics when unpaused
                body.position.addScaledVector( body.velocity, dt );
                body.velocity.addScaledVector( body.force, dt / body.mass );
            }

            // set mesh representing body
            body.mesh.position.set( body.position.x - globalTranslation.x,
                                    body.position.y - globalTranslation.y,
                                    body.position.z - globalTranslation.z );

            if ( this.showMovementVectors ){
                body.forceLine.visible = true; // show force
                body.velocityLine.visible = true; // show velocity
                body.forceLine.position.set( body.position.x - globalTranslation.x,
                                             body.position.y - globalTranslation.y,
                                             body.position.z - globalTranslation.z );
                // body.forceLine.rotation.set( )

                // orient body forces
                var quaternion = new THREE.Quaternion();
                var velocity = body.velocity.clone().normalize();
                var force = body.force.clone().normalize();
                quaternion.setFromUnitVectors( new THREE.Vector3( 1, 0, 0 ),
                                               velocity );

                body.velocityLine.setRotationFromQuaternion( quaternion );

                body.velocityLine.position.set( body.position.x - globalTranslation.x,
                                                body.position.y - globalTranslation.y,
                                                body.position.z - globalTranslation.z );
                quaternion.setFromUnitVectors( new THREE.Vector3( 1, 0, 0 ),
                                               force );

                body.forceLine.setRotationFromQuaternion( quaternion );
                body.forceLine.position.set( body.position.x - globalTranslation.x,
                                             body.position.y - globalTranslation.y,
                                             body.position.z - globalTranslation.z );
            } else {
                body.forceLine.visible = false;
                body.velocityLine.visible = false;
            }
        }
    }

    updateOctreeDisplay( octree, globalTranslation ){
        // display octree
        for ( var i = 0; i < this.treeboxes.length; i++ ){
            this.treeboxes[i].visible = false;
        }

        if ( this.showOctree ){
            var treeboxList = octree.listify();
            for ( var i = 0; i < treeboxList.length; i++ ){
                this.treeboxes[i].visible = true;
                this.treeboxes[i].position.set( treeboxList[i].centerPoint.x - globalTranslation.x,
                                                treeboxList[i].centerPoint.y - globalTranslation.y,
                                                treeboxList[i].centerPoint.z - globalTranslation.z );

                var p1 = treeboxList[i].point1;
                var p2 = treeboxList[i].point2;

                this.treeboxes[i].scale.set( Math.abs( p1.x - p2.x ), 
                                             Math.abs( p1.y - p2.y ),
                                             Math.abs( p1.z - p2.z ) );
            }
        }
    }

    findEndPoints(){
        // finds the maximal and minimal points representing the octree
        var upperPoint = new THREE.Vector3( -Infinity );
        var lowerPoint = new THREE.Vector3( Infinity );

        for ( var i = 0; i < this.bodies.length; i++ ){
            var body = this.bodies[i];
            for ( var j = 0; j < 3; j++ ){
                if ( body.position.getComponent( j ) >
                     upperPoint.getComponent( j ) ){
                    upperPoint.setComponent( j, body.position.getComponent( j ) );
                } 
                if ( body.position.getComponent( j ) <
                     lowerPoint.getComponent( j ) ){
                    lowerPoint.setComponent( j, body.position.getComponent( j ) );
                }                
            }
        }   

        for ( var j = 0; j < 3; j++ ){
            // spread box out if its less than one unit away
            if ( Math.abs( upperPoint.getComponent( j ) -
                           lowerPoint.getComponent( j ) ) < 1 ){
                upperPoint.setComponent( j, upperPoint.getComponent( j ) + 0.5 );
                lowerPoint.setComponent( j, lowerPoint.getComponent( j ) - 0.5 );
            }
        }
        return [ lowerPoint, upperPoint ];
    }

    createBody( position, v0, mass ){
        // create a body with desired velocity and mass
        var geometry = new THREE.SphereGeometry( 1 );
        var material = new THREE.MeshBasicMaterial( { color : 0x00ff00 } );

        var body = {
            position : position.clone(),
            mesh : new THREE.Mesh( geometry, material ),
            mass : mass,
            velocity : v0.clone(),
            force : new THREE.Vector3(),
            velocityLine : new THREE.Line( this.vectorGeometry, this.velocityMaterial ),
            forceLine : new THREE.Line( this.vectorGeometry, this.forceMaterial ),
        }

        body.mesh.position.set( position.x, position.y, position.z );
        body.mesh.scale.set( 0.1, 0.1, 0.1 );

        return body;
    }

    createRandomBody(){
        // create a random body
        var position = new THREE.Vector3( Math.random() * 10 - 5,
                                          Math.random() * 10 - 5,
                                          Math.random() * 10 - 5 );

        var mass = 1;
        var velocity = new THREE.Vector3( Math.random() * 0.2 - 0.1,
                                          Math.random() * 0.2 - 0.1,
                                          Math.random() * 0.2 - 0.1 );

        return this.createBody( position, velocity, mass);
    }

}