var pause = false;

function createCellGeom ( scale, eps1, eps2, segs = 10 ){
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
        this.N = N;
        this.scale = 10.0 / N;
        this.cells = new Array( N ).fill( 0.0 ).map( ( ) => new Array( N ).fill( 0.0 ));
        this.meshes = new Array( N ).fill( null ).map( ( ) => new Array( N ).fill( null ));
        this.cellObjects = [];

        this.raycaster = new THREE.Raycaster();
        this.hoveredCell = [ -1, -1 ];
        this.interval = updateInterval;
        this.countDownTimer = updateInterval;

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
      this.countDownTimer -= dt;

      if ( this.countDownTimer < 0){
            this.countDownTimer = -1.0;
      }

      if ( this.countDownTimer < 0 && pause == false){
        this.updateCells();
        this.countDownTimer = this.interval;
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
/*
var scene = new THREE.Scene();

// Create a basic perspective camera
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
camera.position.set( 8, 0, 15 );

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#F0F0F0");

// Configure renderer size
renderer.setSize( window.innerWidth, window.innerHeight );

// Append Renderer to DOM
document.body.appendChild( renderer.domElement );

// Create a Cube Mesh with basic material
// var geometry = new THREE.BoxGeometry( 1, 1, 1 );
// var material = new THREE.MeshBasicMaterial( { color: "#433F81" } );
// var cube = new THREE.Mesh( geometry, material );
controls = new THREE.OrbitControls( camera, renderer.domElement );

// window resize listener
window.addEventListener( "resize", onWindowResize, false );
document.addEventListener( "keydown", onDocumentKeyDown, false );

var clock = new THREE.Clock();

var gridStart = -5.0;
var gridEnd = 5.0;

var N = 40;
var scale = 10.0 / N;
var eps = scale / 4.0;
var eps2 = scale / 8.0;
var cells = new Array(N).fill(0.0).map(()=>new Array(N).fill(0.0));
var meshes = new Array(N).fill(null).map(()=>new Array(N).fill(null))

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2(), INTERSECTED;
var cellObjects = [];
var hoverCell = [-1, -1];

var golParams = function (){
    this.interval = 1.0
}
var updateInterval = 1.0;
var updateCellsTime = updateInterval;

var gui = new dat.GUI({
        height : 5 * 32 -1 } )

var updateInterval = new golParams

gui.add( updateInterval, "interval" ).min( 0.01 ).max( 1.0 ).step( 0.01 );

var pause = true;
// var boxGeom = new THREE.BoxGeometry( 0.5, 0.5, 0.1 );
// var boxMaterial = new THREE.MeshBasicMaterial( { color: "#FFFFFF" } );
// var mesh = 
// var boxGeom = new THREE.BoxGeometry( scale - eps, scale - eps, scale / 2.0 );
// extruded geom
var shape = new THREE.Shape();
shape.moveTo( -( scale - eps - eps2 ) / 2.0, -( scale - eps - eps2 )  / 2.0 );
shape.lineTo( -( scale - eps - eps2 ) / 2.0,  ( scale - eps - eps2 )  / 2.0 );
shape.lineTo(  ( scale - eps - eps2 ) / 2.0,  ( scale - eps - eps2 )  / 2.0 );
shape.lineTo(  ( scale - eps - eps2 ) / 2.0, -( scale - eps - eps2 )  / 2.0 );
shape.lineTo( -( scale - eps - eps2 ) / 2.0, -( scale - eps - eps2 )  / 2.0 );

var extrudeSettings = {
    steps: 2,
    depth: scale / 4.0,
    bevelEnabled: true,
    bevelThickness: scale / 4.0,
    bevelSize: eps / 2.0,
    bevelSegments: 10
}

var boxGeom = new THREE.ExtrudeBufferGeometry( shape, extrudeSettings );
for ( var i=0; i < N; i ++){
    for ( var j=0; j < N; j++){
        var boxMaterial = new THREE.MeshStandardMaterial( { color: 0xffffff } );
        // var boxMaterial = new THREE.MeshBasicMaterial( { color: "#FFFFFF" } );
        meshes[i][j] = new THREE.Mesh( boxGeom, boxMaterial );

        meshes[i][j].position.set( gridStart + i * scale + scale / 2.0,
                                   gridStart + j * scale + scale / 2.0,
                                   0);
        scene.add( meshes[i][j] );
        cellObjects.push( meshes[i][j] );
    }
}


function updateCells(){

    var updated = new Array(N).fill(0.0).map(()=>new Array(N).fill(0.0));

    // sum neighbors over toroidal map
    for ( var i = 0; i < N; i++ ){
        for ( var j = 0; j < N; j++ ){
            // N
            updated[i][j] += cells[ i % N ][ ( j + 1 ) % N ];
            // NE
            updated[i][j] += cells[ ( i + 1 ) % N ][ ( j + 1 ) % N ];
            // E
            updated[i][j] += cells[ ( i + 1 ) % N ][ j % N ];
            // SE
            updated[i][j] += cells[ ( i + 1 ) % N ][ ( ( j - 1 ) % N + N ) % N ];
            // S
            updated[i][j] += cells[ i % N ][ ( ( j - 1) % N + N ) % N ];
            // SW
            updated[i][j] += cells[ ( ( i - 1 ) % N + N ) % N ][ ( ( j - 1 ) % N + N ) % N ];
            // W
            updated[i][j] += cells[ ( ( i - 1 ) % N + N ) % N ][ j % N ];
            // NW
            updated[i][j] += cells[ ( ( i - 1 ) % N + N ) % N ][ ( j + 1 ) % N ];

        }
    }


    for ( var i = 0; i < N; i++ ){
        for ( var j = 0; j < N; j++ ){
            if ( updated[i][j] < 2 ){
                cells[i][j] = 0;
            }
            if ( updated[i][j] > 3 ){
                cells[i][j] = 0;
            }
            if ( updated[i][j] == 3 ){
                cells[i][j] = 1;
            }
        }
    }
}
// Render Loop
function animate(){
  requestAnimationFrame( animate );
  updateCellsTime -= clock.getDelta();

  if ( updateCellsTime < 0){
        updateCellsTime = -1.0;
  }

  if (updateCellsTime < 0 && pause == false){
    updateCells();
    updateCellsTime = updateInterval.interval;
  }

  controls.update();
  // Render the scene
  render();
};

function render(){
    raycaster.setFromCamera( mouse, camera );
    var intersects = raycaster.intersectObjects( cellObjects );

    // if ( intersects.length > 0 ){
    //     var intersect = intersects[ 0 ];
    //     intersect.object.material.color.set( 0x0000f0 );
    // }
    hoverCell = [-1, -1];

    for ( var i = 0; i < N; i++ ){
        for ( var j = 0; j < N; j++ ){
            if ( cells[i][j] == 0.0 ){
                meshes[i][j].material.color.set( 0xffffff );
                meshes[i][j].scale.set( 1, 1, 1 );
            }
            else {
                meshes[i][j].material.color.set( 0x202020 );
                meshes[i][j].scale.set( 1, 1, 1.5 );
            }
            
        }
    }

    if ( intersects.length > 0 ){
        var intersect = intersects[ 0 ];
        intersect.object.material.color.set( 0x6680de );
        for ( var i = 0; i < N; i++ ){
            for ( var j = 0; j < N; j++ ){
                if ( intersect.object == meshes[i][j] ){
                    hoverCell = [i, j];
                }
            }
        }
    }
    renderer.render(scene, camera);
}

function addPlane(){
    // Create textured plane
    var texture = new THREE.TextureLoader().load("textures/groundimg.png");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set( 20, 20 );

    var planeGeometry = new THREE.PlaneBufferGeometry( 20, 20, 32, 32 );
    var planeMaterial = new THREE.MeshBasicMaterial( { map: texture, side: THREE.DoubleSide } )

    var plane = new THREE.Mesh( planeGeometry, planeMaterial );
    plane.rotation.x = Math.PI / 2;
    plane.position.y = -5.01;
    scene.add( plane );

}

function onWindowResize() {
    // resize and update camera on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentKeyDown( event ){
    // if ( currentModel in nameDictionary ){
    //     nameDictionary[currentModel].keyDown( event );
    // }
}

function addGrid(){
    // add grid
    gridHelper = new THREE.GridHelper( 10, 20 );
    gridHelper.geometry.rotateX( Math.PI / 2 );
    scene.add( gridHelper );
}

function onMouseMove( event ){

    event.preventDefault();

    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( ( event.clientY / window.innerHeight ) * 2 - 1) ;
}

function onMouseClick( event ){

    //console.log( hoverCell );
    if ( hoverCell[0] != -1 && hoverCell[1] != -1 ){
        cells[ hoverCell[0]][ hoverCell[1] ] = 
            ( ( cells[ hoverCell[0] ][ hoverCell[1] ] - 1 ) % 2 + 2 ) % 2;
    }
    // console.log( cells );
}

function addLights() {
        // add lights
    ambientLight = new THREE.AmbientLight( 0x707070, 4);
    pointLight = new THREE.PointLight( 0xfffff0, 3, 0, 2 );
    pointLight.position.set( 10, 10, 3 );
    scene.add( ambientLight );
    scene.add( pointLight );

}

function onRightClick( event ){
    pause = !pause;
}

window.addEventListener( 'contextmenu', onRightClick, false );
window.addEventListener( 'click', onMouseClick, false );
window.addEventListener( 'mousemove', onMouseMove, false );
// addGrid();
addLights();
addPlane();
animate();

*/

