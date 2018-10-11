
class ES extends SuperModel {
    constructor( scene, params={} ){
        super( scene );
        this.instructionString = `Visualization of ES algorithms on benchmarks
                                 `
        this.N = 50;
        this.xySize = 10;

        this.functionDictionary = { "X + Y": this.xPlusY,
                                    "X * Y": this.xTimesY
                                  }
        this.currentFunction = "X + Y";
        this.populationSize = 10;
        this.reproductionSize = 100;
        this.speed = 1.0;

        this.zscale = 0.5;
        this.xyscale = 1.0;

        // init mesh
        var geometry = new THREE.PlaneGeometry( this.xySize,
                                                this.xySize,
                                                this.N,
                                                this.N);

        var material = new THREE.MeshLambertMaterial( { color: 0xff0000,
                                                    side: THREE.DoubleSide,
                                                    wireframe: true,
                                                    transparent: true,
                                                    opacity: 1.0,
                                                    });

        this.functionCurve = new THREE.Mesh( geometry, material );

        this.updateMeshFromFunction();
        this.functionCurve.rotation.x = -Math.PI / 2;
        this.addMesh( scene, this.functionCurve );

        this.gui.add( this, "zscale" ).min( 0.01 ).max( 2 ).step( 0.01 );
    }

    animate( scene, camera, dt ){
        super.animate( scene, camera, dt );

    }

    runEvoStep( ){
        
    }

    updateMeshFromFunction(){
        var x, y;
        var values = [];
        for ( var i = 0; i < this.N + 1; i++ ){
            x = i * this.xySize / this.N - this.xySize / 2;
            for ( var j = 0; j < this.N + 1; j++ ){
                y = j * this.xySize / this.N - this.xySize / 2;
                values.push( this.rastrigin( x, y ) );
                // console.log( i, j, x, y, x + y );
                // this.functionCurve.geometry.vertices[i * this.N + j].z = ( x * y ) * this.zscale;
            }
        }

        // squash so that min is at -4, max is at +4
        var minValue = Math.min(...values);
        var maxValue = Math.max(...values);

        for ( var i = 0; i < values.length; i++ ){
            var squashedValue;
            if ( maxValue !== minValue ){
                squashedValue = ( values[i] - minValue ) / ( maxValue - minValue ) * 8.0 - 4.0
            } else {
                squashedValue = values[i];
            }
            
            this.functionCurve.geometry.vertices[i].z = squashedValue;
            // this.functionCurve.geometry.
        }
    }

    xPlusY( x, y ){
        return x + y;
    }

    xTimesY( x, y ){
        return x * y;
    }

    rastrigin( x, y ){
        return 20.0 + x * x - 10 * Math.cos( 2 * Math.PI * x ) + y * y - 10 * Math.cos( 2 * Math.PI * y );
    }
}