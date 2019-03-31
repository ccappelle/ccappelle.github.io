
class LogisticMap extends SuperModel{

    constructor( scene ){
        super( scene );

        this.instructionString = `The logistic map is ax(1-x).
                                  Tuning the value of a (use W and S) will lead to different dynamics as period-doubling bifurcations occur.
                                  Changing x0 will change where the map starts iterating from (use A and D).
                                  Checking continue will make the map keep iterating.`
                 
        this.modalContent = "The logistic map is just one of many maps which shows the signs of chaos for certain parameters."
        this.frameCount = 0;

        this.scale = 5;
        this.endpoint = -2.5;

        this.funcPoints = 100;
        this.linePoints = 100;

        this.a = 2.0;
        this.x0 = 0.5;

        this.reset = true;
        this.continue = false;

        this.gui.add( this, 'continue' ).listen();

        this.gui.add( this, 'a' )
                .min( 1.0 )
                .max( 4.0 )
                .step( 0.01 )
                .onChange( ( e ) => { this.updateFunction(); this.reset = true; } )
                .listen();
        this.gui.add( this, 'x0' )
                .min( 0.0 )
                .max( 1.0 )
                .step( 0.001 )
                .onChange( ( e ) => this.reset = true )
                .listen();

        this.funcMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        this.funcGeometry = new THREE.BufferGeometry();
        this.funcPointsArray = new Float32Array( this.funcPoints * 3 );
        this.funcGeometry.addAttribute( 'position', new THREE.BufferAttribute( this.funcPointsArray, 3 ) );
        this.funcMesh = new THREE.Line( this.funcGeometry, this.funcMaterial );

        this.funcMesh.position.set( this.endpoint, 0, 0 );
        this.funcMesh.scale.set( this.scale, this.scale, 1 );

        this.addMesh( scene, this.funcMesh );
        this.updateFunction();

        this.identityGeometry = new THREE.Geometry();
        this.identityGeometry.vertices.push( 
                new THREE.Vector3( 0,
                                   0,
                                   0 ),
                new THREE.Vector3( 1,
                                   1,
                                   0 )
            );
        this.identityLine = new THREE.Line( this.identityGeometry,
                                            new THREE.LineBasicMaterial( { color : 0x555555, transparent : true, opacity : 0.3 } )
                                          );
        this.identityLine.position.set( this.endpoint, 0, 0 );
        this.identityLine.scale.set( this.scale, this.scale, 1 );
        this.addMesh( scene, this.identityLine );

        this.ballGeom = new THREE.SphereGeometry( 0.1 );
        this.ballMaterial = new THREE.MeshBasicMaterial( { color : 0x00A011 } );
        this.ballMesh = new THREE.Mesh( this.ballGeom, this.ballMaterial );
        this.addMesh( scene, this.ballMesh )

        this.iterate = 0;
        this.iterateMaterial = new THREE.LineBasicMaterial( { color : 0x22A011 } );
        this.iterateGeometry = new THREE.BufferGeometry();
        this.iteratePointsArray = new Float32Array( this.linePoints * 3 );
        this.iterateGeometry.addAttribute( 'position', new THREE.BufferAttribute( this.iteratePointsArray, 3 ) );
        this.iterateMesh = new THREE.Line( this.iterateGeometry, this.iterateMaterial );
        this.iterateMesh.position.set( this.endpoint, 0, 0 );
        this.iterateMesh.scale.set( this.scale, this.scale, 1 );
        this.addMesh( scene, this.iterateMesh );
    }

    animate( scene, camera, dt ){
        if ( this.keyState['KeyW'][0] == true ){
            this.a += 0.01;
            this.reset = true;
            if ( this.a > 4.0 ){
                this.a = 4.0;
            }

            this.updateFunction();
        }
        if ( this.keyState['KeyS'][0] == true ){
            this.a -= 0.01;
            this.reset = true;
            if ( this.a < 0.0 ){
                this.a = 0.0;
            }
            this.updateFunction();
        }
        if ( this.keyState['KeyA'][0] == true ){
            this.x0 -= 0.01;
            this.reset = true;
        }
        if ( this.keyState['KeyD'][0] == true ){
            this.x0 += 0.01
            this.reset = true;
        }

        if ( this.x0 > 1.0 ){ this.x0 = 1.0 };
        if ( this.x0 < 0.0 ){ this.x0 = 0.0 };
        
        this.ballMesh.position.set( ( this.x0 - 0.5 ) * this.scale, 0, 0 );

        if ( this.reset ){
            this.resetIterate();
            this.reset = false;
            this.frameCount = 0
        }

        if ( this.frameCount > 5 ){
            this.setNextIterate();
            this.frameCount = 0;
        }

        this.frameCount += 1
    }

    evalFunction( x ){
        return this.a * x * ( 1 - x );
    }

    resetIterate( ){
        this.iterate = 1;
        for ( var i = 0; i < this.linePoints; i++ ){
            this.iteratePointsArray[ i * 3 + 0 ] = this.x0;
            this.iteratePointsArray[ i * 3 + 1 ] = 0;
            this.iteratePointsArray[ i * 3 + 2 ] = 0;
        }
        this.iterateMesh.geometry.attributes.position.needsUpdate = true;
    }

    setNextIterate(){
        if ( this.iterate < this.linePoints - 1 ){
            var i = this.iterate;
            var x = this.iteratePointsArray[ ( i - 1 ) * 3 + 0 ];
            var fx = this.evalFunction( x )

            this.iteratePointsArray[ i * 3 + 0 ] = x;
            this.iteratePointsArray[ i * 3 + 1 ] = fx;

            this.iteratePointsArray[ ( i + 1 ) * 3 + 0 ] = fx;
            this.iteratePointsArray[ ( i + 1 ) * 3 + 1 ] = fx;

            this.iterate += 2;


            for ( var i = this.iterate; i < this.linePoints; i++ ){
                this.iteratePointsArray[ i * 3 + 0 ] = this.iteratePointsArray[ ( i - 1 ) * 3 + 0 ];
                this.iteratePointsArray[ i * 3 + 1 ] = this.iteratePointsArray[ ( i - 1 ) * 3 + 1 ];
                this.iteratePointsArray[ i * 3 + 2 ] = this.iteratePointsArray[ ( i - 1 ) * 3 + 2 ];
            }
        } else if ( this.continue ) {
            // move everything back one
            for ( var i = 0; i < this.linePoints - 2; i++){
                this.iteratePointsArray[ i * 3 + 0 ] = this.iteratePointsArray[ ( i + 2 ) * 3 + 0 ];
                this.iteratePointsArray[ i * 3 + 1 ] = this.iteratePointsArray[ ( i + 2 ) * 3 + 1 ];
            }

            // set last points
            var x = this.iteratePointsArray[ ( this.linePoints - 3 ) * 3 + 0 ]
            var fx = this.evalFunction( x );
            this.iteratePointsArray[ ( this.linePoints - 2 ) * 3 + 0 ] = x;
            this.iteratePointsArray[ ( this.linePoints - 2 ) * 3 + 1 ] = fx;

            this.iteratePointsArray[ ( this.linePoints - 1 ) * 3 + 0 ] = fx;
            this.iteratePointsArray[ ( this.linePoints - 1 ) * 3 + 1 ] = fx;
        }
        this.iterateMesh.geometry.attributes.position.needsUpdate = true;
    }

    updateFunction( ){

        for ( var i = 0; i < this.funcPoints; i++ ){
            var x = i / ( this.funcPoints - 1 ) * 2.0 - 0.5 ;
            this.funcPointsArray[ i * 3 + 0 ] = x
            this.funcPointsArray[ i * 3 + 1 ] = this.evalFunction( x );
            this.funcPointsArray[ i * 3 + 2 ] = 0;
        }
        this.funcMesh.geometry.attributes.position.needsUpdate = true;
    }
}