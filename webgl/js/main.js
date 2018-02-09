var mouseX = 0;
var mouseY = 0;

main();

//
// Start here
//
function main() {

  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false});
  var renderer = new renderEngine(gl);

  canvas.addEventListener('mousemove', setMouse);
  // const square = new Square();
  // If we don't have a GL context, give up now
  // var quad = new Quad(gl);
  // var water = new Water2D(gl);


  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  // Vertex shader program

  const vsSource = `#version 300 es
    layout(location = 0) in vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;

    out mediump vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = uColor;
    }
  `;

  // Fragment shader program

  const fsSource = `#version 300 es
    precision mediump float;

    in vec4 vColor;

    out vec4 outColor;
    void main(void) {
      outColor = vColor;
    }
  `;

  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      colorVector: gl.getUniformLocation(shaderProgram, 'uColor'),
    },
  };

  var mesh = new PlanarMesh(gl, 100);
  var then = 0;
  var deltaTime = 0;

  const cc = [112/255, 128/255, 144/255, 1.0];
  // Draw the scene repeatedly
  function render(now) {
    // resize and clear canvas
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(cc[0], cc[1], cc[2], cc[3]);  
    gl.clearDepth(1.0);                 // Clear everything
    // gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    // gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Clear the canvas before we start drawing on it.

    // gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.clear(gl.COLOR_BUFFER_BIT);

    now *= 0.001;  // convert to seconds
    deltaTime = now - then;
    then = now;
    setProjectionMatrix(gl, programInfo);

    var n = mesh.n;
    //console.log(n);
    var heights = new Array(n);
    // for (i=0; i<n*n; i++){
    //   heights [i] = 0;
    //   // heights[i] = 0.15 * Math.cos((i/(n-1))*(2 * Math.PI) + now*2.0);
    //   heights[i] += 0.1 * Math.cos(i % (n-1) + now * 2.0);
    //   heights[i] += .01 * Math.sin(i / (n*n-1) + now);
    // }

    for(i=0; i<n*n; i++){
      heights[i] = 0;
    }
    for (i=0; i<n; i++){
      for (j=0; j<n; j++){
        heights[i*n + j] += 0.025 * Math.cos((i/(n-1) * (4*Math.PI)) + now*4.0);
        heights[j*n + i] += 0.1 * Math.sin((i/(n-1) * (.5*Math.PI)) + now*1.0);
      }
    }

    // renderer.drawWater(programInfo, heights, -20, 0, 100, 30);
    // mesh.draw(gl, programInfo, Math.cos(now)*10.0, Math.sin(now)*10.0);
    mesh.update(gl, heights);
    mesh.draw(gl, programInfo, 0, 0);

    // for (x = -100; x < 100; x += 20){
    //   for(y = -100; y < 100; y += 20){
    //     // renderer.drawQuad(programInfo, x + mouseX, y + mouseY,
    //     //       10.0, 10.0, x + now, c=[Math.abs(x/100), Math.abs(y/100), 0, 1.0]);
    //     // renderer.drawShape('water', programInfo, x + mouseX, y + mouseY,
    //     //       10.0, 10.0, x + now, c=[Math.abs(x/100), Math.abs(y/100), 0, 1.0]);
    //     renderer.drawWater(programInfo, [0,1,2], 0, 0, 10, 10);
    //   }
    // }
    // renderer.drawQuad(programInfo);
    // quad.draw(gl, programInfo, mouseX, mouseY, 20.0, 20.0, now, [1.0, 0.0, 0.0, 1.0]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function setMouse(event){
  var canvas = document.getElementById('glcanvas');
  
  mapToWorld(canvas, event.clientX, event.clientY);

}

function setProjectionMatrix(gl, shaderInfo){
    var projectionMatrix = mat4.create();

    const aspect = 2;
    mat4.ortho(projectionMatrix,
    -100.0, 100.0,
    -100.0*(1/this.aspect), 100.0*(1/this.aspect),
    -1, 1);

    gl.useProgram(shaderInfo.program);
    gl.uniformMatrix4fv(
        shaderInfo.uniformLocations.projectionMatrix,
        false,
        projectionMatrix);

}
function mapToWorld(canvas, x,y,xmin=-100,xmax=100){
  // scale to one
  width = canvas.width;
  height = canvas.height;
  aspect = width / height;

  ymin = xmin * (1/aspect);
  ymax = xmax * (1/aspect);

  x_norm = x / width;
  y_norm =  1 - y / height;

  xPos = x_norm * (xmax - xmin) + xmin;
  yPos = y_norm * (ymax - ymin) + ymin;

  mouseX = xPos;
  mouseY = yPos;
}
