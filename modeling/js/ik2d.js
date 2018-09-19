
// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------
class ArmBot {
    constructor(theta1=0, theta2=0, armLength=1, width=0.4){
        this.armLength = armLength;
        this.armWidth = width;
        this.arm1Position = new THREE.Vector3(0, 0, 0);
        this.arm2Position = new THREE.Vector3(0, 0, 0);
        this.rotateToAngles(theta1, theta2);

        this.speed = 1.0;
        this.angle1 = theta1;
        this.angle2 = theta2;
// }
    }
    setArms(){
        this.arm1.position.set( this.arm1Position.x, this.arm1Position.y, this.arm1Position.z );
        this.arm2.position.set( this.arm2Position.x, this.arm2Position.y, this.arm2Position.z );
        this.arm1.rotation.z = this.angle1;
        this.arm2.rotation.z = this.angle2;
    }

    addToScene(scene){
        // add robot to the scene creating the appropriate meshes and geoms
        var arm1Geometry = new THREE.BoxGeometry( this.armLength, this.armWidth, this.armWidth );
        var arm2Geometry = new THREE.BoxGeometry( this.armLength, this.armWidth - 0.001, this.armWidth - 0.001 );
        var blueMaterial = new THREE.MeshPhongMaterial( { color: "#4040FF" } );
        var redMaterial = new THREE.MeshPhongMaterial( { color: "#FF4040" });
        this.arm1 = new THREE.Mesh( arm1Geometry, redMaterial );
        this.arm2 = new THREE.Mesh( arm2Geometry, blueMaterial );
        this.setArms();

        scene.add( this.arm1 );
        scene.add( this.arm2 );
    }

    computeDesiredAngles(x, y){
        // compute the desired target angles for each arm
        // from the x,y endpoint
        var r = Math.sqrt( x * x + y * y );
        var alpha, beta;

        if ( r > ( 2 * this.armLength ) ) {
            alpha = 0;
        } else {
            alpha = Math.acos( r / ( armLength * 2 ) );
        }

        beta = Math.atan2( y, x );

        return [ beta + alpha, beta - alpha ];
    }

    rotateToAngles(theta1, theta2){
        // rotate the robot to the desired target thetas
        var tip1 = [ Math.cos(theta1) * this.armLength,
                     Math.sin(theta1) * this.armLength ]

        var tip2 = [ tip1[0] + Math.cos(theta2) * this.armLength,
                     tip1[1] + Math.sin(theta2) * this.armLength ]

        this.arm1Position.x = ( tip1[0] + 0 ) / 2.0;
        this.arm1Position.y = ( tip1[1] + 0 ) / 2.0;

        this.arm2Position.x = ( tip2[0] + tip1[0] ) / 2.0;
        this.arm2Position.y = ( tip2[1] + tip1[1] ) / 2.0;

        this.angle1 = theta1;
        this.angle2 = theta2;
    }

    updateArm(x, y){
        var angles = this.computeDesiredAngles(x, y);
        this.rotateToAngles( angles[0], angles[1] );
        this.setArms();
    }
}

// set up global variables
var camera, controls, scene, renderer;
var desiredAngle1 = 0;
var desiredAngle2 = 0;
var ball;
var targetX = 2;
var targetY = 2;
var armLength = 2;
var pause = false;

// robot starts with 0, 0 angles
var robot = new ArmBot(desiredAngle1, desiredAngle2, armLength, armLength / 4.0);

init();
animate();

function init(){
    // init scene with threejs
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    // init renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setSize( window.innerWidth, window.innerHeight );

    // attach to page
    document.body.appendChild( renderer.domElement );

    // add camera
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 2, 5, 6);

    // create orbit controller for viewing
    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // add ambient light
    var ambientLight = new THREE.AmbientLight( 0x404040 , 2 );
    scene.add( ambientLight )

    // ad point light
    var pointLight = new THREE.PointLight( 0xffffff, 3, 0, 2);
    pointLight.position.set( 10, 10, 10);
    pointLight.castShadow = true;
    scene.add( pointLight );

    // add grid
    var gridHelper = new THREE.GridHelper( 10, 10 );
    gridHelper.geometry.rotateX( Math.PI / 2 );
    scene.add( gridHelper );

    // add target ball
    // radius, width seg, height seg
    var ballGeom = new THREE.SphereGeometry( 0.3, 10, 10 );
    var ballMaterial = new THREE.MeshPhongMaterial( { color: "#0f770f", shininess: 3 } );
    ball = new THREE.Mesh( ballGeom, ballMaterial );
    ball.position.set( targetX, targetY, 0 );
    scene.add( ball );

    // add the robot
    robot.addToScene(scene);
    // add the ground plane
    addPlane();

    // allow resize and create key listener
    window.addEventListener( "resize", onWindowResize, false );
    document.addEventListener( "keydown", onDocumentKeyDown, false );
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
    plane.position.y = -5;
    scene.add( plane );
}

function onWindowResize() {
    // resize and update camera on window resize
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    requestAnimationFrame( animate );

    // move ball to updated target
    ball.position.set( targetX, targetY, 0 );
    // update robot to move to target
    if ( !pause ){
        robot.updateArm( targetX, targetY );
    }
    
    controls.update();
    render();
}

function render() {
    // draw scene
    renderer.render( scene, camera );
}

function onDocumentKeyDown( event ){
    // key press events
    var incr = 0.2
    var keyCode = event.which;
    if ( keyCode == 188 ){ // up
        targetY += incr;
    }
    else if ( keyCode == 69 ){ // right
        targetX += incr;
    }
    else if ( keyCode == 79 ){ // down
        targetY -= incr;
    }
    else if ( keyCode == 65 ){ // left
        targetX -= incr;
    }
    else if ( keyCode == 80 ){
        pause = !pause;
    }

    var limit = 5;
    if ( targetX > limit ){
        targetX = limit
    }
    else if ( targetX < -limit ){
        targetX = -limit
    }
    if ( targetY > limit ){
        targetY = limit
    }
    else if ( targetY < -limit ){
        targetY = -limit
    }
}
