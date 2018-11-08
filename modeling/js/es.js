function gaussian( mu = 0, sigma = 1){
    var u = 0;
    var v = 0;

    while( u == 0 ){
        u = Math.random();
    }
    while( v == 0 ){
        v = Math.random();
    }

    var ans = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    return ans * sigma + mu;
}

esVertexShader = `

    varying vec3 pout;
    void main(){
        pout = ( modelMatrix * vec4( position, 1.0 ) ).xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`

esFragmentShader = `
    varying vec3 pout;

    const highp vec4 color1 = vec4( 1.0 , 0.2, 0.0, 1.0 );
    const highp vec4 color2 = vec4( 0.0 , 0.2, 1.0, 1.0 );

    void main(){
        float interValue = ( pout.y + 4.0 ) / 8.0;
        gl_FragColor = color1 * interValue + color2 * ( 1.0 - interValue );
    }
`

class ESIndividual {
    constructor( x, y ){
        this.x = x;
        this.y = y;
        this.fitness = 0;
    }

    createChild( sigma1, sigma2 ){
        var childX = gaussian( this.x, sigma1 );
        var childY = gaussian( this.y, sigma2 );

        return new ESIndividual( childX, childY );
    }

    setFitness( fit ){
        this.fitness = fitness;
    }

    static compare( indv1, indv2 ){
        if ( indv1.fitness > indv2.fitness ){
            return -1;
        } else {
            return 1;
        }
    }

}

class ES extends SuperModel {
    constructor( scene, params={} ){
        super( scene );
        this.timer = 0.0;
        this.pause = false;

        this.instructionString = `Visualization of ES algorithms on different functions. Green dots represent the
                                  current population. The orange dot represents the best solution found so far.
                                 `;

        this.modalContent = `Evolutionary Strategies (ES) is an evolutionary optimization method.
                             At each iteration of the algorithm, the individuals, represented by
                             the green dots, produced mutant offspring normaly distributed using variance
                             sigma1 and sigma2. Individuals who are more fit are more likely to produce
                             offspring. Thus the population climbs the peaks of the objective functions`; 
        this.N = 150;
        this.xySize = 10;
        this.maxLimit = 5;
        this.minLimit = -5;

        this.bestFound = null;

        this.populationSize = 40;
        this.sigma1 = 0.1;
        this.sigma2 = 0.1;

        this.population = [];
        this.populationMeshes = [];

        this.minValue = 0.0;
        this.maxValue = 1.0;

        this.functionDictionary = { "X + Y": this.xPlusY,
                                    "X * Y": this.xTimesY,
                                    "Rastrigin": this.rastrigin,
                                    "Ackley" : this.ackley,
                                    "Rosenbrock": this.rosenbrock
                                  };
        var names = [ "X + Y", "X * Y", "Rastrigin", "Ackley" ];

        this.currentFunction = "X + Y";
        
        this.reproductionSize = 100;
        this.speed = 1.0;

        this.zscale = 0.5;
        this.xyscale = 1.0;

        this.ups = 10;

        // init mesh
        var geometry = new THREE.PlaneGeometry( this.xySize,
                                                this.xySize,
                                                this.N,
                                                this.N);

        var material = new THREE.ShaderMaterial( {
                                    vertexShader: esVertexShader,
                                    fragmentShader: esFragmentShader,
                                    side: THREE.DoubleSide,
                                    // wireframe: true
                                    wireframe: false
                                });
        this.functionCurve = new THREE.Mesh( geometry, material );
        this.functionCurve.rotation.x = -Math.PI / 2.0;
        this.addMesh( scene, this.functionCurve );

        this.updateMeshFromFunction();
        this.needsupdate = false;

        this.restart = this.initPopulation;
        this.togglePause = function() { this.pause = !this.pause };
        // add gui options
        this.gui.add( this, "restart" );
        this.gui.add( this, "togglePause" );
        var controller = this.gui.add( this, "currentFunction", names );
        this.gui.add( this, "ups" ).min( 1 ).max( 50 ).step( 1 );
        this.gui.add( this, "sigma1" ).min( 0 ).max( 1.0 ).step( 0.01 );
        this.gui.add( this, "sigma2" ).min( 0 ).max( 1.0 ).step( 0.01 );
        controller.onFinishChange( (e) => { this.guiNeedsUpdate( e ) } );

        var ballGeom = new THREE.SphereGeometry( 0.15, 20, 20 );
        var ballMaterial = new THREE.MeshLambertMaterial( {color: 0x00ff00 } );
        for ( var i = 0; i < this.populationSize; i++ ){
            var ballMesh = new THREE.Mesh( ballGeom, ballMaterial );

            this.addMesh( scene, ballMesh );
            this.populationMeshes.push( ballMesh );
        }

        document.getElementById( 'model-div' ).style.display = 'inline-block';
        this.bestMesh = new THREE.Mesh( ballGeom, new THREE.MeshLambertMaterial( { color: 0xf05011 } ) );
        this.addMesh( scene, this.bestMesh );
        this.bestMesh.visible = false;

        this.initPopulation();

    }

    guiNeedsUpdate( e ){
        this.needsupdate = true;
    }

    animate( scene, camera, dt ){
        super.animate( scene, camera, dt );
        if ( this.needsupdate ){
            this.updateMeshFromFunction();
            this.needsupdate = false;
        }


        this.timer += dt;
        if ( this.timer > 1.0 / this.ups ){
            this.timer = 0.0;
            if ( !this.pause ) {
                this.runEvoStep();
            }
            // draw population meshes
            for ( var i = 0; i < this.populationMeshes.length; i++ ){
                var x = this.population[i].x;
                var y = this.population[i].y;
                var z = this.population[i].fitness
                this.populationMeshes[i].position.set( x, z, y );
            }

            var modelDiv = document.getElementById( 'model-div' );

            if ( this.bestFound != null ){
                this.bestMesh.position.set( this.bestFound.x,
                                            this.bestFound.fitness,
                                            this.bestFound.y );

                modelDiv.innerHTML = '<p align="left"> Best found:<br /> ' + 
                     '( ' +
                     this.bestFound.x.toFixed( 2 ) + ', ' +
                     this.bestFound.y.toFixed( 2 ) + ' ) </p>';
                this.bestMesh.visible = true;
            } else {
                this.bestMesh.visible = false;
                modelDiv.innerHTML = '';
            }

        }
    }

    runEvoStep( ){
        var children = this.spawnChildren();

        children.sort( ESIndividual.compare );

        this.population = children.slice(0, this.population.length);

        var bestChild = this.population[0];
        if ( this.bestFound == null ){
            this.bestFound = new ESIndividual( bestChild.x, bestChild.y );
            this.bestFound.fitness = bestChild.fitness;
        }

        if ( ESIndividual.compare( bestChild, this.bestFound ) < 0 ){
            this.bestFound.x = bestChild.x;
            this.bestFound.y = bestChild.y;
            this.bestFound.fitness = bestChild.fitness;
        }
    }

    tournamentSelect( k=2 ){
        var i = Math.floor( Math.random() * this.population.length );
        var j = Math.floor( Math.random() * this.population.length );

        var which = ESIndividual.compare( this.population[i], this.population[j] );
        console.log( )
        if ( which == 1 ){
            return j;
        } else {
            return i;
        }
        // var fit1 = this.population[i].fitthis.getFunctionValue( this.population[i].x, this.population[i].y );
        // var fit2 = this.getFunctionValue( this.population[j].x, this.population[j].y );

        // if ( fit1 < fit2 ){
        //     return j;
        // } else {
        //     return i;
        // }
    }

    spawnChildren(){
        var lambda = 100;
        var children = [];

        for ( var i = 0; i < lambda; i++ ){
            // pick parent
            var index = this.tournamentSelect();
            // mutate parent
            var parent = this.population[index];

            var child = parent.createChild( this.sigma1, this.sigma2 );

            // var childX = gaussian( parent.x, this.sigma1 );
            // var childY = gaussian( parent.y, this.sigma2 );

            child.x = Math.max( this.minLimit, Math.min( this.maxLimit, child.x ) );
            child.y = Math.max( this.minLimit, Math.min( this.maxLimit, child.y ) );

            child.fitness = this.getFunctionValue( child.x, child.y );
            // append child
            children.push( child );
        }

        return children;
    }


    initPopulation(){
        this.bestFound = null;
        this.population = []
        for ( var i = 0; i < this.populationSize; i++ ){
            this.population.push( new ESIndividual( Math.random() * 8.0 - 4.0,
                                                    Math.random() * 8.0 - 4.0)
                                );
            this.population[i].fitness = this.getFunctionValue( this.population[i].x, this.population[i].y );
        }
    }

    updateMeshFromFunction(){
        this.bestFound = null;

        var x, y;
        var values = [];
        for ( var i = 0; i < this.N + 1; i++ ){
            x = i * this.xySize / this.N - this.xySize / 2;
            for ( var j = 0; j < this.N + 1; j++ ){
                y = j * this.xySize / this.N - this.xySize / 2;
                //values.push( this.rastrigin( x, y ) );
                values.push( this.functionDictionary[ this.currentFunction ]( x, y ) );
                // console.log( i, j, x, y, x + y );
                // this.functionCurve.geometry.vertices[i * this.N + j].z = ( x * y ) * this.zscale;
            }
        }

        // squash so that min is at -4, max is at +4
        this.minValue = Math.min(...values);
        this.maxValue = Math.max(...values);

        for ( var i = 0; i < values.length; i++ ){
            var squashedValue;
            if ( this.maxValue !== this.minValue ){
                squashedValue = ( values[i] - this.minValue ) / ( this.maxValue - this.minValue ) * 8.0 - 4.0
            } else {
                squashedValue = 0;
            }
            
            this.functionCurve.geometry.vertices[i].z = squashedValue;
            // this.functionCurve.geometry.vertices[i].z = this.getFunctionValue( x, y )
        }

        this.functionCurve.geometry.verticesNeedUpdate = true;
        this.functionCurve.geometry.elementsNeedUpdate = true;
    }

    xPlusY( x, y ){
        return x + y;
    }

    xTimesY( x, y ){
        return x * y;
    }

    rastrigin( x, y ){
        return - ( 20.0 + x * x - 10 * Math.cos( 2 * Math.PI * x ) + y * y - 10 * Math.cos( 2 * Math.PI * y ) );
    }

    getFunctionValue( x, y ){
        var realValue = this.functionDictionary[ this.currentFunction ]( x, y );

        if ( this.maxValue !== this.minValue ){
            return ( realValue - this.minValue ) / ( this.maxValue - this.minValue ) * 8.0 - 4.0;
        } else {
            return 0;
        }
    }

    ackley( x, y ){
        return - ( -20 * Math.exp( - 0.2 * Math.sqrt( 0.5 * ( x * x + y * y ) ) ) - Math.exp( 0.5 * ( Math.cos( 2 * Math.PI * x ) * Math.cos( 2 * Math.PI * y ) ) ) + Math.E + 20.0 );
    }

    rosenbrock( x, y, a = 1, b = 10 ){
        return - ( ( a - x ) * ( a - x ) + b * ( y - x * x ) * ( y - x * x ) );
    }
}