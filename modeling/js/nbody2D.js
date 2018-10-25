

class NBody2D extends SuperModel{
    constructor( scene, maxN=500 ){
        super( scene );

        this.bodies = [];
        this.bodyMeshes = [];

        this.quadtree = [];

        this.maxN = maxN;
        this.maxX =  5;
        this.minX = -5;
        this.maxY =  5;
        this.minY = -5;

        const geom = new THREE.SphereGeometry( 0.15, 20, 20 )
        const material = new THREE.MeshBasicMaterial( { color: 0x25f033 } );
        for ( var i = 0; i < this.maxN; i++ ){
            const mesh = new THREE.Mesh( geom, material );
            this.addMesh( scene, mesh );
            this.bodyMeshes.push( mesh );
            this.bodyMeshes[i].visible = false;
        }

        this.gui.add( this, "randomize" );
        // this.randomize( 50 );
    }

    animate( scene, camera, dt ){
        for ( var i = 0; i < this.bodies.length; i++ ){
            const body = this.bodies[i];
            body.x += body.vx * dt;
            body.y += body.vy * dt;

            this.bodyMeshes[i].position.set( body.x, body.y, 0 );
        }
    }

    populateQuadTree(){
        this.setEdges();
        this.quadtree = NBody2D.createQuadTreeNode( this.minX, this.maxY, this.maxX, this.minY );

        for ( var i = 0; i < this.bodies.length; i++ ){
            this.pushBoodyOnQuadTree( this.bodies[i] );
        }
    }

    setEdges(){
        for ( var i = 0; i < this.bodies.length; i++ ){
            const body = this.bodies[i];
            if ( body.x > this.maxX ){
                this.maxX = body.x;
            }
            if ( body.y > this.maxY ){
                this.maxY = body.y;
            }
            if ( body.x < this.minX ){
                this.minX = body.x;
            }
            if ( body.y < this.minY ){
                this.minY = body.y;
            }
        }
    }
    randomize( nBodies = 500 ){
        this.bodies = [];
        for ( var i = 0; i < this.maxN; i++ ){

            if ( i < nBodies ){
                var body = NBody2D.createBody( 
                        Math.random() * 8 - 4.0,
                        Math.random() * 8 - 4.0,
                        Math.random() * 1 - 0.5,
                        Math.random() * 1 - 0.5,
                        1
                        );
                this.bodies.push( body );
                this.bodyMeshes[i].position.set( body.x, body.y, 0 );
                // console.log( body.x, body.y );
                this.bodyMeshes[i].visible = true;
            } else {
                this.bodyMeshes[i].visible = false;
            }
            
        }
    }


    static createBody( x=0, y=0, vx=0, vy=0, mass=1 ){
        var body = {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            mass: mass,
        };

        return body;
    }

    static createQuadTreeNode( xtop, ytop, xbottom, ybottom ){
        // var node = {
        //     xtop: xtop,
        //     ytop: ytop,
        //     xbottom: xbottom,
        //     ybottom: ybottom,
        //     xmid: ( xtop - xbottom ) / 2.0,
        //     ymid: ( ytop - ybottom ) / 2.0,
        //     mass: 0,
        //     count: 0,
        //     node.children: [null, null, null, null]
        // }
    }

}