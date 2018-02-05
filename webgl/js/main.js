var squareRotation = 0.0;
var squareZ = -6.0;
main();



//
// Start here
//
function main() {
  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl2');
  // const square = new Square();
  // If we don't have a GL context, give up now
  quad = new Quad(gl);

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

    out lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = uColor;
    }
  `;

  // Fragment shader program

  const fsSource = `#version 300 es
    precision lowp float;

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

  var then = 0;

  // Draw the scene repeatedly
  function render(now) {
    // resize and clear canvas
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;

    quad.draw(gl, programInfo, 0, 0, 1, 1, now, [1.0, 0.0, 0.0, 1.0]);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}


