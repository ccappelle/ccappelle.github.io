
class Viewer {
    constructor(){
        this.geomOptions = [ "",
                             "Cylinder",
                             "Toroid"];
        this.instructionString = "View custom made models"
        this.cachedMeshes = [];
        this.currentModel = [];

    }

    init( scene, camera ){
        this.currentModel = '';
        this.cachedModel = ''; 

        // create dropdown with model options
        this.updateSpecialDiv();
    }

    clean ( scene ){

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
