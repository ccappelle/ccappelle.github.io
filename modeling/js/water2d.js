
class Water2D{
    constructor( n = 100, length = 10, height = 1, k = 0.01, damping = 0.025, spread=0.001 ){
        this.n = n;
        this.length = length;
        this.height = height;
        this.waterMesh;
        this.positions;
        this.k = k;
        this.damping = damping;
        this.time = 0.0;
        this.velocities;
        this.spread = spread;
        this.splashVelocity = 0.1;
        this.passes = 8;
    }

    init( scene , camera ){
        this.geom = new THREE.BufferGeometry();
        this.geom.dynamic = true;
        this.geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( this.n * 2 * 3 ), 3 ));
        this.geom.setIndex( new Float32Array( ( this.n - 1 * 2 ) * 3 ) );

        // var material = new THREE.MeshBasicMaterial( { color: "#0044d0", side: THREE.DoubleSide, wireframe: true } );
        var material = new THREE.MeshBasicMaterial( { color: "#0074d0", side: THREE.DoubleSide, transparent: true, opacity: 0.5 } );

        this.positions = this.geom.attributes.position.array;
        this.velocities = new Float32Array( this.n );
        this.leftDeltas = new Float32Array( this.n );
        this.rightDeltas = new Float32Array( this.n );
        // console.log( this.positions );

        this.initPositions()
        this.waterMesh = new THREE.Mesh( this.geom, material );

        scene.add( this.waterMesh );

        this.gui = new dat.GUI();
        this.gui.add( this, "spread", 0.0, 0.05 ).step( 0.01 );
        this.gui.add( this, "k", 0.001, 0.1).step( 0.001 );
        this.gui.add( this, "damping", 0, 1.0).step( 0.01 );
        this.gui.add( this, "splashVelocity", 0.0, 1.0).step( 0.01 );
        this.gui.add( this, "passes", 1, 16).step( 1 );
    }

    clean( scene ){
        this.gui.destroy();
        this.velocities = [];

        scene.remove( this.waterMesh );
    }

    animate( scene, dt, camera, pause=false ){
        // update
        if ( this.time > 1.0 ){
            this.splash( Math.floor( this.n / 2) );
            this.time = 0.0;
        }
        this.time += dt;

        this.updatePositions( dt );

        this.geom.attributes.position.needsUpdate = true;
    }

    render( renderer, scene, camera ){
        renderer.render( scene, camera );
    }

    splash( i ){
        this.velocities[i] = -this.splashVelocity;
    }
    updatePositions( dt ){
        // for ( var i = 0; i < this.n; i++ ){
        //     // index of y positions
        //     this.positions[1 + i * 3 ] = this.height + 0.5 * Math.cos( this.time + 4 * i / this.n );
        // }

        for ( var i = 0; i < this.n; i++ ){
            var xDiff = this.positions[ 1 + i * 3 ] - this.height;
            var acc = -this.k * xDiff - this.damping * this.velocities[i];

            this.positions[ 1 + i * 3 ] += this.velocities[i];
            this.velocities[i] += acc;
        }

        var leftDeltas = new Float32Array( this.n );
        var rightDeltas = new Float32Array( this.n );

        for ( var j = 0; j < this.passes; j++ ){
            for ( var i = 0; i < this.n; i++){

                if ( i > 0 ){
                    leftDeltas[i] = this.spread * ( this.positions[ 1 + i * 3] - this.positions[ 1 + ( i - 1 ) * 3 ] );
                    this.velocities[i - 1] += leftDeltas[i] / this.passes;
                }
                if ( i < this.n - 1 ){
                    rightDeltas[i] = this.spread * ( this.positions[1 + i * 3] - this.positions[ 1 + ( i + 1) * 3 ] );
                    this.velocities[i + 1] += rightDeltas[i] / this.passes;
                }
            }
        }

        for ( var i = 0; i < this.n; i++ ){
            if ( i > 0 ){
                this.positions[ 1 + ( i - 1 ) * 3 ] += leftDeltas[i];
            }
            if ( i < this.n - 1 ){
                this.positions[ 1 + ( i + 1 ) * 3 ] += rightDeltas[i];
            }
        }

    }
    initPositions(){
        var step = this.length / ( this.n - 1 );

        // ypoints
        for ( var i = 0; i < this.n; i++ ){
            var index = i * 3
            // xyz top vertices
            this.positions[ index + 0 ] = step * i - this.length / 2; // x
            this.positions[ index + 1 ] = this.height; // y
            this.positions[ index + 2 ] = 0; // z
        } // verts 0 -> n - 1

        for ( var i = 0; i < this.n; i++ ){
            var index = i * 3 + this.n * 3;
            // xyz bottom vertices
            this.positions[ index + 0 ] = i * step - this.length / 2 ;
            this.positions[ index + 1 ] = 0 ;
            this.positions[ index + 2 ] = 0;
        } // verts n -> 2n - 1


        var indicesArray = [];

        for ( var i = 0; i < ( this.n - 1) ; i ++ ){
            indicesArray.push( i );
            indicesArray.push( i + this.n );
            indicesArray.push( i + this.n + 1);

            indicesArray.push( i );
            indicesArray.push( i + 1 + this.n );
            indicesArray.push( i + 1 );
        }

        this.geom.setIndex( new THREE.BufferAttribute( new Uint16Array( indicesArray ), 1 ));
    }
}