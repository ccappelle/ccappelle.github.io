class SVD extends SuperModel{
    constructor( scene ){
        super( scene );

        this.imageFile;
        this.imageData;
        this.planeTexture;

        this.fileInput = document.createElement( 'input' );
        this.fileInput.setAttribute( 'type', 'file' );
        this.fileInput.setAttribute( 'value', 'Upload Image' );
        this.fileInput.setAttribute( 'id', 'imageUpload' );
        this.fileInput.setAttribute( 'accept', 'image/png image/jpeg' );
        this.fileInput.setAttribute( 'name', 'imageUpload' );
        this.fileInput.setAttribute( 'style', 
                                     `position: absolute;
                                      right: 0%; bottom: 20%;`);

        // this.fileInput.onchange = ( input ) => this.readImage( input );
        this.fileInput.addEventListener( 'change', ( e ) => this.readImage( e ), false );
        // document.getElementById( 'model-div' ).appendChild( this.fileInput );
        document.body.appendChild( this.fileInput );

        this.planeMeshes = [];
        this.nImages = 20;
        this.imageWidth = 5.0;
        this.imageHeight = this.imageWidth * 3 / 5;

        var planeGeometry = new THREE.PlaneGeometry();
        var planeMaterial = new THREE.MeshBasicMaterial( { color : 0x555555, side : THREE.DoubleSide, transparent : true } );
        for ( var i = 0; i < this.nImages; i++ ){
            this.planeMeshes.push( new THREE.Mesh( planeGeometry.clone(), planeMaterial.clone() ) );
            this.planeMeshes[i].scale.set( this.imageWidth, this.imageHeight, 1.0 );
            this.addMesh( scene, this.planeMeshes[i] );
            this.planeMeshes[i].material.opacity = 0.1;
        }
        // this.planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
        
        this.kRankStart = 0;
        this.kRankEnd = 0;

        this.fileChangeRead = false;
        this.imagesPositionChanged = true;
        
        this.gui.add( this, 'kRankStart' ).min( 0 ).max( this.planeMeshes.length ).step( 0.1 )
                .onChange( ( e ) => this.imagesPositionChanged = true );
        this.gui.add( this, 'kRankEnd' ).min( 0 ).max( this.planeMeshes.length ).step( 0.1 )
                .onChange( ( e ) => this.imagesPositionChanged = true );
    }

    setPlaneParameters( index ){
        index += 1;
        var showHeight = 0;
        var hideHeight = showHeight + this.imageHeight * 2;

        if ( this.kRankStart < index && index < this.kRankEnd ){
            this.planeMeshes[index - 1].position.set( 0, showHeight, -index / this.planeMeshes.length );
        } else {
            var alpha = Math.max( this.kRankStart - index, index - this.kRankEnd );
            alpha = Math.min( alpha, 1 );

            this.planeMeshes[index - 1].position.set( 0, hideHeight * alpha, -index / this.planeMeshes.length );
        }
    }

    animate( scene, camera, dt ){

        if ( this.imagesPositionChanged ){
            for ( var i = 0; i < this.nImages; i++ ){
                this.setPlaneParameters( i );
            }

            this.imagesPositionChanged = false;
        }

        if ( this.fileChangeRead == true ){
            this.fileChangeRead = false;

            var canvas = document.createElement( 'canvas' );
            var ctx = canvas.getContext('2d');
            ctx.drawImage( this.planeTexture.image, 0, 0);

            console.log( this.planeTexture.image.width, this.planeTexture.image.height );
            
            var aspect = ( this.planeTexture.image.width / this.planeTexture.image.height );
            if ( aspect > 0 ){
                this.planeMesh.scale.set( 10, 10 / aspect, 1 );
            } else {
                this.planeMesh.scale.set( 10 * aspect, 10, 1 );
            }

            var pixel = ctx.getImageData( 0, 0, this.planeTexture.image.width, this.planeTexture.image.height );

            this.planeMesh.material.visible = true;

            this.planeMesh.material.map = this.planeTexture;
            this.planeMesh.material.needsUpdate = true;
        }
    }

    readImage( input ){
        var imageList =  input.target.files;
        this.imageFile = imageList[0];
        this.image = URL.createObjectURL( this.imageFile );

        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin( '' );

        this.planeTexture = loader.load( this.image, ( e ) => { this.fileChangeRead = true; } );
        this.planeTexture.minFilter = THREE.LinearFilter;
    }
}