
class GOL extends SuperModel {
    constructor ( scene ){
        super( scene );

        this.instructionString = `This demo is an implementation of Conway's Game of Life.
                                  Cells in the grid switch between "live" and "dead" states
                                  based on their neighbors. Simply click a cell to toggle
                                  its state uncheck pause to run a Game of Life.
                                  `;

        this.modalContent = `More on the Game of Life can be found on the 
                             <a href="https://en.wikipedia.org/wiki/Glider_(Conway%27s_Life)" target="_blank">wikepdia page here</a>`

        this.time = 0.0;

        this.N = 10;
        this.cellValues = [];
        this.cellMeshes = [];
        this.modelShouldUpdate = true;

        this.size = 4;
        this.eps = 0.1;
        this.ups = 10;
        this.pAlive = 0.5;
        
        this.highlightColor = 0x0055ff;
        this.liveColor = 0x444444;
        this.deadColor = 0xffffff;

        this.pause = true;

        this.gui.add( this, 'pause' ).listen();  
        this.gui.add( this, 'randomize' );
        this.gui.add( this, 'reset' );  
        this.gui.add( this, 'N' )
                            .min( 6 ).max( 75 ).step( 1 )
                            .onChange( ( e ) => { this.modelShouldUpdate = true;
                                                 this.pause = true } );
        this.gui.add( this, 'ups' ).min( 1 ).max( 60 ).step( 1 );

        this.gui.add( this, 'pAlive' ).min( 0 ).max( 1 ).step( 0.01 );

        this.gui.addColor( this, 'liveColor' );
        this.gui.addColor( this, 'deadColor' );

        this.layout = 'plane';

        this.updateShape = true;

        this.gui.add( this, 'layout', [ 'plane', 'donut' ] ).onChange( ( e ) => this.updateShape = true );
        this.cellGeom = new THREE.BoxGeometry();
        this.cellMaterial = new THREE.MeshStandardMaterial( { color : this.deadColor } );

        this.cells = [];
        this.chosenCell = null;

        this.param1 = 1.5;
        this.param2 = 3.2;
    }

    createCell( value = 0 ){
        var cell = new THREE.Mesh( this.cellGeom, this.cellMaterial.clone() );
        cell.value = value;
        cell.storedValue = value;
        cell.baseSize = new THREE.Vector3( 1, 1, 1 );

        return cell;
    }

    reset(){
        for ( var i = 0; i < this.N * this.N; i++ ){
            this.cells[i].value = 0;
        }
    }

    randomize( palive = this.pAlive ){
        for ( var i = 0; i < this.N * this.N; i++ ){
            if ( Math.random() < palive ){
                this.cells[i].value = 1;
            } else {
                this.cells[i].value = 0;
            }
        }

        this.pause = true;
    }

    resizeCells( scene ){
        const Nsquared = this.N * this.N;

        if ( Nsquared > this.cells.length ){
            for ( var i = this.cells.length; i < Nsquared; i++ ){
                var cell = this.createCell();
                this.cells.push( cell );
                this.addMesh( scene, cell );
            }
        } else if  ( Nsquared < this.cells.length ){
            this.removeMeshesBySplice( scene, Nsquared, this.cells.length - Nsquared );
            this.cells.splice( Nsquared, this.cells.length - Nsquared );
        }
    }

    reshapeCells(){
        if ( this.layout === 'donut' ){
            var outerRadius = 5.5;
            var crossRadius = 1.5;

            var dTheta = Math.PI * 2 / this.N;

            for ( var i = 0; i < this.N; i++ ){
                var outerTheta = i * dTheta;
                var x = Math.cos( outerTheta );
                var z = Math.sin( outerTheta );
                // var xPos = Math.cos( outerTheta ) * outerRadius;
                // var zPos = Math.sin( outerTheta ) * outerRadius;

                for ( var j = 0; j < this.N; j++ ){
                    var innerPhi = j * dTheta;
                    var yPos = Math.sin( innerPhi ) * crossRadius;
                    var xPos = x * outerRadius + Math.cos( innerPhi ) * x * crossRadius;
                    var zPos = z * outerRadius + Math.cos( innerPhi ) * z * crossRadius;
                    this.cells[ i * this.N + j ].position.set( xPos, yPos, zPos );
                    this.cells[ i * this.N + j ].rotation.set( 0, -outerTheta, innerPhi);
                    this.cells[ i * this.N + j ].baseSize.set( dTheta,
                                                               1.5 * dTheta,
                                                               dTheta * ( crossRadius *
                                                               Math.cos( innerPhi ) + outerRadius * 0.9 ) );
                }
            }
        } else if ( this.layout == 'plane' ){
            var gridCenter = 0;
            var gridHeight = 9;
            var gridWidth = 9;
            var zPos = 0;
            for ( var i = 0; i < this.N; i++ ){
                var yPos = gridCenter - ( gridHeight / 2.0 ) + i * gridHeight / ( this.N - 1 );
                for ( var j = 0; j < this.N; j++ ){
                    var xPos = gridCenter - ( gridWidth / 2.0 ) + j * gridWidth / ( this.N - 1 );
                    this.cells[ i * this.N + j ].position.set( xPos, yPos, zPos );
                    this.cells[ i * this.N + j ].baseSize.setScalar( gridHeight / this.N * ( 1 - 0.1) );
                    this.cells[ i * this.N + j ].rotation.set( 0, 0, 0);
                }
            }
        }
    }
    
    animate( scene, camera, dt ){
        if ( this.modelShouldUpdate ){
            this.resizeCells( scene );
            this.reshapeCells();
            // this.resizeCells();
            // this.resizeMeshes( scene );
            this.modelShouldUpdate = false;
            this.updateShape = false;
        }

        if ( this.updateShape ){
            this.reshapeCells();
            this.updateShape = false;
        }

        this.time += dt;

        if ( !this.pause && this.time > 1 / this.ups ){
            this.udpateCells();
            this.time = 0.0;
        }



        var stepSize = ( 2 * this.size ) / ( this.N - 1 );
        var incr = 0.15; // percent increas

        for ( var i = 0; i < this.N * this.N; i++ ){
            var baseSize = this.cells[i].baseSize;
            if( this.cells[i].value == 0 ){
                this.cells[i].scale.set( baseSize.x, baseSize.y, baseSize.z);
                this.cells[i].material.color.setHex( this.deadColor );
            } else {
                this.cells[i].scale.set( baseSize.x * ( 1 + incr ),
                                         baseSize.y * ( 1 + incr ),
                                         baseSize.z * ( 1 + incr ) );
                this.cells[i].material.color.setHex( this.liveColor );
            }

            if ( this.cells[i].showValue < 0 ){
                this.cells[i].material.emissive.setHex( this.highlightColor );
            } else {
                this.cells[i].material.emissive.setHex( 0x000000 );
            }
            
            // if ( this.cells[i].material.emission.setHex( ))
        }

        this.raycaster.setFromCamera( this.mouse, camera );
        var intersections = this.raycaster.intersectObjects( this.cells );

        if ( intersections.length > 0 ){
            if ( this.chosenCell === intersections[0].object ){
                return;
            }

            if ( this.chosenCell ){ // reset previous cell
                this.chosenCell.showValue = this.chosenCell.value;
            }

            this.chosenCell = intersections[0].object;
            this.chosenCell.showValue = -1;
        } else {
            if ( this.chosenCell ){
                this.chosenCell.showValue = this.value;
            }
            this.chosenCell = null;
        }

    }

    mouseClickHandler( e ){
        if ( this.chosenCell ){
            this.chosenCell.value = Math.abs( this.chosenCell.value - 1 );
        }
    }
    getCellIndex( row, col ){
        if ( row < 0 ){
            row += this.N;
        }

        if ( col < 0 ){
            col += this.N;
        }

        col = col % this.N;
        row = row % this.N;

        return col + row * this.N;
    }

    udpateCells(){
        var newValues = [];
        var allZeros = true;

        for ( var i=0; i < this.N; i++ ){
            for ( var j = 0; j < this.N; j++ ){
                var newSum = 0;

                for ( var ii = -1; ii < 2; ii++ ){
                    for ( var jj = -1; jj < 2; jj++ ){
                        if ( ii == 0 && jj == 0 ){
                            continue;
                        }

                        // console.log( i, j, i + off1, j + off2 );
                        var neighborIndex = this.getCellIndex( i + ii, j + jj );
                        newSum += this.cells[neighborIndex].value;
                    }
                }
                if ( newSum > 0 ){
                    allZeros = false;
                }
                newValues.push( newSum );
            }
        }

        for ( var i = 0; i < this.cells.length; i++ ){
            if ( newValues[i] < 2 ){
                this.cells[i].value = 0.0;
            } else if ( newValues[i] == 3 ) {
                this.cells[i].value = 1.0;
            } else if ( newValues[i] > 3 ){
                this.cells[i].value = 0.0;
            }
        }

        if ( allZeros ){
            this.pause = true;
        }
    }
}
