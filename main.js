//shaders
const glsl = (x) => x;

const vertex = glsl`
  attribute vec2 a_position;

  uniform vec2 u_resolution;
  uniform vec2 u_translation;

  void main() {

    //add in the translation
    vec2 position = a_position + u_translation;

    // convert the circle points from pixels to 0.0 to 1.0
    vec2 zeroToOne = position / u_resolution;

    // convert from 0->1 to 0->2
    vec2 zeroToTwo = zeroToOne * 2.0;

    // convert from 0->2 to -1->+1 (clipspace)
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;

const fragment = glsl`
  // fragment shaders don't have a default precision so we need
  // to pick one. mediump is a good default. It means "medium precision"
  precision mediump float;

  uniform vec4 u_color;
 
  // gl_FragColor is a special variable a fragment shader
  void main() {
    gl_FragColor = u_color;
  }
`;

function main() {
  // Get A WebGL context
  var canvas = document.querySelector("#c");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const opacity = 0.5;
  const color = [0, 0, 0, opacity];
  const translation = [window.innerWidth * .5, window.innerHeight * .5];
  
  // Use our boilerplate utils to compile the shaders and link into a program
  var program = webglUtils.createProgramFromSources(gl, [vertex, fragment]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(program,"u_resolution");
  var translationUniformLocation = gl.getUniformLocation(program, "u_translation");
  var colorUniformLocation = gl.getUniformLocation(program, "u_color");

  // Create a buffer to put three 2d clip space points in
  var positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [];

  const stops = 10; //how many sides the polygon has
  const r = 2; //half the width of the polygon (radius for circle)

  for (i = 0; i <= stops; i++){
    positions.push(r * Math.cos(i * 2 * Math.PI/stops)); // x coord
    positions.push(r * Math.sin(i * 2 * Math.PI/stops)); // y coord
  }

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  //sets canvas width and height to current size of canvas as specified in css
  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per stop
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  // set the resolution
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  //set the translation
  gl.uniform2fv(translationUniformLocation, translation);

  //set the color
  gl.uniform4fv(colorUniformLocation, color);


  // draw
  var primitiveType = gl.TRIANGLE_FAN;
  var offset = 0;
  const count = stops + 1; //adding one for center of circle
  gl.drawArrays(primitiveType, offset, count);
}

main();
