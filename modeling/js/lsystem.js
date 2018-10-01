
class Lsystem{
	constructor ( ){
		this.rules = {};
		this.numRuleEntries = 0;
		this.meshes = [];
		this.gui;
		this.depth = 1;
		this.cachedDepth = 1;
		this.ruleFolders = {};
		this.updateModel = false;
		this.timeToUpdate = 1.0;
		this.scale = 1.0;
		this.thetaIncrement = 45;
		this.phiIncrement = 45;
		this.psiIncrement = 45;
		this.seed = 'F';
		this.startingTheta = Math.PI / 2.0;
	}

	animate ( scene, dt, camera, pause=false ){
		// this.timeToUpdate -= dt;
		// if ( this.timeToUpdate < 0.0 ){
		// 	this.updateModel = true;
		// 	this.timeToUpdate = 1.0;
		// }
		if ( document.getElementById( "seedInput" ).value != this.seed ){
			this.updateModel = true;
			this.seed = document.getElementById( "seedInput" ).value;
		}

		this.updateRules();

		if ( this.updateModel ){
			this.createMeshes( scene );
			console.log( "update" );
			this.updateModel = false;
		}
	}

	render ( renderer, scene, camera ){
		renderer.render( scene, camera );
	}

	init ( scene, camera ){
		this.updateModel = true;
		this.generateGUI();

		this.generateSpecialDiv();
	}

	guiChanged( value ){
		this.updateModel = true;
	}

	removeMeshes( scene ){
		for ( var i = 0; i < this.meshes.length; i ++ ){
			scene.remove( this.meshes[i] );
		}
		this.meshes = null;
		this.meshes = [];
	}

	createMeshes( scene ){
		this.removeMeshes( scene );

		var currentString = document.getElementById( "seedInput" ).value;

		for ( var d=0; d < this.depth; d++ ){
			currentString = this.iterateString( currentString );
		}

		var theta = this.startingTheta // Math.PI / 2.0;
		var phi = 0.0;
		var psi = 0.0;

		var thetaStack = [];
		var phiStack = [];
		var positionStack = [];

		// this.thetaIncr = Math.PI / 4.0;

		var position = new THREE.Vector3( 0, 0, 0 );

		// console.log( currentString );
		for ( var i = 0; i < currentString.length; i++ ){
			var character = currentString[i];

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
				theta += this.thetaIncrement * Math.PI / 180.0;

			} else if ( character == '-' ){
				// decrement theta by amount
				theta -= this.thetaIncrement * Math.PI / 180.0;

			} else if ( character in this.rules ){
				var length = this.rules[character]['length'];
				if ( length > 0 ){

					var baseDirection = new THREE.Vector3( 1, 0, 0 );

					var direction = new THREE.Vector3( Math.cos( theta ), 
													   Math.sin( theta ),
													   0 );
					var quaternion = new THREE.Quaternion();

					var mid = position.addScaledVector( direction, this.scale * length / 2.0 );

					var geom = new THREE.CylinderGeometry( this.rules[character]['radius'], 
														   this.rules[character]['radius'],
														   this.scale * length, 
														   Math.floor( this.rules[character]['radius'] + 1 * 30 ) + 3,
														   1 );

					var material = new THREE.MeshStandardMaterial( { color: this.rules[character]['color'], metalness: 0.0,
																	 roughness: 0.8 } );
					var mesh = new THREE.Mesh( geom, material );
					mesh.position.set( mid.x, mid.y, mid.z );
					mesh.rotation.set( phi, psi, theta - Math.PI / 2.0 );
					scene.add( mesh );
					this.meshes.push( mesh );
					// lsystem.toDrawArray.push( [ character, mid.x, mid.y, mid.z,
					// 							 0.0, 0.0, theta - Math.PI / 2.0 ] );
					position.addScaledVector( direction, this.scale * length / 2.0 );
				}
			}
		}


	}

	clean ( scene ){
		lsystem.rules = {};
		lsystem.numRuleEntries = 0;

		// // remove drawn elements
		// for ( var i = 0; i < lsystem.meshes.length; i++ ){
		// 	scene.remove( lsystem.meshes[i] );
		// }

		this.removeMeshes( scene );

		// 	// remove grid
		// 	scene.remove( lsystem.gridHelper );

		this.gui.destroy();
	}

	generateSpecialDiv ( ){
		var inputBox = document.createElement("input");
		inputBox.setAttribute( "type", "text" );
		inputBox.setAttribute( "value", "F" );
		inputBox.setAttribute( "style", "width:180px; position: absolute; left: 10px; top: 10px" );
		inputBox.setAttribute( "id", "seedInput" );

		var specialDiv = document.getElementById( "special" );
		specialDiv.appendChild( inputBox );

		// create plus and minus buttons
		var addButton = document.createElement( "button" );
		addButton.setAttribute( "id", "plusButton" );
		addButton.setAttribute( "style", "position: absolute; left: " + (50 * 0 + 10) + "px; top: 40px; " + 
								"height: 20px; width: 30px; text-align: center;");
		addButton.innerText = "+";
		addButton.addEventListener( "click", ( e ) => { this.createRuleEntry( e ); } );
		specialDiv.appendChild( addButton );

		var minusButton = document.createElement( "button" );
		minusButton.setAttribute( "id", "minusButton" );
		minusButton.setAttribute( "style", "position: absolute; left: " + (50 * 1 + 10) + "px; top: 40px; " + 
								"height: 20px; width: 30px; text-align: center;");
		minusButton.innerText = "-";
		minusButton.addEventListener( "click", ( e ) => { this.removeRuleEntry( e ); } );
		specialDiv.appendChild( minusButton );

		this.createRuleEntry();
		document.getElementById( "leftRuleEntry1" ).value = "F";
		document.getElementById( "rightRuleEntry1" ). value = "F[+F][-F]";

		this.updateRules();
	}

	generateGUI ( ){
		this.gui = new dat.GUI();
		// this.gui.onFinishChange( this.guiChanged );

		var depthController = this.gui.add( this, "depth", 0, 7 ).step( 1 );
		var scaleController = this.gui.add( this, "scale", 0.1, 2.0).step( 0.1 );
		var thetaController = this.gui.add( this, "thetaIncrement", 0, 180 );
		// this.gui.add( this, "phiIncrement", 0.0, Math.PI );
		// this.gui.add( this, "psiIncrement", 0.0, Math.PI );
		this.guiRuleFolder = this.gui.addFolder( 'Rules' );

		depthController.onChange( (e) => { this.guiChanged( e ); } );
		scaleController.onChange( (e) => { this.guiChanged( e ); } );
		thetaController.onChange( (e) => { this.guiChanged( e ); } );
	}

	createRuleEntry ( event ) {
		var textBoxSpacing = 30;
		if ( this.numRuleEntries < 6 ){
			this.numRuleEntries += 1;
			var leftSide = document.createElement( "input" );
			leftSide.setAttribute( "type", "text" );
			leftSide.setAttribute( "style", "width:20px; position: absolute; left: 10px; top: " + 
						( this.numRuleEntries * textBoxSpacing + 50 )+ "px;" );

			var rightSide = document.createElement("input");
			rightSide.setAttribute( "style", "width:140px; position: absolute; left: 50px; top: " + 
						( this.numRuleEntries * textBoxSpacing + 50 ) + "px;" );
			var specialDiv = document.getElementById( "special" );

			leftSide.id = "leftRuleEntry" + this.numRuleEntries;
			rightSide.id = "rightRuleEntry" + this.numRuleEntries;

			specialDiv.appendChild( leftSide );
			specialDiv.appendChild( rightSide );
		} else if ( this.numRuleEntries == 6 ){
			document.getElementById( "plusButton" ).disabled = true;
		}

		if ( this.numRuleEntries > 1 ){
			document.getElementById( "minusButton" ).disabled = false;
		}
	}

	removeRuleEntry ( event ) {
		if ( this.numRuleEntries > 1 ){
			var leftSide = document.getElementById( "leftRuleEntry" + this.numRuleEntries );
			leftSide.parentNode.removeChild( leftSide );
			var rightSide = document.getElementById( "rightRuleEntry" + this.numRuleEntries );
			rightSide.parentNode.removeChild( rightSide );

			this.numRuleEntries -= 1;
		} else if ( this.numRuleEntries == 1 ){
			document.getElementById( "minusButton" ).disabled = true;
		}

		if ( this.numRuleEntries < 6 ){
			document.getElementById( "plusButton" ).disabled = false;
		}
	}

	updateRules ( ){

		var toDelete = [];
		for ( var index in this.rules ){
			toDelete.push( index );
		}

		for ( var i=1; i <= this.numRuleEntries; i++ ){
			var leftSide = document.getElementById( "leftRuleEntry" + i ).value;
			var rightSide = document.getElementById( "rightRuleEntry" + i).value;

			if ( leftSide == "" ){
				continue;
			}

			if ( leftSide in this.rules ){
				if ( this.rules[leftSide]['right'] != rightSide){
					this.updateModel = true;
					this.rules[leftSide]['right'] = rightSide;
				}
			}
			else {
				this.rules[leftSide] = {};
				this.rules[leftSide]['right'] = rightSide;
				// this.rules[leftSide]['cachedRight'] = rightSide;
				this.rules[leftSide]['length'] = 1.0;
				this.rules[leftSide]['radius'] = 0.1;
				this.rules[leftSide]['color'] = "#ff4444";
				this.rules[leftSide]['folder'] = this.guiRuleFolder.addFolder( leftSide );
				var lengthController = this.rules[leftSide]['folder'].add( this.rules[leftSide], 'length', 0, 1 ).step( 0.1 );
				var colorController = this.rules[leftSide]['folder'].addColor( this.rules[leftSide] , 'color' );
				var radiusController = this.rules[leftSide]['folder'].add( this.rules[leftSide], 'radius', 0.01, 1).step( 0.01 );
				lengthController.onChange( (e) => { this.guiChanged( e ); } );
				colorController.onChange( (e) => { this.guiChanged( e ); } );
				radiusController.onChange( (e) => { this.guiChanged( e ); } );

				this.updateModel = true;
			}

			var index = toDelete.indexOf( leftSide );
			if ( index > -1 ){
				toDelete.splice( index, 1 );
			}
		}

		for ( var i=0; i < toDelete.length; i++ ){
			this.guiRuleFolder.removeFolder( this.rules[ toDelete[i] ]['folder'] );
			delete this.rules[ toDelete[i] ];
		}
	}

	iterateString( inputString ){
		var outputString = "";
		for ( var i = 0; i < inputString.length; i++ ){
			var character = inputString[i];
			if ( character in this.rules ){
				outputString += this.rules[character]['right'];
			} else {
				outputString += character;
			}
		}

		return outputString;
	}
}



// var lsystem = {};

// lsystem.rules = {};
// lsystem.numRuleEntries = 0;
// lsystem.constants = "+-[].*"
// lsystem.toDrawArray = [];
// lsystem.meshes = [];

// lsystem.iterateString  = function ( inputString ){
// 	// read rules to generate next iteration of the 
// 	// input string
// 	outputString = "";

// 	for ( var i = 0; i < inputString.length; i++ ){
// 		var character = inputString[i];
// 		if ( character in lsystem.rules ){
// 			outputString += lsystem.rules[character]['right'];
// 		} else { // if no rule; assume constant
// 			outputString += character;
// 		}
// 	}

// 	return outputString;
// }

// lsystem.instructionString = "Complete 3D Coming Soon";

// lsystem.animate = function ( scene, dt, camera, pause=false ){
	
// }

// lsystem.render = function ( renderer, scene, camera ){
// 	renderer.render( scene, camera );
// }


// lsystem.generateGUI = function ( ){

// }

// lsystem.clean = function ( scene ){
// 	lsystem.rules = {};
// 	lsystem.numRuleEntries = 0;

// 	// remove drawn elements
// 	for ( var i = 0; i < lsystem.meshes.length; i++ ){
// 		scene.remove( lsystem.meshes[i] );
// 	}

// 	lsystem.meshes = [];
// 	lsystem.toDrawArray = [];

// 	// remove grid
// 	scene.remove( lsystem.gridHelper );
// }

// lsystem.init = function ( scene ){
// 	var inputBox = document.createElement("input");
// 	inputBox.setAttribute( "type", "text" );
// 	inputBox.setAttribute( "value", "F" );
// 	inputBox.setAttribute( "onfocusout", "lsystem.focusOut()" );
// 	inputBox.setAttribute( "style", "width:180px; position: absolute; left: 10px; top: 10px" );
// 	inputBox.setAttribute( "id", "seedInput" );

// 	var specialDiv = document.getElementById( "special" );
// 	specialDiv.appendChild( inputBox );

// 	// create depth incrementer 
// 	var depthInput = document.createElement( "input" );
// 	depthInput.id = "depthInput";
// 	depthInput.setAttribute( "style", "width:30px; position: absolute; left: 200px; top: 10px" );
// 	depthInput.type = "number";
// 	depthInput.max = "7";
// 	depthInput.min = "0";
// 	depthInput.value = "1";

// 	specialDiv.appendChild( depthInput );

// 	// create plus and minus buttons
// 	var buttonNames = [ "plusButton", "minusButton" ];
// 	var buttonText = [ "+", "-" ];
// 	var buttonFuncs = [ lsystem.createRuleEntry, lsystem.removeRuleEntry ];
// 	for ( var i = 0; i < 2; i++ ){
// 		var newButton = document.createElement( "button" );
// 		// newButton.setAttribute( "innerText", buttonText[i] );
// 		newButton.setAttribute( "id", buttonNames[i] );
// 		newButton.setAttribute( "style", "position: absolute; left: " + (50 * i + 10) + "px; top: 40px; " + 
// 								"height: 20px; width: 30px; text-align: center;");
// 		newButton.innerText = buttonText[i];
// 		newButton.addEventListener( "click", buttonFuncs[i] );
// 		specialDiv.appendChild( newButton );
// 	}

// 	// create run button
// 	var runButton = document.createElement( "button" );
// 	runButton.innerText = "Generate";
// 	runButton.setAttribute( "style", "position: absolute; left: 250px; top: 10px;" +
// 							"height: 20px");
// 	runButton.addEventListener( "click", lsystem.generate );
// 	specialDiv.appendChild( runButton );

// 	lsystem.createRuleEntry();

// 	// set starting sample value into rule
// 	document.getElementById( "leftRuleEntry1" ).value = "F";
// 	document.getElementById( "rightRuleEntry1" ). value = "F[+F][-F]";
// 	lsystem.generate( null );

// 	// grid helper
// 	lsystem.gridHelper = new THREE.GridHelper( 10, 10 );
//     lsystem.gridHelper.geometry.rotateX( Math.PI / 2 );
//     scene.add( lsystem.gridHelper );

//     lsystem.gui = new dat.GUI();

//     lsystem.generateGUI();
// }

// lsystem.focusOut = function () {
//     // var x = document.getElementById( "seedInput" );
//     // x.value = x.value.toUpperCase();
// }

// lsystem.keyDown = function () {

// }

// lsystem.createRuleEntry = function ( event ) {
	
// 	var textBoxSpacing = 30;
// 	if ( lsystem.numRuleEntries < 6 ){
// 		lsystem.numRuleEntries += 1;
// 		var leftSide = document.createElement( "input" );
// 		leftSide.setAttribute( "type", "text" );
// 		leftSide.setAttribute( "style", "width:20px; position: absolute; left: 10px; top: " + 
// 					( lsystem.numRuleEntries * textBoxSpacing + 50 )+ "px;" );

// 		var rightSide = document.createElement("input");
// 		rightSide.setAttribute( "style", "width:140px; position: absolute; left: 50px; top: " + 
// 					( lsystem.numRuleEntries * textBoxSpacing + 50 ) + "px;" );
// 		var specialDiv = document.getElementById( "special" );

// 		leftSide.id = "leftRuleEntry" + lsystem.numRuleEntries;
// 		rightSide.id = "rightRuleEntry" + lsystem.numRuleEntries;

// 		specialDiv.appendChild( leftSide );
// 		specialDiv.appendChild( rightSide );
// 	} else if ( lsystem.numRuleEntries == 6 ){
// 		document.getElementById( "plusButton" ).disabled = true;
// 	}

// 	if ( lsystem.numRuleEntries > 1 ){
// 		document.getElementById( "minusButton" ).disabled = false;
// 	}
// }

// lsystem.removeRuleEntry = function ( event ) {
// 	if ( lsystem.numRuleEntries > 1 ){
// 		var leftSide = document.getElementById( "leftRuleEntry" + lsystem.numRuleEntries );
// 		leftSide.parentNode.removeChild( leftSide );
// 		var rightSide = document.getElementById( "rightRuleEntry" + lsystem.numRuleEntries );
// 		rightSide.parentNode.removeChild( rightSide );
// 		// document.getElementById( "specialDiv" ).removeChild( 
// 		// 				document.getElementById( "leftRuleEntry" + lsystem.numRuleEntries ) );
// 		// document.getElementById( "specialDiv" ).removeChild(
// 		// 				document.getElementById( "rightRuleEntry" + lsystem.numRuleEntries) );

// 		lsystem.numRuleEntries -= 1;
// 	} else if ( lsystem.numRuleEntries == 1 ){
// 		document.getElementById( "minusButton" ).disabled = true;
// 	}

// 	if ( lsystem.numRuleEntries < 6 ){
// 		document.getElementById( "plusButton" ).disabled = false;
// 	}
// }

// lsystem.generate = function ( event ){
// 	lsystem.rules = {}

// 	// clear all meshes

// 	var depth = document.getElementById( "depthInput" ).value;

// 	var currentString = document.getElementById( "seedInput" ).value;
// 	// update rules from html entry
// 	for ( var i=1; i <= lsystem.numRuleEntries; i++ ){
// 		var leftSide = document.getElementById( "leftRuleEntry" + i ).value;
// 		var rightSide = document.getElementById( "rightRuleEntry" + i).value;

// 		lsystem.rules[leftSide] = {};
// 		lsystem.rules[leftSide]['right'] = rightSide;
// 		lsystem.rules[leftSide]['length'] = 1.0;
// 		lsystem.rules[leftSide]['color'] = [ 0.0, 0.0, 0.0 ];
// 	}	


// 	for ( var d=0; d < depth; d++ ){
// 		currentString = lsystem.iterateString( currentString );
// 	}


// 	lsystem.toDrawArray = [];
// 	var thetaStack = [];
// 	var phiStack = [];
// 	var positionStack = [];

// 	lsystem.thetaIncr = Math.PI / 4.0;

// 	// generate objects from currentString
// 	// starting angle
// 	var theta = Math.PI / 2.0;
// 	var phi = 0.0;
// 	var psi = 0.0;

// 	var position = new THREE.Vector3( 0, 0, 0 );


// 	for ( var i = 0; i < currentString.length; i++ ){
// 		character = currentString[ i ];
// 		if ( character == '[' ){
// 			// push current data to relevant stacks
// 			thetaStack.push( theta );
// 			var pushedPositionVector = new THREE.Vector3();
// 			pushedPositionVector.copy( position );
// 			positionStack.push( pushedPositionVector );
// 		} else if ( character == ']' ){
// 			// pop relevant data
// 			theta = thetaStack.pop();
// 			position = positionStack.pop();
// 		} else if ( character == '+' ){
// 			// increment theta by amount
// 			theta += lsystem.thetaIncr;

// 		} else if ( character == '-' ){
// 			// decrement theta by amount
// 			theta -= lsystem.thetaIncr;

// 		} else if ( character in lsystem.rules ){
// 			var baseDirection = new THREE.Vector3( 1, 0, 0 );

// 			var direction = new THREE.Vector3( Math.cos( theta ), 
// 											   Math.sin( theta ),
// 											   0 );
// 			var quaternion = new THREE.Quaternion();

// 			// direction.cross( direction );
// 			// quaternion.x = direction.x;
// 			// quaternion.y = direction.y;
// 			// quaternion.z = direction.z;
// 			// quaternion.w = Math.sqrt( direction )
// 			var mid = position.addScaledVector( direction, 0.5 );

			
// 			lsystem.toDrawArray.push( [ character, mid.x, mid.y, mid.z,
// 										 0.0, 0.0, theta - Math.PI / 2.0 ] );
// 			position.addScaledVector( direction, 0.5 );
// 		}

// 	}

// 	var radius = 0.1;
// 	var length = 1.0;
// 	var n = 8;

// 	// radius top, radius bottom, height, radial segs,
// 	// height segs, capped, 
// 	var geometry = new THREE.CylinderGeometry( radius, radius,
// 			length );
// 	var mesh = new THREE.MeshStandardMaterial( { color: 0x832A0D} );

// 	for ( var i = 0; i < lsystem.meshes.length; i++ ){
// 		scene.remove( lsystem.meshes[ i ] );
// 	}

// 	// console.log( lsystem.toDrawArray[] );
	
// 	for ( var i = 0; i < lsystem.toDrawArray.length; i++ ){
// 		var data = lsystem.toDrawArray[ i ];
// 		var cylinder = new THREE.Mesh( geometry, mesh );

// 		// character, x, y, z, rx, ry, rz
// 		cylinder.position.x = data[ 1 ];
// 		cylinder.position.y = data[ 2 ];
// 		cylinder.position.z = data[ 3 ];

// 		cylinder.rotation.x = data[ 4 ];
// 		cylinder.rotation.y = data[ 5 ];
// 		cylinder.rotation.z = data[ 6 ];

// 		scene.add( cylinder );
// 		lsystem.meshes.push( cylinder );
// 	}
// }


