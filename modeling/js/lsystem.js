class LsystemRule {
	constructor( controller, lhs = '', rhs = '', color= 0xff0000 ){
		this.lhs = lhs;
		this.rhs = rhs;
		this.color = color;
		this.scale = 1;
		this.controller = null;
	}

	constrainLHS( value ){
		if ( this.lhs.length > 1 ){
			this.lhs = this.lhs[0];
		}
		this.controller.updateDisplay();
	}
}

class Lsystem extends SuperModel {
	constructor( scene ){
		super( scene );

		this.rules = [];
		this.nRuleEntries = 0;
		this.meshes = [];

		this.depth = 1;
		this.invScale = 1.0;
		this.seed = 'G';

		this.ruleFolders = [];

		this.modelShouldUpdate = true;

		this.gui.add( this, 'addRule' );
		this.gui.add( this, 'seed' ).onChange( ( e ) => { this.modelShouldUpdate = true } );
		this.gui.add( this, 'invScale' ).min( 1 ).max( 100 ).step( 1 ).onChange( ( e ) => { this.modelShouldUpdate = true } );
		this.gui.add( this, 'depth' ).min( 0 ).max( 10 ).step( 1 ).onChange( ( e ) => { this.modelShouldUpdate = true }  );
		this.startAngle = 90;
		this.gui.add( this, 'startAngle' ).min( 0 ).max( 180 ).step(1).onChange( ( e ) => { this.modelShouldUpdate = true } );
		this.ruleFolder = this.gui.addFolder( 'Rules' );



		this.branchPositions = [];

		this.addRule();
		this.rules[0].lhs = 'F';
		this.rules[0].rhs = 'FF';

		this.addRule();
		this.rules[1].lhs = 'G';
		this.rules[1].rhs = 'F[+G][-G]';
		this.rules[1].color = 0x00ff00;
	}

	addRule(){
		var rule = new LsystemRule();

		this.nRuleEntries += 1;
		var ruleEntry = this.ruleFolder.addFolder( 'Rule ' + String( this.nRuleEntries ) );
		this.ruleFolders.push( ruleEntry );

		rule.controller = ruleEntry.add( rule, 'lhs' ).listen();
		rule.controller.onFinishChange( ( e ) => {
				rule.constrainLHS( e );
				this.modelShouldUpdate=true } );

		var controller = ruleEntry.add( rule, 'rhs' ).listen();
		controller.onFinishChange( ( e ) => { this.modelShouldUpdate = true } );

		controller = ruleEntry.add( rule, 'scale' ).min( 0 ).max( 1 ).step( 0.01 );
		controller.onChange( ( e ) => { this.modelShouldUpdate = true } );

		controller = ruleEntry.addColor( rule, 'color' );
		controller.onChange( ( e ) => { this.modelShouldUpdate = true } );

		this.rules.push( rule );
	}

	animate ( scene, camera, dt ){
		if ( this.modelShouldUpdate ){
			// run update 
			this.generateTree( scene );
			this.modelShouldUpdate = false;
		}
	}

	generateTree( scene ){
		// clear all tree meshes
		for( var i = 0; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.sceneMeshes[i] );
        }

        var ruleDict = {};
        for ( var i = 0; i < this.rules.length; i++ ){
        	var r = this.rules[i];

        	if ( r.lhs.length > 0 ){
        		ruleDict[ r.lhs ] = {};
        	}
        }

        for ( var i = 0; i < this.rules.length; i++ ){
        	var r = this.rules[i];
        	if ( r.lhs.length > 0 ){
        		ruleDict[ r.lhs ]['rhs'] = r.rhs;
        		ruleDict[ r.lhs ]['material'] = new THREE.LineBasicMaterial( { color: r.color } );
        		ruleDict[ r.lhs ]['scale'] = r.scale;
        		ruleDict[ r.lhs ]['geometry' ] = new THREE.Geometry();
        	}
        }

        var outString = this.seed;

        // generate string
        for ( var i = 0; i < this.depth; i++ ){
        	var tempString = '';
        	for ( var j = 0; j < outString.length; j++){
        		const character = outString[j];
        		if ( character in ruleDict ){
        			tempString += ruleDict[character]['rhs'];
        		} else {
        			tempString += character;
        		}
        	}
        	outString = tempString;
        }
        
        var position = new THREE.Vector3();
        var phi = Math.PI * this.startAngle / 180;
        var psi = 0.0;
        var theta = 0.0;
        var positionStack = [];
        var phiStack = [];
        var psiStack = [];
        var thetaStack = [];

        // generate meshes
        for ( var i = 0; i < outString.length; i++ ){
        	const character = outString[i];
        	if ( character in ruleDict ){
        		const ruleEntry = ruleDict[ character ];
        		const rxMatrix = new THREE.Matrix3();
        		const ryMatrix = new THREE.Matrix3();
        		const rzMatrix = new THREE.Matrix3();

        		rxMatrix.set ( 1, 0, 0,
        					   0, Math.cos( psi ), -Math.sin( psi ) ,
        					   0, Math.sin( psi ),  Math.cos( psi ) );

        		ryMatrix.set ( Math.cos( phi ), -Math.sin( phi ), 0,
        					   Math.sin( phi ),  Math.cos( phi ), 0,
        					   0, 0, 1 );

        		rzMatrix.set( Math.cos( theta ), 0, Math.sin( theta), 
        					  0, 1, 0,
        					 -Math.sin( theta ), 0, Math.cos( theta ) );

        		const rotationMatrix = new THREE.Matrix3();
        		rotationMatrix.multiplyMatrices( rzMatrix, rxMatrix );
        		rotationMatrix.multiply( ryMatrix );

        		// create line segment and move head
        		// ruleDict[ r.lhs ]['geometry'].vertices.push( position.clone() );
        		ruleEntry['geometry'].vertices.push( position.clone() );
        		var vectorAddition = new THREE.Vector3( 1, 0, 0 );
        		vectorAddition.applyMatrix3( rotationMatrix );
        		// position.addScaledVector( vectorAddition, ruleDict[ r.lhs ]['scale'] );
        		position.addScaledVector( vectorAddition, ruleEntry['scale'] / this.invScale );
        		// ruleDict[ r.lhs ]['geometry'].vertices.push( position.clone() );
        		ruleEntry['geometry'].vertices.push( position.clone() );
        	} else if ( character === '[' ){
        		// push to stack
        		positionStack.push( position.clone() );
        		thetaStack.push( theta );
        		phiStack.push( phi );
        		psiStack.push( psi );
        	} else if ( character === ']' ){
        		// pop from stack
        		position = positionStack.pop();
        		phi = phiStack.pop();
        		psi = psiStack.pop();
        		theta = thetaStack.pop();
        	} else if ( character === '+' ){
        		phi += Math.PI / 4.0;
        	} else if ( character === '-' ){
        		phi -= Math.PI / 4.0;
        	} else if ( character == '&' ){
        		theta += Math.PI / 4.0;
        	} else if ( character == '^' ){
        		theta -= Math.PI / 4.0;
        	} else if ( character == '/' ){
        		psi += Math.PI / 4.0;
        	} else if ( character == '\\' ){
        		psi -= Math.PI / 4.0;
        	}
        }

        for ( var i = 0; i < this.rules.length; i++ ){
        	// create mesh
        	var mesh = new THREE.LineSegments( ruleDict[ this.rules[i].lhs ]['geometry'],
        									   ruleDict[ this.rules[i].lhs ]['material'] );

        	this.addMesh( scene, mesh );
        }
	}
	// animate( scene, camera, dt ){
	// 	super( scene, camera, dt );
	// }

}
// class Lsystem{
// 	constructor ( ){
// 		this.rules = {};
// 		this.numRuleEntries = 0;
// 		this.meshes = [];
// 		this.gui;
// 		this.depth = 1;
// 		this.cachedDepth = 1;
// 		this.ruleFolders = {};
// 		this.updateModel = false;
// 		this.timeToUpdate = 1.0;
// 		this.scale = 1.0;
// 		this.thetaIncrement = 45;
// 		this.phiIncrement = 45;
// 		this.psiIncrement = 45;
// 		this.seed = 'F';
// 		this.startingTheta = Math.PI / 2.0;
// 	}

// 	animate ( scene, dt, camera, pause=false ){
// 		// this.timeToUpdate -= dt;
// 		// if ( this.timeToUpdate < 0.0 ){
// 		// 	this.updateModel = true;
// 		// 	this.timeToUpdate = 1.0;
// 		// }
// 		if ( document.getElementById( "seedInput" ).value != this.seed ){
// 			this.updateModel = true;
// 			this.seed = document.getElementById( "seedInput" ).value;
// 		}

// 		this.updateRules();

// 		if ( this.updateModel ){
// 			this.createMeshes( scene );
// 			console.log( "update" );
// 			this.updateModel = false;
// 		}
// 	}

// 	render ( renderer, scene, camera ){
// 		renderer.render( scene, camera );
// 	}

// 	init ( scene, camera ){
// 		this.updateModel = true;
// 		this.generateGUI();

// 		this.generateSpecialDiv();
// 	}

// 	guiChanged( value ){
// 		this.updateModel = true;
// 	}

// 	removeMeshes( scene ){
// 		for ( var i = 0; i < this.meshes.length; i ++ ){
// 			scene.remove( this.meshes[i] );
// 		}
// 		this.meshes = null;
// 		this.meshes = [];
// 	}

// 	createMeshes( scene ){
// 		this.removeMeshes( scene );

// 		var currentString = document.getElementById( "seedInput" ).value;

// 		for ( var d=0; d < this.depth; d++ ){
// 			currentString = this.iterateString( currentString );
// 		}

// 		var theta = this.startingTheta // Math.PI / 2.0;
// 		var phi = 0.0;
// 		var psi = 0.0;

// 		var thetaStack = [];
// 		var phiStack = [];
// 		var positionStack = [];

// 		// this.thetaIncr = Math.PI / 4.0;

// 		var position = new THREE.Vector3( 0, 0, 0 );

// 		// console.log( currentString );
// 		for ( var i = 0; i < currentString.length; i++ ){
// 			var character = currentString[i];

// 			if ( character == '[' ){
// 				// push current data to relevant stacks
// 				thetaStack.push( theta );
// 				var pushedPositionVector = new THREE.Vector3();
// 				pushedPositionVector.copy( position );
// 				positionStack.push( pushedPositionVector );
// 			} else if ( character == ']' ){
// 				// pop relevant data
// 				theta = thetaStack.pop();
// 				position = positionStack.pop();
// 			} else if ( character == '+' ){
// 				// increment theta by amount
// 				theta += this.thetaIncrement * Math.PI / 180.0;

// 			} else if ( character == '-' ){
// 				// decrement theta by amount
// 				theta -= this.thetaIncrement * Math.PI / 180.0;

// 			} else if ( character in this.rules ){
// 				var length = this.rules[character]['length'];
// 				if ( length > 0 ){

// 					var baseDirection = new THREE.Vector3( 1, 0, 0 );

// 					var direction = new THREE.Vector3( Math.cos( theta ), 
// 													   Math.sin( theta ),
// 													   0 );
// 					var quaternion = new THREE.Quaternion();

// 					var mid = position.addScaledVector( direction, this.scale * length / 2.0 );

// 					var geom = new THREE.CylinderGeometry( this.rules[character]['radius'], 
// 														   this.rules[character]['radius'],
// 														   this.scale * length, 
// 														   Math.floor( this.rules[character]['radius'] + 1 * 30 ) + 3,
// 														   1 );

// 					var material = new THREE.MeshStandardMaterial( { color: this.rules[character]['color'], metalness: 0.0,
// 																	 roughness: 0.8 } );
// 					var mesh = new THREE.Mesh( geom, material );
// 					mesh.position.set( mid.x, mid.y, mid.z );
// 					mesh.rotation.set( phi, psi, theta - Math.PI / 2.0 );
// 					scene.add( mesh );
// 					this.meshes.push( mesh );
// 					// lsystem.toDrawArray.push( [ character, mid.x, mid.y, mid.z,
// 					// 							 0.0, 0.0, theta - Math.PI / 2.0 ] );
// 					position.addScaledVector( direction, this.scale * length / 2.0 );
// 				}
// 			}
// 		}


// 	}

// 	clean ( scene ){
// 		lsystem.rules = {};
// 		lsystem.numRuleEntries = 0;

// 		// // remove drawn elements
// 		// for ( var i = 0; i < lsystem.meshes.length; i++ ){
// 		// 	scene.remove( lsystem.meshes[i] );
// 		// }

// 		this.removeMeshes( scene );

// 		// 	// remove grid
// 		// 	scene.remove( lsystem.gridHelper );

// 		this.gui.destroy();
// 	}

// 	generateSpecialDiv ( ){
// 		var inputBox = document.createElement("input");
// 		inputBox.setAttribute( "type", "text" );
// 		inputBox.setAttribute( "value", "F" );
// 		inputBox.setAttribute( "style", "width:180px; position: absolute; left: 10px; top: 10px" );
// 		inputBox.setAttribute( "id", "seedInput" );

// 		var specialDiv = document.getElementById( "special" );
// 		specialDiv.appendChild( inputBox );

// 		// create plus and minus buttons
// 		var addButton = document.createElement( "button" );
// 		addButton.setAttribute( "id", "plusButton" );
// 		addButton.setAttribute( "style", "position: absolute; left: " + (50 * 0 + 10) + "px; top: 40px; " + 
// 								"height: 20px; width: 30px; text-align: center;");
// 		addButton.innerText = "+";
// 		addButton.addEventListener( "click", ( e ) => { this.createRuleEntry( e ); } );
// 		specialDiv.appendChild( addButton );

// 		var minusButton = document.createElement( "button" );
// 		minusButton.setAttribute( "id", "minusButton" );
// 		minusButton.setAttribute( "style", "position: absolute; left: " + (50 * 1 + 10) + "px; top: 40px; " + 
// 								"height: 20px; width: 30px; text-align: center;");
// 		minusButton.innerText = "-";
// 		minusButton.addEventListener( "click", ( e ) => { this.removeRuleEntry( e ); } );
// 		specialDiv.appendChild( minusButton );

// 		this.createRuleEntry();
// 		document.getElementById( "leftRuleEntry1" ).value = "F";
// 		document.getElementById( "rightRuleEntry1" ). value = "F[+F][-F]";

// 		this.updateRules();
// 	}

// 	generateGUI ( ){
// 		this.gui = new dat.GUI();
// 		// this.gui.onFinishChange( this.guiChanged );

// 		var depthController = this.gui.add( this, "depth", 0, 7 ).step( 1 );
// 		var scaleController = this.gui.add( this, "scale", 0.1, 2.0).step( 0.1 );
// 		var thetaController = this.gui.add( this, "thetaIncrement", 0, 180 );
// 		// this.gui.add( this, "phiIncrement", 0.0, Math.PI );
// 		// this.gui.add( this, "psiIncrement", 0.0, Math.PI );
// 		this.guiRuleFolder = this.gui.addFolder( 'Rules' );

// 		depthController.onChange( (e) => { this.guiChanged( e ); } );
// 		scaleController.onChange( (e) => { this.guiChanged( e ); } );
// 		thetaController.onChange( (e) => { this.guiChanged( e ); } );
// 	}

// 	createRuleEntry ( event ) {
// 		var textBoxSpacing = 30;
// 		if ( this.numRuleEntries < 6 ){
// 			this.numRuleEntries += 1;
// 			var leftSide = document.createElement( "input" );
// 			leftSide.setAttribute( "type", "text" );
// 			leftSide.setAttribute( "style", "width:20px; position: absolute; left: 10px; top: " + 
// 						( this.numRuleEntries * textBoxSpacing + 50 )+ "px;" );

// 			var rightSide = document.createElement("input");
// 			rightSide.setAttribute( "style", "width:140px; position: absolute; left: 50px; top: " + 
// 						( this.numRuleEntries * textBoxSpacing + 50 ) + "px;" );
// 			var specialDiv = document.getElementById( "special" );

// 			leftSide.id = "leftRuleEntry" + this.numRuleEntries;
// 			rightSide.id = "rightRuleEntry" + this.numRuleEntries;

// 			specialDiv.appendChild( leftSide );
// 			specialDiv.appendChild( rightSide );
// 		} else if ( this.numRuleEntries == 6 ){
// 			document.getElementById( "plusButton" ).disabled = true;
// 		}

// 		if ( this.numRuleEntries > 1 ){
// 			document.getElementById( "minusButton" ).disabled = false;
// 		}
// 	}

// 	removeRuleEntry ( event ) {
// 		if ( this.numRuleEntries > 1 ){
// 			var leftSide = document.getElementById( "leftRuleEntry" + this.numRuleEntries );
// 			leftSide.parentNode.removeChild( leftSide );
// 			var rightSide = document.getElementById( "rightRuleEntry" + this.numRuleEntries );
// 			rightSide.parentNode.removeChild( rightSide );

// 			this.numRuleEntries -= 1;
// 		} else if ( this.numRuleEntries == 1 ){
// 			document.getElementById( "minusButton" ).disabled = true;
// 		}

// 		if ( this.numRuleEntries < 6 ){
// 			document.getElementById( "plusButton" ).disabled = false;
// 		}
// 	}

// 	updateRules ( ){

// 		var toDelete = [];
// 		for ( var index in this.rules ){
// 			toDelete.push( index );
// 		}

// 		for ( var i=1; i <= this.numRuleEntries; i++ ){
// 			var leftSide = document.getElementById( "leftRuleEntry" + i ).value;
// 			var rightSide = document.getElementById( "rightRuleEntry" + i).value;

// 			if ( leftSide == "" ){
// 				continue;
// 			}

// 			if ( leftSide in this.rules ){
// 				if ( this.rules[leftSide]['right'] != rightSide){
// 					this.updateModel = true;
// 					this.rules[leftSide]['right'] = rightSide;
// 				}
// 			}
// 			else {
// 				this.rules[leftSide] = {};
// 				this.rules[leftSide]['right'] = rightSide;
// 				// this.rules[leftSide]['cachedRight'] = rightSide;
// 				this.rules[leftSide]['length'] = 1.0;
// 				this.rules[leftSide]['radius'] = 0.1;
// 				this.rules[leftSide]['color'] = "#ff4444";
// 				this.rules[leftSide]['folder'] = this.guiRuleFolder.addFolder( leftSide );
// 				var lengthController = this.rules[leftSide]['folder'].add( this.rules[leftSide], 'length', 0, 1 ).step( 0.1 );
// 				var colorController = this.rules[leftSide]['folder'].addColor( this.rules[leftSide] , 'color' );
// 				var radiusController = this.rules[leftSide]['folder'].add( this.rules[leftSide], 'radius', 0.01, 1).step( 0.01 );
// 				lengthController.onChange( (e) => { this.guiChanged( e ); } );
// 				colorController.onChange( (e) => { this.guiChanged( e ); } );
// 				radiusController.onChange( (e) => { this.guiChanged( e ); } );

// 				this.updateModel = true;
// 			}

// 			var index = toDelete.indexOf( leftSide );
// 			if ( index > -1 ){
// 				toDelete.splice( index, 1 );
// 			}
// 		}

// 		for ( var i=0; i < toDelete.length; i++ ){
// 			this.guiRuleFolder.removeFolder( this.rules[ toDelete[i] ]['folder'] );
// 			delete this.rules[ toDelete[i] ];
// 		}
// 	}

// 	iterateString( inputString ){
// 		var outputString = "";
// 		for ( var i = 0; i < inputString.length; i++ ){
// 			var character = inputString[i];
// 			if ( character in this.rules ){
// 				outputString += this.rules[character]['right'];
// 			} else {
// 				outputString += character;
// 			}
// 		}

// 		return outputString;
// 	}
// }

