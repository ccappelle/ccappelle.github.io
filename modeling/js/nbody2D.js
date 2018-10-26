

class NBody2D extends SuperModel{
    constructor( scene, maxN=500 ){
        super( scene );

        this.bodies = [];
        this.bodyMeshes = [];
        this.boxOutlines = [];

        this.quadtree = [];

        this.maxN = maxN;
        this.maxX =  5;
        this.minX = -5;
        this.maxY =  5;
        this.minY = -5;

        this.theta = 0.5;
        this.G = 1.0;

        this.drawTree = true;
        this.keepCentered = true;
        this.keepScaled = true;

        this.scalingFactor = new THREE.Vector2( 1.0, 1.0 );

        const geom = new THREE.SphereGeometry( 0.15, 20, 20 )
        const material = new THREE.MeshBasicMaterial( { color: 0x25f033 } );

        var boxMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 } );
        var boxGeom = new THREE.Geometry();
        boxGeom.vertices.push( 
            new THREE.Vector3(  0.5,  0.5, 0.0 ),
            new THREE.Vector3( -0.5,  0.5, 0.0 ),
            new THREE.Vector3( -0.5, -0.5, 0.0 ),
            new THREE.Vector3(  0.5, -0.5, 0.0 ),
            new THREE.Vector3(  0.5,  0.5, 0.0 )
        );

        for ( var i = 0; i < this.maxN; i++ ){
            const mesh = new THREE.Mesh( geom, material );
            this.addMesh( scene, mesh );
            this.bodyMeshes.push( mesh );
            this.bodyMeshes[i].visible = false;

            const boxOutline = new THREE.Line( boxGeom, boxMaterial );
            boxOutline.rotation.x = -Math.PI / 2.0;
            boxOutline.visible = false;

            this.addMesh( scene, boxOutline );
            this.boxOutlines.push( boxOutline );
        }

        this.gui.add( this, "pause" );
        this.gui.add( this, "randomize" );
        this.gui.add( this, "theta").min(0.0).max(1.0).step(0.01);
        this.gui.add( this, "drawTree" );
        this.gui.add( this, "keepCentered" );
        this.gui.add( this, "keepScaled" );
        // this.randomize( 50 )
    }

    animate( scene, camera, dt ){

        this.populateQuadTree();
        
        for ( var i = 0; i < this.boxOutlines.length; i++ ){
            this.boxOutlines[i].visible = false;
        }

        this.setNodeTreeBoxOutline( this.quadtree );

        for ( var i = 0; i < this.bodies.length; i++ ){
            const body = this.bodies[i];

            if ( !this.pause ){
                // this.updateForcesFromQuadTree( body );

                body.velocity.addScaledVector( body.force, dt / body.mass );
                body.position.addScaledVector( body.velocity, dt );
                body.force.x = 0;
                body.force.y = 0;
            }

            if ( this.keepCentered ){
                if ( this.keepScaled ){
                    this.bodyMeshes[i].position.set( ( body.position.x - this.quadtree.mid.x ) / this.scalingFactor.x,
                                                     0,
                                                     ( body.position.y - this.quadtree.mid.y ) / this.scalingFactor.y);
                    var sizeScalar = 1.0 / ( ( this.scalingFactor.x + this.scalingFactor.y ) / 2.0 )
                    if ( sizeScalar < 0.01 ) { sizeScalar = 0.01};
                    this.bodyMeshes[i].scale.set( sizeScalar, sizeScalar, sizeScalar );
                } else {
                    this.bodyMeshes[i].position.set( body.position.x - this.quadtree.mid.x, 0, body.position.y - this.quadtree.mid.y );
                }
                
            } else {
                this.bodyMeshes[i].position.set( body.position.x, 0, body.position.y );
            }
            
        }
    }

    updateForcesFromQuadTree( body ){
        // this.updateForcesFromNode( body, this.quadtree );
    }

    updateForcesFromNode( body, node, num=0 ){
        console.log( num );
        if ( node.count < 2 ){ // terminal calculate gravitational force between body and node
            var r = body.position.distanceTo( node.com );
            var direction = new THREE.Vector2( 0, 0 );
            direction.x = node.com.x - body.position.x;
            direction.y = node.com.y - body.position.y;
            // direction.subVectors( node.com, body.position )
            direction.normalize();
            var F = this.calcGravity( body.mass, node.mass, r );
            body.force.addScaledVector( direction, F );
        } else {
            var s = Math.min( node.bottomCorner.x - node.topCorner.x, node.topCorner.y - node.bottomCorner.y );
            var r = body.position.distanceTo( node.com ); 

            if ( s / r > this.theta ){
                 for ( var i = 0; i < node.children.length; i++ ){
                    if ( node.children[i] != null ){
                        // this.recursivePrint( node.children[i] );
                        num = this.updateForcesFromNode( body, node.children[i], num + 1 );
                    }
                }
                // var direction = new THREE.Vector2( 1, 0 );
                // body.force.add( direction );
            } else {
                var direction = new THREE.Vector2(1, 0);
                // direction.subVectors( node.com, body.position).normalize();
                var F = this.calcGravity( body.mass, node.mass, r );
                body.force.addScaledVector( direction, F );
           }
        }

        return num;
    }

    recursivePrint( node ){
        console.log( node.com );
        for ( var i = 0; i < node.children.length; i++ ){
            if ( node.children[i] != null ){
                this.recursivePrint( node.children[i] );
            }
        }
    }

    calcGravity( m1, m2, r ){
        return ( this.g * m1 * m2 ) / ( r * r )
    }

    setNodeTreeBoxOutline( node, boxIndex=0 ){
        if ( node.count == 0 ){
            return 0;
        }

        var boxOutline = this.boxOutlines[boxIndex];

        if ( this.drawTree ){

            if ( this.keepCentered ){
                if ( this.keepScaled ){
                    boxOutline.position.set( ( node.mid.x - this.quadtree.mid.x ) / this.scalingFactor.x,
                                             0.0,
                                             ( node.mid.y - this.quadtree.mid.y ) / this.scalingFactor.y );
                } else {
                    boxOutline.position.set( node.mid.x - this.quadtree.mid.x , 0.0, node.mid.y - this.quadtree.mid.y );
                }
                
            } else {
                boxOutline.position.set( node.mid.x, 0.0, node.mid.y );
            }

            if ( this.keepCentered && this.keepScaled ){
                boxOutline.scale.set( ( node.topCorner.x - node.bottomCorner.x ) / this.scalingFactor.x,
                                       ( node.topCorner.y - node.bottomCorner.y ) / this.scalingFactor.y,
                                       1.0 );
             } else {
                 boxOutline.scale.set( node.topCorner.x - node.bottomCorner.x, node.topCorner.y - node.bottomCorner.y, 1.0 );
             }
           
            boxOutline.visible = true;
        } 
        
        if ( node.count > 1 ){
            for ( var i = 0; i < node.children.length; i++ ){
                if ( node.children[i] != null ){
                    boxIndex = this.setNodeTreeBoxOutline( node.children[i], boxIndex + 1);
                }
            }
        }

        return boxIndex;
    }

    populateQuadTree(){
        this.setEdges();
        this.quadtree = null;
        this.quadtree = NBody2D.createQuadTreeNode( this.minX, this.maxY, this.maxX, this.minY );

        for ( var i = 0; i < this.bodies.length; i++ ){
            console.log( 'body length', this.bodies.length );
            console.log( 'looping', i );
            this.pushBodyOnNode( this.bodies[i], this.quadtree );
        }

        // calc center of mass
        this.setNodeTreeCOM( this.quadtree );
    }

    pushBodyOnNode( body, node, num = 0 ){
        // console.log( 'count top recursion', node.count );
        // console.log( 'bodyOnNode', num, node.count );
        console.log( 'ugh', node.count );
        node.bodies.push( body );
        node.count += 1;
        node.mass += body.mass;
        
        if ( node.count <= 1 ){
            return num;
        }

        var quadrantInfo = this.findChildQuadrant( node, node.bodies[0] );
        // console.log( quadrantInfo );
        var quadrantInfo;
        if ( node.count > 1 ){
            quadrantInfo = this.findChildQuadrant( node, node.bodies[0] );
            // console.log( 'quadrant info', quadrantInfo );
            if ( node.children[quadrantInfo.index] == null ){
                node.children[quadrantInfo.index] = NBody2D.createQuadTreeNode( quadrantInfo.topCorner.x,
                                                                                quadrantInfo.topCorner.y,
                                                                                quadrantInfo.bottomCorner.x,
                                                                                quadrantInfo.bottomCorner.y);
            }
            console.log( 'from 1' );
            num = this.pushBodyOnNode( node.bodies[0], node.children[quadrantInfo.index], num + 1 );
        }
        quadrantInfo = this.findChildQuadrant( node, body );
        if( node.children[quadrantInfo.index] == null ){
            node.children[quadrantInfo.index] = NBody2D.createQuadTreeNode( quadrantInfo.topCorner.x,
                                                                            quadrantInfo.topCorner.y,
                                                                            quadrantInfo.bottomCorner.x,
                                                                            quadrantInfo.bottomCorner.y);
        }
        console.log( 'from 2');
        num = this.pushBodyOnNode( body, node.children[quadrantInfo.index], num + 1 );
        return num;
    }

    findChildQuadrant( node, body ){
        var greaterX = 0;
        var greaterY = 0;
        var topPoint = new THREE.Vector2( node.mid.x , node.topCorner.y );
        var bottomPoint = new THREE.Vector2( node.bottomCorner.x, node.mid.y );

        if ( body.position.x < node.mid.x ){
            greaterX = 1;
            topPoint.x = node.topCorner.x;
            bottomPoint.x = node.mid.x;
        }

        if ( body.position.y < node.mid.y ){
            greaterY = 1;
            topPoint.y = node.mid.y;
            bottomPoint.y = node.bottomCorner.y;
        }

        var quadrantInfo = {
            index: 2 * greaterY + greaterX,
            topCorner: topPoint,
            bottomCorner: bottomPoint
        }
        return quadrantInfo;
    }

    setNodeTreeCOM( node ){
        if ( node.count == 1 ){
            node.com = node.bodies[0].position;
        } else {
            node.com.x = 0;
            node.com.y = 0;

            for ( var i=0; i < node.children.length; i++ ){
                // get com from all children
                if ( node.children[i] == null ){

                } else{
                    // recursive step
                    this.setNodeTreeCOM( node.children[i] );
                    // add child com scaled by mass
                    node.com.addScaledVector( node.children[i].com, node.children[i].mass )
                }
            }

            node.com.divideScalar( node.mass );
        }
    }
    getCenterOfMass( bodies ){
        var totalMass = 0;
        var COM = new THREE.Vector2( 0, 0 );
        for ( var i=0; i < bodies.length; i++ ){
            const body = bodies[i];
            COM.add( body.position );
            totalMass += body.mass;
        }

        COM.divideScalar( this.totalMass );
        
        return COM;
    }
    setEdges(){
        this.maxX = -Infinity;
        this.maxY = -Infinity;
        // this.maxX = -100000000;
        // this.maxY = -100000000;
        this.minX = Infinity;
        this.minY = Infinity;
        // this.maxX = Number.NEGATIVE_INFINITY;
        // this.minX = Number.INFINITY;
        // this.maxY = Number.NEGATIVE_INFINITY;
        // this.minY = Number.INFINITY;

        for ( var i = 0; i < this.bodies.length; i++ ){
            const body = this.bodies[i];

            if ( body.position.x > this.maxX ){
                this.maxX = body.position.x;
            }
            if ( body.position.y > this.maxY ){
                this.maxY = body.position.y;
            }
            if ( body.position.x < this.minX ){
                this.minX = body.position.x;
            }
            if ( body.position.y < this.minY ){
                this.minY = body.position.y;
            }
        }
        if ( ( this.maxX - this.minX ) < 1.0 ){
            this.maxX += 0.5;
            this.minX -= 0.5;
        }

        if ( ( this.maxY - this.minY) < 1.0 ){
            this.maxY += 0.5;
            this.minY -= 0.5;
        }

        this.scalingFactor.x = ( this.maxX - this.minX ) / 10.0;
        this.scalingFactor.y = ( this.maxY - this.minY ) / 10.0;
    }

    randomize( nBodies = 10 ){
        this.bodies = [];
        for ( var i = 0; i < this.maxN; i++ ){

            if ( i < nBodies ){
                var body = NBody2D.createBody( 
                        Math.random() * 8 - 4.0,
                        Math.random() * 8 - 4.0,
                        0, 0,
                        1
                        );
                this.bodies.push( body );
                this.bodyMeshes[i].position.set( body.position.x, 0, body.position.y);
                // console.log( body.x, body.y );
                this.bodyMeshes[i].visible = true;
            } else {
                this.bodyMeshes[i].visible = false;
            }          
        }
    }


    static createBody( x=0, y=0, vx=0, vy=0, mass=1 ){
        var body = {
            position: new THREE.Vector2( x, y ),
            velocity: new THREE.Vector2( vx, vy ),
            force: new THREE.Vector2( 0, 0 ),
            mass: mass,
        };

        return body;
    }

    static createQuadTreeNode( xtop, ytop, xbottom, ybottom ){
        var node = {
            topCorner:    new THREE.Vector2( xtop, ytop ),
            bottomCorner: new THREE.Vector2( xbottom, ybottom ),
            mid:          new THREE.Vector2( ( xtop + xbottom ) / 2.0, ( ytop + ybottom ) / 2.0 ),
            com:          new THREE.Vector2( 0, 0 ),
            mass: 0,
            count: 0,
            children: [null, null, null, null],
            bodies: []
        }

        return node;
    }

}