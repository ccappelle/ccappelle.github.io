
class Octree {
    constructor ( point1, point2, depth = 0, limitPerNode = 1, depthLimit = 20 ){

        this.point1 = point1;
        this.point2 = point2;
        this.centerPoint = new THREE.Vector3().lerpVectors( point1, point2, 0.5 );
        this.depth = depth;
        this.depthLimit = depthLimit;
        this.limitPerNode = limitPerNode;
        
        this.nEntries = 0;
        this.entries = [];

        this.children = [];
        for ( var i = 0; i < 8; i++ ){
            this.children.push( null );
        } 
        // child layout xyz
        // [ ---, --+, -+-, -++, +--, +-+, ++-, +++]
        //    0    1    2    3    4    5    6    7
    }

    push( entry ){
        this.nEntries += 1

        if ( this.nEntries <= this.limitPerNode || this.depth == this.depthLimit ){
            // no need to create a new octree,
            // simply append to entry list and return
            this.entries.push( entry );
            return;
        } else {
            if ( this.nEntries == this.limitPerNode + 1 ){
                // push all stored entries into child octrees
                for ( var i = 0; i < this.entries.length; i++ ){
                    var poppedEntry = this.entries.pop();
                    this.pushToChild( poppedEntry );
                }
            }

            this.pushToChild( entry );
        }
    }

    pushToChild( entry ){

        var indexArray = [ 0, 0, 0 ]; // default is ---

        var limitPoint = new THREE.Vector3();

        if ( entry.position.x > this.centerPoint.x ){
            indexArray[0] = 1;
            limitPoint.x = Math.max( this.point1.x, this.point2.x );
        } else {
            limitPoint.x = Math.min( this.point1.x, this.point2.x );
        }

        if ( entry.position.y > this.centerPoint.y ){
            indexArray[1] = 1;
            limitPoint.y = Math.max( this.point1.y, this.point2.y );
        } else {
            limitPoint.y = Math.min( this.point1.y, this.point2.y );
        }

        if ( entry.position.z > this.centerPoint.z ){
            indexArray[2] = 1;
            limitPoint.z = Math.max( this.point1.z, this.point2.z );
        } else {
            limitPoint.z = Math.min( this.point1.z, this.point2.z );
        }


        var index = 4 * indexArray[0] + 2 * indexArray[1] + indexArray[2];

        if ( this.children[index] === null ){
            // create new child tree
            this.children[index] = this.createChild( limitPoint, this.centerPoint.clone(),
                                               this.depth + 1, this.limitPerNode, this.depthLimit );
        }

        this.children[index].push( entry );
    }

    createChild( point1, point2, depth, nodeLimit, depthLimit ){
        return new Octree( point1, point2, depth, nodeLimit, depthLimit );
    }
    
    listify(){
        var outList = [ this ];

        for ( var i = 0; i < this.children.length; i++ ){
            if ( this.children[i] === null ){
                continue;
            } else {
                var childList = this.children[i].listify();
                outList.push( ...childList );
            }
        }

        return outList;
    }
}