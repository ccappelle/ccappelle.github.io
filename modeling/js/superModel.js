
class SuperModel {
    constructor( scene, camera ){
        this.sceneMeshes = [];
        this.instructionString = `Please select a model 
                                  from the dropdown selector 
                                  in the top left of the page.`;
        this.gui = new dat.GUI();
        this.pause = false;
        this.mouseX = 0;
        this.mouseY = 0;

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