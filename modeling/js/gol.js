
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
        this.palive = 0.5;
        
        this.highlightColor = 0x0055ff;
        this.liveColor = 0x444444;
        this.deadColor = 0xffffff;

        this.pause = true;
        this.gui.add( this, 'pause' ).listen();    
        this.gui.add( this, 'N' )
                            .min( 6 ).max( 50 ).step( 1 )
                            .onChange( ( e ) => { this.modelShouldUpdate = true;
                                                 this.pause = true } );
        this.gui.add( this, 'ups' ).min( 1 ).max( 60 ).step( 1 );

        this.gui.add( this, 'palive' ).min( 0 ).max( 1 ).step( 0.01 );
        this.gui.add( this, 'randomize' );

        this.gui.addColor( this, 'liveColor' );
        this.gui.addColor( this, 'deadColor' );

        this.cellGeom = new THREE.BoxGeometry();
        this.cellMaterial = new THREE.MeshStandardMaterial( { color : this.deadColor } );

        this.cells = [];
        this.chosenCell = null;
    }

    createCell( value = 0 ){
        var cell = new THREE.Mesh( this.cellGeom, this.cellMaterial.clone() );
        cell.value = value;
        cell.storedValue = value;

        return cell;
    }

    randomize( palive = this.palive ){
        for ( var i = 0; i < this.N * this.N; i++ ){
            if ( Math.random() < palive ){
                this.cells[i].value = 1;
            } else {
                this.cells[i].value = 0;
            }
        }

        this.pause = true;
    }

    refreshCells( scene ){
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

        var zPos = 0;
        var stepSize = ( 2 * this.size ) / ( this.N - 1 );
        // reset to 0
        for ( var i = 0; i < this.N; i++ ){
            var yPos = -this.size + stepSize * i;
            for ( var j = 0; j < this.N; j++ ){
                var xPos = -this.size + stepSize * j;
                var index = j + i * this.N;
                this.cells[index].value = 0;
                this.cells[index].position.set( xPos, yPos, zPos );
            }
        }
    }
    
    animate( scene, camera, dt ){
        if ( this.modelShouldUpdate ){
            this.refreshCells( scene );
            // this.resizeCells();
            // this.resizeMeshes( scene );
            this.modelShouldUpdate = false;
        }

        this.time += dt;

        if ( !this.pause && this.time > 1 / this.ups ){
            this.udpateCells();
            this.time = 0.0;
        }



        var stepSize = ( 2 * this.size ) / ( this.N - 1 );
        var n1 = 1 / 5.0;
        var n2 = 1 / 100.0;

        for ( var i = 0; i < this.cells.length; i++ ){
            if( this.cells[i].value == 0 ){
                this.cells[i].scale.set( stepSize - stepSize * n1,
                                         stepSize - stepSize * n1,
                                         stepSize - stepSize * n1 );
                this.cells[i].material.color.setHex( this.deadColor );
            } else {
                this.cells[i].scale.set( stepSize - stepSize * n2,
                                         stepSize - stepSize * n2,
                                         stepSize - stepSize * n2);
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
    }
}
