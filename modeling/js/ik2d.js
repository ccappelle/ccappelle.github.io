class IK extends SuperModel{
    constructor( scene ){
        super( scene );
        this.bones = [];

        this.boneFolder = this.gui.addFolder( 'Bones' );
        this.boneFolders = []

        for ( var i = 0; i < 3; i++ ){
            this.addBone( 0, 0, 0 )
        }
    }

    addBone( length, angle, range ){
        var bone = {
            length: length,
            range: range,
            angle: angle
        };

        var index = this.bones.length;

        this.bones.push( bone );
        this.boneFolders.push( 
            this.boneFolder.addFolder( 'Bone ' + String( index + 1 ) )
        );
        this.boneFolders[index].add( bone, 'length' );
        this.boneFolders[index].add( bone, 'range' );
        // this.boneFolders[index].add( bone, 'angle' );
    }
}



// class ArmBot {
//     constructor(theta1=0, theta2=0, armLength=1, width=0.4){
//         this.armLength = armLength;
//         this.armWidth = width;
//         this.arm1Position = new THREE.Vector3(0, 0, 0);
//         this.arm2Position = new THREE.Vector3(0, 0, 0);
//         this.rotateToAngles(theta1, theta2);

//         this.speed = 1.0;
//         this.angle1 = theta1;
//         this.angle2 = theta2;
// // }
//     }
//     setArms(){
//         this.arm1.position.set( this.arm1Position.x, this.arm1Position.y, this.arm1Position.z );
//         this.arm2.position.set( this.arm2Position.x, this.arm2Position.y, this.arm2Position.z );
//         this.arm1.rotation.z = this.angle1;
//         this.arm2.rotation.z = this.angle2;
//     }

//     setSpeed( newSpeed ){
//         this.speed = newSpeed;
//     }

//     removeFromScene( scene ){
//         scene.remove( this.arm1 );
//         scene.remove( this.arm2 );
//     }

//     addToScene( scene ){
//         // add robot to the scene creating the appropriate meshes and geoms
//         var arm1Geometry = new THREE.BoxGeometry( this.armLength, this.armWidth, this.armWidth );
//         var arm2Geometry = new THREE.BoxGeometry( this.armLength, this.armWidth - 0.001, this.armWidth - 0.001 );
//         var blueMaterial = new THREE.MeshStandardMaterial( { color: "#4040FF" } );
//         var redMaterial = new THREE.MeshStandardMaterial( { color: "#FF4040" });
//         this.arm1 = new THREE.Mesh( arm1Geometry, redMaterial );
//         this.arm2 = new THREE.Mesh( arm2Geometry, blueMaterial );
//         this.setArms();

//         scene.add( this.arm1 );
//         scene.add( this.arm2 );
//     }

//     computeDesiredAngles(x, y){
//         // compute the desired target angles for each arm
//         // from the x,y endpoint
//         var r = Math.sqrt( x * x + y * y );
//         var alpha, beta;

//         if ( r > ( 2 * this.armLength ) ) {
//             alpha = 0;
//         } else {
//             alpha = Math.acos( r / ( this.armLength * 2 ) );
//         }

//         beta = Math.atan2( y, x );

//         return [ beta + alpha, beta - alpha ];
//     }

//     rotateToAngles(theta1, theta2, delta){
//         // console.log(theta1, this.angle1, theta2, this.angle2);
//         if (this.speed >= 0){ // instantaneous when speed is less than 0
//             var theta1Diff = theta1 - this.angle1;
//             // compare against other angle
//             // var toCompare;
//             // if ( this.angle1 > 0 ){
//             //     toCompare = theta1Diff - ( this.angle1 - 2 * Math.PI );
//             // } else {
//             //     toCompare = theta1Diff - ( this.angle1 + 2 * Math.PI );
//             // }
//             // if ( Math.abs( theta1Diff ) > Math.abs( toCompare ) ){
//             //     theta1Diff = toCompare;
//             // }

//             var theta2Diff = theta2 - this.angle2;

//             // if ( theta1Diff > Math.PI / 2.0 ){
//             //     theta1Diff -= 2 * Math.PI;
//             // } else if ( theta1Diff < Math.PI / 2.0 ) {
//             //     theta1Diff += 2 * Math.PI;
//             // }
//             // if ( Math.abs( theta1Diff ) > Math.PI ){
//             //     if ( theta1Diff > 0 ){
//             //         theta1Diff -= Math.PI;
//             //     } else {
//             //         theta1Diff += Math.PI;
//             //     }
//             //     theta1 = this.angle1 - theta1Diff * delta * this.speed;
//             // } else {
//             //     // update to new smaller taregt thetas based on angular speed
//             //     theta1 = this.angle1 + theta1Diff * delta * this.speed;
//             // }
//             theta1 = this.angle1 + theta1Diff * delta * this.speed;
//             theta2 = this.angle2 + theta2Diff * delta * this.speed;   
//         }


//         // rotate the robot to the desired target thetas
//         var tip1 = [ Math.cos(theta1) * this.armLength,
//                      Math.sin(theta1) * this.armLength ]

//         var tip2 = [ tip1[0] + Math.cos(theta2) * this.armLength,
//                      tip1[1] + Math.sin(theta2) * this.armLength ]

//         this.arm1Position.x = ( tip1[0] + 0 ) / 2.0;
//         this.arm1Position.y = ( tip1[1] + 0 ) / 2.0;

//         this.arm2Position.x = ( tip2[0] + tip1[0] ) / 2.0;
//         this.arm2Position.y = ( tip2[1] + tip1[1] ) / 2.0;

//         this.angle1 = theta1;
//         this.angle2 = theta2;
//     }

//     updateArm(x, y, delta){
//         var angles = this.computeDesiredAngles(x, y);
//         this.rotateToAngles( angles[0], angles[1], delta );
//         this.setArms();
//     }
// }

// var ik2d = {};

// ik2d.name = "2D Inverse Kinematics";


// ik2d.init = function ( scene , camera ) {
//     ik2d.robot = new ArmBot( 0, 0, 2 );
//     // camera.position.set( 3, 0, 10 );
//     // camera.lookAt( 0, 0, 0 );


//     // add robot
//     ik2d.robot.addToScene( scene );

//     // add grid
//     ik2d.gridHelper = new THREE.GridHelper( 10, 10 );
//     ik2d.gridHelper.geometry.rotateX( Math.PI / 2 );
//     scene.add( ik2d.gridHelper );

//     // add ball
//     var ballGeometry = new THREE.SphereGeometry( 0.3, 5, 5 );
//     var ballMaterial = new THREE.MeshStandardMaterial( { color: "#0f770f" } )
//     ballMaterial.wireframe = true;
//     ik2d.ball = new THREE.Mesh( ballGeometry, ballMaterial );
//     ik2d.ball.position.set( 1, 2, 0);
//     scene.add( ik2d.ball );

//     // set target
//     ik2d.targetX = 1;
//     ik2d.targetY = 2;

//     // dat gui magic

//     ik2d.gui = new dat.GUI({
//         height : 5 * 32 -1 } )
//     ik2d.gui.add( ik2d.robot, "speed" ).min( -0.1 ).max( 10 ).step( 0.1 );
// }

// ik2d.clean = function ( scene ) {
//     // scene.remove( ik2d.ambientLight );
//     // scene.remove( ik2d.pointLight );
//     scene.remove( ik2d.gridHelper );

//     ik2d.robot.removeFromScene( scene );

//     scene.remove( ik2d.ball );
//     ik2d.gui.destroy();
// }

// ik2d.animate = function ( scene , dt, camera, pause=false ){
//     // move ball to updated target
//     ik2d.ball.position.set( ik2d.targetX, ik2d.targetY, 0 );
//     // update robot to move to target
//     if ( !pause ){
//         ik2d.robot.updateArm( ik2d.targetX, ik2d.targetY, dt );
//     }
// }

// ik2d.render = function ( renderer, scene, camera ){
//     renderer.render( scene, camera );
// }

// ik2d.instructionString = "Use WASD to move the green target along the grid.";

// ik2d.keyDown = function ( event ){
//     var keyCode = event.which;
//     var incr = 0.2
//     if ( keyCode == 188 || keyCode == 87 ){ // up
//         ik2d.targetY += incr;
//     }
//     else if ( keyCode == 69 || keyCode == 68 ){ // right
//         ik2d.targetX += incr;
//     }
//     else if ( keyCode == 79 || keyCode == 83 ){ // down
//         ik2d.targetY -= incr;
//     }
//     else if ( keyCode == 65 ){ // left
//         ik2d.targetX -= incr;
//     }

//     var limit = 5;
//     if ( ik2d.targetX > limit ){
//         ik2d.targetX = limit;
//     }
//     else if ( ik2d.targetX < -limit ){
//         ik2d.targetX = -limit;
//     }
//     if ( ik2d.targetY > limit ){
//         ik2d.targetY = limit;
//     }
//     else if ( ik2d.targetY < -limit ){
//         ik2d.targetY = -limit;
//     }
// }
