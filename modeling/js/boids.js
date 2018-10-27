
class Boids extends SuperModel{
    constructor( scene ){
        super( scene );

        this.boids = [];
        // this.boidMeshes = [];
        this.perceptionMeshes = [];

        // this.scaleX = 1.0;
        // this.scaleY = 1.0;
        // this.scaleZ = 1.0;

        // this.gui.add( this, 'scaleX' ).min( 0.1 ).max( 2.0 ).step( 0.1 );
        // this.gui.add( this, 'scaleY' ).min( 0.1 ).max( 2.0 ).step( 0.1 );
        // this.gui.add( this, 'scaleZ' ).min( 0.1 ).max( 2.0 ).step( 0.1 );
        this.gui.add( this, 'pause' );

        this.time = 0;

        this.addBoid( scene, Math.PI / 2.0 );
    }

    animate( scene, camera, dt ){
        if ( !this.pause ){
            this.time += dt;

            var xUnitVector = new THREE.Vector3( 1, 0, 0 );

            for ( var i = 0; i < this.boids.length; i++ ){
                this.boids[i].position.addScaledVector( this.boids[i].velocity, dt );
                var direction = this.boids[i].velocity.clone();
                direction.normalize();
                var quaternion = new THREE.Quaternion();
                quaternion.setFromUnitVectors( xUnitVector, direction );

                this.boids[i].mesh.setRotationFromQuaternion( quaternion );
                this.boids[i].mesh.position.set( this.boids[i].position.x,
                                                 this.boids[i].position.y,
                                                 this.boids[i].position.z );
                this.boids[i].perceptionLine.position.set(
                                                 this.boids[i].position.x,
                                                 this.boids[i].position.y,
                                                 this.boids[i].position.z );

                this.boids[i].perceptionLine.setRotationFromQuaternion( quaternion );

                this.boids[i].perceptionLine.scale.set( this.boids[i].perceptionRadius,
                                                        this.boids[i].perceptionRadius,
                                                        this.boids[i].perceptionRadius);

                this.boids[i].velocity.x = Math.cos( this.time );
                this.boids[i].velocity.y = Math.sin( this.time );
                this.boids[i].velocity.z = Math.cos( 2 * this.time );
            }
        }
    }

    addBoid( scene, perceptionAngle = 3.0 * Math.PI / 2.0, perceptionRadius = 4.0 ){
        var boidGeom = this.createBoidGeometry();
        var boidMaterial = new THREE.MeshStandardMaterial( { color : 0x00ff00 } );
        var boidMesh = new THREE.Mesh( boidGeom, boidMaterial );

        var perceptionGeom = this.createPerceptionGeometry( perceptionAngle );
        var perceptionMaterial = new THREE.LineBasicMaterial( { color : 0xff0000 } );
        var perceptionLine = new THREE.Line( perceptionGeom, perceptionMaterial );

        var boid = {
            position : new THREE.Vector3( 0, 0, 0 ),
            // direction : new THREE.Vector3( 1, 0, 0 ),
            velocity : new THREE.Vector3( 1, 0, 0 ),
            perceptionRadius : perceptionRadius,
            perceptionAngle : perceptionAngle,
            mesh : boidMesh,
            perceptionLine : perceptionLine
        }

        this.addMesh( scene, boidMesh );
        this.addMesh( scene, perceptionLine );
        this.boids.push( boid );
    }

    createPerceptionGeometry( theta, n = 30 ){

        var geometry = new THREE.Geometry();

        // center point
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        var startAngle = -theta / 2;
        var dTheta = theta / ( n - 1 );

        for ( var i = 0; i < n; i++ ){
            var angle = startAngle + dTheta * i;
            var xPos = Math.cos( angle );
            var yPos = Math.sin( angle );
            var zPos = 0;
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
        }
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        for ( var i = 0; i < n; i++ ){
            var angle = startAngle + dTheta * i;
            var xPos = Math.cos( angle );
            var yPos = 0;
            var zPos = Math.sin( angle );
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
        }
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        return geometry;
    }


    createBoidGeometry( n = 6, puffyness = 0.5 ){
        var geometry = new THREE.Geometry();

        // center point == 0
        geometry.vertices.push( new THREE.Vector3( 0, 0, 0 ) );

        // nose point == 1
        geometry.vertices.push( new THREE.Vector3( 0.5, 0, 0 ) );

        const pos1 = 0.5;
        const pos2 = 0.3;

        var m = 2 * n; 
        // geometry.vertices.push( new THREE.Vector3( -0.5, 0, 0.5 ) );
        // tail points [2, n + 2)
        for ( var i = 0; i < m; i++ ){
            const angle = ( i / m ) * 2 * Math.PI;
            var xPos = -pos1;
            var radius = pos1;
            if ( i % 2 == 1 ){
                xPos = -pos2;
                radius = ( pos2 + 0.5 ) * puffyness;
            }
            const zPos = Math.cos( angle ) * radius;
            const yPos = Math.sin( angle ) * radius;
            geometry.vertices.push( new THREE.Vector3( xPos, yPos, zPos ) );
        }

        // // create faces
        for ( var i = 0; i < m; i++ ){
            var index = i;
            // current index, nose vertex, next index
            var frontFace = new THREE.Face3( i + 2, 1, ( ( i + 1) % m ) + 2 );
            geometry.faces.push( frontFace );
            
            var backFace = new THREE.Face3( i + 2, ( ( i + 1 ) % m ) + 2, 0 );
            geometry.faces.push( backFace );
        }

        var frontFace = new THREE.Face3( 0, 1, 2 );
        geometry.faces.push( frontFace );

        geometry.computeFaceNormals();
        // geometry.computeVertexNormals();

        return geometry;
    }
}