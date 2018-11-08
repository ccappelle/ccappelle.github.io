var currentModel;
var scene, camera, renderer, controls, clock, skyboxGroup;

var linkString = `<a id="modalLink" href="#" onclick="openModal();">More Info...</a>`

// document.body.appendChild( instructionDiv );

function addGround(){
    var texture = new THREE.TextureLoader().load("textures/groundimg.png");
    texture.minFilter = THREE.NearestFilter;
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
    var ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );
    var dirLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
    dirLight.position.set( 0, 2, 1 );


    scene.add( ambientLight );
    scene.add( dirLight );
}

function addSkybox(){
    console.log( 'added skybox' );

    var prefix = 'textures/blizzard_';
    var suffix = '.tga';
    var directions = [ 'rt', 'lf', 'up', 'dn', 'ft', 'bk' ];
    
    var geometry = new THREE.PlaneBufferGeometry( 1, 1, 1, 1 );
    var knownTexture = new THREE.TextureLoader().load( 'textures/groundimg.png' );
    var distance = 500;

    skyboxGroup = new THREE.Group();
    for ( var i = 0; i < 6; i++ ){
        var texture = new THREE.TGALoader().load( prefix + directions[i] + suffix );
        // var material = new THREE.MeshBasicMaterial( { map: knownTexture } );
        var material = new THREE.MeshBasicMaterial( { map : texture } );
        var skybox = new THREE.Mesh( geometry, material );
        skybox.scale.set( distance * 2, distance * 2, 1);
        if ( i == 0 ){
            skybox.position.set(  distance, 0, 0 );
            skybox.rotation.y = -Math.PI / 2.0;
        } else if ( i == 1 ){
            skybox.position.set( -distance, 0, 0 );
            skybox.rotation.y = Math.PI / 2.0;
        } else if ( i == 2 ){
            skybox.position.set( 0, distance, 0 );
            skybox.rotation.x = Math.PI / 2.0;
            skybox.rotation.z = Math.PI / 2.0;
        } else if ( i == 3 ){
            skybox.position.set( 0, -distance, 0 );
            skybox.rotation.x = -Math.PI / 2.0;
            skybox.rotation.z = -Math.PI / 2.0;
        } else if ( i == 4 ){
            skybox.position.set( 0, 0, distance );
            skybox.rotation.y = -Math.PI;
        } else if ( i == 5 ){
            skybox.position.set( 0, 0, -distance );
            skybox.rotation.y = 0;
        }

        skyboxGroup.add( skybox );
    }

    scene.add( skyboxGroup );
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
    // var dt = clock.getDelta();
    var dt = 1 / 60.0;


    // set skybox
    skyboxGroup.position.set( camera.position.x, camera.position.y, camera.position.z );
    currentModel.animate( scene, camera, dt );

    controls.update();
    currentModel.render( renderer, scene, camera );
}

function updateModel( newModelName ){

    if ( newModelName != currentModelName ){
        currentModelName = newModelName;

        if ( currentModel instanceof SuperModel ){
            currentModel.destroy( scene );
        }

        if ( newModelName in modelDictionary ){
            currentModel = new modelDictionary[newModelName]( scene );
            instructionDiv = document.getElementById( 'instruction-div' );
            instructionDiv.innerHTML = "<p>" + currentModel.instructionString
                                      + "</p> " + linkString;
            var modalDiv = document.getElementById( 'modal-content' );
            modalDiv.innerHTML = '<p align="justify">' + currentModel.modalContent + "</p>";
            document.getElementById( 'model-div' ).innerHTML = '';
            document.getElementById( 'model-div' ).style.display = 'none';
        } else {
            console.log( "Model not in dictionary" );
        }
    }
}

scene = new THREE.Scene();
// fov, aspect ratio, near clip, far clip
camera = new THREE.PerspectiveCamera( 75,
                                      window.innerWidth / window.innerHeight,
                                      0.1,
                                      1000 );
camera.position.set( 8, 0, 15 );

renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setClearColor( "#f0f0f0" );
renderer.setSize( window.innerWidth,
                  window.innerHeight );
document.body.appendChild( renderer.domElement );

controls = new THREE.OrbitControls( camera, renderer.domElement );

// resize listener
window.addEventListener( "resize", onWindowResize, false );
window.addEventListener( "mousedown", onMouseClick, false );
window.addEventListener( "mousemove", ( e ) => currentModel.mouseMoveHandler( e ), false );
window.addEventListener( 'keydown', ( e ) => currentModel.keyDownHandler( e ), false );
// keydown listener

clock = new THREE.Clock();

addSkybox();
addGround();
addLights();

currentModelName = ''
updateModel( "Empty" );
run();
