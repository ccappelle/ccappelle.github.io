
class Boids extends SuperModel{
    constructor( scene ){
        super( scene );

        this.boids = [];
        this.pause = true;
        // this.boidMeshes = [];
        this.perceptionMeshes = [];

        this.gui.add( this, 'pause' );

        this.time = 0;

        this.showPerception = true;
        this.gui.add( this, 'showPerception' );

        this.position = new THREE.Vector3( 0.0, 0.0, 0.0 );
        this.direction = new THREE.Vector3( 1.0, 0.0, 0.0 );
        this.angle = 90;
        this.radius = 5;

        this.addNewBoid = ( e ) => this.addBoid( scene, this.position.clone(),
							this.direction.clone(), this.angle * Math.PI / 180, this.radius );
        this.newBoidFolder = this.gui.addFolder( 'New Boid Parameters' );

        this.newBoidFolder.add( this, 'addNewBoid' );
        var posFolder = this.newBoidFolder.addFolder( 'Position' );

        posFolder.add( this.position, 'x' ).min( -5 ).max( 5 ).step( 0.1 );
        posFolder.add( this.position, 'y' ).min( -5 ).max( 5 ).step( 0.1 );
        posFolder.add( this.position, 'z' ).min( -5 ).max( 5 ).step( 0.1 );
        var dirFolder = this.newBoidFolder.addFolder( 'Direction' );
        dirFolder.add( this.direction, 'x' ).min( -1 ).max( 1 ).step( 0.1 );
        dirFolder.add( this.direction, 'y' ).min( -1 ).max( 1 ).step( 0.1 );
        dirFolder.add( this.direction, 'z' ).min( -1 ).max( 1 ).step( 0.1 );
        var perceptionFolder = this.newBoidFolder.addFolder( 'Perception' );
        perceptionFolder.add( this, 'radius' ).min( 0 ).max( 10 ).step( 0.1 );
        perceptionFolder.add( this, 'angle' ).min( 0 ).max( 180 ).step( 1 );

        this.boidFolder = null;

        this.perceptionMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );

        this.hoveredBoid = null;
        this.currentBoid = null;

        this.addNewBoid();
    }

    animate( scene, camera, dt ){

        if ( !this.pause ){
            this.time += dt;
        }

        var xUnitVector = new THREE.Vector3( 1, 0, 0 );

        var boidObjects = [];

        for ( var i = 0; i < this.boids.length; i++ ){
            if ( !this.pause ){
                this.boids[i].position.addScaledVector( this.boids[i].velocity, dt );
            }
            
            var direction = this.boids[i].velocity.clone();
            direction.normalize();
            var quaternion = new THREE.Quaternion();
            quaternion.setFromUnitVectors( xUnitVector, direction );

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

            if ( this.showPerception ){
                this.boids[i].perceptionLine.visible = true;
            } else {
                this.boids[i].perceptionLine.visible = false;
            }
            this.boids[i].mesh.myIndex = i;
            boidObjects.push( this.boids[i].mesh );
        }

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

    addBoid( scene, position, velocity, perceptionAngle, perceptionRadius ){
    	console.log( 'adding boid' );
        var boidGeom = this.createBoidGeometry();
        var boidMaterial = new THREE.MeshStandardMaterial( { color : 0x00ff00 } );
        var boidMesh = new THREE.Mesh( boidGeom, boidMaterial );

        var perceptionGeom = this.createPerceptionGeometry( perceptionAngle );
        var perceptionLine = new THREE.Line( perceptionGeom, this.perceptionMaterial );

        var boid = {
            position : position,
            // direction : new THREE.Vector3( 1, 0, 0 ),
            velocity : velocity,
            perceptionRadius : perceptionRadius,
            perceptionAngle : perceptionAngle,
            mesh : boidMesh,
            perceptionLine : perceptionLine
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
    	if ( boid == null ){
    		return
    	}
    	if ( boid.mesh === this.currentBoid ){
    		return;
    	}

    	if ( this.currentBoid ){ // if replacing other boid, change back color
    		this.currentBoid.mesh.material.color.setHex( this.currentBoid.baseHex );
    		this.currentBoid.unHighlightedHex = this.currentBoid.mesh.material.color;
    	}
    	// set color of chosen boid
    	this.currentBoid = boid;
    	this.currentBoid.baseHex = boid.mesh.material.color.getHex();
    	this.currentBoid.unHighlightedHex = 0x0000bb;
    	this.currentBoid.mesh.material.color.set( this.currentBoid.unHighlightedHex );

    	if ( this.boidFolder ){
    		this.gui.removeFolder( this.boidFolder );
    	}
    	
    	this.boidFolder = this.gui.addFolder( 'Selected Boid Parameters' );
    	var posFolder = this.boidFolder.addFolder( 'Position' );
    	var dirFolder = this.boidFolder.addFolder( 'Direction' );

    	posFolder.add( boid.position, 'x' )
    			.listen();
    	posFolder.add( boid.position, 'y' ).listen();
    	posFolder.add( boid.position, 'z' ).listen();

    	dirFolder.add( boid.velocity, 'x' ).listen();
    	dirFolder.add( boid.velocity, 'y' ).listen();
    	dirFolder.add( boid.velocity, 'z' ).listen();

    	var perceptionFolder = this.boidFolder.addFolder( 'Perception' );
        perceptionFolder.add( boid, 'perceptionRadius' ).min( 0 ).max( 10 ).step( 0.1 );
        perceptionFolder.add( boid, 'perceptionAngle' ).min( 0 ).max( 180 ).step( 1 );
    	this.boidFolder.open();
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