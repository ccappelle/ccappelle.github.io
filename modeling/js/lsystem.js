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

        this.instructionString = `This demo showcases L-Systems. Using the gui controller, you can change the L-Systems behaviour.
                                  {+-&^/\\} are rotational modifiers. {[]} are pushes and pops from the drawing stack.`;
        this.modalContent = `Lindenmayer systems ( L-Systems ) is a type of formal grammar. It has been primarily used
                             to generate images of tree structures. You can find more info and examples here:
                             <a href="https://en.wikipedia.org/wiki/L-system" target="_blank">https://en.wikipedia.org/wiki/L-system</a>`;
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
        this.ruleFolders[1].updateDisplay();
	}

	addRule(){
        if ( this.nRuleEntries >= 5 ){
            return;
        }

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