
class Water2D extends SuperModel{
    constructor( scene, n = 100, length = 10, height = 1.0, k = 0.01,
                 damping = 0.025, spread = 0.01, passes = 8 ){
        super( scene );
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
        this.passes = passes
        // init water mesh
        var geom = new THREE.BufferGeometry();
        geom.dynamic = true;
        geom.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array ( this.n * 2 * 3 ), 3 ) );
        geom.setIndex( new Float32Array( ( this.n - 1 * 2 ) * 3 ) );

        var material = new THREE.MeshBasicMaterial( { color: "#0055d0", side: THREE.DoubleSide } );
        this.waterMesh = new THREE.Mesh( geom, material );

        this.positions = geom.attributes.position.array;
        this.velocities = new Float32Array( this.n );
        this.leftDeltas = new Float32Array( this.n );
        this.rightDeltas = new Float32Array( this.n );

        // init positions
        this.initPositions( geom );

        
        this.addMesh( scene, this.waterMesh );

        this.pause = false;
        this.togglePause = function(){ this.pause = !this.pause };
        this.reset = this.initPositions;
        // gui
        this.gui.add( this, "togglePause" );
        this.gui.add( this, "reset" );
        this.gui.add( this, "k" ).min( 0.0 ).max( 1.0 ).step( 0.01 );
        this.gui.add( this, "spread" ).min( 0 ).max( 1.0 ).step( 0.01 );
        this.gui.add( this, "damping" ).min( 0 ).max( 1.0 ).step( 0.01 );
        this.gui.add( this, "passes" ).min( 1 ).max( 10 ).step( 1.0 );
    }

    animate ( scene, camera, dt ){
        super.animate( scene, camera, dt );
        this.time += dt;

        if ( !this.pause ){
            // update mesh
            this.positions[1] = Math.sin( this.time ) + 1.0;
            this.updatePositions( dt );

            this.waterMesh.geometry.attributes.position.needsUpdate = true;           
        }
    }

    initPositions( ){
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

        this.waterMesh.geometry.setIndex( new THREE.BufferAttribute( new Uint16Array( indicesArray ), 1 ));

        this.velocities = new Float32Array( this.n );
        this.leftDeltas = new Float32Array( this.n );
        this.rightDeltas = new Float32Array( this.n );

        this.waterMesh.geometry.attributes.position.needsUpdate = true;
        this.time = 0;
    }

    updatePositions( dt ){
        // for ( var i = 0; i < this.n; i++ ){
        //     // index of y positions
        //     this.positions[1 + i * 3 ] = this.height + 0.5 * Math.cos( this.time + 4 * i / this.n );
        // }

        for ( var i = 0; i < this.n; i++ ){
            var xDiff = this.positions[ 1 + i * 3 ] - this.height;
            var acc = -this.k * xDiff * dt - this.damping * this.velocities[i];

            this.positions[ 1 + i * 3 ] += this.velocities[i] * dt;
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
}
