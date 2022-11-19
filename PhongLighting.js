"use strict";

var canvas;
var gl;

var numVertices = 500;

var pointsArray = [];
var normalsArray = [];

var vertices = [
  vec4(-0.5, -0.5, 0.5, 1.0), // d
  vec4(-0.5, 0.5, 0.5, 1.0), // a
  vec4(0.5, 0.5, 0.5, 1.0), // b
  vec4(0.5, -0.5, 0.5, 1.0), // c
  vec4(-0.5, -0.5, -0.5, 1.0), // h
  vec4(-0.5, 0.5, -0.5, 1.0), // e
  vec4(0.5, 0.5, -0.5, 1.0), // f
  vec4(0.5, -0.5, -0.5, 1.0), //g

  vec4(0.5, -0.5, 0.0, 1.0), //4
  vec4(0.5, 0.5, 0.0, 1.0), //1
  vec4(1.0, 0.5, 0.0, 1.0), //2
  vec4(1.0, -0.5, 0.0, 1.0), //3
  vec4(0.75, 0.5, 0.25, 1.0), //5
  vec4(0.75, -0.5, 0.25, 1.0), //6

  vec4(-1.0, 0.5, 0.0, 1.0), //7
  vec4(-1.0, -0.5, 0.0, 1.0), //8
  vec4(-0.5, -0.5, 0.0, 1.0), //9
  vec4(-0.5, 0.5, 0.0, 1.0), //10
  vec4(-0.75, 0.5, 0.25, 1.0), //11
  vec4(-0.75, -0.5, 0.25, 1.0), //12
];

// 조명 속성
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// 물질 속성
var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 0.8, 0.0, 1.0);
var materialShininess = 100.0;

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelView, projection;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta = [0, 0, 0];

var thetaLoc;

var flag = true;

function quad(a, b, c, d) {
  var t1 = subtract(vertices[b], vertices[a]);
  var t2 = subtract(vertices[c], vertices[b]);
  var normal = cross(t1, t2);
  var normal = vec3(normal);

  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  pointsArray.push(vertices[b]);
  normalsArray.push(normal);
  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  pointsArray.push(vertices[a]);
  normalsArray.push(normal);
  pointsArray.push(vertices[c]);
  normalsArray.push(normal);
  pointsArray.push(vertices[d]);
  normalsArray.push(normal);
}

function colorCube() {
  quad(1, 0, 3, 2);
  quad(0, 4, 7, 3);
  quad(1, 2, 6, 5);
  quad(4, 5, 6, 7);
  quad(8, 7, 6, 9);
  quad(2, 3, 11, 10);
  quad(3, 8, 11, 13);
  quad(2, 9, 10, 12);
  quad(8, 9, 10, 11);
  quad(16, 4, 5, 17);
  quad(14, 15, 16, 17);
  quad(14, 15, 0, 1);
  quad(15, 16, 0, 19);
  quad(14, 17, 1, 18);
}

window.onload = function init() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  colorCube();

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  thetaLoc = gl.getUniformLocation(program, "theta");

  viewerPos = vec3(0.0, 0.0, -20.0);

  projection = ortho(-1, 1, -1, 1, -100, 100);

  var ambientProduct = mult(lightAmbient, materialAmbient);
  var diffuseProduct = mult(lightDiffuse, materialDiffuse);
  var specularProduct = mult(lightSpecular, materialSpecular);

  document.getElementById("ButtonX").onclick = function () {
    axis = xAxis;
  };
  document.getElementById("ButtonY").onclick = function () {
    axis = yAxis;
  };
  document.getElementById("ButtonZ").onclick = function () {
    axis = zAxis;
  };
  document.getElementById("ButtonT").onclick = function () {
    flag = !flag;
  };
  document.getElementById("ButtonL").onclick = function () {
    if (flag === false) {
      theta[axis] -= 5.0;
    }
  };
  document.getElementById("ButtonR").onclick = function () {
    if (flag === false) {
      theta[axis] += 5.0;
    }
  };

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );

  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "projectionMatrix"),
    false,
    flatten(projection)
  );

  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  if (flag) theta[axis] += 2.0;

  modelView = mat4();
  modelView = mult(modelView, rotate(theta[xAxis], [1, 0, 0]));
  modelView = mult(modelView, rotate(theta[yAxis], [0, 1, 0]));
  modelView = mult(modelView, rotate(theta[zAxis], [0, 0, 1]));

  gl.uniformMatrix4fv(
    gl.getUniformLocation(program, "modelViewMatrix"),
    false,
    flatten(modelView)
  );

  gl.drawArrays(gl.TRIANGLES, 0, numVertices);

  requestAnimFrame(render);
};
