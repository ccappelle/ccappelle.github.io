
class renderEngine{
    constructor(gl){
        this.gl = gl; // store gl context

        this.quad = new Quad(this.gl);
        this.water = new Water2D(this.gl);

        this.aspect = 2;
    }

    drawShape(shapeStr, shaderInfo, x=0, y=0, w=1.0, h=1.0, theta=0.0, c=[1.0, 0.0, 0.0, 1.0]){
        if (shapeStr == 'quad'){
            var shape = this.quad;
        } else if (shapeStr == 'water'){
            var shape = this.water;
        }

        var modelViewMatrix = mat4.create();


        // Now move the drawing position a bit to where we want to
        // start drawing the square.
        mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [x, y, -0.5]);  // amount to translate

        mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                theta,   // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around
        mat4.scale(modelViewMatrix,
                modelViewMatrix,
                [w, h, 1.0]);

        this.gl.bindVertexArray(shape.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, shape.vbo);
        this.gl.useProgram(shaderInfo.program);

        this.gl.uniformMatrix4fv(
          shaderInfo.uniformLocations.modelViewMatrix,
          false,
          modelViewMatrix);

        this.gl.uniform4fv(
            shaderInfo.uniformLocations.colorVector, c);

        // console.log(shape.primitive, shape.offset, shape.vertexCount);
        // gl.drawArrays(gl.TRIANGLE_STRIP, this.offset, this.vertexCount);
        this.gl.drawArrays(shape.primitive, shape.offset, shape.vertexCount);
    }

    drawQuad(shaderInfo, x=0, y=0, w=1.0, h=1.0, theta=0.0, c=[1.0, 0.0, 0.0, 1.0]){
        this.drawShape('quad', shaderInfo, x, y, w, h, theta, c);
    }

    drawWater(shaderInfo, heights, x=0, y=0, w=1.0, h=1.0){
        var bufferVerts = this.water.verts;


        // set up sub buffer data
        for (i=0; i< heights.length; i++){
            bufferVerts[i*4 + 1] = heights[i];
            // console.log(bufferVerts[i*4], heights[i]);
        }

        this.drawShape('water', shaderInfo, x, y, w, h);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, new Float32Array(bufferVerts), bufferVerts);
    }
}