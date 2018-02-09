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
        2, // number of components i.e. 2 vertices per point (x,y)
        gl.FLOAT, // type of data
        false, // normalize data
        0, // stride
        0 // offset
        );
    this.primitive = gl.TRIANGLE_STRIP;
    // this.draw = Draw;
}
function resize(canvas){

  var displayWidth = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  if(canvas.width !== displayWidth || canvas.height !== displayHeight){
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }
}


function Water2D(gl, w=1.0, h=1.0, n=100){
  this.n = n;
  this.verts = new Array(n * 4);
  this.w = w;
  this.h = h;

  const xIncr = (1.0 / (n-1)) * this.w;
  // vertex data set up up1x, up1y -> down1x, down1y -> up2x, up2y -> etc.
  for (i = 0; i < n * 4; i += 4){
    const xPos = (i/4.0)*xIncr;
    this.verts[i] = xPos; // x top position
    this.verts[i+1] = this.h;      // y top position
    this.verts[i+2] = xPos; // x bottom position
    this.verts[i+3] = 0.0; // y bottom position
  }

  this.type = gl.FLOAT;
  this.stride = 0;
  this.offset = 0;
  this.vertexCount = n * 2;

  // generate and bind vao, vbo
  this.vao = gl.createVertexArray();
  gl.bindVertexArray(this.vao);

  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

  // assign buffer data
  gl.bufferData(
      gl.ARRAY_BUFFER, 
      new Float32Array(this.verts), 
      gl.DYNAMIC_DRAW);

  gl.enableVertexAttribArray(0); // position coordinates
  gl.vertexAttribPointer(
      0, // position attribute location in shader
      2, // number of components i.e. 2 vertices per point (x,y)
      gl.FLOAT, // type of data
      false, // normalize data
      0, // stride
      0 // offset
      );

  this.primitive = gl.TRIANGLE_STRIP;
}

function PlanarMesh(gl, n=20){
  this.n = n;

  this.verts = new Array(this.n * this.n * 3); // 3 coords for every vertex
  this.indices = new Array(this.n * 2 * (this.n - 1)); // indices for ebo

  // generate mesh
  var incr = (1/(n-1));
  var zPos = -0.5;

  for(row=0; row<this.n; row++){
    var xPos = -0.5;
    for(col=0; col<this.n*3; col +=3){
      this.verts[row*this.n*3 + col] = xPos;
      this.verts[row*this.n*3 + col + 1] = 0.0;
      this.verts[row*this.n*3 + col + 2] = zPos;
      xPos += incr;
    }
    zPos += incr;
  }

  // generate indices
  for (i=0; i<this.n-1; i++){ // go through each row except last
    for (j=0; j<this.n*2; j += 2){ // go through each col and add 2 elment index to indices
      this.indices[i*this.n*2 + j] = i * this.n + j/2;
      this.indices[i*this.n*2 + j + 1] = (i + 1)* this.n + j/2;
    }
  }

  console.log(this.indices, this.verts);

  
  this.vao = gl.createVertexArray();
  gl.bindVertexArray(this.vao);

  this.vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(this.verts),
        gl.STATIC_DRAW,
      );

  this.ebo = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
  gl.bufferData(
      gl.ELEMENT_ARRAY_BUFFER,
      new Uint16Array(this.indices),
      gl.DYNAMIC_DRAW
    );

  gl.vertexAttribPointer(
      0,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

  gl.enableVertexAttribArray(0);

  this.draw = DrawMesh;
  this.update = UpdateMesh;
}

function UpdateMesh(gl, yMatrix){
  // bind buffer
  gl.bindVertexArray(this.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  var updatedVerts = this.verts;

  for(i=0; i<yMatrix.length; i++){
    const newY = yMatrix[i];
    const matIndex = (i * 3) +1;
    updatedVerts[matIndex] = newY;
  }

  gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(updatedVerts));
}
function DrawMesh(gl, shaderInfo, x, y){
  // create perspective matrix
  var projectionMatrix = mat4.create();

  mat4.perspective(projectionMatrix, 
              Math.PI/6.0,
              gl.canvas.width / gl.canvas.height,
              0.01,
              200
            );

  var modelViewMatrix = mat4.create();
  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(modelViewMatrix,     // destination matrix
             modelViewMatrix,     // matrix to translate
             [x, y, -80.0]);  // amount to translate

  mat4.rotate(modelViewMatrix,  // destination matrix
          modelViewMatrix,  // matrix to rotate
          Math.PI/5.0,   // amount to rotate in radians
          [1, 0, 0]);       // axis to rotate around

  // mat4.rotate(modelViewMatrix,
  //         modelViewMatrix,
  //         Math.PI/4.0,
  //         [0, 1, 0])
  mat4.scale(modelViewMatrix,
          modelViewMatrix,
          [20.0, 20.0, 20.0]);

  gl.bindVertexArray(this.vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
  gl.useProgram(shaderInfo.program);

  gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix
    );

  gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix
    );

  gl.uniform4fv(
    shaderInfo.uniformLocations.colorVector, [0.2, 0.3, 0.9, 0.6]);

  BYTES_PER_SHORT = 2;

  for (i=0; i<this.n-1; i++){ // draw strip for each row
    gl.drawElements(gl.TRIANGLE_STRIP, this.n * 2, gl.UNSIGNED_SHORT, i * this.n * 2 * BYTES_PER_SHORT);
  }
   gl.uniform4fv(
  shaderInfo.uniformLocations.colorVector, [0.0, 0.0, 0.0, 0.5]);    

  for (i=0; i<this.n-1; i++){ // draw strip for each row
    gl.drawElements(gl.LINE_STRIP, this.n * 2, gl.UNSIGNED_SHORT, i * this.n * 2 * BYTES_PER_SHORT);
  }

}