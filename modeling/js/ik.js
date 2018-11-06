class IK extends SuperModel{

	constructor ( scene ){
		super( scene );
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
		this.ballColor = 0x00ff00;

		var ballMaterial = new THREE.MeshStandardMaterial( { color : this.ballColor } );
		var ballGeometry = new THREE.SphereGeometry( 0.3, 32, 32 );
		this.ballMesh = new THREE.Mesh( ballGeometry, ballMaterial );

		this.ballMesh.position.set( 5, 0, 0 );

		this.addMesh( scene, this.ballMesh );

		var targetFolder = this.gui.addFolder( 'Target' );

		targetFolder.add( this.ballPosition, "x" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.onChange( ( value ) => { this.ballMesh.position.setX( value ); this.recalcFABRIK = true; } );
		targetFolder.add( this.ballPosition, "y" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.onChange( ( value ) => { this.ballMesh.position.setY( value ); this.recalcFABRIK = true; } );
		targetFolder.add( this.ballPosition, "z" )
					.min( -5 )
					.max( 5 )
					.step( 0.1 )
					.onChange( ( value ) => { this.ballMesh.position.setZ( value ); this.recalcFABRIK = true; } );
		targetFolder.addColor( this, "ballColor" )
					.onChange( ( value ) => { this.ballMesh.material.color.setHex( value ) } );

		this.bones = [];
		this.boneFolder = this.gui.addFolder( 'Bones' );
		this.boneFolders = [];
		this.boneMeshes = [];

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
		
		if ( this.recalcFABRIK ){
			this.runFABRIK();
			this.updateBones();
			this.recalcFABRIK = false;
		}
	}

	updateBones( ){
		// set control meshes position
		for ( var i = 0; i < this.controlPoints.length; i ++ ){
			this.controlMeshes[i].position.set( this.controlPoints[i].x,
												this.controlPoints[i].y,
												this.controlPoints[i].z
											  );
		}

		var xUnitVector = new THREE.Vector3( 1, 0, 0 );

		// draw control points
		for ( var i = 0; i < this.bones.length; i++ ){
			var quaternion = new THREE.Quaternion();
			quaternion.setFromUnitVectors( xUnitVector, this.bones[i].direction );
			this.boneMeshes[i].setRotationFromQuaternion( quaternion );
			this.boneMeshes[i].position.set( this.bones[i].position.x,
											 this.bones[i].position.y,
											 this.bones[i].position.z
										    );
			// this.boneMeshes[i].rotation.x = 0.0;
			this.boneMeshes[i].scale.set( this.bones[i].length, 1, 1 );
		}
	}

	removeBone( scene ){

		var index = this.bones.length - 1;

		if ( index < 0 ){
			return;
		}
		var controlMesh = this.controlMeshes.pop();
		var boneMesh = this.boneMeshes.pop();

		var bone = this.bones.pop();
		this.controlPoints.pop();

		this.boneFolder.removeFolder( this.boneFolders[index] );
		this.boneFolders.pop();

		this.removeMesh( scene, controlMesh );
		this.removeMesh( scene, boneMesh );


		this.recalcFABRIK = true;
	}

	addBone( scene ){
		var index = this.bones.length

		if ( index >=7 ){
			return;
		}

		var controlMat = new THREE.MeshStandardMaterial( { color : 0x000000 } );
		var controlGeom = new THREE.SphereGeometry(0.2, 10, 10 );
		var mesh = new THREE.Mesh( controlGeom, controlMat );
		this.controlMeshes.push( mesh );

		// var boneMat = new THREE.LineBasicMaterial( { color : 0xff0000 } );
		// var boneGeom = new THREE.Geometry();
		// boneGeom.vertices.push( new THREE.Vector3( -0.5, 0.0, 0.0 ),
		// 						new THREE.Vector3( 0.5, 0.0, 0.0 ) );
		// boneGeom.dynamic = true;
		// var boneMesh = new THREE.Line( boneGeom, boneMat );

		var boneMat = new THREE.MeshStandardMaterial( { color : 0xff0000 } );
		var boneGeom = new THREE.BoxGeometry( 1, 0.2, 0.2 );
		var boneMesh = new THREE.Mesh( boneGeom, boneMat );
		this.boneMeshes.push( boneMesh );

		var bone = {
			length : 1,
			angle : 0,
			limited: false,
			lowerLimit : -180,
			upperLimit : 180,
			axis : new THREE.Vector3( 0, 0, 1 ),
			color : 0xff0000,
			direction : ( new THREE.Vector3( 1, 0, 0 ) ).normalize(),
			position : new THREE.Vector3()
		}

		this.bones.push( bone );
		this.boneFolders.push( this.boneFolder.addFolder( String( index + 1 ) ) );

		this.boneFolders[index].add( bone, 'length' ).min( 0 ).max( 5 ).step( 0.1 )
							   .onChange( ( value ) => { this.recalcFABRIK = true; } );
		this.boneFolders[index].addColor( bone, 'color' )
							   .onChange( ( value ) => boneMesh.material.color.setHex( value ) );

		var point = this.controlPoints[index].clone();
		bone.position = point.clone();
		bone.position.addScaledVector( bone.direction, bone.length / 2.0 );

		point.addScaledVector( bone.direction, bone.length );
		this.controlPoints.push( point );

		this.addMesh( scene, mesh );
		this.addMesh( scene, boneMesh );

		this.recalcFABRIK = true;
	}

	runFABRIK( ){
		var error = 1.0;
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
}