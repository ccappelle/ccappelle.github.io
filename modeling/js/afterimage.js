
class AfterImage extends SuperModel {
	constructor ( scene ){
		super( scene );

		this.nSpheres = 20;
		this.spheres = [];


		var color1 = new THREE.Color( 1, 0, 0 );
		var color2 = new THREE.Color( 1, 1, 0 );

		var sphereGeom = new THREE.SphereGeometry( 0.5, 10, 10 );

		this.position = new THREE.Vector3()

		for ( var i = 0; i < this.nSpheres; i++ ){
			var sphereColor = color1.clone();
			sphereColor.lerp( color2, i / this.nSpheres );
			var sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );
			var sphereMesh = new THREE.Mesh( sphereGeom, sphereMaterial );

			var s = 1.0 - ( i / ( this.nSpheres - 1 ) * 0.75 );
			sphereMesh.scale.set( s, s, s )
			this.addMesh( scene, sphereMesh );
			this.spheres.push( sphereMesh )
		}
	}

	animate( scene, camera, dt ){

		var speed = 10.0;

		if ( this.keyState['KeyA'][0] == true ){
			this.position.x -= speed * dt;
		}

		if ( this.keyState['KeyD'][0] == true ){
			this.position.x += speed * dt;
		}

		if ( this.keyState['KeyW'][0] == true ){
			this.position.z -= speed * dt;
		}

		if ( this.keyState['KeyS'][0] == true ){
			this.position.z += speed * dt;
		}

		if ( this.keyState['KeyQ'][0] == true ){
			this.position.y -= speed * dt;
		}

		if ( this.keyState['KeyE'][0] == true ){
			this.position.y += speed * dt;
		}

		this.position.clamp( new THREE.Vector3( -10.0, -5.0, -10.0),
							 new THREE.Vector3(  10.0,  5.0,  10.0 ) );
		for ( var i = this.nSpheres - 1; i > 0; i-- ){
			this.spheres[i].position.x = this.spheres[i-1].position.x
			this.spheres[i].position.y = this.spheres[i-1].position.y
			this.spheres[i].position.z = this.spheres[i-1].position.z			
		}

		this.spheres[0].position.x = this.position.x;
		this.spheres[0].position.y = this.position.y;
		this.spheres[0].position.z = this.position.z;
	}
}