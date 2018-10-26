
class SuperModel {
    constructor( scene, camera ){
        this.sceneMeshes = [];
        this.instructionString = `WORK IN PROGRESS`;
        this.modalContent = `WORK IN PROGRESS`;
        this.gui = new dat.GUI();
        this.pause = false;
        this.mouseX = 0;
        this.mouseY = 0;

        this.pause = false;
    }

    destroy( scene ){
        this.gui.destroy();

        for( var i = 0; i < this.sceneMeshes.length; i++ ){
            scene.remove( this.sceneMeshes[i] );
        }
    }

    addMesh( scene, mesh ){
        scene.add( mesh );
        this.sceneMeshes.push( mesh );
    }

    removeMesh( scene, mesh ){
        var indices = [];

        for ( var i = 0; i < this.sceneMeshes.length; i++ ){
            if ( this.sceneMeshes[i] == mesh ){
                indices.push( i );
                scene.remove( this.sceneMeshes[i] );
            }
        }

        for ( var i = 0; i < indices.length; i++ ){
            this.sceneMeshes.splice( indices[i] - i, 1);
        }

        mesh.geometry.dispose();
        mesh.material.dispose();
        mesh = undefined;
    }
    animate( scene, camera, dt ){

    }

    render( renderer, scene, camera ){
        renderer.render( scene, camera );
    }

    keyDownHandler( event ){

    }

    mouseClickHandler( event ){

    }

    mouseMoveHandler( event ){
            this.mouseX = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.mouseY = 1 - ( event.clientY / window.innerHeight ) * 2;
    }
}