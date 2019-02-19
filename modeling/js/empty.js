class Empty extends SuperModel{
	constructor( scene ){
		super( scene );
		this.instructionString = `Please select from the menu on the  
                                  left of the page.`;
        this.modalContent = `Welcome. This webpage contains demos 
       						 I created in order to learn more about ThreeJS
       						 and javascript in general. You can use the dropdown
       						 selector in the top-right corner to switch between
       						 different demos. Enjoy!`

        var loader = new THREE.FontLoader();

        this.textMesh;
        this.loaded = false;
        loader.load( '../../fonts/Pixolde_Medium.json',
                     ( font ) => this.createText( scene, font )
             );
        this.time = 0.0;

        // var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
        // var edges = new THREE.EdgesGeometry( geometry );
        // var line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x00ff00 } ) );
        // this.addMesh( scene, line );
    }

    animate( scene, camera, dt ){
        if ( this.loaded ){
            this.time += dt;
            var randomVec = new THREE.Vector3( Math.random() * 2.0 - 1.0,
                                               Math.random() * 2.0 - 1.0,
                                               Math.random() * 2.0 - 1.0 );
            this.textMesh.position.addScaledVector( randomVec, 2.0 * Math.sin( this.time * 0.0001 ) );
        }
    }

    createText( scene, font ){
        var geometry = new THREE.TextGeometry( 'Choose a Demo',
            {
                font: font,
                size: 2,
                height: 0.2,
            }
         );

        var material = new THREE.MeshBasicMaterial( { color: 0x00000 } );

        this.textMesh = new THREE.Mesh( geometry, material );
        this.textMesh.position.set( -7.5, 0, 0 );
        this.addMesh( scene, this.textMesh );
        this.loaded = true;
    }
}