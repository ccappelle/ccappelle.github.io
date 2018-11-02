
var ARROW_VERTEX_SHADER = `
    precision highp float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;
    uniform bool shouldNormalize;
    uniform float scale;
    uniform bool useColor;
    uniform float arrowAlpha;

    attribute vec3 position;
    attribute vec3 offset;
    attribute vec3 direction;
    attribute vec3 color;

    vec4 vPosition;

    varying vec4 vColor;

    void main(){
        vPosition = vec4( position.x, position.y, position.z, 1.0 );

        vec3 scaleVector = vec3( scale );

        float angle = atan( direction.y, direction.x );
        float directionLength = length( direction );


        if ( shouldNormalize == false ){
            scaleVector.x = scaleVector.x * directionLength;
        }

        mat4 S = mat4( scaleVector.x, 0.0, 0.0, 0.0,
                       0.0, scaleVector.y, 0.0, 0.0,
                       0.0, 0.0, scaleVector.z, 0.0,
                       0.0, 0.0, 0.0,   1.0 );

        mat4 R = mat4(  cos( angle ), sin( angle ), 0.0, 0.0,
                        - sin( angle ),  cos( angle ), 0.0, 0.0,
                        0.0,          0.0          , 1.0, 0.0,
                        0.0,          0.0          , 0.0, 1.0 );


        vPosition = vec4( offset.x, offset.y, offset.z, 0.0 ) + R * S * vPosition;
        if ( useColor == true ){
            vColor = vec4( color, arrowAlpha );
        } else {
            vColor = vec4( 0.5, 0.5, 0.5, arrowAlpha);
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    }
`

var ARROW_FRAGMENT_SHADER = `
    precision highp float;
    varying vec4 vColor;
    // varying vec4 vPosition;

    void main(){
        gl_FragColor = vColor;
    }
`

class ODESolvers{

    static eulerStep( f, t, h, yInits ){
        // take single step
        if ( Array.isArray( yInits ) ){
            var outYs = [];

            for ( var i = 0; i < yInits.length; i++ ){
                var y = yInits[i];
                y = y + f.eval( { t: t, y: y } ) * h;
                outYs.push( y );
            }
            return outYs;
        } else {
            return yInits + f.eval( { t: t, y: yInits } ) * h;
        }
    }

    static euler( f, t0, tf, h, y0s = 0){
        // run euler integration over the time range ts
        var ys = [];
        var ts = [];
        ys.push( y0s );

        var i = 0;
        ts.push( t0 );
        for ( var t = t0 + h; t <= tf; t += h){
            ys.push ( ODESolvers.eulerStep( f, t, h, ys[i] ) );
            ts.push( t );
            i ++;
        }

        return [ ys, ts ];
    }

    static rk( f, ts, y0s = 0, order = 4 ){

    }

    static adamsBashforth( f, ts, y0s = 0 ){

    }
}

class ODEDemo extends SuperModel{
    constructor ( scene ){
        super( scene );

        this.instructionString = `A demo comparing different ODE integrators.`;
        this.modalContent = `You can read more about ODE integration here
                             <a href="https://en.wikipedia.org/wiki/Numerical_methods_for_ordinary_differential_equations">
                                https://en.wikipedia.org/wiki/Numerical_methods_for_ordinary_differential_equations</a>`

        this.yPrime = '-t';
        this.code = math.parse( this.yPrime ).compile();

        this.tStart = -5.0;
        this.tEnd = 5.0;

        this.h = 0.1;
        this.y0 = 0;

        this.minColor = 0x6495ED;
        this.maxColor = 0xd93e3e;

        // must go before update
        var grid = new THREE.GridHelper( 10, 10 );
        grid.rotation.x = Math.PI / 2.0;
        this.addMesh( scene, grid );

        this.modelShouldUpdate = true;
        this.slopesShouldUpdate = true;

        this.normalizeSlopes = true;
        this.colorSlopes = true;

        this.functionShouldUpdate = true;

        this.gui.add( this, 'yPrime' ).onFinishChange( ( e ) => { this.code = math.parse( e ).compile();
                                                                  this.functionShouldUpdate = true;
                                                                  this.slopesShouldUpdate = true; } );
        this.gui.add( this, 'tStart' )
                .min( -5.0 ).max( 0.0 ).step( 0.01 )
                .onChange( ( e ) => { this.functionShouldUpdate = true;
                                     this.lineGeometry.setDrawRange( 0, Math.floor( ( 1 / this.h ) * ( this.tEnd - this.tStart) ) + 1 );
                } );

        this.gui.add( this, 'tEnd' )
                .min( 0.0 ).max( 5.0 ).step( 0.01 )
                .onChange( ( e ) => { this.functionShouldUpdate = true;
                                     this.lineGeometry.setDrawRange( 0, Math.floor( ( 1 / this.h ) * ( this.tEnd - this.tStart) ) + 1 );
                } );

        this.gui.add( this, 'y0' )
                .min( -5.0 )
                .max( 5.0)
                .step( 0.1 )
                .onChange( ( e ) => this.functionShouldUpdate = true );
        
        this.minH = 0.005;

        this.gui.add( this, 'h' )
                .min( this.minH )
                .max( 1.0 )
                .step( 0.001 )
                .onChange( ( e ) => { this.functionShouldUpdate = true;
                                     this.lineGeometry.setDrawRange( 0, Math.floor( ( 1 / this.h ) * ( this.tEnd - this.tStart) ) + 1);
                } );


        this.arrowAlpha = 1.0;

        this.arrowFolder = this.gui.addFolder( 'Slope Field Options' );





        this.integratorFolder = this.gui.addFolder( 'Integrators' );

        this.integrators = [];

        this.lineMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        this.lineGeometry = new THREE.BufferGeometry();

        this.maxLinePoints = 10 * ( 1 / this.minH );
        this.linePointsArray = new Float32Array( this.maxLinePoints * 3 );

        for ( var i = 0; i < this.maxLinePoints; i++ ){
            this.linePointsArray[ 3 * i + 0 ] = - 5.0 + i * this.h;
            this.linePointsArray[ 3 * i + 1 ] = 2.0;
            this.linePointsArray[ 3 * i + 2 ] = 0.0;
        }
        this.lineGeometry.addAttribute( 'position', new THREE.BufferAttribute( this.linePointsArray, 3 ) );


        console.log( this.maxLinePoints / 3.0 );

        this.lineMesh = new THREE.Line( this.lineGeometry, this.lineMaterial );
        this.addMesh( scene, this.lineMesh );

        this.createSlopeField();

        this.lineMeshes = [];
        this.time = 0;

        this.arrowFolder.add( this, 'normalizeSlopes' )
                        .onChange( ( value ) => this.arrowInstanceMesh.material.uniforms.shouldNormalize.value = value);
        this.arrowFolder.add( this, 'colorSlopes' )
                        .onChange( ( value ) => this.arrowInstanceMesh.material.uniforms.useColor.value = value);
        this.arrowFolder.add( this, 'arrowAlpha' )
                        .min( 0 )
                        .max( 1.0 )
                        .step( 0.1 )
                        .onChange( ( value ) => { this.arrowInstanceMesh.material.uniforms.arrowAlpha.value = value 
                            if ( value == 0 ){
                                this.arrowInstanceMesh.material.visible = false;
                            } else {
                                this.arrowInstanceMesh.material.visible = true;
                            }
                        } );
        this.arrowFolder.addColor( this, 'minColor' ).onChange( ( e ) => this.slopesShouldUpdate = true )

        this.arrowFolder.addColor( this, 'maxColor' ).onChange( ( e ) => this.slopesShouldUpdate = true );
        this.lineGeometry.setDrawRange( 0, Math.floor( ( 1 / this.h ) * ( this.tEnd - this.tStart) ) + 1 )
    }

    animate( scene, camera, dt ){

        if ( this.slopesShouldUpdate || this.functionShouldUpdate ){
            this.updateModel( scene, this.slopesShouldUpdate );
            this.slopesShouldUpdate = false;
            this.functionShouldUpdate = false;
        }
    }

    createSlopeField(){
        var arrowGeom = this.getArrowGeometry();
        this.arrowInstance = new THREE.InstancedBufferGeometry();

        this.arrowInstance.index = arrowGeom.index;
        this.arrowInstance.attributes.position = arrowGeom.attributes.position;

        this.N_INSTANCES = 21 * 21 * 3;
        this.arrowPositions = new Float32Array( this.N_INSTANCES );
        this.directionVectors = new Float32Array( this.N_INSTANCES );
        this.colorVectors = new Float32Array( 21 * 21 * 4 );


        var count = 0;
        var count2 = 0;
        for ( var x = -5; x <= 5; x += 0.5 ){
            for ( var y = -5; y <= 5; y += 0.5 ){
                this.colorVectors[count] = 0.0;
                this.directionVectors[count] = 1.0;
                this.arrowPositions[ count++ ] = x;

                this.colorVectors[count] = 0.0;
                this.directionVectors[count] = 0.0;
                this.arrowPositions[ count++ ] = y;

                this.colorVectors[count] = 0.0;
                this.directionVectors[count] = 0.0;
                this.arrowPositions[ count++ ] = 0;
            }
        }

        this.arrowInstance.addAttribute( 'offset', new THREE.InstancedBufferAttribute( this.arrowPositions, 3 ) );
        this.arrowInstance.addAttribute( 'direction', new THREE.InstancedBufferAttribute( this.directionVectors, 3 ) );
        this.arrowInstance.addAttribute( 'color', new THREE.InstancedBufferAttribute( this.colorVectors, 3 ) );

        // this.arrowInstance.addAttribute( 'angle' , new THREE.InstancedBufferAttribute( this.thetaVector, 1 ) );
        

        var instancedMaterial = new THREE.RawShaderMaterial( {
            uniforms : { 
                         shouldNormalize : { value : true },
                         scale : { value : 0.3 },
                         useColor : { value : true },
                         arrowAlpha : { value : this.arrowAlpha },
                       },
            vertexShader: ARROW_VERTEX_SHADER,
            fragmentShader: ARROW_FRAGMENT_SHADER,
            side : THREE.DoubleSide,
            transparent : true,
        });


        this.arrowInstanceMesh = new THREE.Mesh( this.arrowInstance, instancedMaterial );

        // this.arrowInstanceMesh.scale.set( 1, 0.1, 0.1 );
        this.addMesh( scene, this.arrowInstanceMesh );
    };

    getArrowGeometry( headwidthratio=4.0, headwidth=0.25, headlength=0.4, n = 10 ){

        var bodyToHeadRatio = headwidth / ( 2.0 * headwidthratio );

        var vertices = [  0.0,               bodyToHeadRatio,  0.0,
                          0.0,              -bodyToHeadRatio,  0.0,
                          1.0 - headlength, -bodyToHeadRatio,  0.0,

                          0.0,               bodyToHeadRatio, 0.0,
                          1.0 - headlength, -bodyToHeadRatio, 0.0,
                          1.0 - headlength,  bodyToHeadRatio, 0.0,

                          1.0 - headlength, -headwidth / 2.0, 0.0,
                          1.0, 0.0, 0.0,
                          1.0 - headlength, headwidth / 2.0, 0.0
                          ];

        var vertsArray = new Float32Array( vertices );
        var bufferGeometry = new THREE.BufferGeometry();

        bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertsArray, 3) );

        return bufferGeometry;
    }
        
    updateModel( scene, both = false ){
        
        // draw real function
        for( var i = 0; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.lineMeshes[i] );
        }

        var slopeLengths = [];

        var index = 0;
        var count = 0;
        var ys, ts;
        [ ys, ts ] = ODESolvers.euler( this.code, this.tStart, this.tEnd, this.h, this.y0 );

        for ( var i = 0; i < ts.length; i++ ){
            this.linePointsArray[ i * 3 + 0 ] = ts[i];
            this.linePointsArray[ i * 3 + 1 ] = ys[i];
            this.linePointsArray[ i * 3 + 2 ] = 0.0;
        }

        for ( var i = ts.length; i < this.maxLinePoints; i++ ){
            this.linePointsArray[ i * 3 + 0 ] = ts[ts.length - 1];
            this.linePointsArray[ i * 3 + 1 ] = ys[ys.length - 1];
            this.linePointsArray[ i * 3 + 2 ] = 0;
        }

        this.lineMesh.geometry.attributes.position.needsUpdate = true;

        for ( var t = -5; t <= 5; t += 0.5 ){
            var yStart = -5
            var yEnd = 5
            var yStep = ( yEnd - yStart ) / 20.0;
            for ( var y = yStart; y <= yEnd; y += yStep ){

                var sample = this.code.eval( { t : t, y : y } );
                // var sample = currentFunction( t, y );
                if ( both ){
                    var dir = new THREE.Vector3( 1, sample, 0 );
                    slopeLengths.push( dir.length() );

                    this.directionVectors[ count++ ] = dir.x;
                    this.directionVectors[ count++ ] = dir.y;
                    this.directionVectors[ count++ ] = dir.z;
                }
            }
        }

        if ( both ){
            this.arrowInstanceMesh.geometry.attributes.direction.needsUpdate = true;

            var minSlope = Math.min( ...slopeLengths );
            var maxSlope = Math.max( ...slopeLengths );

            for ( var i = 0; i < slopeLengths.length; i++ ){
                var alpha = ( slopeLengths[i] - minSlope ) / ( maxSlope - minSlope );
                var arrowColor = new THREE.Color( this.minColor );
                arrowColor.lerpHSL( new THREE.Color( this.maxColor ), alpha );

                this.colorVectors[ 3 * i ] = arrowColor.r;
                this.colorVectors[ 3 * i + 1 ] = arrowColor.g;
                this.colorVectors[ 3 * i + 2 ] = arrowColor.b;
            }

            this.arrowInstanceMesh.geometry.attributes.color.needsUpdate = true;
        }
    }



}