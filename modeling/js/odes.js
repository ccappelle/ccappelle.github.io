
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

            ys.push( yPrev + dt * f( tPrev, yPrev ) );
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
            var k1 = dt * f( ts[i - 1], ys[i - 1] );
            var k2 = dt * f( ts[i - 1] + dt / 2, ys[i - 1] + k1 / 2.0 );
            var k3 = dt * f( ts[i - 1] + dt / 2, ys[i - 1] + k2 / 2.0 );
            var k4 = dt * f( ts[i - 1] + dt, ys[i - 1] + k3 );

            ys.push( ys[i - 1] + ( 1 / 6.0 ) * ( k1 + 2 * k2 + 2 * k3 + k4 ) );
        }

        return ys;
    }
}

class ODEDemo extends SuperModel{
    constructor ( scene ){
        super( scene );
        this.functionNames = [ 't',
                               'cos(t)',
                               'e^t',
                               'e^-ty',
                               'cos(ty)'
                            ];
        this.functionList = [ ( t, y ) => t,
                              ( t, y ) => Math.cos( t ),
                              ( t, y ) => Math.exp( t ) ,
                              ( t, y ) => Math.exp( -t * y ),
                              ( t, y ) => Math.cos( t * y )
                            ];

        this.functionDict = {};
        for ( var i = 0; i < this.functionNames.length; i++ ){
            this.functionDict[this.functionNames[i]] = this.functionList[i];
        }

        this.tStart = -5.0;
        this.tEnd = 5.0;

        this.dt = 0.1;
        this.y0 = 0;
        this.scaleFunction = true;
        this.function = this.functionNames[0];

        // must go before update
        var grid = new THREE.GridHelper( 10, 10 );
        grid.rotation.x = Math.PI / 2.0;
        this.addMesh( scene, grid );

        // this.udpateModel( scene );

        this.modelShouldUpdate = true;

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

        this.gui.add( this, 'scaleFunction' )
                .onChange( ( e ) => this.modelShouldUpdate = true);
        this.gui.add( this, 'function', this.functionNames )
                .onChange( ( e ) => this.modelShouldUpdate = true );

        this.integratorFolder = this.gui.addFolder( 'Integrators' );

        this.integrators = [];
        // add euler integrator
        this.eulerFolder = this.integratorFolder.addFolder( 'Forward Euler' );
        this.integrators.push( new ForwardEuler( this, this.eulerFolder ) );

        this.rk4Folder = this.integratorFolder.addFolder( 'RK-4' );
        this.integrators.push( new RK4( this, this.rk4Folder ) );
    }

    animate( scene, camera, timeStep ){
        if ( this.modelShouldUpdate ){
            this.udpateModel( scene );
            this.modelShouldUpdate = false;
        }

    }
        
    udpateModel( scene ){
        // draw real function

        var currentFunction = this.functionDict[this.function];
        // clear scene
        for( var i = 1; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.sceneMeshes[i] );
        }

        var ts = [];
        for ( var t = this.tStart; t <= this.tEnd; t+= this.dt ){
            ts.push( t );
        }

        for ( var i = 0; i < this.integrators.length; i++ ){
            var integrator = this.integrators[i];
            var ys = integrator.integrate( currentFunction, ts, this.y0, this.scaleFunction );



            if ( this.scaleFunction ){
                const minY = Math.min( ...ys );
                const maxY = Math.max( ...ys );
                 // scale input
                for ( var j = 0; j < ys.length; j++ ){
                    ys[j] = ( ys[j] - minY ) / ( maxY - minY ) * ( this.tEnd - this.tStart ) + this.tStart;
                }
            }

            var geometry = new THREE.Geometry();
            // var material = new THREE.LineBasicMaterial( { color: 0xfff000 } );

            for ( var j = 0; j < ys.length; j++ ){
                geometry.vertices.push( new THREE.Vector3( ts[j], ys[j], this.integrators[i].z ) );
            }
            var line = new THREE.Line( geometry, integrator.material );
            this.addMesh( scene, line );
        }
    }



}