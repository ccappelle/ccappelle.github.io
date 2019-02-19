class IK extends SuperModel{

	constructor ( scene ){
		super( scene );
		this.currentSegment = null;
		this.hoveredSegment = null;
		this.segmentFolder = null;

		this.instructionString = `This demo showcases the FABRIK algorithm for solving inverse kinematics.
								  You can add and remove arm segments and change their length
								  through the gui control panel.`

		this.modalContent = `Forward And Backward Reaching Inverse Kinematics (FABRIK) is a heuristic algorithm
							 for solving inverse kinematics. It was invented by Dr. Andreas Aristidou. You can
							 read more about it here: 
							 <a href="http://www.andreasaristidou.com/FABRIK.html" target="_blank">http://www.andreasaristidou.com/FABRIK.html</a>`
		this.showGrid = true;
		this.recalcFABRIK = true;
		this.eps = 0.01;
		this.maxIterations = 10;
		this.armChanged = true;

		// add grid helper
		var xyGrid = new THREE.GridHelper( 10, 10 );
		var xzGrid = new THREE.GridHelper( 10, 10 );
		var yzGrid = new THREE.GridHelper( 10, 10 );

		xyGrid.rotation.x = Math.PI / 2.0;
		yzGrid.rotation.x = Math.PI / 2.0;
		yzGrid.rotation.z = Math.PI / 2.0;

		this.addMesh( scene, xyGrid );
		this.addMesh( scene, xzGrid );
		this.addMesh( scene, yzGrid );
		this.gridMeshes = [ xyGrid, xzGrid, yzGrid ];

		this.gui.add( this, 'showGrid' ).onChange( ( value ) => { 
				for ( var i = 0; i < 3; i++ ){
					this.gridMeshes[i].visible = value;
				}
			} );

		this.addSegment = ( e ) => this.addBone( scene );
		this.removeSegment = ( e ) => this.removeBone( scene );

		this.gui.add( this, 'addSegment' );
		this.gui.add( this, 'removeSegment' );

		// add target
		this.ballPosition = new THREE.Vector3( 5, 0, 0 );
		this.targetColor = 0x00ff00;

		var ballMaterial = new THREE.MeshStandardMaterial( { color : this.targetColor } );
		var ballGeometry = new THREE.SphereGeometry( 0.3, 32, 32 );
		this.ballMesh = new THREE.Mesh( ballGeometry, ballMaterial );

		this.ballMesh.position.set( 5, 0, 0 );

		this.addMesh( scene, this.ballMesh );

		var targetFolder = this.gui.addFolder( 'Target' );

		targetFolder.add( this.ballPosition, "x" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.listen()
					.onChange( ( value ) => { this.ballMesh.position.setX( value ); this.recalcFABRIK = true; } );
		targetFolder.add( this.ballPosition, "y" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.listen()
					.onChange( ( value ) => { this.ballMesh.position.setY( value ); this.recalcFABRIK = true; } );
		targetFolder.add( this.ballPosition, "z" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.listen()
					.onChange( ( value ) => { this.ballMesh.position.setZ( value ); this.recalcFABRIK = true; } );
		targetFolder.addColor( this, "targetColor" )
					.onChange( ( value ) => { this.ballMesh.material.color.setHex( value ) } );

		this.bones = [];
		// this.boneMeshes = [];

		this.controlPoints = [];
		this.controlPoints.push( new THREE.Vector3( 0, 0, 0 ) );

		this.controlMeshes = [];
		var controlMat = new THREE.MeshBasicMaterial( { color : 0x000000 } );
		var controlGeom = new THREE.SphereGeometry(0.3, 10, 10 );
		var mesh = new THREE.Mesh( controlGeom, controlMat );
		this.addMesh( scene, mesh );
		this.controlMeshes.push( mesh );

		this.addBone( scene );
		
	}

	animate( scene, camera, dt ){
		// var x, y, z;
		// console.log( this.ballMesh.position );
		if ( this.keyState['KeyE'][0] == true ){
            this.ballMesh.position.z -= 0.1;
            this.recalcFABRIK = true;
        }
        if ( this.keyState['KeyQ'][0] == true ){
            this.ballMesh.position.z += 0.1;
            this.recalcFABRIK = true;
        }
        if ( this.keyState['KeyW'][0] == true ){
            this.ballMesh.position.y += 0.1;
            this.recalcFABRIK = true;
        }
        if ( this.keyState['KeyA'][0] == true ){
            this.ballMesh.position.x -= 0.1;
            this.recalcFABRIK = true;
        }
        if ( this.keyState['KeyS'][0] == true ){
        	this.ballMesh.position.y -= 0.1;
        	this.recalcFABRIK = true;
        }
        if ( this.keyState['KeyD'][0] == true ){
            this.ballMesh.position.x += 0.1;
            this.recalcFABRIK = true;
        }

        

        this.ballMesh.position.clamp( new THREE.Vector3( -5, -5, -5 ),
        						 new THREE.Vector3( 5, 5, 5 ) );
        this.ballPosition = this.ballMesh.position;

		if ( this.recalcFABRIK ){
			this.runFABRIK();
			this.updateBones();
			this.recalcFABRIK = false;
		}

		this.handleUserInput();
	}

	handleUserInput(){
		this.raycaster.setFromCamera( this.mouse, camera );
		var boneMeshes = []

		for ( var i = 0; i < this.bones.length; i++ ){
			this.bones[i].mesh.myIndex = i;
			boneMeshes.push( this.bones[i].mesh );
		}

		var intersections = this.raycaster.intersectObjects( boneMeshes );
		if ( intersections.length > 0 ){
			var segment = this.bones[ intersections[0].object.myIndex ];
			this.updateHoveredSegment( segment );
		} else{
			this.updateHoveredSegment( null );
		}
	}

	updateHoveredSegment( segment ){
		if ( this.hoveredSegment === segment ){
			return;
		}

		if ( this.hoveredSegment ){
			this.hoveredSegment.mesh.material.emissive.setHex( 
				this.hoveredSegment.mesh.defaultEmissive );
		}

		if ( segment ){
			this.hoveredSegment = segment;
			this.hoveredSegment.mesh.defaultEmissive = this.hoveredSegment.mesh.material.emissive;
			this.hoveredSegment.mesh.material.emissive.setHex( 0xff0000 );
		} else {
			this.hoveredSegment = null;
		}
	}

	updateCurrentSegment( segment ){
		if ( segment == null ){
			return;
		}

		if ( segment == this.currentSegment ){
			segment = 'deselect'
		}


		if ( this.currentSegment ){
			this.currentSegment.mesh.material.color.setHex( this.currentSegment.baseHex );
		}

		if ( this.segmentFolder != null ){
			this.gui.removeFolder( this.segmentFolder );
		}

		if ( segment == 'deselect' ){
			this.currentSegment = null;
			this.segmentFolder = null;
		}

		this.currentSegment = segment;
		this.currentSegment.baseHex = segment.mesh.material.color.getHex();
		this.currentSegment.mesh.material.color.setHex( 0x0022ff );
		// update current segment folder

		this.segmentFolder = this.gui.addFolder( 'Selected Segment' );

		this.segmentFolder.add( segment, 'length' )
						  .min( 0.1 ).max( 10.0 ).step( 0.1 )
						  .onChange( ( e ) => { this.recalcFABRIK = true; this.controlPoints[this.controlPoints.length - 1].x += 0.1 } );
		this.segmentFolder.open();
		this.recalcFABRIK = true;
	}

	updateBones( ){
		// set control meshes position
		for ( var i = 0; i < this.controlPoints.length; i ++ ){
			this.controlMeshes[i].position.set( this.controlPoints[i].x,
												this.controlPoints[i].y,
												this.controlPoints[i].z
											  );
		}

		// draw control points
		for ( var i = 0; i < this.bones.length; i++ ){
			// this.boneMeshes[i].rotation.x = 0;
			this.bones[i].mesh.rotation.x = 0;
			// not dir = ( 0, 1 , 0 );
			if( Math.abs( this.bones[i].direction.x ) + Math.abs( this.bones[i].direction.z ) > 0.05 ){
				var XZdir = ( new THREE.Vector3( this.bones[i].direction.x, 
											   0,
											   this.bones[i].direction.z )).normalize();
				var mult = 1.0;
				if( XZdir.z > 0 ){
					mult = -1.0;
				}


				var angle = mult * Math.acos( XZdir.x );
				this.bones[i].mesh.rotation.y = angle;
				this.bones[i].mesh.rotation.z = Math.asin( this.bones[i].direction.y );
			} else {
				this.bones[i].mesh.rotation.y = 0;
				this.bones[i].mesh.rotation.z = Math.PI * Math.sign( this.bones[i].direction.y ) / 2.0;
			}
			this.bones[i].mesh.position.set( this.bones[i].position.x,
											 this.bones[i].position.y,
											 this.bones[i].position.z
										    );
			// this.boneMeshes[i].rotation.x = 0.0;
			this.bones[i].mesh.scale.set( this.bones[i].length, 1, 1 );
			

			// this.boneMeshes[i].position.set( this.bones[i].position.x,
			// 								 this.bones[i].position.y,
			// 								 this.bones[i].position.z
			// 							    );
			// // this.boneMeshes[i].rotation.x = 0.0;
			// this.boneMeshes[i].scale.set( this.bones[i].length, 1, 1 );
		}
	}

	removeBone( scene ){

		var index = this.bones.length - 1;

		if ( index < 0 ){
			return;
		}
		var controlMesh = this.controlMeshes.pop();
		// var boneMesh = this.boneMeshes.pop();

		var bone = this.bones.pop();
		this.controlPoints.pop();

		if ( bone === this.currentSegment ){
			this.gui.removeFolder( this.segmentFolder )
			this.segmentFolder = null;
		}
		this.removeMesh( scene, controlMesh );
		this.removeMesh( scene, bone.mesh );

		this.recalcFABRIK = true;
	}

	addBone( scene ){
		var index = this.bones.length

		if ( index >=7 ){
			return;
		}

		var controlMat = new THREE.MeshStandardMaterial( { color : 0x000000 } );
		var controlGeom = new THREE.SphereGeometry(0.2, 10, 10 );
		var controlMesh = new THREE.Mesh( controlGeom, controlMat );
		this.controlMeshes.push( controlMesh );

		var boneMat = new THREE.MeshStandardMaterial( { color : 0xff0000 } );
		var boneGeom = new THREE.BoxGeometry( 1, 0.2, 0.2 );
		var boneMesh = new THREE.Mesh( boneGeom, boneMat );
		// this.boneMeshes.push( boneMesh );

		var bone = {
			length : 1,
			angle : 0,
			limited: false,
			lowerLimit : -180,
			upperLimit : 180,
			axis : new THREE.Vector3( 0, 0, 1 ),
			color : 0xff0000,
			direction : ( new THREE.Vector3( 1, 0, 0 ) ).normalize(),
			desiredDirection : ( new THREE.Vector3( 1, 0, 0 ) ).normalize(),
			position : new THREE.Vector3(),
			mesh : boneMesh,
		}

		this.bones.push( bone );
		var point = this.controlPoints[index].clone();
		bone.position = point.clone();
		bone.position.addScaledVector( bone.direction, bone.length / 2.0 );

		point.addScaledVector( bone.direction, bone.length );
		this.controlPoints.push( point );

		this.addMesh( scene, controlMesh );
		this.addMesh( scene, bone.mesh );

		this.recalcFABRIK = true;
	}

	runFABRIK( ){
		// TO DO:
		// run radius check

		////
		var error = this.controlPoints[ this.controlPoints.length - 1 ].distanceTo( this.ballPosition );
		if ( this.armChanged ){
			error = 1;
			this.armChanged = false;
		}
		
		var count = 0;
		while( error > this.eps && count < this.maxIterations ){
			var cpBack = [];
			// backward pass
			// create temporary vector of control points
			for ( var i = 0; i < this.controlPoints.length - 1; i++ ){
				const index = this.controlPoints.length - i - 1;
				if ( i == 0 ){ // make the last cp move to the target
					cpBack.push( this.ballPosition.clone() );
				} else {
					// get direction to next cp
					const cpSource = cpBack[i - 1];
					const cpTarget = this.controlPoints[index];

					var direction = cpTarget.clone();
					direction.sub( cpSource ).normalize();

					var length = this.bones[index].length;
					var cpNext = cpSource.clone();
					cpNext.addScaledVector( direction, length );
					if ( count == 0 ){ // add little nudge to remove 0 cases
						var randomVec = new THREE.Vector3( Math.random(), Math.random(), Math.random() );
						randomVec.addScalar( -0.5 );
						cpNext.addScaledVector( randomVec, 0.01 );
					}
					cpBack.push( cpNext );
				}
			}

			var cpForward = [];
			// forward pass
			for ( var i = 0; i < cpBack.length + 1; i++ ){
				const index = cpBack.length - i;
				if ( i == 0 ){
					cpForward.push( new THREE.Vector3( 0, 0, 0 ) );
				} else {
					const cpSource = cpForward[i - 1];
					const cpTarget = cpBack[index];

					var direction = cpTarget.clone();
					direction.sub( cpSource ).normalize();

					var length = this.bones[i - 1].length;
					var cpNext = cpSource.clone();

					var midpoint = cpSource.clone();
					midpoint.addScaledVector( direction, length / 2.0 );
					this.bones[i - 1].position = midpoint;
					this.bones[i - 1].direction.copy( direction );

					cpNext.addScaledVector( direction, length );
					cpForward.push( cpNext );

				}
			}

			// set control points
			for ( var i = 0; i < this.controlPoints.length; i++ ){
				this.controlPoints[i] = cpForward[i];
			}

			count += 1;
			var errorVec = this.controlPoints[ this.controlPoints.length - 1 ].clone();
			error = errorVec.distanceTo( this.ballPosition );
		}

	}

	mouseClickHandler( e ){
		this.updateCurrentSegment( this.hoveredSegment );
	}
}