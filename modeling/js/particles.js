class ParticleCannon extends SuperModel{
    constructor( scene ){
        super( scene )
        this.firerate = 5.0;
        this.time = 0.0;
        this.velocity = 5.0;

        var geom = new THREE.BoxGeometry();
        geom.applyMatrix( new THREE.Matrix4().makeTranslation( 0.5, 0, 0 ) );
        var material = new THREE.MeshStandardMaterial( { color: 0x000000 } );

        this.theta = 0.0;
        this.heading = 0.0;
        this.pitch = 0.0;


        this.cannon = new THREE.Mesh( geom, material );

        this.cannon.scale.set( 1, 0.2, 0.2 );
        this.cannon.position.set( 0, -4.9, 0 );
        this.cannon.rotation.set( this.theta, this.heading, this.pitch );

        this.gui.add( this, 'pitch' ).min( 0 ).max( 90 ).step( 1 ).listen();
        this.gui.add( this, 'heading' ).min( 0 ).max( 360 ).step( 1 ).listen();
        this.gui.add( this, 'firerate' ).min( 1 ).max( 10 ).step( 1 ).listen();
        this.gui.add( this, 'velocity' ).min( 0 ).max( 100 ).step( 0.1 ).listen();

        this.addMesh( scene, this.cannon );

        this.particles = [];

    }

    animate( scene, camera, dt ){
        this.time += dt;
        var fireParticle = false;
        
        if ( this.time > 1.0 / this.firerate ){
            this.time = 0.0;
            if ( this.particles.length < 1000 ){
                this.fireParticle( scene );
            }
        }

        // console.log( this.keyState['KeyA'] )
        if ( this.keyState['KeyA'][0] === true ){
            this.heading += 1;
        }

        if ( this.keyState['KeyD'][0] === true ){
            this.heading -= 1;
        }

        if ( this.keyState['KeyW'][0] === true ){
            this.pitch += 1;
        }

        if ( this.keyState['KeyS'][0] === true ){
            this.pitch -= 1;
        }

        if ( this.keyState['KeyE'][0] === true ){
            this.velocity += 1;
        }

        if ( this.keyState['KeyQ'][0] === true ){
            this.velocity -= 1;
        }

        if ( this.pitch < 0 ){
            this.pitch = 0;
        }

        if ( this.pitch > 90 ){
            this.pitch = 90;
        }

        if ( this.heading < 0 ){
            this.heading += 360;
        }

        if ( this.velocity > 100 ){
            this.velocity = 100;
        }

        if ( this.velocity < 0 ){
            this.velocity = 0;
        }

        this.heading = this.heading % 360;
        
        this.cannon.rotation.set( this.theta, this.heading / 180 * Math.PI,
                                                this.pitch / 180 * Math.PI );

        var toDelete = [];

        for( var i = 0; i < this.particles.length; i++ ){
            var particle = this.particles[i];

            particle.velocity.y -= 9.8 * dt;

            var bounce = 0.1;

            if ( particle.position.y < -5 ){
                particle.position.y = -5;
                particle.velocity.y = -particle.velocity.y * bounce;
            }

            if ( particle.position.x > 10 ){
                particle.position.x = 10;
                particle.velocity.x = -particle.velocity.x * bounce;
            }

            if ( particle.position.x < -10 ){
                particle.position.x = -10;
                particle.velocity.x = -particle.velocity.x * bounce;
            }

            if ( particle.position.z > 10 ){
                particle.position.z = 10;
                particle.velocity.z = -particle.velocity.z * bounce;
            }

            if ( particle.position.z < -10 ){
                particle.position.z = -10;
                particle.velocity.z = -particle.velocity.z * bounce;
            } 


            particle.position.set( particle.position.x + particle.velocity.x * dt,
                                   particle.position.y + particle.velocity.y * dt,
                                   particle.position.z + particle.velocity.z * dt);

            particle.lifetime -= dt;
            if ( particle.lifetime < 0 ){
                toDelete.push( i );
            }       
        }

        for( var i = toDelete.length - 1; i > 0; i-- ){
            var index = toDelete[i];
            this.removeMesh( scene, this.particles[index] )
            this.particles.splice( index, 1 );
        }

    }

    fireParticle( scene ){
        var off = Math.cos( this.pitch / 180 * Math.PI );
        var x = Math.cos( this.heading / 180 * Math.PI ) * this.velocity * off;
        var y = Math.sin( this.pitch / 180 * Math.PI )   * this.velocity;
        var z = -Math.sin( this.heading / 180 * Math.PI )   * this.velocity * off;


        var particle = new THREE.Mesh( new THREE.SphereGeometry( 1 ),
                                       new THREE.MeshBasicMaterial( { color : 0x00ff00 } ) );
        particle.velocity = new THREE.Vector3( x, y , z );
        particle.scale.set( 0.1, 0.1, 0.1 );
        particle.position.set( this.cannon.position.x + x / this.velocity,
                               this.cannon.position.y + y / this.velocity,
                               this.cannon.position.z + z / this.velocity );
        particle.lifetime = 30.0;

        this.addMesh( scene, particle );
        // var particle = {
        //     position: new THREE.Vector3( 0, 0, 0 ),
        //     velocity: new THREE.Vector3( x, y, z ),
        //     mass: 1.0,
        //     diameter: 0.01,
        // };

        this.particles.push( particle );
    }
}