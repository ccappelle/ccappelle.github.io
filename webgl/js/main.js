var mouseX = 0;
var mouseY = 0;
var radius = 4;
var theta = Math.PI/6.0;
var phi = Math.PI/6.0;
var pause = true;
var totalTime = 0.0;
var clamped = false;
var x = 0;
var y = 0;
var z = 0;

main();

//
// Start here
//
function main() {

  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl2', {premultipliedAlpha: false});
  var renderer = new renderEngine(gl);
  canvas.setAttribute("tabindex", 0);
  canvas.addEventListener('mousemove', setMouse);
  canvas.addEventListener('keydown', keyboardCallbackFunction);
  canvas.addEventListener('focusout', function(){pause = true;});


  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  // Vertex shader program

  const vsSource = `#version 300 es
    layout(location = 0) in vec3 aVertexPosition;

    uniform mat4 uModelMatrix;
    uniform mat4 uViewMatrix;
    uniform mat4 uProjectionMatrix;
    uniform vec4 uColor;
    uniform vec3 uCameraPos;

    out mediump vec4 vColor;
    out mediump vec3 vNormal;
    out mediump vec3 vFragPos;
    out mediump vec3 vCameraPos;

    void main(void) {
      vNormal = normalize(vec3(1.0, 1.0, 0.0));
      gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aVertexPosition, 1.0);
      vColor = uColor;
      vFragPos = vec3(uModelMatrix * vec4(aVertexPosition, 1.0));
      vCameraPos = uCameraPos;
    }
  `;

  // Fragment shader program

  const fsSource = `#version 300 es
    precision mediump float;

    in vec4 vColor;
    in vec3 vFragPos;
    in vec3 vNormal;
    in vec3 vCameraPos;

    out vec4 outColor;
    void main(void) {
      vec3 lightColor = vec3(1.0, 1.0, 1.0);
      vec3 lightPosition = vec3(0.0, 20.0, 20.0);

      vec3 lightDir = normalize(lightPosition - vFragPos);

      float specularStrength = 0.5f;
      float gamma = 1.0f;
      vec3 viewDir = normalize(vCameraPos - vFragPos);
      vec3 reflectDir = reflect(-lightDir, vNormal);

      float spec = pow(max(float(dot(viewDir, reflectDir)), 0.0f), gamma);
      vec3 specular = specularStrength * spec * lightColor;

      float diff = max(dot(vNormal, lightDir), 0.0);
      vec3 diffuse = diff * lightColor;

      float ambientStrength = 0.5;
      vec3 ambient = ambientStrength * lightColor;

      vec3 fx = vec3(0.0f);
      fx += ambient;
      fx += diffuse;
      fx += specular;
      outColor = vec4(ambient + diffuse + specular, 1.0) * vColor;
      // outColor = vec4(specular, 1.0);
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
      viewMatrix: gl.getUniformLocation(shaderProgram, 'uViewMatrix'),
      modelMatrix: gl.getUniformLocation(shaderProgram, 'uModelMatrix'),
      colorVector: gl.getUniformLocation(shaderProgram, 'uColor'),
      cameraPositionVector: gl.getUniformLocation(shaderProgram, 'uCameraPosition'),
    },
  };

  var n = 10;
  var mesh = new PlanarMesh(gl, n);
  var waterModel = new WaterSpringModel(n);
  waterModel.clamped = clamped;
  var then = 0;
  var deltaTime = 0;


  function render(now) {
    now *= 0.001;  // convert to seconds
    deltaTime = now - then;
    then = now;
    waterModel.clamped = clamped;


    if (!pause){
      setProjectionMatrix(gl, programInfo);
      setViewMatrix(gl, programInfo);

      totalTime += deltaTime;
      if (totalTime > 3.0){
        totalTime -= 3.0;
        // random splash
        if (clamped){
          var i = Math.floor(Math.random()*(n-2)+1);
          var j = Math.floor(Math.random()*(n-2)+1);
        } else{
          var i = Math.floor(Math.random()*(n-1));
          var j = Math.floor(Math.random()*(n-1));
        }
        let speed = Math.random()*2.0-1.0;
        console.log('Spash!!', i, j, speed);
        waterModel.splash([i,j], speed);
      }
        waterModel.update(deltaTime);
        mesh.update(gl, math.flatten(waterModel.heightMatrix));
    }
    // renderer.drawWater(programInfo, heights, -20, 0, 100, 30);
    // mesh.draw(gl, programInfo, Math.cos(now)*10.0, Math.sin(now)*10.0);

    // Draw the scene repeatedly
    // gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.DEPTH_TEST);
    if (pause){
      gl.clearColor(0,0,0,1);  
    }
    else{
      gl.clearColor(.5,.5,.5,1);
    }
    resize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    // gl.clearDepth(1.0);                 // Clear everything
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mesh.draw(gl, programInfo);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function setMouse(event){
  var canvas = document.getElementById('glcanvas');
  mapToWorld(canvas, event.clientX, event.clientY);

}

function setViewMatrix(gl, shaderInfo){
  var up = [0, 1.0, 0];

  var viewMatrix = mat4.create();

  // var eye = vec3.create();
  var center = [0, 0, 0];

  // vec3.set(eye, x, y, z);
  var cameraPos = getCameraPosition();

  mat4.lookAt(viewMatrix,
              cameraPos,
              center,
              up);

  gl.useProgram(shaderInfo.program);
  gl.uniformMatrix4fv(
      shaderInfo.uniformLocations.viewMatrix,
      false,
      viewMatrix
      );

  gl.uniform3fv(
      shaderInfo.uniformLocations.cameraPositionVector,
      cameraPos
    );

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

function keyboardCallbackFunction(event){
  if(event.keyCode == 37){ // left arrow
    // phi -= Math.PI / 10.0;
    x -= 0.1
  }
  if(event.keyCode == 38){ // up arrow
    // theta += Math.PI / 10.0;
    y += 0.1
  }
  if(event.keyCode == 39){ // right arrow
    // phi += Math.PI / 10.0;
    x += 0.1
  }
  if(event.keyCode == 40){ // down arrow
    // theta -= Math.PI / 10.0;
    y -= 0.1
  }
  if(event.keyCode == 90){
    // radius += 1.0;
    z += 0.1
  }
  if(event.keyCode == 67){
    // radius -= 1.0;
    z -= 0.1
  }

  if (theta > Math.PI){
    theta = Math.PI;
  }
  if (theta < 0){
    theta = 0;
  }

  if(event.keyCode == 32){
    clamped = !clamped;
    console.log('clamped ', clamped);
  }
  if(event.keyCode == 80){
    pause = !pause;
    console.log('paused = ', pause);
  }
} 

function getCameraPosition(){
  // var x = radius * Math.sin(theta) * Math.cos(phi);
  // var y = radius * Math.sin(theta) * Math.sin(phi);
  // var z = radius * Math.cos(theta);

  // console.log(x, y, z);
  return [x, y, z];
}