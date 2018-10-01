
class Viewer {
    constructor(){
        this.geomOptions = [ "",
                             "Cylinder",
                             "Toroid"];
        this.instructionString = "View custom made models"
        this.currentMeshes = [];
        this.cachedMeshes = []
        this.currentModel = "";
        this.cachedModel = "";

        this.gui;

        this.scale = 1.0;
        this.xRotation = 0.0;
        this.yRotation = 0.0;
        this.zRotation = 0.0;
    }

    init( scene, camera ){
        this.updateSpecialDiv();

        // create gui
        this.gui = new dat.GUI();
        this.gui.add( this, "scale", 0.1, 5.0 ).step( 0.1 );
        this.gui.add( this, "xRotation", 0, 360 ).step( 1 );
        this.gui.add( this, "yRotation", 0, 360 ).step( 1 );
        this.gui.add( this, "zRotation", 0, 360 ).step( 1 );
    }

    clean ( scene ){
        for ( var i = 0; i < this.currentMeshes.length; i++ ){
            scene.remove( this.currentMeshes[i] );
        }

        this.currentModel = [];
        this.currentMeshes = [];
    }


    animate ( scene, dt, camera ){
        if ( this.currentModel != this.cachedModel ){
            for ( var i = 0; i < this.cachedMeshes.length; i++ ){
                scene.remove( this.cachedMeshes[i] );
            }

            for ( var i = 0; i < this.currentMeshes.length; i++ ){
                scene.add( this.currentMeshes[i] );
                this.cachedMeshes.push( this.currentMeshes[i] );
            }
            // console.log( this.currentModel );
            // scene.add( this.mesh );
            // this.cachedModel = this.currentModel;
        }

        if ( this.currentMeshes.length > 0 ){
            this.currentMeshes[0].rotation.x = this.xRotation * Math.PI / 180.0;
            this.currentMeshes[0].rotation.y = this.yRotation * Math.PI / 180.0;
            this.currentMeshes[0].rotation.z = this.zRotation * Math.PI / 180.0;
            this.currentMeshes[0].scale.set( this.scale, this.scale, this.scale );
        }
    }

    render ( renderer, scene, camera ){
        renderer.render( scene, camera );
    }

    updateSpecialDiv(){
        var specialDiv = document.getElementById( "special" );

        var geomSelector = document.createElement( "select" );
        geomSelector.setAttribute( "id", "geomSelector" );
        geomSelector.setAttribute( "style", "text-align: left; position: absolute; left: 10px; top: 10px");
        specialDiv.appendChild( geomSelector );


        for ( var i = 0; i < this.geomOptions.length; i++ ){
            var geomOption = document.createElement( "option" );
            geomOption.value = this.geomOptions[i];
            geomOption.text = this.geomOptions[i];

            geomSelector.appendChild( geomOption );
        }

        var updateGeomButton = document.createElement( "button" );
        updateGeomButton.setAttribute( "id", "updateGeomButton" );
        updateGeomButton.innerText = "Update";
        updateGeomButton.setAttribute( "style", "position: absolute; left: 85px; top: 10px;" + 
                                "height: 20px; width: 60px; text-align: center;");
        updateGeomButton.addEventListener( "click", ( e ) => { this.updateCurrentModel( e ) } );
        specialDiv.appendChild( updateGeomButton );
    }

    updateCurrentModel(){
        this.currentModel = document.getElementById( "geomSelector" ).value;
        this.currentMeshes = [];

        if ( this.currentModel == "" ) {

        } else if ( this.currentModel == "Cylinder" ) {
            // remove mesh
            // make circle add to scene
            var geom = prismGeom();
            var mesh = new THREE.Mesh( geom, new THREE.MeshStandardMaterial( { color: 0xff0000, side: THREE.DoubleSide } ) );
            this.currentMeshes.push( mesh );
        } else if ( this.currentModel == "Toroid" ) {
            var geom = toroidGeom();
            var mesh = new THREE.Mesh( geom, new THREE.MeshStandardMaterial( { color: 0xff0000 } ) );
            this.currentMeshes.push ( mesh );
        }
    }
}
