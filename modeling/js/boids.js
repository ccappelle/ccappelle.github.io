
class Boids extends SuperModel{
    constructor( scene ){
        super( scene );

        this.boids = [];
        // this.boidMeshes = [];
        this.perceptionMeshes = [];

        this.gui.add( this, 'pause' );

        this.time = 0;

        this.perceptionAngle = Math.PI/ 2.0;
        this.perceptionRadius = 4.0;

        this.perceptionChanged = false;
        this.gui.add( this, 'perceptionAngle' ).min( 0 ).max( Math.PI ).step( 0.1 )
                .onChange( ( e ) => this.perceptionChanged = true );
        this.gui.add( this, 'perceptionRadius' ).min( 0.1 ).max( 10 ).step( 0.1 );

        this.showPerception = true;
        this.gui.add( this, 'showPerception' );

        this.perceptionMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        this.chosenBoid = null;

        this.addRandomBoid = ( e ) => this.addBoid( scene, 
                                new THREE.Vector3( Math.random() * 10 - 5,
                                                   Math.random() * 10 - 5,
                                                   Math.random() * 10 - 5),
                                new THREE.Vector3( Math.random() * 2 - 1,
                                                   Math.random() * 2 - 1,
                                                   Math.random() * 2 - 1).normalize(),
                                this.perceptionAngle,
                                this.perceptionRadius );

        this.gui.add( this, 'addRandomBoid' );
        // this.addRandomBoid();
        // this.addBoid( scene, this.perceptionAngle, this.perceptionRadius );

        // this.testSpheres = [];
        // var nDots = 5;

        // var sphereGeom = new THREE.SphereGeometry();
        // var sphereMaterial = new THREE.MeshBasicMaterial( { color : 0x888888, transparent : true, opacity : 0.3 } );
        // for ( var i = 0; i < nDots; i++ ){
        //     var x = -5 + ( i / nDots ) * 10;
        //     for ( var j = 0; j < nDots; j++ ){
        //         var y = -5 + ( j / nDots ) * 10;
        //         for ( var k = 0; k < nDots; k++ ){
        //             var z = -5 + ( k / nDots ) * 5;
        //             var sphereMesh = new THREE.Mesh( sphereGeom, sphereMaterial.clone() );
        //             sphereMesh.position.set( x, y, z );
        //             sphereMesh.scale.set( 0.1, 0.1, 0.1 );
        //             this.testSpheres.push( sphereMesh );
        //             this.addMesh( scene, sphereMesh );
        //         }
        //     }
        // }
    }

    animate( scene, camera, dt ){
        // if ( this.perceptionChanged ){
        //     var geom = this.createPerceptionGeometry( this.perceptionAngle );
        //     for ( var i = 0; i < this.boids.length; i++ ){
        //         this.boids[i].perceptionAngle = this.perceptionAngle;
        //         // remove mesh from scene
        //         this.removeMesh( scene, this.boids[i].perceptionLine );
        //         this.boids[i].perceptionLine = new THREE.Line( geom, this.perceptionMaterial );
        //         this.addMesh( scene, this.boids[i].perceptionLine );
        //     }

        //     this.perceptionChanged = false;
        // }
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

            boidObjects.push( this.boids[i].mesh );
        }

        // test intersection with boid objects
        this.raycaster.setFromCamera( this.mouse, camera );
        var intersections = this.raycaster.intersectObjects( boidObjects );
        // var intersections = this.raycaster.intersectObjects( scene.children );
        // console.log( intersections );
        if ( intersections.length > 0 ){
            if ( this.chosenBoid != intersections[0].object ){
                if ( this.chosenBoid ){
                    this.chosenBoid.material.emissive.setHex( this.chosenBoid.currentHex );
                }

                this.chosenBoid = intersections[0].object;
                this.chosenBoid.currentHex = this.chosenBoid.material.emissive.getHex();
                this.chosenBoid.material.emissive.setHex( 0xff0000 );
            }
        } else {
            if ( this.chosenBoid ){
                this.chosenBoid.material.emissive.setHex( this.chosenBoid.currentHex );
            }

            this.chosenBoid = null;
        }
        // for ( var i = 0; i < this.boids.length; i++ ){
        //     var 
        // }
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