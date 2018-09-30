
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
        this.numCells = N;
        // this.scale = 10.0 / N; // fits 10 x 10 grid so adjust cell size accordingly

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

        this.pause = true;
        this.color1 = "#ffffff";
        this.color2 = "#00000f";
    }

    init ( scene, camera ){
        // create meshes

        this.generateMeshes( scene, camera );
        // special div
        this.updateSpecialDiv();

        this.gui = new dat.GUI({
        height : 5 * 32 -1 } )

        this.gui.add( this, "interval" ).min( 0.01 ).max( 1.0 ).step( 0.01 );
        this.gui.addColor( this, "color1" );
        this.gui.addColor( this, "color2" );
        this.gui.add( this, "numCells" ).min( 8 ).max( 60 ).step( 2 );
    }

    generateMeshes ( scene, camera ){
        this.cells = new Array( this.N ).fill( 0.0 ).map( ( ) => new Array( this.N ).fill( 0.0 )); // binary values of cells
        this.meshes = new Array( this.N ).fill( null ).map( ( ) => new Array( this.N ).fill( null )); // empty array to store mesh objects
        this.cellObjects = []; // linear version of meshes for easier looping

        var scale = 10.0 / this.N;
        var cellGeom = createCellGeom( scale,
                                       scale / 4.0,
                                       scale / 8.0);

        for ( var i = 0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                var cellMaterial = new THREE.MeshStandardMaterial( { color: this.color1 } );
                // var boxMaterial = new THREE.MeshBasicMaterial( { color: "#FFFFFF" } );
                this.meshes[i][j] = new THREE.Mesh( cellGeom, cellMaterial );

                this.meshes[i][j].position.set( this.gridStart + i * scale + scale / 2.0,
                                           this.gridStart + j * scale + scale / 2.0,
                                           0);
                scene.add( this.meshes[i][j] );
                this.cellObjects.push( this.meshes[i][j] );
            }
        }

        this.pause = true;
    }

    animate ( scene, dt, camera, p=false){
        if ( !this.pause ){
            document.getElementById( "runButton" ).innerText = "pause";
        } else{
            document.getElementById( "runButton" ).innerText = "run";
        }

        if ( this.N != this.numCells ){ // recreate grid
            this.removeMeshes( scene );
            this.N = this.numCells;
            this.generateMeshes( scene, camera );

        }
        // update countdown
        this.countDownTimer -= dt;

        if ( this.countDownTimer < 0){
            this.countDownTimer = -1.0;
        }

        if ( this.countDownTimer < 0 && this.pause == false){ // if countdown is ready and running
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
                    this.meshes[i][j].material.color.set( this.color1 );
                    this.meshes[i][j].scale.set( 1, 1, 1 );
                }
                else {
                    this.meshes[i][j].material.color.set( this.color2 );
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
        this.removeMeshes( scene );
        this.gui.destroy();
    }
    
    removeMeshes ( scene ){
        for ( var i = 0; i < this.cellObjects.length; i++ ){
            scene.remove( this.cellObjects[ i ] );
        }
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
        runButton.setAttribute( "style", "position: absolute; left: 10px; top: 20px;" + 
                                "height: 20px; width: 50px; text-align: center;");

        runButton.addEventListener( "click", (e) => { this.togglePause( e ); });
        specialDiv.appendChild( runButton );

        var clearButton = document.createElement( "button" );
        clearButton.setAttribute( "id", "clearButton" );
        clearButton.innerText = "clear";
        clearButton.setAttribute( "style", "position: absolute; left: 80px; top: 20px; " + 
                        "height: 20px; width: 50px; text-align: center;");
        clearButton.addEventListener( "click", (e) => { this.clear( e ); } );
        specialDiv.appendChild( clearButton );

        var patternMenu = document.createElement( "select" );
        patternMenu.id = "pattenMenu";
        specialDiv.appendChild( patternMenu )
        var patterns = [ "", "glider", "glider gun" ];
        for ( var i = 0; i < patterns.length; i++ ){
            var option = document.createElement( "option" );
            option.value = patterns[ i ];
            option.text = patterns[ i ];
            patternMenu.appendChild( option );
        }
    }

    togglePause( event ){
        this.pause = !this.pause;
    }

    clear( event ){
        this.cells = new Array( this.N ).fill( 0.0 ).map( ( ) => new Array( this.N ).fill( 0.0 )); // binary values of cells
        if ( !this.pause ){
            this.togglePause( null );
        }
    }

    addPattern ( name ) {
        centeri = Math.floor( this.N / 2 );
        centerj = Math.floor( this.N / 2 );
        if ( name == "glider" ){
            // 0 1 0
            // 0 0 1
            // 1 1 1
            this.cells[ centeri ][ centerj - 1 ] = 1;
            this.cells[ centeri + 1 ][ centerj ] = 1;
            this.cells[ centeri - 1 ][ centerj + 1 ] = 1;
            this.cells[ centeri ][ centerj + 1 ] = 1;
            this.cells[ centeri + 1 ][ centerj + 1 ] = 1;
        }
    }
}

