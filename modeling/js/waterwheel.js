
class WaterWheel extends SuperModel {
    constructor( scene ){
        super( scene );
        this.nCups = 8;
        this.wheelAngle = 0;
        this.wheelRadius = 5;
        this.wheelAngularVelocity = 0.01;

        this.cups = [];
        this.waterLevels = [];

        this.particles = [];
        this.maxParticles = 1000;

        this.faucetY = 10.0;
        this.faucetX = 0.0;
        this.faucetZ = 0.0;
        this.faucetrate = 0.1;
        this.cuprate = 0.09;
        this.maxFlow = 1.0;

        this.freeParticles = [];

        this.ups = 60.0;
        this.time = 0.0;

        this.particlesToRelease = [];
        this.gui.add( this, 'pause' );
        this.gui.add( this, 'ups' ).min( 1 ).max( 60 ).step( 1 );
        this.gui.add( this, 'faucetX' ).min( -5 ).max( 5 ).step( 0.01 ).listen();
        this.gui.add( this, 'faucetrate' ).min( 0.0 ).max( this.maxFlow ).step( 0.01 ).listen();
        this.gui.add( this, 'cuprate' ).min( 0.0 ).max( 1 ).step( 0.01 ).listen();
        
        this.volumeScale = 0.05;

        this.particleMeshes = [];

        this.initParticles( scene );
        this.initCups( scene );

        this.first = true;
    }

    getParticleSize( particle, mass ){
        var size = Math.cbrt( mass ) * this.volumeScale;
        particle.scale.set( size, size, size );
    }

    absorbParticle( cup, particle ){
        cup.mass += particle.mass;
    }

    releaseParticle( particle ){
        this.freeParticles.push( particle );
    }
    releaseParticleFromFaucet(){
        if ( this.faucetrate <= 0 ){
            return;
        }

        var particle = this.createParticle( this.faucetX, this.faucetY, this.faucetZ,
                                            0, 0, 0, this.faucetrate);
        // this.particlesToRelease.push( particle );
        this.releaseParticle( particle );
    }

    releaseParticleFromCup( cup ){

        if ( this.cuprate <= 0 ){
            return;
        }

        if ( cup.mass <= 0.000001 ){
            return;
        }

        // var x = cup.position.x;
        // var y = cup.position.y - 0.5;
        // var z = cup.position.z;

        var vx = cup.velocity.x;
        var vy = cup.velocity.y;
        var vz = cup.velocity.z;

        var mass = Math.min( cup.mass, this.cuprate );
        var radius = cup.diameter / 2.0;
        if ( cup.holes == 1 ){
            radius = 0;
        }

        for ( var i = 0; i < cup.holes; i++ ){
            var theta = Math.PI * 2 * i / cup.holes;
            var x = cup.position.x + Math.cos( theta ) * radius;
            var y = cup.position.y - 0.5;
            var z = cup.position.z + Math.sin( theta ) * radius;

            var pMass = mass / cup.holes;

            var particle = this.createParticle( x, y, z, vx, vy, vz, pMass );
            this.releaseParticle( particle );
        }
        

        cup.mass -= mass;
        if ( cup.mass < 0 ){
            cup.mass = 0;
        }
    }

    animate( scene, camera, dt ){

        if ( this.keyState['KeyA'][0] == true ){
            this.faucetX -= 0.1;
        }

        if ( this.keyState['KeyD'][0] == true ){
            this.faucetX += 0.1;
        }

        if ( this.keyState['KeyW'][0] == true ){
            this.faucetrate += 0.01;
        }

        if ( this.keyState['KeyS'][0] == true ){
            this.faucetrate -= 0.01;
        }

        if ( this.keyState['KeyQ'][0] == true ){
            this.cuprate -= 0.01;
        }

        if ( this.keyState['KeyE'][0] == true ){
            this.cuprate += 0.01;
        }

        if ( this.faucetX > 5 ){
            this.faucetX = 5.0;
        } else if ( this.faucetX < -5.0 ){
            this.faucetX = -5.0;
        }

        if ( this.faucetrate > 1.0 ){
            this.faucetrate = 1.0;
        } else if ( this.faucetrate < 0.0 ){
            this.faucetrate = 0.0;
        }

        if ( this.cuprate > 1.0 ){
            this.cuprate = 1.0;
        } else if ( this.cuprate < 0.0 ){
            this.cuprate = 0.0;
        }


        if ( this.pause ){
            return;
        }


        this.time += dt;
        if ( this.time < 1 / this.ups ){
            return;
        } else {
            this.time = 0.0;
        }

        var particlesToRemove = [];

        for ( var i = 0; i < this.freeParticles.length; i++ ){
            var particle = this.freeParticles[i];
            particle.velocity.y -= 9.8 * dt;
            particle.position.addScaledVector( particle.velocity, dt );

            var particleAbsorbed = false;

            // collide with cups
            for ( var j = 0; j < this.cups.length; j++ ){
                var cup = this.cups[j];
                if ( Math.abs( particle.position.x - cup.position.x ) > cup.diameter ||
                     Math.abs( particle.position.z - cup.position.z ) > cup.diameter ){
                    continue;
                }

                if ( particle.position.y < cup.position.y && particle.position.y > cup.position.y - 0.4 ){
                    this.absorbParticle( cup, particle );
                    particleAbsorbed = true;
                    break;
                }
            }

            if ( particle.position.y < -5.0 || particleAbsorbed == true ){
                particlesToRemove.push( i );
            }
        }

        for ( var i = particlesToRemove.length - 1; i >= 0; i-- ){
            this.freeParticles.splice( particlesToRemove[i], 1 );
        }

        this.releaseParticleFromFaucet();

        // accumulate force due to weight
        var centerOfMass = new THREE.Vector3();
        var totalMass = 0;

        for ( var i = 0; i < this.cups.length; i++ ){
            centerOfMass.addScaledVector( this.cups[i].position, this.cups[i].mass );
            totalMass += this.cups[i].mass;
        }
        // average forces
        centerOfMass.multiplyScalar( this.cups.length );
        centerOfMass.y -= 1.0;

        var r = centerOfMass.length();
        var theta = Math.atan2( centerOfMass.x, centerOfMass.y );

        var torque = -r * 0.001 * Math.sin(theta)
        // centerOfMass.y -= 1.0;

        this.wheelAngularVelocity += torque * dt;
        this.wheelAngle += this.wheelAngularVelocity * dt;

        if ( this.wheelAngle > Math.PI * 2 ){
            this.wheelAngle -= Math.PI * 2;
        }

        if ( this.wheelAngle < 0 ){
            this.wheelAngle += Math.PI * 2;
        }

        for ( var i = 0; i < this.cups.length; i++ ){
            // release particle
            this.releaseParticleFromCup( this.cups[i] );

            // get force of each cup
            var theta = 2 * Math.PI * i / this.nCups + this.wheelAngle;

            this.cups[i].position.set( Math.cos( theta ) * this.wheelRadius,
                                       Math.sin( theta ) * this.wheelRadius + 1.0,
                                       0.0 );
        }

        for ( var i = 0; i < this.freeParticles.length; i++ ){
            this.particleTranslation[ i * 3 ] = this.freeParticles[i].position.x;
            this.particleTranslation[ i * 3 + 1 ] = this.freeParticles[i].position.y;
            this.particleTranslation[ i * 3 + 2 ] = this.freeParticles[i].position.z;

            this.particleScale[i] = this.freeParticles[i].diameter;
        }


        this.particleMesh.geometry.attributes.translation.needsUpdate = true;
        this.particleMesh.geometry.attributes.scale.needsUpdate = true;

        this.particleMesh.material.uniforms.discardAbove.value = this.freeParticles.length;
        this.particleMesh.material.uniforms.discardAbove.needsUpdate = true;
    }

    initCups( scene ){
        var geometry = new THREE.CylinderGeometry( 1, 1, 1,
                                                   32, 1, true );
        var material = new THREE.MeshBasicMaterial( { color: 0xf05044,
                                                      side: THREE.DoubleSide } );

        var waterGeometry = new THREE.CylinderGeometry( 1, 1, 1, 32 );
        var waterMaterial = new THREE.MeshBasicMaterial( { color: 0x1030f0 } );
        
        for ( var i = 0; i < this.nCups; i++ ){

            // create cups in a wheel
            var cup = new THREE.Mesh( geometry, material );
            cup.mass = 0;
            cup.flowrate = this.cuprate;
            var theta = 2 * Math.PI * i / this.nCups;
            cup.position.set( Math.cos( theta ) * this.wheelRadius,
                              Math.sin( theta ) * this.wheelRadius + 1.0,
                              0.0 );
            cup.holes = 3;
            cup.diameter = 0.5;
            cup.velocity = new THREE.Vector3();
            cup.waterLevel = this.volumeScale * cup.mass / ( cup.diameter * cup.diameter );
            cup.scale.set( cup.diameter, 1.0, cup.diameter );
            this.addMesh( scene, cup );

            // create water level
            var waterMesh = new THREE.Mesh( waterGeometry, waterMaterial );
            waterMesh.position.set( Math.cos( theta ) * this.wheelRadius, 
                                    Math.sin( theta ) * this.wheelRadius - 0.5,
                                    0.0 );
            waterMesh.scale.set( cup.diameter, 0.001, cup.diameter );
            this.addMesh( scene, waterMesh );
            this.waterLevels.push( waterMesh );
            waterMesh.visible = false;
            this.cups.push( cup );
        }
    }

    createParticle( x, y, z, vx, vy, vz, mass){

        var particle = {
            position: new THREE.Vector3( x, y , z ),
            velocity: new THREE.Vector3( vx, vy, vz ),
            mass: mass,
            diameter: Math.cbrt( mass ) * this.volumeScale,
        };

        return particle;
    }

    initParticles( scene ){

        var particleVertexShader = `
            precision highp float;
            uniform mat4 modelViewMatrix;
            uniform mat4 projectionMatrix;

            attribute vec3 position;

            attribute vec3 translation;
            attribute float scale;
            attribute float instanceID;

            vec3 vPosition;
            varying float vIndex;

            void main(){
                vPosition = position * scale + translation;
                vIndex = instanceID;

                gl_Position = projectionMatrix * modelViewMatrix * vec4( vPosition, 1.0 );
            }
        `

        var particleFragmentShader = `
            precision highp float;
            uniform vec3 color;

            varying float vIndex;
            uniform int discardAbove;

            void main(){    
                if ( vIndex >= float( discardAbove ) ){
                    discard;
                }
                gl_FragColor = vec4( color, 1.0 );
            }
        `

        var instanceGeometry = new THREE.InstancedBufferGeometry();
        var sphereGeometry = new THREE.SphereBufferGeometry( 1 );

        this.particleTranslation = new Float32Array( this.maxParticles * 3 );
        this.particleScale = new Float32Array( this.maxParticles );
        var index = new Float32Array( this.maxParticles );
        for ( var i = 0; i < this.maxParticles; i++ ){
            this.particleTranslation[i * 3] = this.faucetX;
            this.particleTranslation[i * 3 + 1] = 10.0;
            this.particleTranslation[i * 3 + 2 ] = 0.0;
        }
        for ( var i = 0; i < this.maxParticles; i++ ){
            this.particleScale[i] = Math.cbrt( this.flowrate ) * this.volumeScale;
            index[i] = i;
        }

        instanceGeometry.index = sphereGeometry.index;
        instanceGeometry.attributes.position = sphereGeometry.attributes.position;

        instanceGeometry.addAttribute( 'translation', new THREE.InstancedBufferAttribute( this.particleTranslation, 3, true ) );
        instanceGeometry.addAttribute( 'scale', new THREE.InstancedBufferAttribute( this.particleScale, 1, true ) );
        instanceGeometry.addAttribute( 'instanceID', new THREE.InstancedBufferAttribute( index, 1, true ) );

        var material = new THREE.RawShaderMaterial( {
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                         color: { value : new THREE.Vector3( 0.1, 0.3, 1.0 ) },
                         discardAbove: { value : 1 },
                       },
            visible: true,
        } );

        this.particleMesh = new THREE.Mesh( instanceGeometry, material );

        this.addMesh( scene, this.particleMesh );

        // instanceGeometry.attributes.uv = 
        // // replace with instance rendering
        // var geometry = new THREE.SphereGeometry( 1 );
        // var material = new THREE.MeshBasicMaterial( { color: 0x1030f0 } );

        // for ( var i = 0; i < this.MAX_PARTICLES; i++ ){
        //     var mesh = new THREE.Mesh( geometry, material );

        //     mesh.visible = false;
        //     this.addMesh( scene, mesh );
        //     this.particleMeshes.push( mesh );
        // }
    }
}