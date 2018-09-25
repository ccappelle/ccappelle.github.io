var empty = {};

empty.instructionString = "Welcome to the " +
        "Modeling Suite." +
        "Please select an example in the lower "+
        "left hand corner and " +
        "press resubmit to view";

empty.animate = function ( scene, dt, pause=false ){

}

empty.clean = function ( scene ){
    
}

empty.init = function ( scene ){

}

var nameDictionary = {
    "ik2d": ik2d,
    "empty": empty,
    "lsystem": lsystem
};

// HTML THINGIES -------------
// get dropdown selector
var dropdown = document.getElementById("modelDropdown");
var resubmitButton = document.getElementById("resubmit");
resubmitButton.addEventListener( "click", resubmit);

var instructionDiv = document.getElementById( "instructions" )

var currentModel = dropdown.value;

// ----------------------------


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

// Render Loop
function animate(){
  requestAnimationFrame( animate );
  var dt = clock.getDelta();

  if ( currentModel in nameDictionary ){
    nameDictionary[currentModel].animate( scene, dt );
  }

  controls.update();
  // Render the scene
  render();
};

function render(){
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

function addLights() {
        // add lights
    ambientLight = new THREE.AmbientLight( 0x505050, 1);
    pointLight = new THREE.PointLight( 0xfffff0, 3, 0, 2 );
    pointLight.position.set( 10, 10, 3 );
    scene.add( ambientLight );
    scene.add( pointLight );

}
function resubmit(){

    var dropdownValue = dropdown.value;
    // update to dropdown value
    // if ( dropdown.value == "ik2d" ){
    //     console.log( ik2d.name );
    // }
    // else { console.log( dropdown.value ); }

    if ( currentModel in nameDictionary ){
        nameDictionary[currentModel].clean( scene );
    }
    // clean instruction div
    document.getElementById( "instructions" ).innerHTML = "";
    document.getElementById( "special" ).innerHTML = "";
    
    if ( dropdownValue in nameDictionary ){
        nameDictionary[dropdownValue].init( scene , camera );
        // update text in instruction box
        var p = document.createElement( "p" );
        var text = document.createTextNode( nameDictionary[dropdownValue].instructionString );
        p.appendChild( text );
        instructionDiv.appendChild( p );
        // nameDictionary[dropdownValue].updateInstructions( instructionDiv );
    }

    currentModel = dropdownValue;
}

function onWindowResize() {
    // resize and update camera on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentKeyDown( event ){
    if ( currentModel in nameDictionary ){
        nameDictionary[currentModel].keyDown( event );
    }
}

addPlane();
addLights();
resubmit();
animate();

