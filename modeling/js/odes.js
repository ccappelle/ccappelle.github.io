
var ARROW_VERTEX_SHADER = `
    precision highp float;
    uniform mat4 modelViewMatrix;
    uniform mat4 projectionMatrix;

    attribute vec3 position;
    attribute vec3 offset;
    attribute vec3 direction;
    // attribute vec3 scale;
    // attribute vec3 color;
    const vec3 scale = vec3( 0.1, 0.1, 0.1 );
    varying vec4 vPosition;
    

    void main(){
        vec3 normalizedDirection = normalize( vec3( direction.x, -direction.y, direction.z ) );
        float theta = atan( normalizedDirection.y, normalizedDirection.x );
        // theta = 3.14159 / 2.0;
        mat4 S = mat4( scale.x, 0.0, 0.0, 0.0,
                       0.0, scale.y, 0.0, 0.0,
                       0.0, 0.0, scale.z, 0.0,
                       0.0, 0.0, 0.0,     1.0 );

        mat4 R = mat4(  cos( theta ), -sin( theta ), 0.0, 0.0,
                        sin( theta ),  cos( theta ), 0.0, 0.0,
                        0.0,          0.0          , 1.0, 0.0,
                        0.0,          0.0          , 0.0, 1.0 );

        mat4 T = mat4( 1.0, 0.0, 0.0, offset.x,
                       0.0, 1.0, 0.0, offset.y,
                       0.0, 0.0, 1.0, offset.z,
                       0.0, 0.0, 0.0, 1.0 );

        vPosition = vec4( offset, 0.0 ) + R * S * vec4( position, 1.0 );//  T * R * S * vec4( position, 1.0 );
        // vColor = vec4( vColor, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vPosition;
    }
`

var ARROW_FRAGMENT_SHADER = `
    precision highp float;
    // varying vColor;
    varying vec4 vPosition;

    void main(){
        gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
    }
`

class ODESolvers{

    static eulerStep( f, t, h, yInits ){
        // take single step
        if ( Array.isArray( yInits ) ){
            var outYs = [];

            for ( var i = 0; i < yInits.length; i++ ){
                var y = yInits[i];
                y = y + f( t, y ) * h;
                outYs.push( y );
            }
            return outYs;
        } else {
            return yInits + f( t, yInits ) * h;
        }
    }

    static euler( f, t0, tf, h, y0s = 0){
        // run euler integration over the time range ts
        var ys = [];
        ys.push( y0s );

        for ( var t = t0 + h; t <= tf; t += h){
            ys.push ( ODESolvers.eulerStep( f, t, h, ys[i] ) );
        }

        return ys;
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

        // must go before update
        var grid = new THREE.GridHelper( 10, 10 );
        grid.rotation.x = Math.PI / 2.0;
        this.addMesh( scene, grid );

        this.modelShouldUpdate = true;

        this.normalizeSlopes = true;
        this.colorSlopes = true;

        this.gui.add( this, 'yPrime' ).onFinishChange( ( e ) => { this.code = math.parse( e ).compile();
                                                                  this.modelShouldUpdate = true } );
        this.gui.add( this, 'tStart' )
                .min( -5.0 ).max( 0.0 ).step( 0.01 )
                .onChange( ( e ) => this.modelShouldUpdate = true );

        this.gui.add( this, 'tEnd' )
                .min( 0.0 ).max( 5.0 ).step( 0.01 )
                .onChange( ( e ) => this.modelShouldUpdate = true );
        this.gui.add( this, 'y0' )
                .min( -5.0 )
                .max( 5.0)
                .step( 0.1 )
                .onChange( ( e ) => this.modelShouldUpdate = true );
        
        this.minH = 0.005;

        this.gui.add( this, 'h' )
                .min( this.minH )
                .max( 1.0 )
                .step( 0.001 )
                .onChange( ( e ) => this.modelShouldUpdate = true );

        this.gui.add( this, 'normalizeSlopes' ).onChange( ( e ) => this.modelShouldUpdate = true );
        this.gui.add( this, 'colorSlopes' ).onChange( ( e ) => this.modelShouldUpdate = true );

        this.integratorFolder = this.gui.addFolder( 'Integrators' );

        this.integrators = [];
        // add euler integrator
        // this.eulerFolder = this.integratorFolder.addFolder( 'Forward Euler' );
        // this.integrators.push( new ForwardEuler( this, this.eulerFolder ) );

        // this.rk4Folder = this.integratorFolder.addFolder( 'RK-4' );
        // this.integrators.push( new RK4( this, this.rk4Folder ) );
        this.lineMaterial = new THREE.LineBasicMaterial( { color : 0x00000 } );
        this.lineGeometetry = new THREE.Geometry();

        this.eulerLineMesh = 
        this.arrowMeshes = [];
        // create arrow helpers
        for ( var i = -5; i <= 5; i += 0.5 ){
            for ( var j = -5; j <=5; j += 0.5 ){
                var dir = new THREE.Vector3( 1, 1, 0 );
                dir.normalize();
                var pos = new THREE.Vector3( i, j, 0 );
                var arrow = new THREE.ArrowHelper( 
                                dir, pos,
                                0.3, 0x555555,
                                0.2, 0.1
                             );
                this.addMesh( scene, arrow );
                this.arrowMeshes.push( 
                        arrow  
                    );
            }
        }
        var arrowGeom = this.getArrowGeometry();
        this.arrowInstance = new THREE.InstancedBufferGeometry();

        this.arrowInstance.index = arrowGeom.index;
        this.arrowInstance.attributes.position = arrowGeom.attributes.position;

        this.N_INSTANCES = 21 * 21 * 3;
        this.arrowPositions = new Float32Array( this.N_INSTANCES );
        this.slopeVectors = new Float32Array( this.N_INSTANCES );

        var count = 0;
        for ( var x = -5; x <= 5; x += 0.5 ){
            for ( var y = -5; y <= 5; y += 0.5 ){
                this.slopeVectors[count] = Math.random() * 2 - 1.0;
                this.arrowPositions[ count++ ] = x;

                this.slopeVectors[count] = Math.random() * 2 - 1.0;
                this.arrowPositions[ count++ ] = y;

                this.slopeVectors[count] = Math.random();
                this.arrowPositions[ count++ ] = 0;
            }
        }

        this.arrowInstance.addAttribute( 'offset', new THREE.InstancedBufferAttribute( this.arrowPositions, 3 ) );
        this.arrowInstance.addAttribute( 'direction', new THREE.InstancedBufferAttribute( this.slopeVectors, 3 ) );

        var instancedMaterial = new THREE.RawShaderMaterial( {
            vertexShader: ARROW_VERTEX_SHADER,
            fragmentShader: ARROW_FRAGMENT_SHADER,
        });


        this.arrowInstanceMesh = new THREE.Mesh( this.arrowInstance, instancedMaterial );
        // this.arrowInstanceMesh.scale.set( 1, 0.1, 0.1 );
        this.addMesh( scene, this.arrowInstanceMesh );
        var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
        var mesh = new THREE.Mesh( arrowGeom, material );

        this.addMesh( scene, mesh );
        this.lineMeshes = [];

    }

    animate( scene, camera, timeStep ){
        if ( this.modelShouldUpdate ){
            this.udpateModel( scene );
            this.modelShouldUpdate = false;
        }
    }

    getArrowGeometry( headpercent=0.1, n = 10 ){

        var vertices = [ 0.0, 0.0, 0.0,
                     -2.0, 1.0, 0.0,
                     -2.0, -1.0, 0.0 ];

        var vertsArray = new Float32Array( vertices );
        var bufferGeometry = new THREE.BufferGeometry();

        bufferGeometry.addAttribute( 'position', new THREE.BufferAttribute( vertsArray, 3) );

        return bufferGeometry;
    }
        
    udpateModel( scene ){
        
        // draw real function
        for( var i = 0; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.lineMeshes[i] );
        }

        var slopeLengths = [];

        var index = 0;
        var count = 0;
        for ( var t = -5; t <= 5; t += 0.5 ){
            var yStart = -5
            var yEnd = 5
            var yStep = ( yEnd - yStart ) / 20.0;
            for ( var y = yStart; y <= yEnd; y += yStep ){

                var sample = this.code.eval( { t : t, y : y } );
                // var sample = currentFunction( t, y );
                var dir = new THREE.Vector3( 1, sample, 0 );
                var length = dir.length();
                slopeLengths.push( length );

                var otherDir = new THREE.Vector3( sample, 1, 0 );
                this.arrowInstance.attributes.direction[ count++ ] = dir.x;
                this.arrowInstance.attributes.direction[ count++ ] = dir.y;
                this.arrowInstance.attributes.direction[ count++ ] = dir.z;

                dir.normalize();

                this.arrowMeshes[index].setDirection( dir );
                if ( this.normalizeSlopes ){
                    this.arrowMeshes[index].setLength( 0.3, 0.2, 0.1 );
                } else {
                    var arrSize = 0.5
                    this.arrowMeshes[index].setLength( length * arrSize,
                                                       Math.min( length * 0.2, 0.2 ),
                                                       Math.min( length * 0.1, 0.1 ) );
                }
                index += 1;
            }
        }

        this.arrowInstance.attributes.direction.needsUpdate = true;

        var maxLength = Math.max( ...slopeLengths );
        maxLength += maxLength * 0.01;

        var maxColor = new THREE.Color( 0xaa0000 );

        for ( var i = 0; i < this.arrowMeshes.length; i++ ){
            if ( this.colorSlopes ){
                var arrowColor = new THREE.Color( 0x0000aa );
                arrowColor.lerpHSL( maxColor, slopeLengths[i] / maxLength );

                this.arrowMeshes[i].setColor( arrowColor );
            } else {
                this.arrowMeshes[i].setColor( new THREE.Color( 0x555555 ) );
            }
        }
    }



}