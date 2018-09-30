// class for each model
// class Coil{
// 	constructor( nCoils=3, wireThickness=0.1 ){
// 		self.nCoils = nCoils;
// 		self.wireThickness=0.1;


// 	}
// }


function coilGeometry( nCoils = 3, nCirclesPerCoil = 8, nPointsPerCircle = 8, coilRadius= 0.5, wireRadius = 0.1 ){
	var coil = new THREE.Geometry();

	START = 0.5;
	END = -0.5;


	for ( var i = 0; i < nCoils; i++ ){ // how many times around
	 	for ( var j = 0; j < nCirclesPerCoil; j++ ){ // around the y axis
			var baseY = START - ( ( i * nCirclesPerCoil ) + j ) / ( nCoils * nCirclesPerCoil ) * 1.0;

			var theta = ( j / nCirclesPerCoil ) * ( Math.PI * 2.0 )

			var dirX = Math.cos( theta );
			var dirZ = Math.sin( theta );
			var baseX = dirX * coilRadius;
			var baseZ = dirZ * coilRadius;

			for ( var k = 0; k < nPointsPerCircle; k++ ){ // around the XZ axis
				var phi = ( k / nPointsPerCircle ) * ( Math.PI * 2.0 );

				var dirFlat = Math.cos( phi );
				var dirUp = Math.sin( phi );
				var x = dirX * dirFlat * wireRadius + baseX;
				var z = dirZ * dirFlat * wireRadius + baseZ;
				var y = dirUp * wireRadius + baseY

				coil.vertices.push( new THREE.Vector3( x, y, z) );
			}
		}
	}

	for ( var i = 0; i < nCoils; i++ ){
		for ( var j = 0; j < nCirclesPerCoil; j++ ){
			for ( var k = 0; k < nPointsPerCircle; k++ ){
				iIncr = nCirclesPerCoil * nPointsPerCircle;
				jIncr = nPointsPerCircle;
				index1 = i * iIncr + j * jIncr + k;
				index2 = i * iIncr + j * jIncr + ( ( k + 1 ) % nPointsPerCircle );

				index3 = i * iIncr + ( j + 1 ) * jIncr + k;
				index4 = i * iIncr + ( j + 1 ) * ( ( k + 1 ) & nPointsPerCircle );

				coil.faces.push( new THREE.Face3( index1, index3, index4 ) );
				coil.faces.push( new THREE.Face3( index1, index4, index3 ) );					
				

			}
		}
	}

	return coil
}
// var coil = new Three.Geometry();

// geom