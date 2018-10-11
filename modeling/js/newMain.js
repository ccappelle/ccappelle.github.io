var currentModel;
var scene, camera, renderer, controls, clock;

var modelDictionary = {
    "Empty"                   : SuperModel,
    "Evolutionary Strategies" : ES
    // "Empty"           : Empty,
    // "Game of Life"    : GameOfLife,
    // "L-systems"       : Lsystem,
    // "3D Model Viewer" : Viewer,
    // "2D Water"        : Water2D
}

// create selector
var modelSelector = document.createElement( "select" );
modelSelector.setAttribute( "id", "ModelSelector" );
document.body.appendChild( modelSelector );
modelSelector.addEventListener( "change", changeModel );

for (const [key, value] of Object.entries( modelDictionary ) ) {
    var modelOption = document.createElement( "option" );
    modelOption.value = key;
    modelOption.text = key;
    modelSelector.appendChild( modelOption );
}

// create instruction div
var instructionDiv = document.createElement( "div" );
instructionDiv.setAttribute( "id", "InstructionDiv" );
instructionDiv.setAttribute( "style",
                             `max-width: 300px;
                              height: 100px;
                              margin: auto;
                              background-color: rgba( 200, 200, 200, 0.5 );
                              padding: 10px;
                              position: absolute;
                              left: 70%;
                              right: 1%;
                              bottom: 10px;
                             `
                            )
document.body.appendChild( instructionDiv );

function addGround(){
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

function addLights(){
    var ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
    var pointLight = new THREE.PointLight( 0xfffff0, 3, 0, 2 );
    pointLight.position.set( 10, 10, 3 );
    scene.add( ambientLight );
    scene.add( pointLight );
}

function changeModel( event ){
    // var currentModel = document.getElementById( "ModelSelector" );
    console.log( event.target.value );

    updateModel( event.target.value );
}

function onWindowResize(){
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function run(){
    requestAnimationFrame( run );
    var dt = clock.getDelta();

    currentModel.animate( scene, camera, dt );

    controls.update();
    currentModel.render( renderer, scene, camera );
}

function updateModel( newModelName ){
    if ( currentModel instanceof SuperModel ){
        currentModel.destroy( scene );
    }

    if ( newModelName in modelDictionary ){
        currentModel = new modelDictionary[newModelName]( scene );

        instructionDiv.innerHTML= "<p>" + currentModel.instructionString
                                  + "</p>";
    } else {
        console.log( "Model not in dictionary" );
    }
    
}


scene = new THREE.Scene();
// fov, aspect ratio, near clip, far clip
camera = new THREE.PerspectiveCamera( 75,
                                      window.innerWidth / window.innerHeight,
                                      0.1,
                                      1000 );
camera.position.set( 8, 0, 15 );

renderer = new THREE.WebGLRenderer( { antialias: true} );
renderer.setClearColor( "#f0f0f0" );
renderer.setSize( window.innerWidth,
                  window.innerHeight );
document.body.appendChild( renderer.domElement );

controls = new THREE.OrbitControls( camera, renderer.domElement );

// resize listener
window.addEventListener( "resize", onWindowResize, false );

// keydown listener

clock = new THREE.Clock();

addGround();
addLights();
updateModel( "Empty" );
run();
