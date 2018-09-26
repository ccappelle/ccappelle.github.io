var pause = false;

function createCellGeom ( scale, eps1, eps2, segs = 10 ){
    // creates beveled cube
    var shape = new THREE.Shape();
    shape.moveTo( -( scale - eps1 - eps2 ) / 2.0, -( scale - eps1 - eps2 )  / 2.0 );
    shape.lineTo( -( scale - eps1 - eps2 ) / 2.0,  ( scale - eps1 - eps2 )  / 2.0 );
    shape.lineTo(  ( scale - eps1 - eps2 ) / 2.0,  ( scale - eps1 - eps2 )  / 2.0 );
    shape.lineTo(  ( scale - eps1 - eps2 ) / 2.0, -( scale - eps1 - eps2 )  / 2.0 );
    shape.lineTo( -( scale - eps1 - eps2 ) / 2.0, -( scale - eps1 - eps2 )  / 2.0 );

    var extrudeSettings = {
        steps: 2,
        depth: scale / 4.0,
        bevelEnabled: true,
        bevelThickness: scale / 4.0,
        bevelSize: eps1 / 2.0,
        bevelSegments: segs
    }

    var geom = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
    return geom;
}

class GameOfLife {
    constructor ( N = 20, updateInterval = 1.0 ){
        this.N = N; // N x N number of cells
        this.scale = 10.0 / N; // fits 10 x 10 grid so adjust cell size accordingly
        this.cells = new Array( N ).fill( 0.0 ).map( ( ) => new Array( N ).fill( 0.0 )); // binary values of cells
        this.meshes = new Array( N ).fill( null ).map( ( ) => new Array( N ).fill( null )); // empty array to store mesh objects
        this.cellObjects = []; // linear version of meshes for easier looping

        this.raycaster = new THREE.Raycaster(); // raycaster
        this.hoveredCell = [ -1, -1 ]; // which cell is currently pointed to
        this.interval = updateInterval; // interval between gol update steps
        this.countDownTimer = updateInterval; // countdown to measure interval

        this.name = "Game of Life"; 

        this.gridStart = -5.0;
        this.instructionString = " In Development ";
        this.mouse = new THREE.Vector2()
        this.mouse.x = 0;
        this.mouse.y = 0;
    }

    init ( scene, camera ){
        // create meshes

        var cellGeom = createCellGeom( this.scale, this.scale / 4.0, this.scale / 8.0);

        for ( var i = 0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                var cellMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
                // var boxMaterial = new THREE.MeshBasicMaterial( { color: "#FFFFFF" } );
                this.meshes[i][j] = new THREE.Mesh( cellGeom, cellMaterial );

                this.meshes[i][j].position.set( this.gridStart + i * this.scale + this.scale / 2.0,
                                           this.gridStart + j * this.scale + this.scale / 2.0,
                                           0);
                scene.add( this.meshes[i][j] );
                this.cellObjects.push( this.meshes[i][j] );
            }
        }
        pause = true;
        // special div
        this.updateSpecialDiv();

        this.gui = new dat.GUI({
        height : 5 * 32 -1 } )

        this.gui.add( this, "interval" ).min( 0.01 ).max( 1.0 ).step( 0.01 );
    }

    animate ( scene, dt, camera, p=false){
        // update countdown
        this.countDownTimer -= dt;

        if ( this.countDownTimer < 0){
            this.countDownTimer = -1.0;
        }

        if ( this.countDownTimer < 0 && pause == false){ // if countdown is ready and running
            this.updateCells();
            this.countDownTimer = this.interval; // reset countdown
        }
    }

    render ( renderer, scene, camera ){
        // console.log ( this.mouse );
        this.raycaster.setFromCamera( this.mouse, camera );
        var intersects = this.raycaster.intersectObjects( this.cellObjects );

    // if ( intersects.length > 0 ){
    //     var intersect = intersects[ 0 ];
    //     intersect.object.material.color.set( 0x0000f0 );
    // }
        this.hoveredCell = [-1, -1];

        // reset cell color to black or white
        for ( var i = 0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                if ( this.cells[i][j] == 0.0 ){
                    this.meshes[i][j].material.color.set( 0xffffff );
                    this.meshes[i][j].scale.set( 1, 1, 1 );
                }
                else {
                    this.meshes[i][j].material.color.set( 0x202020 );
                    this.meshes[i][j].scale.set( 1, 1, 1.5 );
                }
                
            }
        }

        // color hovered cell and set hover cell ij
        if ( intersects.length > 0 ){
            var intersect = intersects[ 0 ];
            intersect.object.material.color.set( 0x6680de );
            for ( var i = 0; i < this.N; i++ ){
                for ( var j = 0; j < this.N; j++ ){
                    if ( intersect.object == this.meshes[i][j] ){
                        this.hoveredCell = [i, j];
                    }
                }
            }
        }

        renderer.render( scene, camera ); 
    }

    clean ( scene ){
        for ( var i = 0; i < this.cellObjects.length; i++ ){
            scene.remove( this.cellObjects[ i ] );
        }

        this.gui.destroy();
    }
    
    setMouse( x, y ){
        this.mouse.x = x;
        this.mouse.y = y;
    }

    mouseClick( event ){
    //console.log( hoverCell );
        if ( this.hoveredCell[0] != -1 && this.hoveredCell[1] != -1 ){
            this.cells[ this.hoveredCell[0 ]][ this.hoveredCell[1] ] = 
                ( ( this.cells[ this.hoveredCell[0] ][ this.hoveredCell[1] ] - 1 ) % 2 + 2 ) % 2;
        }
    // console.log( cells );
    }
    
    updateCells( ){
        var updated = new Array(this.N).fill(0.0).map(()=>new Array(this.N).fill(0.0));

        // sum neighbors over toroidal map
        for ( var i = 0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                // N
                updated[i][j] += this.cells[ i % this.N ][ ( j + 1 ) % this.N ];
                // NE
                updated[i][j] += this.cells[ ( i + 1 ) % this.N ][ ( j + 1 ) % this.N ];
                // E
                updated[i][j] += this.cells[ ( i + 1 ) % this.N ][ j % this.N ];
                // SE
                updated[i][j] += this.cells[ ( i + 1 ) % this.N ][ ( ( j - 1 ) % this.N + this.N ) % this.N ];
                // S
                updated[i][j] += this.cells[ i % this.N ][ ( ( j - 1) % this.N + this.N ) % this.N ];
                // SW
                updated[i][j] += this.cells[ ( ( i - 1 ) % this.N + this.N ) % this.N ][ ( ( j - 1 ) % this.N + this.N ) % this.N ];
                // W
                updated[i][j] += this.cells[ ( ( i - 1 ) % this.N + this.N ) % this.N ][ j % this.N ];
                // NW
                updated[i][j] += this.cells[ ( ( i - 1 ) % this.N + this.N ) % this.N ][ ( j + 1 ) % this.N ];

            }
        }

        // kill and generate cells
        for ( var i = 0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                if ( updated[i][j] < 2 ){
                    this.cells[i][j] = 0;
                }
                if ( updated[i][j] > 3 ){
                    this.cells[i][j] = 0;
                }
                if ( updated[i][j] == 3 ){
                    this.cells[i][j] = 1;
                }
                if ( updated[i][j] == 2){
                }
            }
        }
    }


    updateSpecialDiv(){
        var specialDiv = document.getElementById( "special" );

        var runButton = document.createElement( "button" );
        runButton.setAttribute( "id", "runButton" );
        runButton.innerText = "run";
        runButton.setAttribute( "style", "position: absolute; left: 20px; top: 20px")
        runButton.addEventListener( "click", this.togglePause );
        specialDiv.appendChild( runButton );
    }

    togglePause( event ){
        pause = !pause;
        if ( !pause ){
            document.getElementById( "runButton" ).innerText = "pause";
        } else{
            document.getElementById( "runButton" ).innerText = "run";
        }
    }
}

gol = new GameOfLife( );

