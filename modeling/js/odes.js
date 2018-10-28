
class ForwardEuler{
    constructor( demo, gui ){
        this.color = 0xff0000;
        this.material = new THREE.LineBasicMaterial( { color: this.color } );
        gui.addColor( this, 'color' )
                .onChange( ( value ) => this.material.color.setHex( value ) );
        this.z = 0.0;
        gui.add( this, 'z' ).min(-0.1).max(0.1).step(0.01)
                .onChange( ( e ) => demo.modelShouldUpdate = true );
    }

    integrate( f, ts, y0 = 0 ){
        var ys = [];

        ys.push( y0 );

        for ( var i = 1; i < ts.length; i++ ){
            const tPrev = ts[i-1];
            const yPrev = ys[i-1];
            const dt = ts[i] - tPrev;
            const funcEval = f.eval( { t : tPrev, y : yPrev } );
            ys.push( yPrev + dt * funcEval );
        }
        return ys;        
    }
}

class RK4{
    constructor( demo, gui ){
        this.color = 0x0000ff;
        this.material = new THREE.LineBasicMaterial( { color: this.color } );
        gui.addColor( this, 'color' )
                .onChange( ( value ) => this.material.color.setHex( value ) );

        this.c1 = 0;
        this.c2 = 0.5;
        this.c3 = 0.5;
        this.c4 = 1.0;

        this.b1 = 1 / 6.0;
        this.b2 = 1 / 3.0;
        this.b3 = 1 / 3.0;
        this.b4 = 1 / 6.0;

        this.a21 = 0.5;
        this.a31 = 0.0;
        this.a32 = 0.5;
        this.a41 = 0.0;
        this.a42 = 0.0;
        this.a43 = 1.0;

        this.z = 0.0;
        gui.add( this, 'z' ).min(-0.1).max(0.1).step(0.01)
                .onChange( ( e ) => demo.modelShouldUpdate = true );
    }

    integrate( f, ts, y0 = 0 ){
        var ys = [];
        ys.push( y0 );

        for( var i = 1; i < ts.length; i++ ){
            var dt = ts[i] - ts[i - 1];
            var k1 = dt * f.eval( { t : ts[i - 1], y : ys[i - 1] } );
            var k2 = dt * f.eval( { t : ts[i - 1] + dt / 2, y : ys[i - 1] + k1 / 2.0 } );
            var k3 = dt * f.eval( { t : ts[i - 1] + dt / 2, y : ys[i - 1] + k2 / 2.0 } );
            var k4 = dt * f.eval( { t : ts[i - 1] + dt, y : ys[i - 1] + k3 } );


            ys.push( ys[i - 1] + ( 1 / 6.0 ) * ( k1 + 2 * k2 + 2 * k3 + k4 ) );
        }

        return ys;
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

        this.dt = 0.1;
        this.y0 = 0;

        // must go before update
        var grid = new THREE.GridHelper( 10, 10 );
        grid.rotation.x = Math.PI / 2.0;
        this.addMesh( scene, grid );

        this.modelShouldUpdate = true;

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
         
        this.gui.add( this, 'dt' )
                .min( 0.001 )
                .max( 1.0 )
                .step( 0.001 )
                .onChange( ( e ) => this.modelShouldUpdate = true );

        this.integratorFolder = this.gui.addFolder( 'Integrators' );

        this.integrators = [];
        // add euler integrator
        this.eulerFolder = this.integratorFolder.addFolder( 'Forward Euler' );
        this.integrators.push( new ForwardEuler( this, this.eulerFolder ) );

        this.rk4Folder = this.integratorFolder.addFolder( 'RK-4' );
        this.integrators.push( new RK4( this, this.rk4Folder ) );

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

        this.lineMeshes = [];
    }

    animate( scene, camera, timeStep ){
        if ( this.modelShouldUpdate ){
            this.udpateModel( scene );
            this.modelShouldUpdate = false;
        }

    }
        
    udpateModel( scene ){
        // draw real function

        // var currentFunction = this.code;

        // var currentFunction = this.functionDict[this.function];
        // clear scene
        for( var i = 0; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.lineMeshes[i] );
        }

        var ts = [];
        for ( var t = this.tStart; t <= this.tEnd; t+= this.dt ){
            ts.push( t );
        }

        for ( var i = 0; i < this.integrators.length; i++ ){
            var integrator = this.integrators[i];
            var ys = integrator.integrate( this.code, ts, this.y0, this.scaleFunction );

            // if ( this.scaleFunction ){
            //     minY = Math.min( ...ys );
            //     maxY = Math.max( ...ys );
            //      // scale input
            //     for ( var j = 0; j < ys.length; j++ ){
            //         ys[j] = ( ys[j] - minY ) / ( maxY - minY ) * ( this.tEnd - this.tStart ) + this.tStart;
            //     }
            // }

            var geometry = new THREE.Geometry();
            // var material = new THREE.LineBasicMaterial( { color: 0xfff000 } );

            for ( var j = 0; j < ys.length; j++ ){
                geometry.vertices.push( new THREE.Vector3( ts[j], ys[j], this.integrators[i].z ) );
            }
            var line = new THREE.Line( geometry, integrator.material );
            this.addMesh( scene, line );
            this.lineMeshes.push( line );
        }

        var index = 0;
        for ( var t = -5; t <= 5; t += 0.5 ){
            var yStart = -5
            var yEnd = 5
            var yStep = ( yEnd - yStart ) / 20.0;
            for ( var y = yStart; y <= yEnd; y += yStep ){
                // if ( this.scaleFunction ){
                var sample = this.code.eval( { t : t, y : y } );
                // var sample = currentFunction( t, y );
                var dir = new THREE.Vector3( 1, sample, 0 ); 
                dir.normalize();
                // }
                this.arrowMeshes[index].setDirection( dir );
                index += 1;
            }
        }
    }



}