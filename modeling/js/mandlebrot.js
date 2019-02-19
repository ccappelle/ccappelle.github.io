
class Mandlebrot extends SuperModel {
    constructor( scene ){
        super( scene );

        this.center = new THREE.Vector2( 0, 0 );
        this.scale = 5;
        this.sampleZ = false;
        this.sampleC = true;
        this.whichImage = 'Mandlebrot'

        this.Z_real = 0.0;
        this.Z_imag = 0.0;
        this.C_real = 0.0;
        this.C_imag = 0.0;

        // this.gui.add( this, 'sampleZ' );
        // this.gui.add( this, 'sampleC' );
        this.gui.add( this, 'whichImage', [ 'Mandlebrot', 'Julia' ] );
        this.gui.add( this, 'Z_real' ).min( -1.0 ).max( 1.0 ).step( 0.001 );
        this.gui.add( this, 'Z_imag' ).min( -1.0 ).max( 1.0 ).step( 0.001 );
        this.gui.add( this, 'C_real' ).min( -1.0 ).max( 1.0 ).step( 0.001 );
        this.gui.add( this, 'C_imag' ).min( -1.0 ).max( 1.0 ).step( 0.001 );

        this.vertexshader = `
            varying vec2 pout;
            void main(){
                pout = position.xy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
        `

        this.fragmentshader = `
            uniform vec2 center;
            uniform float scale;
            uniform bool sampleZ;
            uniform bool sampleC;
            uniform vec4 zcInit;

            varying vec2 pout;

            const int ITERATIONS = 1000;
            const float THRESHOLD = 4.0;

            void main(){
                vec2 c;
                vec2 z;

                if ( sampleC ){
                    c = vec2( pout.x * scale, pout.y * scale ) + center;
                } else {
                    c = zcInit.zw;
                }

                if ( sampleZ ){
                    z = vec2( pout.x * scale, pout.y * scale ) + center;
                } else {
                    z = zcInit.xy;
                }

                int count = 0;
                for( int i=0; i<ITERATIONS; i++ ){
                    z = vec2( z.x * z.x - z.y * z.y + c.x, 2.0 * z.x * z.y + c.y );
                    if ( ( z.x * z.x + z.y * z.y ) > THRESHOLD ){
                        break;
                    }
                    count ++;
                }

                if ( count >= ITERATIONS ){
                    gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
                } else {
                    float alpha = float( count ) / float( ITERATIONS );
                    gl_FragColor = vec4( 1.0 - alpha,
                                         alpha,
                                         1.0, 1.0 );
                }
            }
        `

        var vertices = new Float32Array( [
            -0.5, -0.5,  0.0,
             0.5, -0.5,  0.0,
             0.5,  0.5,  0.0,

             0.5,  0.5,  0.0,
            -0.5,  0.5,  0.0,
            -0.5, -0.5,  0.0
        ] );

        var squareGeom = new THREE.BufferGeometry();
        squareGeom.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        // var material = new THREE.MeshBasicMaterial( { color: 0xff0000, side: THREE.DoubleSide } );

        var material = new THREE.ShaderMaterial( {
                vertexShader : this.vertexshader,
                fragmentShader: this.fragmentshader,
                side: THREE.DoubleSide,
                uniforms: {
                    center: { value: this.center },
                    scale: { value: this.scale },
                    sampleZ: { value: this.sampleZ },
                    sampleC: { value: this.sampleC },
                    zcInit: { value: new THREE.Vector4( this.Z_real, this.Z_imag, this.C_real, this.C_imag ) },
                }
        });

        this.square = new THREE.Mesh( squareGeom, material );

        this.square.scale.set( 10, 10, 1 );
        this.addMesh( scene, this.square );

    }


    animate ( scene, camera, dt ){
        var speedScale = 0.99;

        if ( this.keyState['KeyE'][0] == true ){
            // zoom in
            this.scale *= speedScale;
        }
        if ( this.keyState['KeyQ'][0] == true ){
            // zoom out
            this.scale *= 2 - speedScale;
        }
        if ( this.keyState['KeyW'][0] == true ){
            // move up
            this.center.y = this.center.y + this.scale * ( 1 - speedScale );
        }
        if ( this.keyState['KeyA'][0] == true ){
            // move left
            this.center.x = this.center.x - this.scale * ( 1 - speedScale );
        }
        if ( this.keyState['KeyS'][0] == true ){
            // move down
            this.center.y = this.center.y - this.scale * ( 1 - speedScale );
        }
        if ( this.keyState['KeyD'][0] == true ){
            // move right
            this.center.x = this.center.x + this.scale * ( 1 - speedScale );
        }


        // console.log( this.actionKeys );
        // this.center = this.center.addScalar( dt / 10.0 );
        this.square.material.uniforms.center.value = this.center;
        this.square.material.uniforms.scale.value = this.scale;

        if ( this.whichImage === "Mandlebrot" ){
            this.sampleC = true;
            this.sampleZ = false;
        } else {
            this.sampleZ = true;
            this.sampleC = false;
        }

        this.square.material.uniforms.sampleZ.value = this.sampleZ;
        this.square.material.uniforms.sampleC.value = this.sampleC;
        this.square.material.uniforms.zcInit.value = new THREE.Vector4( this.Z_real, this.Z_imag,
                                                                        this.C_real, this.C_imag );

    }
}