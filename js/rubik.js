/****************************** RUBIK PROPERTIES ******************************/
// Rubiks cube face colors (Orange, Red, Blue, Green, Yellow, White)
var COLORS = [0xFF5900, 0xB90000, 0x0045AD, 0x009B48, 0xFFD500, 0xFFFFFF];

var CUBE_SIZE = 0.5; // length of each cube side
var SPACE_BETWEEN_CUBES = CUBE_SIZE / 100; // spacing between each cube

// https://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
var pivot = new THREE.Object3D();

var EPS = 0.01;

/****************************** HELPER FUNCTIONS ******************************/
function createCube(x, y, z) {
  /* TODO: color the inside faces of each cube black
   * (Maybe color all faces black to begin with, then "whitelist" exterior faces)
   */
  var faceMaterials = COLORS.map(function(c) {
    return new THREE.MeshLambertMaterial({ color: c });
  });
  var cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  cube = new THREE.Mesh(cubeGeometry, faceMaterials);
  cube.castShadow = true;

  cube.position.set(x, y, z);

  return cube;
}

// return a list of cubes on the face described by axis and face.
function getActiveCubes(cubes, axis, face) {
  var activeCubes = [];
  cubes.forEach(function(cube) {
    if (equal(cube.position[axis], face)) {
      activeCubes.push(cube);
    }
  });
  return activeCubes;
}

function equal(a, b) {
  return Math.abs(a - b) <= EPS;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function randomAxis() {
  return ['x', 'y', 'z'][randomInt(0, 2)];
}

function randomDirection() {
  return randomInt(0, 1) * 2 - 1;
}

/***************************** RUBIK *****************************/
function Rubik(dimensions) {
  this.dimensions = dimensions;
  this.cubes = [];

  var len = CUBE_SIZE + SPACE_BETWEEN_CUBES;
  var offset = (dimensions - 1) * len * 0.5;  
  this.center = (len * (dimensions - 1) - 2 * offset) / 2;

  for (let i = 0; i < dimensions; i++) {
    for (let j = 0; j < dimensions; j++) {
      for (let k = 0; k < dimensions; k++) {
        var x = len * i - offset;
        var y = len * j - offset;
        var z = len * k - offset;
        this.cubes.push(createCube(x, y, z));
      }
    }
  }
}

// Rotate a face at depth (0 to dimensions - 1) perpendicular to
// axis (x, y, z) in a direction (-1 or 1).
Rubik.prototype.rotate = function(depth, direction, axis) {
  var len = CUBE_SIZE + SPACE_BETWEEN_CUBES;
  var offset = (this.dimensions - 1) * len * 0.5;
  var face = len * depth - offset;

  var activeCubes = getActiveCubes(this.cubes, axis, face);

  pivot.rotation.set(0, 0, 0);
  pivot.updateMatrixWorld();
  scene.add(pivot);

  // make the cubes a child of the pivot
  for (let i = 0; i < activeCubes.length; i++) {
    THREE.SceneUtils.attach(activeCubes[i], scene, pivot)
  }

  // rotate
  pivot.rotation[axis] += direction * Math.PI / 2;

  // put the cubes back as children of the scene
  pivot.updateMatrixWorld();
  scene.remove(pivot);
  for (let i = 0; i < activeCubes.length; i++) {
    var cube = activeCubes[i];
    cube.updateMatrixWorld();

    THREE.SceneUtils.detach(cube, pivot, scene);
  }
}

// n: number of moves to simulate during shuffle
Rubik.prototype.shuffle = function(n) {
  for (let i = 0; i < n; i++) {
    var depth = randomInt(0, this.dimensions - 1);
    var direction = randomDirection();
    var axis = randomAxis();

    this.rotate(depth, direction, axis);
  }
}
