
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
                                      left: 50%; top: 10%;`);

        // this.fileInput.onchange = ( input ) => this.readImage( input );
        this.fileInput.addEventListener( 'change', ( e ) => this.readImage( e ), false );
        // document.getElementById( 'model-div' ).appendChild( this.fileInput );
        document.body.appendChild( this.fileInput );

        this.planeMeshes = [];
        this.nImages = 20;
        this.imageWidth = 5.0;

        var planeGeometry = new THREE.PlaneGeometry();
        var planeMaterial = new THREE.MeshBasicMaterial( { color : 0x555555, side : THREE.DoubleSide } );
        for ( var i = 0; i < this.nImages; i++ ){
            this.planeMeshes.push( new THREE.Mesh( planeGeometry.clone(), planeMaterial.clone() ) );
            this.planeMeshes[i].scale.set( this.imageWidth, this.imageWidth * 3 / 5, 1.0 );
            this.setPlaneParameters( i, 0, 0 );
            this.addMesh( scene, this.planeMeshes[i] );
        }
        // this.planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
        
        // this.planeMesh.material.visible = false;
        // this.addMesh( scene, this.planeMesh );

        this.fileChangeRead = false;
        this.targetAngle = 0;
        this.autoRotateSpeed = 0.5;
        this.autoRotate = true;
        this.imageRotation = 0.0;
        
        this.gui.add( this, 'autoRotate' );
        this.gui.add( this, 'autoRotateSpeed' ).min( 0.1 ).max( 10 ).step( 0.1 );
        this.gui.add( this, 'imageRotation' ).min( 0 ).max( Math.PI * 2 ).step( 0.1 ).listen();
    }

    setPlaneParameters( index, offset,
                        outerWindow = Math.PI / 4.0,
                        windowSpread = Math.PI / 6.0 ){
        var r = this.imageWidth * .85;
        
        var startAngle = ( index / ( this.nImages ) ) * Math.PI * 2.0;
        var outAngle = startAngle + offset;

        // if ( outAngle > Math.PI ){
        //     outAngle -= Math.PI * ;
        // }

        var yRotation = -outAngle + Math.PI / 2.0;
        if ( outAngle < windowSpread && outAngle > -windowSpread){
            var alpha = 1.2 * ( windowSpread - Math.abs( outAngle ) ) / ( windowSpread );

            if ( alpha > 1 ){
                alpha = 1;
            }
            // console.log( alpha );
            r = ( 1 + alpha ) * r;
            yRotation -= alpha * Math.PI / 2.0;
        } else {
            if ( outAngle > 0 ){
                outAngle = outAngle + Math.PI / 4.0;
            } else {
                outAngle = outAngle - Math.PI / 4.0;
            }
            
            yRotation = -outAngle + Math.PI / 2.0;
        }
        // var mappedAngle =  ( index / ( this.nImages) ) * Math.PI * 2.0;
        // var ix = -Math.sin( mappedAngle );
        // var iz =  Math.cos( mappedAngle );
        // var offx = -Math.sin( offset );
        // var offz = Math.cos( offset );

        // var thetaBetween = ix * offx + iz * offz;
        // var yRotation = ( Math.PI / 2.0 ) - mappedAngle;

        // var x, z;

        // if ( thetaBetween > windowSpread ){
        //     var alpha = 4 * ( thetaBetween - windowSpread ) / windowSpread; // between 0 and 1
        //     r = ( 1 + alpha ) * r;
        //     yRotation = yRotation + Math.PI * alpha / 2.0;
        // }

        var x = -Math.sin( outAngle ) * r;
        var z =  Math.cos( outAngle ) * r;

        this.planeMeshes[index].rotation.y = yRotation;
        this.planeMeshes[index].position.set( x, 0, z );
    }

    animate( scene, camera, dt ){
        if ( this.autoRotate ){
            this.imageRotation += dt * this.autoRotateSpeed;
        }

        if ( this.imageRotation >= Math.PI * 2 ){
            this.imageRotation -= Math.PI * 2;
        }

        for ( var i = 0; i < this.nImages; i++ ){
            this.setPlaneParameters( i, this.imageRotation );
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