
function Quad(gl){
    this.verts = [
        0.5, 0.5,
         -0.5, 0.5,
         0.5, -0.5,
         -0.5, -0.5,
    ];
    this.numComponents = 2;
    this.type = gl.FLOAT;
    this.stride = 0;
    this.offset = 0;
    this.vertexCount = 4;

    // generate and bind vao, vbo
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

    // assign buffer data
    gl.bufferData(
        gl.ARRAY_BUFFER, 
        new Float32Array(this.verts), 
        gl.STATIC_DRAW);

    gl.enableVertexAttribArray(0); // position coordinates
    gl.vertexAttribPointer(
        0, // position attribute location in shader
        2, // number of components i.e. 2 triangles
        gl.FLOAT, // type of data
        false, // normalize data
        0, // stride
        0 // offset
        );

    this.draw = Draw;
}
function resize(canvas){
  var cssToRealPixels = window.devicePixelRatio || 1;

  var displayWidth = Math.floor(canvas.clientWidth * cssToRealPixels);
  var displayHeight = Math.floor(canvas.clientHeight * cssToRealPixels);

  if(canvas.width !== displayWidth || canvas.height !== displayHeight){
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}

function Draw(gl, shaderInfo, x, y, w=1.0, h=1.0, theta=0.0, c=[1.0, 1.0, 1.0, 1.0]){
    const fieldOfView = 45 * Math.PI / 180;   // in radians
    const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    const zNear = 0.1;
    const zFar = 100.0;
    const projectionMatrix = mat4.create();

    // note: glmatrix.js always has the first argument
    // as the destination to receive the result.
    mat4.perspective(projectionMatrix,
       fieldOfView,
       aspect,
       zNear,
       zFar);

    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    mat4.translate(modelViewMatrix,     // destination matrix
                   modelViewMatrix,     // matrix to translate
                   [x, y, -6.0]);  // amount to translate

    mat4.rotate(modelViewMatrix,  // destination matrix
                modelViewMatrix,  // matrix to rotate
                theta,   // amount to rotate in radians
                [0, 0, 1]);       // axis to rotate around
    mat4.scale(modelViewMatrix,
                modelViewMatrix,
                [w, h, 1.0]);

    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.useProgram(shaderInfo.program);

    gl.enableVertexAttribArray(shaderInfo.attribLocations.vertexPosition);
    gl.vertexAttribPointer(
        shaderInfo.attribLocations.vertexPosition,
        this.numComponents,
        this.type,
        false,
        this.stride,
        this.offset);

    gl.enableVertexAttribArray(
        shaderInfo.attribLocations.vertexPosition);

    gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);
    gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

  gl.uniform4fv(
      shaderInfo.uniformLocations.colorVector, c);

  // gl.drawArrays(gl.TRIANGLE_STRIP, this.offset, this.vertexCount);
  gl.drawArrays(gl.TRIANGLE_STRIP, this.offset, this.vertexCount);
}