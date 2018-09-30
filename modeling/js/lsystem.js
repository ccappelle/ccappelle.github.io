

var lsystem = {};

lsystem.rules = {};
lsystem.numRuleEntries = 0;
lsystem.constants = "+-[].*"
lsystem.toDrawArray = [];
lsystem.meshes = [];

lsystem.iterateString  = function ( inputString ){
	// read rules to generate next iteration of the 
	// input string
	outputString = "";

	for ( var i = 0; i < inputString.length; i++ ){
		var character = inputString[i];
		if ( character in lsystem.rules ){
			outputString += lsystem.rules[character]['right'];
		} else { // if no rule; assume constant
			outputString += character;
		}
	}

	return outputString;
}

lsystem.instructionString = "Complete 3D Coming Soon";

lsystem.animate = function ( scene, dt, camera, pause=false ){
	
}

lsystem.render = function ( renderer, scene, camera ){
	renderer.render( scene, camera );
}

lsystem.clean = function ( scene ){
	lsystem.rules = {};
	lsystem.numRuleEntries = 0;

	// remove drawn elements
	for ( var i = 0; i < lsystem.meshes.length; i++ ){
		scene.remove( lsystem.meshes[i] );
	}

	lsystem.meshes = [];
	lsystem.toDrawArray = [];

	// remove grid
	scene.remove( lsystem.gridHelper );
}

lsystem.init = function ( scene ){
	var inputBox = document.createElement("input");
	inputBox.setAttribute( "type", "text" );
	inputBox.setAttribute( "value", "F" );
	inputBox.setAttribute( "onfocusout", "lsystem.focusOut()" );
	inputBox.setAttribute( "style", "width:180px; position: absolute; left: 10px; top: 10px" );
	inputBox.setAttribute( "id", "seedInput" );

	var specialDiv = document.getElementById( "special" );
	specialDiv.appendChild( inputBox );

	// create depth incrementer 
	var depthInput = document.createElement( "input" );
	depthInput.id = "depthInput";
	depthInput.setAttribute( "style", "width:30px; position: absolute; left: 200px; top: 10px" );
	depthInput.type = "number";
	depthInput.max = "7";
	depthInput.min = "0";
	depthInput.value = "1";

	specialDiv.appendChild( depthInput );

	// create plus and minus buttons
	var buttonNames = [ "plusButton", "minusButton" ];
	var buttonText = [ "+", "-" ];
	var buttonFuncs = [ lsystem.createRuleEntry, lsystem.removeRuleEntry ];
	for ( var i = 0; i < 2; i++ ){
		var newButton = document.createElement( "button" );
		// newButton.setAttribute( "innerText", buttonText[i] );
		newButton.setAttribute( "id", buttonNames[i] );
		newButton.setAttribute( "style", "position: absolute; left: " + (50 * i + 10) + "px; top: 40px; " + 
								"height: 20px; width: 30px; text-align: center;");
		newButton.innerText = buttonText[i];
		newButton.addEventListener( "click", buttonFuncs[i] );
		specialDiv.appendChild( newButton );
	}

	// create run button
	var runButton = document.createElement( "button" );
	runButton.innerText = "Generate";
	runButton.setAttribute( "style", "position: absolute; left: 250px; top: 10px;" +
							"height: 20px");
	runButton.addEventListener( "click", lsystem.generate );
	specialDiv.appendChild( runButton );

	lsystem.createRuleEntry();

	// set starting sample value into rule
	document.getElementById( "leftRuleEntry1" ).value = "F";
	document.getElementById( "rightRuleEntry1" ). value = "F[+F][-F]";
	lsystem.generate( null );

	// grid helper
	lsystem.gridHelper = new THREE.GridHelper( 10, 10 );
    lsystem.gridHelper.geometry.rotateX( Math.PI / 2 );
    scene.add( lsystem.gridHelper );
}

lsystem.focusOut = function () {
    // var x = document.getElementById( "seedInput" );
    // x.value = x.value.toUpperCase();
}

lsystem.keyDown = function () {

}

lsystem.createRuleEntry = function ( event ) {
	
	var textBoxSpacing = 30;
	if ( lsystem.numRuleEntries < 6 ){
		lsystem.numRuleEntries += 1;
		var leftSide = document.createElement( "input" );
		leftSide.setAttribute( "type", "text" );
		leftSide.setAttribute( "style", "width:20px; position: absolute; left: 10px; top: " + 
					( lsystem.numRuleEntries * textBoxSpacing + 50 )+ "px;" );

		var rightSide = document.createElement("input");
		rightSide.setAttribute( "style", "width:140px; position: absolute; left: 50px; top: " + 
					( lsystem.numRuleEntries * textBoxSpacing + 50 ) + "px;" );
		var specialDiv = document.getElementById( "special" );

		leftSide.id = "leftRuleEntry" + lsystem.numRuleEntries;
		rightSide.id = "rightRuleEntry" + lsystem.numRuleEntries;

		specialDiv.appendChild( leftSide );
		specialDiv.appendChild( rightSide );
	} else if ( lsystem.numRuleEntries == 6 ){
		document.getElementById( "plusButton" ).disabled = true;
	}

	if ( lsystem.numRuleEntries > 1 ){
		document.getElementById( "minusButton" ).disabled = false;
	}
}

lsystem.removeRuleEntry = function ( event ) {
	if ( lsystem.numRuleEntries > 1 ){
		var leftSide = document.getElementById( "leftRuleEntry" + lsystem.numRuleEntries );
		leftSide.parentNode.removeChild( leftSide );
		var rightSide = document.getElementById( "rightRuleEntry" + lsystem.numRuleEntries );
		rightSide.parentNode.removeChild( rightSide );
		// document.getElementById( "specialDiv" ).removeChild( 
		// 				document.getElementById( "leftRuleEntry" + lsystem.numRuleEntries ) );
		// document.getElementById( "specialDiv" ).removeChild(
		// 				document.getElementById( "rightRuleEntry" + lsystem.numRuleEntries) );

		lsystem.numRuleEntries -= 1;
	} else if ( lsystem.numRuleEntries == 1 ){
		document.getElementById( "minusButton" ).disabled = true;
	}

	if ( lsystem.numRuleEntries < 6 ){
		document.getElementById( "plusButton" ).disabled = false;
	}
}

lsystem.generate = function ( event ){
	lsystem.rules = {}

	// clear all meshes

	var depth = document.getElementById( "depthInput" ).value;

	var currentString = document.getElementById( "seedInput" ).value;
	// update rules from html entry
	for ( var i=1; i <= lsystem.numRuleEntries; i++ ){
		var leftSide = document.getElementById( "leftRuleEntry" + i ).value;
		var rightSide = document.getElementById( "rightRuleEntry" + i).value;

		lsystem.rules[leftSide] = {};
		lsystem.rules[leftSide]['right'] = rightSide;
		lsystem.rules[leftSide]['length'] = 1.0;
		lsystem.rules[leftSide]['color'] = [ 0.0, 0.0, 0.0 ];
	}	


	for ( var d=0; d < depth; d++ ){
		currentString = lsystem.iterateString( currentString );
	}


	lsystem.toDrawArray = [];
	var thetaStack = [];
	var phiStack = [];
	var positionStack = [];

	lsystem.thetaIncr = Math.PI / 4.0;

	// generate objects from currentString
	// starting angle
	var theta = Math.PI / 2.0;
	var phi = 0.0;
	var psi = 0.0;

	var position = new THREE.Vector3( 0, 0, 0 );


	for ( var i = 0; i < currentString.length; i++ ){
		character = currentString[ i ];
		if ( character == '[' ){
			// push current data to relevant stacks
			thetaStack.push( theta );
			var pushedPositionVector = new THREE.Vector3();
			pushedPositionVector.copy( position );
			positionStack.push( pushedPositionVector );
		} else if ( character == ']' ){
			// pop relevant data
			theta = thetaStack.pop();
			position = positionStack.pop();
		} else if ( character == '+' ){
			// increment theta by amount
			theta += lsystem.thetaIncr;

		} else if ( character == '-' ){
			// decrement theta by amount
			theta -= lsystem.thetaIncr;

		} else if ( character in lsystem.rules ){
			var baseDirection = new THREE.Vector3( 1, 0, 0 );

			var direction = new THREE.Vector3( Math.cos( theta ), 
											   Math.sin( theta ),
											   0 );
			var quaternion = new THREE.Quaternion();

			// direction.cross( direction );
			// quaternion.x = direction.x;
			// quaternion.y = direction.y;
			// quaternion.z = direction.z;
			// quaternion.w = Math.sqrt( direction )
			var mid = position.addScaledVector( direction, 0.5 );

			
			lsystem.toDrawArray.push( [ character, mid.x, mid.y, mid.z,
										 0.0, 0.0, theta - Math.PI / 2.0 ] );
			position.addScaledVector( direction, 0.5 );
		}

	}

	var radius = 0.1;
	var length = 1.0;
	var n = 8;

	// radius top, radius bottom, height, radial segs,
	// height segs, capped, 
	var geometry = new THREE.CylinderGeometry( radius, radius,
			length );
	var mesh = new THREE.MeshStandardMaterial( { color: 0x832A0D} );

	for ( var i = 0; i < lsystem.meshes.length; i++ ){
		scene.remove( lsystem.meshes[ i ] );
	}

	// console.log( lsystem.toDrawArray[] );
	
	for ( var i = 0; i < lsystem.toDrawArray.length; i++ ){
		var data = lsystem.toDrawArray[ i ];
		var cylinder = new THREE.Mesh( geometry, mesh );

		// character, x, y, z, rx, ry, rz
		cylinder.position.x = data[ 1 ];
		cylinder.position.y = data[ 2 ];
		cylinder.position.z = data[ 3 ];

		cylinder.rotation.x = data[ 4 ];
		cylinder.rotation.y = data[ 5 ];
		cylinder.rotation.z = data[ 6 ];

		scene.add( cylinder );
		lsystem.meshes.push( cylinder );
	}
}


