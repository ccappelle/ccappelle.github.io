
class Boids extends SuperModel{
    constructor( scene ){
        super( scene );

        this.instructionString = `Boids are agents which move based on heuristic instructions.
                                  There are many options to choose from in the upper right hand side bar so have fun exploring!`;
        this.modalContent = `Boids were invented by Craig Reynolds in 1986.
                             They have been used in a variety of animations and video games to simulate swarm behavior.
                             Check out <a href="http://www.red3d.com/cwr/">Craig's Website</a> for more info.`;

        this.boids = [];
        this.pause = true;
        // this.boidMeshes = [];
        this.perceptionMeshes = [];

        this.gui.add( this, 'pause' );

        this.time = 0;

        this.showPerceptionCone = false;
        this.showSightLines = false;
        this.gui.add( this, 'showPerceptionCone' );
        this.gui.add( this, 'showSightLines' );

        this.position = new THREE.Vector3( 0.0, 0.0, 0.0 );
        this.direction = new THREE.Vector3( 1.0, 0.0, 0.0 );
        this.angle = 90;
        this.radius = 5;

        this.targetPosition = new THREE.Vector3( 0.0, 0.0, 0.0 );

        this.cohesion     = 0.15;
        this.seperation   = 0.15;
        this.alignment    = 0.15;
        this.targetDesire = 0.0;

        this.gui.add( this, 'cohesion' ).min( 0 ).max( 1 ).step( 0.01 );
        this.gui.add( this, 'alignment' ).min( 0 ).max( 1 ).step( 0.01 );
        this.gui.add( this, 'seperation' ).min( 0 ).max( 1 ).step( 0.01 );
        this.gui.add( this, 'targetDesire' ).min( 0 ).max( 1 ).step( 0.01 );
        this.addNewBoid = ( e ) => this.addBoid( scene, this.position.clone(),
							this.direction.clone(), this.angle * Math.PI / 180, this.radius );

        this.addRandomBoids = ( e ) => {
            for ( var i = 0; i < 10; i++ ){
                var position = new THREE.Vector3(
                            Math.random() * 10 - 5,
                            Math.random() * 10 - 5,
                            Math.random() * 10 - 5
                        );
                var direction = position.clone().multiplyScalar( -1 ); // face towards center
                // var direction = new THREE.Vector3(
                //         Math.random() * 2 - 1,
                //         Math.random() * 2 - 1,
                //         Math.random() * 2 - 1
                //     );
                this.addBoid( scene, position, direction, this.angle * Math.PI / 180, this.radius );
            }
        };

        this.removeBoid = ( e ) => {
                                    if ( this.currentBoid == null ){
                                        return;
                                    }
                                    var boid = this.currentBoid;
                                    this.currentBoid = null;
                                    this.updateCurrentBoid( 'deselect' );

                                    this.deleteBoid( scene, boid );
        };

        this.removeAllBoids = ( e ) => {
                                    while( this.boids.length > 0 ){
                                        this.deleteBoidByIndex( scene, 0 );
                                    }
        };
        

        this.gui.add( this, 'addNewBoid' );
        this.gui.add( this, 'addRandomBoids' );
        this.gui.add( this, 'removeAllBoids' );

        this.newBoidFolder = this.gui.addFolder( 'New Boid Parameters' );
        this.newBoidFolder.add( this, 'radius' ).min( 0.1 ).max( 10 ).step( 0.1 );
        this.newBoidFolder.add( this, 'angle' ).min( 0 ).max( 180 ).step( 1 );

        this.boidFolder = null;

        this.perceptionMaterial = new THREE.LineBasicMaterial( { color : 0xff0000, transparent : true, opacity : 0.45 } );
        this.seeMaterial = new THREE.LineBasicMaterial( { color : 0xaa00aa, transparent : true, opacity : 1.0 } );

        this.hoveredBoid = null;
        this.currentBoid = null;

        this.sightLines = [];

        // this.addNewBoid();
        this.addRandomBoids();
        this.updateCurrentBoid( 'deselect' );
    }

    animate( scene, camera, dt ){

        if ( !this.pause ){
            this.time += dt;
        }

        var xUnitVector = new THREE.Vector3( 1, 0, 0 );

        var boidObjects = [];

        // clear sight line meshs
        while( this.sightLines.length > 0 ){
            this.removeMesh( scene, this.sightLines.pop() );
        }

        for ( var i = 0; i < this.boids.length; i++ ){


            if ( this.boids[i].perceptionNeedsUpdate ){
                this.updatePerception( scene, this.boids[i] );
                this.boids[i].perceptionNeedsUpdate = false;
            }
            
            var seenBoids = [];

            // check if boid sees other boids
            for ( var j = 0; j < this.boids.length; j++ ){
                if ( i == j ){
                    continue;
                }

                if ( this.boidASeesBoidB( this.boids[i], this.boids[j] ) ){
                    // var material = new THREE.LineBasicMaterial( { color : 0x005500 } );
                    var geometry = new THREE.Geometry();
                    geometry.vertices.push( this.boids[i].position.clone(), this.boids[j].position.clone() );
                    var line = new THREE.Line( geometry, this.seeMaterial );
                    this.sightLines.push( line );
                    if ( this.boids[i].showPerception || this.showSightLines ){
                        line.visible = true;
                    } else {
                        line.visible = false;
                    }
                    this.addMesh( scene, line );
                    seenBoids.push( this.boids[j] );
                }
            }

            if ( !this.pause ){
                var steerDirection = new THREE.Vector3( 0.0, 0.0, 0.0 );
                if ( seenBoids.length > 0 ){
                    // get updated velocity based on seen boids
                    

                    // boids should move away from other boids
                    for ( var j = 0; j < seenBoids.length; j++ ){
                        var sepDiff = this.boids[i].position.clone();
                        sepDiff.sub( this.boids[j].position );
                        sepDiff.normalize();
                        sepDiff.multiplyScalar( this.seperation / seenBoids.length );
                        steerDirection.add( sepDiff );
                    }

                    // try to align with other boids in range
                    var avgAlignment = new THREE.Vector3( 0.0, 0.0, 0.0 );
                    for ( var j = 0; j < seenBoids.length; j++ ){
                        avgAlignment.add( this.boids[j].direction );
                    }
                    avgAlignment.multiplyScalar( 1 / seenBoids.length );
                    steerDirection.addScaledVector( avgAlignment, this.alignment );

                    // try to move towards center of mass
                    var com = new THREE.Vector3( 0.0, 0.0, 0.0 );
                    for ( var j = 0; j < seenBoids.length; j++ ){
                        com.add( this.boids[j].position );
                    }
                    com.multiplyScalar( 1 / seenBoids.length );
                    // dir to com
                    com.sub( this.boids[i].position );
                    com.normalize();
                    steerDirection.addScaledVector( com, this.cohesion );

                    
                }

                var dirToTarget = this.targetPosition.clone();
                dirToTarget.sub( this.boids[i].position).normalize();
                steerDirection.addScaledVector( dirToTarget, this.targetDesire );
                this.boids[i].direction.addScaledVector( steerDirection, 0.1 );
                this.boids[i].direction.normalize();

                this.boids[i].position.addScaledVector( this.boids[i].direction, this.boids[i].speed * dt );
            }

            // orient boid
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors( xUnitVector, this.boids[i].direction );

            this.boids[i].mesh.setRotationFromQuaternion( quaternion );
            this.boids[i].mesh.position.set( this.boids[i].position.x,
                                             this.boids[i].position.y,
                                             this.boids[i].position.z );
            this.boids[i].perceptionLine.position.set(
                                             this.boids[i].position.x,
                                             this.boids[i].position.y,
                                             this.boids[i].position.z );

            this.boids[i].perceptionLine.setRotationFromQuaternion( quaternion );

            this.boids[i].perceptionLine.scale.set( this.boids[i].perceptionRadius,
                                                    this.boids[i].perceptionRadius,
                                                    this.boids[i].perceptionRadius);

            // toggle perception cone
            if ( this.showPerceptionCone || this.boids[i].showPerception ){
                this.boids[i].perceptionLine.visible = true;
            } else {
                this.boids[i].perceptionLine.visible = false;
            }

            // collect meshes for ui interaction
            this.boids[i].mesh.myIndex = i;
            boidObjects.push( this.boids[i].mesh );
        }

        this.handleUserInput( scene, camera, boidObjects );
    }

    deleteBoidByIndex( scene, index ){
        var boid = this.boids.splice( index, 1 )[0];

        if ( boid === this.currentBoid ){
            this.currentBoid = null;
            this.updateCurrentBoid( 'deselect' );
        }
        this.removeMesh( scene, boid.mesh );
        this.removeMesh( scene, boid.perceptionLine );
    }

    deleteBoid( scene, boid ){
        var index = -1;
        for ( var i = 0; i < this.boids.length; i++ ){
            if ( boid == this.boids[i] ){
                index = i;
                break;
            }
        }

        if ( index >= 0 ){
            this.deleteBoidByIndex( scene, index );
        }
    }

    updatePerception( scene, boid ){
        this.removeMesh( scene, boid.perceptionLine );
        var perceptionGeom = this.createPerceptionGeometry( boid.perceptionAngle );          
        boid.perceptionLine = new THREE.Line( perceptionGeom, this.perceptionMaterial );
        this.addMesh( scene, boid.perceptionLine );        
    }

    handleUserInput( scene, camera, boidObjects ){
        // test intersection with boid objects
        this.raycaster.setFromCamera( this.mouse, camera );
        var intersections = this.raycaster.intersectObjects( boidObjects );
        // var intersections = this.raycaster.intersectObjects( scene.children );
        // console.log( intersections );
        if ( intersections.length > 0 ){
            var boid = this.boids[intersections[0].object.myIndex];
            this.updateHoveredBoid( boid );
        } else {
            this.updateHoveredBoid( null );
        }      
    }

    boidASeesBoidB( boidA, boidB ){
        var aPoint = boidA.position;
        var bPoint = boidB.position;
        var aDirection = boidA.direction;
        var aRadius = boidA.perceptionRadius;
        var aAngle = boidA.perceptionAngle;

        return this.aSeesB( aPoint, bPoint, aDirection, aRadius, aAngle );
    }
    aSeesB( aPoint, bPoint, aDirection, aRadius, aAngle ){
        var aToB = bPoint.clone();
        aToB.sub( aPoint );
        if ( aToB.lengthSq() > aRadius * aRadius ){
            return false;
        }

        if ( Math.abs( aDirection.angleTo( aToB ) ) < aAngle ){
            return true;
        } else {
            return false;
        }
    }

    addBoid( scene, position, direction, perceptionAngle, perceptionRadius, speed = 1.0 ){
        var boidGeom = this.createBoidGeometry();
        var boidMaterial = new THREE.MeshStandardMaterial( { color : 0x00ff00 } );
        var boidMesh = new THREE.Mesh( boidGeom, boidMaterial );

        var perceptionGeom = this.createPerceptionGeometry( perceptionAngle );
        var perceptionLine = new THREE.Line( perceptionGeom, this.perceptionMaterial );

        var boid = {
            position : position,
            direction : direction.normalize(),
            speed : speed,
            perceptionRadius : perceptionRadius,
            perceptionAngle : perceptionAngle,
            angle : perceptionAngle / Math.PI * 180,
            mesh : boidMesh,
            perceptionLine : perceptionLine,
            perceptionNeedsUpdate : false,
            showPerception : false,
        }

        this.addMesh( scene, boidMesh );
        this.addMesh( scene, perceptionLine );
        this.boids.push( boid );
        this.updateCurrentBoid( boid );
    }

    updateHoveredBoid( boid ){
    	if ( this.hoveredBoid === boid ){
    		return;
    	}

    	if ( this.hoveredBoid ){
    		this.hoveredBoid.mesh.material.emissive.setHex( this.hoveredBoid.mesh.unHighlightedHex ); // reset color
    	}
    	if ( boid ){
    		this.hoveredBoid = boid;
			this.hoveredBoid.unHighlightedHex = this.hoveredBoid.mesh.material.emissive;
			this.hoveredBoid.mesh.material.emissive.setHex( 0xff0000 );
    	} else {
    		this.hoveredBoid = null;
    	}

    }

    updateCurrentBoid( boid ){
        if ( boid === null ){ // necessary for clicks moving camera etc.
            return;
        }
    	if ( boid === this.currentBoid ){
            boid = 'deselect';
    	}

    	if ( this.currentBoid ){ // if replacing other boid, change back color
    		this.currentBoid.mesh.material.color.setHex( this.currentBoid.baseHex );
    		this.currentBoid.unHighlightedHex = this.currentBoid.mesh.material.color;
            this.currentBoid.showPerception = false;
    	}

        if ( this.boidFolder != null ){
            this.gui.removeFolder( this.boidFolder );
        }

        if ( boid == 'deselect' ){
            this.boidFolder = null;
            this.currentBoid = null;
            return;
        }

    	// set color of chosen boid
    	this.currentBoid = boid;
    	this.currentBoid.baseHex = boid.mesh.material.color.getHex();
    	this.currentBoid.unHighlightedHex = 0x0000bb;
    	this.currentBoid.mesh.material.color.set( this.currentBoid.unHighlightedHex );
        this.currentBoid.showPerception = true;
    	
    	this.boidFolder = this.gui.addFolder( 'Selected Boid Parameters' );
        this.boidFolder.add( this, 'removeBoid' );

    	var posFolder = this.boidFolder.addFolder( 'Position' );
    	var dirFolder = this.boidFolder.addFolder( 'Direction' );

    	posFolder.add( boid.position, 'x' )
    			.listen();
    	posFolder.add( boid.position, 'y' ).listen();
    	posFolder.add( boid.position, 'z' ).listen();

    	dirFolder.add( boid.direction, 'x' ).listen();
    	dirFolder.add( boid.direction, 'y' ).listen();
    	dirFolder.add( boid.direction, 'z' ).listen();

    	var perceptionFolder = this.boidFolder.addFolder( 'Perception' );
        perceptionFolder.add( boid, 'showPerception' );
        perceptionFolder.add( boid, 'perceptionRadius' ).min( 0.1 ).max( 10 ).step( 0.1 );
        perceptionFolder.add( boid, 'angle' ).min( 0 ).max( 180 ).step( 1 )
                        .onChange( ( e ) => { boid.perceptionAngle = e / 180 * Math.PI;
                                              boid.perceptionNeedsUpdate = true; } );
    	this.boidFolder.open();
        // posFolder.open();
        // dirFolder.open();
        perceptionFolder.open();
    }

    createPerceptionGeometry( theta, segments=3, n = 30 ){

        var geometry = new THREE.Geometry();

        // center point
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        var startAngle = -theta;
        var dTheta = 2 * theta / ( n - 1 );

        // semi-circle followed by line to origin
        for ( var i = 0; i < n; i++ ){
            var angle = startAngle + dTheta * i;
            var xPos = Math.cos( angle );
            var yPos = Math.sin( angle );
            var zPos = 0;
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
            
            var modStep = Math.floor( n / 2 / segments );
            if ( yPos < 0 && i % modStep == 0 ){
                // console.log( 'start position', xPos, yPos, zPos );
                for ( var j = 0; j < n; j++ ){
                    var innerAngle = ( j + 1 ) / n * Math.PI * 2 + Math.PI / 2.0;
                    var innerRadius = yPos;
                    var perpYPos = Math.sin( innerAngle ) * innerRadius;
                    var perpZPos = Math.cos( innerAngle ) * innerRadius;

                    geometry.vertices.push( new THREE.Vector3( xPos, perpYPos, perpZPos ) );
                    // console.log( 'vertex', j, xPos, perpYPos, perpZPos );
                }
            }

            
        }
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        // second orthoganal semi cirle 
        for ( var i = 0; i < n; i++ ){
            var angle = startAngle + dTheta * i;
            var xPos = Math.cos( angle );
            var yPos = 0;
            var zPos = Math.sin( angle );
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
        }
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );
        return geometry;
    }

    mouseClickHandler( e ){
    	this.updateCurrentBoid( this.hoveredBoid );
    }

    keyDownHandler( e ){
        if ( e.keyCode == 27 ){
            this.updateCurrentBoid( 'deselect' );
        }
    }


    createBoidGeometry( n = 6, puffyness = 0.5 ){
        var geometry = new THREE.Geometry();

        // center point == 0
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        // nose point == 1
        geometry.vertices.push( new THREE.Vector3( 0.5, 0, 0 ) );

        const pos1 = 0.5;
        const pos2 = 0.3;

        var m = 2 * n; 
        // geometry.vertices.push( new THREE.Vector3( -0.5, 0, 0.5 ) );
        // tail points [2, n + 2)
        for ( var i = 0; i < m; i++ ){
            const angle = ( i / m ) * 2 * Math.PI;
            var xPos = -pos1;
            var radius = pos1;
            if ( i % 2 == 1 ){
                xPos = -pos2;
                radius = ( pos2 + 0.5 ) * puffyness;
            }
            const zPos = Math.cos( angle ) * radius;
            const yPos = Math.sin( angle ) * radius;
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
        }

        // // create faces
        for ( var i = 0; i < m; i++ ){
            var index = i;
            // current index, nose vertex, next index
            var frontFace = new THREE.Face3( i + 2, 1, ( ( i + 1) % m ) + 2 );
            geometry.faces.push( frontFace );
            
            var backFace = new THREE.Face3( i + 2, ( ( i + 1 ) % m ) + 2, 0 );
            geometry.faces.push( backFace );
        }

        var frontFace = new THREE.Face3( 0, 1, 2 );
        geometry.faces.push( frontFace );

        geometry.computeFaceNormals();
        // geometry.computeVertexNormals();

        geometry.computeBoundingSphere();

        return geometry;
    }
}