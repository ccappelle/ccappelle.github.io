
function squareGeom( indexed=true ){

    var geom = new THREE.BufferGeometry();
    var vertices;

    if ( indexed ){
        // indexed square
        vertices = new Float32Array(
                        [ -1.0, -1.0, 0.0,
                           1.0, -1.0, 0.0,
                           1.0,  1.0, 0.0,
                          -1.0,  1.0, 0.0
                        ]);
        var indices = new Uint16Array([
                               0, 1, 2,
                               0, 2, 3
                            ]);
        geom.setIndex( new THREE.BufferAttribute( indices, 1) );
    } else {
        // unindexed square
        vertices = new Float32Array(
                    [ -1.0, -1.0, 0.0,
                       1.0, -1.0, 0.0,
                       1.0,  1.0, 0.0,

                       1.0,  1.0, 0.0,
                      -1.0,  1.0, 0.0,
                      -1.0, -1.0, 0.0
                    ] 
                );       
    }

    geom.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3) );
    return geom;
}


function circleGeom( pointsPerCircle=100, indexed=true ){
    var vertices;
    var geom = new THREE.BufferGeometry();

    if ( indexed ){
        // indexed circle (actually n-gon but whateva)
        // var vertices = new Float32Array( pointsPerCircle * 3 );
        var verticesArray = [];
        var indicesArray = [];
        var delta = ( 1 / pointsPerCircle ) * 2 * Math.PI;

        for ( var i = 0; i < pointsPerCircle; i++ ){
            var theta = delta * i;

            verticesArray.push( Math.cos( theta ) );
            verticesArray.push( Math.sin( theta ) );
            verticesArray.push( 0.0 );
        }

        for ( var i = 0; i < pointsPerCircle - 2; i++ ){
            indicesArray.push( 0 );
            indicesArray.push( i + 1 );
            indicesArray.push( i + 2 );
        }

        vertices = new Float32Array( verticesArray );
        var indices = new Uint16Array( indicesArray );

        geom.setIndex( new THREE.BufferAttribute( indices, 1) );
    } else {
    // unindexed circle
        var vertices = new Float32Array( ( pointsPerCircle - 2 ) * 3 * 3);
        var delta = ( 1 / pointsPerCircle ) * 2 * Math.PI;

        for ( var i = 0; i < ( pointsPerCircle - 2 ) * 3 * 3; i += ( 3 * 3) ){
            var triangleIndex = Math.floor( i / 9 );

            var theta1 = triangleIndex * delta;
            var theta2 = theta1 + delta;
            var theta3 = theta2 + delta;

            // starting point alwas the same
            vertices[i]     = 0.5;
            vertices[i + 1] = 0.0;
            vertices[i + 2] = 0.0;

            // point one 'tic' away
            vertices[i + 3] = Math.cos( theta2 ) * 0.5;
            vertices[i + 4] = Math.sin( theta2 ) * 0.5;
            vertices[i + 5] = 0.0;

            // point two 'tics' away
            vertices[i + 6] = Math.cos( theta3 ) * 0.5;
            vertices[i + 7] = Math.sin( theta3 ) * 0.5;
            vertices[i + 8] = 0.0;
        }
    }

    return geom;
}


function prismGeom( n=100, indexed=true ){
    var vertices;
    var geom = new THREE.BufferGeometry();

    if ( indexed ){
        verticesArray = [];
        indicesArray = [];

        delta = ( 1 / n ) * Math.PI * 2.0;

        for ( var i = 0; i < 2; i++ ){
            z = i;
            for ( var j = 0; j < n; j++ ){
                verticesArray.push( Math.cos( delta * j ) );
                verticesArray.push( Math.sin( delta * j ) );
                verticesArray.push( z );
            }
        }

        for ( var i = 0; i < n; i++ ){
            indicesArray.push( i );
            indicesArray.push( n + ( ( i + 1 ) % n ) );
            indicesArray.push( n + i );
            

            indicesArray.push( i );
            indicesArray.push( ( i + 1 ) % n );
            indicesArray.push( n + ( ( i + 1 ) % n ) );
        }

        vertices = new Float32Array( verticesArray );
        indices = new Uint16Array( indicesArray );
        geom.setIndex( new THREE.BufferAttribute( indices, 1) );
        
    } else {
        // unindexed cylinder
        vertices = new Float32Array( n * 3 * 3 * 2);
        var delta = ( 1 / n ) * 2 * Math.PI;

        for ( var i = 0; i < ( n * 3 * 3 ); i += 9 ){
            var triangleIndex = Math.floor( i / 9 );

            var theta1 = triangleIndex * delta;
            var theta2 = theta1 + delta;

            vertices[i + 0] = Math.cos( theta1 );
            vertices[i + 1] = Math.sin( theta1 );
            vertices[i + 2] = 0.0;

            vertices[i + 3] = Math.cos( theta2 );
            vertices[i + 4] = Math.sin( theta2 );
            vertices[i + 5] = 1.0;

            vertices[i + 6] = Math.cos( theta1 );
            vertices[i + 7] = Math.sin( theta1 );
            vertices[i + 8] = 1.0;
        }

        var offset = n * 3 * 3;
        for ( var i = 0; i < ( n * 3 * 3 ); i += 9 ){
            var triangleIndex = Math.floor( i / 9 );

            var theta1 = triangleIndex * delta;
            var theta2 = theta1 + delta;

            vertices[i + offset + 0] = Math.cos( theta1 );
            vertices[i + offset + 1] = Math.sin( theta1 );
            vertices[i + offset + 2] = 0.0; 

            vertices[i + offset + 3] = Math.cos( theta2 );
            vertices[i + offset + 4] = Math.sin( theta2 );
            vertices[i + offset + 5] = 0.0; 

            vertices[i + offset + 6] = Math.cos( theta2 );
            vertices[i + offset + 7] = Math.sin( theta2 );
            vertices[i + offset + 8] = 1.0;
        }
    }

    geom.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    
    return geom
}

function toroidGeom( n=5, m=100, radius1=0.5, radius2=0.25){

    var circlesPerToroid = 5;
    var pointsPerCircle = 100;
    var verticesArray = [];
    var normalArray = [];
    var indicesArray = [];

    var thetaDelta = ( 1 / n ) * Math.PI * 2.0;
    var phiDelta = ( 1 / m ) * Math.PI * 2.0;

    for ( var i = 0; i < n; i++ ){
        xBase = Math.cos( thetaDelta * i );
        yBase = 0.0;
        zBase = Math.sin( thetaDelta * i );

        for ( var j = 0; j < m; j++ ){
            xDiff = Math.cos( phiDelta * j ) * xBase;
            yDiff = Math.sin( phiDelta * j );
            zDiff = Math.cos( phiDelta * j ) * zBase;

            x = xBase * radius1 + xDiff * radius2;
            y = yBase * radius1 + yDiff * radius2;
            z = zBase * radius1 + zDiff * radius2;

            verticesArray.push( x );
            verticesArray.push( y );
            verticesArray.push( z );

            normalArray.push( xDiff );
            normalArray.push( yDiff );
            normalArray.push( zDiff );
        }
    }

    for ( var i = 0; i < n; i++){
        for ( var j = 0; j < m; j++){
            one = i * m + j;
            two = i * m + ( j + 1 ) % m;
            three = ( ( i + 1) % n ) * m + ( j + 1 ) % m;
            four = ( ( i + 1 ) % n ) * m + j;
            
            indicesArray.push( one );
            indicesArray.push( two );
            indicesArray.push( three );

            indicesArray.push( one );
            indicesArray.push( three );
            indicesArray.push( four );
        }
    }

    vertices = new Float32Array( verticesArray );
    indices = new Uint16Array( indicesArray );
    normals = new Float32Array( normalArray );
    // make a square
    var geom = new THREE.BufferGeometry();

    geom.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    geom.addAttribute( 'normal', new THREE.BufferAttribute( normals, 3 ) );
    geom.setIndex( new THREE.BufferAttribute( indices, 1) );
    return geom;
}