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

