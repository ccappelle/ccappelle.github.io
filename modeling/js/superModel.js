
class SuperModel {
    constructor( scene, camera ){
        this.sceneMeshes = [];
        this.instructionString = `WORK IN PROGRESS`;
        this.modalContent = `WORK IN PROGRESS`;
        this.gui = new dat.GUI();
        this.pause = false;
        this.mouse = new THREE.Vector2();

        this.pause = false;

        this.raycaster = new THREE.Raycaster();
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

    removeMeshesBySplice( scene, indexStart, count ){
        var meshesToRemove = this.sceneMeshes.splice( indexStart, count );
        for ( var i = 0; i < meshesToRemove.length; i++ ){
            scene.remove( meshesToRemove[i] );
            meshesToRemove[i].geometry.dispose();
            meshesToRemove[i].material.dispose();
        }
    }   

    // removeMeshByIndex( scene, index ){
    //     this.sceneMeshes.splice(index, 1 );
    // }

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

    keyUpHandler( event ){

    }

    mouseClickHandler( event ){
        
    }

    mouseMoveHandler( event ){
            this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            this.mouse.y = 1 - ( event.clientY / window.innerHeight ) * 2;
    }
}