getQuaternionFromX( targetVec ){
    // returns rotation from ( 1, 0, 0 ) to vector targetVec
    vec.normalize();
    var xUnitVector = new THREE.Vector3( 1, 0, 0 );

    var dotProduct = xUnitVector.dot( targetVec );
    var quaternion = new THREE.Quaternion();

    if ( dotProduct < -0.9999 ){
        // close to ( -1 , 0, 0 )
        // rotate about y axis PI radians
        quaternion.setFromAxisAngle( new THREE.Vector3( -1, 0, 0 ), Math.PI );
    } else if ( dotProduct > 0.9999 ){
        quaternion.setFromAxisAngle( xUnitVector, 0.0 );
    } else{

    }
}
// getQuaternion( vecA, vecB ){
//     // return quaternion rotation from vector a to vector b

//     return quaternion;
// }