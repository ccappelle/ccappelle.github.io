

function antGeom( ){
    var legWidth = 0.2;
    var legHeight = 0.3 / 4;

    var geom = new THREE.Geometry();

    var angles = [ Math.PI / 6.0, 0, -Math.PI / 6.0 ];

    for ( var m = 0; m < 2; m++ ){
        for ( var i = 0; i < 3; i++ ){
            var angle = angles[i] + Math.PI * m;
            var radii = [ 0.3, 0.6, 0.8 ];

            for ( var j = 0; j < 3; j++ ){
                var radius = radii[j];
                var xPos = Math.sin( angle ) * radius;
                var zPos = Math.cos( angle ) * radius;
                var yPos = -( j * j ) * legHeight;

                if ( j == 1 ){
                    geom.vertices.push( new THREE.Vector3( xPos + ( -1 + 2 * m ) * zPos * legWidth,
                                                           yPos,
                                                           zPos + ( 1 - 2 * m ) * xPos * legWidth ) );
                }

                geom.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
            }
            var k = 4 * i + ( 4 * 3 ) * m;
            var face1 = new THREE.Face3( k, k + 1, k + 2 );
            var face2 = new THREE.Face3( k + 1, k + 3, k + 2 );
            var face3 = new THREE.Face3( k, k + 2, k + 1 );
            var face4 = new THREE.Face3( k + 1, k + 2, k + 3 );

            geom.faces.push( face1 );
            geom.faces.push( face2 );
            geom.faces.push( face3 );
            geom.faces.push( face4 );

            for ( var ii = 0; ii < 4; ii++ ){
                geom.faceVertexUvs[0].push( [ new THREE.Vector2( 0, 1 ),
                                                      new THREE.Vector2( 1, 1 ),
                                                      new THREE.Vector2( 1, 0 ) ] );              
            }
        }
    }

    

    var sphere = new THREE.SphereGeometry( 1 );


    var mat = new THREE.Matrix4().identity();
    mat.scale( new THREE.Vector3( 0.33, 0.33, 0.33 ) );
    mat.setPosition( new THREE.Vector3( 0.6, 0, 0 ) );

    geom.merge( sphere, mat );

    mat.setPosition( new THREE.Vector3( 0, 0, 0 ) );
    geom.merge( sphere, mat );

    mat.scale( new THREE.Vector3( 1.5, 1, 1 ) );
    mat.setPosition( new THREE.Vector3( -0.6, 0, 0 ) );
    geom.merge( sphere, mat );

    geom.computeFaceNormals();
    return geom;
}