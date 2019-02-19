class SVD extends SuperModel{
    constructor( scene ){
        super( scene );

        this.planeTexture;

        this.fileInput = document.createElement( 'input' );
        this.fileInput.setAttribute( 'type', 'file' );
        this.fileInput.setAttribute( 'value', 'Upload Image' );
        this.fileInput.setAttribute( 'id', 'imageUpload' );
        this.fileInput.setAttribute( 'accept', 'image/jpeg' );
        this.fileInput.setAttribute( 'name', 'imageUpload' );
        this.fileInput.setAttribute( 'style', 
                                     `position: absolute;
                                      right: 0%; bottom: 20%;`);

        // this.fileInput.onchange = ( input ) => this.readImage( input );
        this.fileInput.addEventListener( 'change', ( e ) => this.readImageFromUpload( e ), false );
        document.getElementById( 'model-div' ).appendChild( this.fileInput );
        // document.body.appendChild( this.fileInput );

        this.planeMeshes = [];
        this.nImages = 20;
        this.imageWidth = 5.0;
        this.imageHeight = this.imageWidth * 3 / 5;

        var planeGeometry = new THREE.PlaneGeometry();
        var planeMaterial = new THREE.MeshBasicMaterial( { color : 0xffffff, side : THREE.DoubleSide, transparent : true,
                                depthWrite: false, depthTest: true } );
        for ( var i = 0; i < this.nImages; i++ ){
            this.planeMeshes.push( new THREE.Mesh( planeGeometry, planeMaterial.clone() ) );
            this.planeMeshes[i].scale.set( this.imageWidth, this.imageHeight, 1.0 );
            this.addMesh( scene, this.planeMeshes[i] );
            this.planeMeshes[i].material.opacity = 0.2;
            this.planeMeshes[i].rotation.z = Math.PI;
            this.planeMeshes[i].rotation.y = Math.PI;
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

        this.showHeight = 3.0;
        this.baseImagePlane = new THREE.Mesh( planeGeometry, planeMaterial.clone() );
        this.baseImagePlane.position.set( this.imageWidth * 1.5, this.showHeight, 0 );
        this.baseImagePlane.scale.set( this.imageWidth, this.imageHeight, 1.0 );

        this.addMesh( scene, this.baseImagePlane );
        this.readImage( '../../img/tree.png' );
    }

    setPlaneParameters( index ){
        index += 1;
        // this.showHeight = 0;
        var hideHeight = this.showHeight - this.imageHeight * 1.5;

        // if index is within range be full scale and show
        if ( this.kRankStart < index && index < this.kRankEnd ){
            this.planeMeshes[index - 1].position.set( 0, this.showHeight, -index / this.planeMeshes.length );
            this.planeMeshes[index - 1].scale.set( this.imageWidth,   
                                                   this.imageHeight,
                                                   1.0);
        } else {
            var alpha = Math.max( this.kRankStart - index, index - this.kRankEnd );
            alpha = Math.min( alpha, 1 );
            this.planeMeshes[index - 1].scale.set( this.imageWidth * ( 2 - alpha ) / 2,
                                                   this.imageHeight * ( 2 - alpha ) / 2,
                                                   1.0 )
            this.planeMeshes[index - 1].position.set( 0, this.showHeight * ( 1 - alpha ) + hideHeight * alpha, -index / this.planeMeshes.length );
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

            var aspect = ( this.planeTexture.image.height / this.planeTexture.image.width);
            this.imageHeight = this.imageWidth * aspect;
    
            var canvas = document.createElement( 'canvas' );
            canvas.width = this.planeTexture.image.width;
            canvas.height = this.planeTexture.image.height;
            // document.body.appendChild( canvas );
            // canvas.style.zIndex = "1000";

            var ctx = canvas.getContext('2d');
            ctx.drawImage( this.planeTexture.image,
                           0, 0,
                           this.planeTexture.image.width,
                           this.planeTexture.image.height,
                           0, 0,
                           canvas.width,
                           canvas.height
                    );

            // console.log( this.planeTexture.image.width, this.planeTexture.image.height );
            this.baseImagePlane.scale.set( this.imageWidth, this.imageWidth * aspect, 1 );

            var pixel = ctx.getImageData( 0, 0, this.planeTexture.image.width, this.planeTexture.image.height );
            // console.log( pixel.data );

            var size = this.planeTexture.image.width * this.planeTexture.image.height;
            

            for ( var j = 0; j < this.planeMeshes.length; j ++ ){
                var curr = j % 3;
                var data = new Uint8Array( 4 * size );
                for ( var i = 0; i < size; i++ ){
                    var stride = i * 4;
                    data[ stride + 0 ] = 255;
                    data[ stride + 1 ] = 255;
                    data[ stride + 2 ] = 255;

                    data[ stride + curr ] = pixel.data[ 4 * i + curr ];

                    data[ stride + 3 ] = 255 - pixel.data[ 4 * i + curr ];
                }
                // pixel.data = 
                var texture = new THREE.DataTexture( data, pixel.width, pixel.height, THREE.RGBAFormat );
                texture.needsUpdate = true;
                this.planeMeshes[j].material.map = texture;
                this.planeMeshes[j].material.needsUpdate = true;
                this.planeMeshes[j].scale.set( this.imageWidth, this.imageWidth * aspect, 1 );
                this.setPlaneParameters( j );      
            }


            this.baseImagePlane.material.map = this.planeTexture;
            this.baseImagePlane.material.needsUpdate = true;


            console.log( 'img loaded' );
        }
    }

    readImageFromUpload( inputFiles ){
        if ( inputFiles == null ){
            return;
        }
        var localImagePath = inputFiles.target.files[0];
        var image = URL.createObjectURL( localImagePath );

        this.readImage( image );
    }

    readImage( image ){
        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin( '' );

        this.planeTexture = loader.load( image, ( e ) => { this.fileChangeRead = true; } );
        this.planeTexture.minFilter = THREE.LinearFilter;
    }
}