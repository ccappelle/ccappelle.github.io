class Matrix{
    constructor( m, n, ArrayType = Float32Array ) {
        this.entries = new ArrayType( m * n );
        this.ArrayType = ArrayType;
        this.order = 'row';
        this.m = m;
        this.n = n;
    }

    setEntry( i, j, value ){
        var index = this.getIndex( i, j );
        this.entries[ index ] = value;
    }

    getEntry( i, j ){
        var index = this.getIndex( i, j );
        return this.entries[index];
    }

    getIndex( i, j ){
        return i * this.n + j;
    }



    addMatrix( M ){
        for ( var i = 0; i < this.m * this.n; i++ ){
            this.entries[i] += M.entries[i];
        }
    }

    addScalar( s ){
        for ( var i = 0; i < this.m * this.n; i++ ){
            this.entries[i] += s;
        }
    }

    multiplyScalar( s ){
        for ( var i = 0; i < this.m * this.n; i++ ){
            this.entries[i] *= s;
        }
    }

    static Multiply( A, B ){
        if ( A.n !== B.m ){
            throw new Error( 'Dimension Mismatch (' + A.m.toString() + ',' + A.n.toString() +') * (' +
                             A.m.toString() + ',' + A.n.toString() + ')' );       
        }
        var C = new Matrix( A.m, B.n, A.ArrayType );
        // var outMatrix = new A.ArrayType( A.m * B.n );
        for ( var ci = 0; ci < C.m; ci++ ){ // ith
            for ( var cj = 0; cj < C.n; cj++ ){
                var cIndex = C.getIndex( ci, cj );
                var sum = 0;
                for ( var k = 0; k < C.m; k++ ){
                    // var aIndex = A.getIndex( ci, k  );
                    // var bIndex = B.getIndex( k , cj );
                    sum += A.getEntry( ci, k ) * B.getEntry( k, cj );
                }
                C.entries[cIndex] = sum;
            }
        }

        return C;
    }

    static Add( A, B ){

    }
}

// var matrix1 = new Matrix( 2, 2 );
// matrix1.setEntry( 0, 0, 1 );
// var matrix2 = new Matrix( 2, 2 );
// matrix2.setEntry( 0, 1, 1 );

// var matrix3 = Matrix.Multiply( matrix1, matrix2 );
// console.log( matrix3 );
