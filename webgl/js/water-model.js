
class WaterSpringModel{
    constructor(n=100, k=5, spread=0.01, dampening=1.0, clamped=true){
        this.heightMatrix = math.matrix(math.zeros([n,n]));
        this.velocityMatrix = math.matrix(math.zeros([n,n]));
        this.target = 0.0;
        this.n = n;
        this.k = k;
        this.dx = 1.0 / (n-1);
        this.spread = spread;
        this.dampening = dampening;
        this.clamped = clamped;
        this.normalMatrix = math.matrix(math.zeros([n,n,3]));
        
    }

    update(dt){
        // get distance from target displacement (0)
        var diffMatrix = math.subtract(this.heightMatrix, this.target);
        // var accMatrix = math.multiply(-this.k, diffMatrix);

        var accMatrix = math.subtract(
                            math.multiply(-this.k, diffMatrix), 
                            math.multiply(this.dampening, this.velocityMatrix));

        this.velocityMatrix = math.add(this.velocityMatrix, 
                                math.multiply(accMatrix, dt));

        this.heightMatrix = math.add(this.heightMatrix,
                                math.multiply(this.velocityMatrix, dt));

        if (this.clamped){
            // clamp edge positions and velocities to 0
            for(let i=0; i<this.n; i++){
                this.velocityMatrix.subset(math.index(i,0), 0);
                this.velocityMatrix.subset(math.index(i,this.n-1), 0);
                this.velocityMatrix.subset(math.index(0,i), 0);
                this.velocityMatrix.subset(math.index(this.n-1, i), 0);

                this.heightMatrix.subset(math.index(i,0), 0);
                this.heightMatrix.subset(math.index(i,this.n-1), 0);
                this.heightMatrix.subset(math.index(0,i), 0);
                this.heightMatrix.subset(math.index(this.n-1, i), 0);
            }
        }

        var leftMatrix = math.matrix(math.zeros([this.n,this.n]));
        var rightMatrix = math.matrix(math.zeros([this.n,this.n]));
        var upMatrix = math.matrix(math.zeros([this.n, this.n]));
        var downMatrix = math.matrix(math.zeros([this.n, this.n]));
        var maxIters = 8;

        for(let iters=0; iters < maxIters; iters++){
            for(let i=0; i < this.n; i++){
                for(let j=0; j < this.n; j++){
                    let currentHeight = this.heightMatrix.subset(math.index(i,j));

                    // upper neighbor
                    if ( i != 0){
                        // current height - up height
                        let diff = this.heightMatrix.subset(math.index(i-1, j)) - currentHeight;
                        upMatrix.subset(math.index(i,j), this.spread * diff);
                    }
                    // lower neighbor
                    if ( i != this.n-1){
                        // current height - down height
                        let diff = this.heightMatrix.subset(math.index(i+1, j)) - currentHeight;
                        downMatrix.subset(math.index(i,j), this.spread * diff);                        
                    }
                    // left neighbor
                    if ( j != 0){
                        // current height - left height
                        let diff = this.heightMatrix.subset(math.index(i, j-1)) - currentHeight;
                        leftMatrix.subset(math.index(i,j), this.spread * diff);                        
                    }        
                    // right matrix           
                    if ( j != this.n-1){
                        // current height - right height
                        let diff = this.heightMatrix.subset(math.index(i, j+1)) - currentHeight;
                        rightMatrix.subset(math.index(i,j), this.spread * diff);                        
                    }     
                }
            }

            this.velocityMatrix = math.add(this.velocityMatrix,
                                           upMatrix,
                                           downMatrix,
                                           leftMatrix,
                                           rightMatrix);

            this.heightMatrix = math.add(this.heightMatrix,    
                                    math.multiply(dt,
                                    math.add(upMatrix, downMatrix, leftMatrix, rightMatrix)));
        }

    }

    splash(index, speed){
        this.velocityMatrix.subset(math.index(index[0], index[1]), speed);
    }

    updateNormals(){
        
    }
}