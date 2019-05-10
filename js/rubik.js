/****************************** RUBIK PROPERTIES ******************************/
// Rubiks cube face colors (Orange, Red, Blue, Green, Yellow, White)
var COLORS = [0xFF5900, 0xB90000, 0x0045AD, 0x009B48, 0xFFD500, 0xFFFFFF];

var CUBE_SIZE = 0.5; // length of each cube side
var SPACE_BETWEEN_CUBES = CUBE_SIZE / 100; // spacing between each cube

// TODO: Allow user to choose rotation speed
var ROTATION_SPEED = 0.15; // speed of cube rotation

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

/***************************** MOVE *****************************/
// A Move describes a face rotation. 
// depth: the depth of the face to be rotated (0 to dimensions - 1)
// direction: the direction in which to rotate the face (-1 or 1)
// axis: The axis (x, y, z) perpendicular to the face
function Move(depth, direction, axis) {
  this.depth = depth;
  this.direction = direction;
  this.axis = axis;
} 

/***************************** RUBIK *****************************/
function Rubik(dimensions) {
  this.dimensions = dimensions; // number of cubes per row/column
  this.cubes = []; // list of cubes in the Rubik's cube
  this.moves = []; // queue of moves to execute
  this.currentMove = {}; // current move to execute
  this.activeCubes = []; // list of cubes to be rotated
  this.isMoving = false; // is a move being executed?
  this.completedMoves = []; // stack of completed moves
  this.isUndoing = false; // are we undoing a move?

  var len = CUBE_SIZE + SPACE_BETWEEN_CUBES;
  var offset = (dimensions - 1) * len * 0.5;  
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

Rubik.prototype.setActiveCubes = function() {
  var depth = this.currentMove.depth;
  var direction = this.currentMove.direction;
  var axis = this.currentMove.axis;

  var len = CUBE_SIZE + SPACE_BETWEEN_CUBES;
  var offset = (this.dimensions - 1) * len * 0.5;
  var face = len * depth - offset;

  for (let i = 0; i < this.cubes.length; i++) {
    var cube = this.cubes[i];
    if (equal(cube.position[axis], face)) {
      this.activeCubes.push(cube);
    }
  }
}

Rubik.prototype.executeCurrentMove = function() {
  this.isMoving = true;

  this.setActiveCubes();

  pivot.rotation.set(0, 0, 0);
  pivot.updateMatrixWorld();
  scene.add(pivot);

  // make the cubes a child of the pivot
  for (let i = 0; i < this.activeCubes.length; i++) {
    THREE.SceneUtils.attach(this.activeCubes[i], scene, pivot)
  }
}

// Rotate a face a quarter turn and then stop
Rubik.prototype.rotate = function() {
  var direction = this.currentMove.direction;
  var axis = this.currentMove.axis;

  // Account for over-rotation and stop
  if (pivot.rotation[axis] >= Math.PI / 2) {
    pivot.rotation[axis] = Math.PI / 2;
    this.moveComplete();
  } else if (pivot.rotation[axis] <= -Math.PI / 2) {
    pivot.rotation[axis] = -Math.PI / 2;
    this.moveComplete();
  } else {
    // otherwise continue rotating
    pivot.rotation[axis] += direction * ROTATION_SPEED;
  }
}

Rubik.prototype.moveComplete = function() {
  // put the cubes back as children of the scene
  pivot.updateMatrixWorld();
  scene.remove(pivot);
  for (let i = 0; i < this.activeCubes.length; i++) {
    var cube = this.activeCubes[i];
    cube.updateMatrixWorld();
    THREE.SceneUtils.detach(cube, pivot, scene);
  }

  // reset variables
  this.isMoving = false;
  if (! this.isUndoing) this.completedMoves.push(this.currentMove);
  this.isUndoing = false;
  this.currentMove = {};
  this.activeCubes = [];
  
  this.executeMoves(); // execute the next move
}

Rubik.prototype.executeMoves = function() {
  if (this.moves.length > 0) {
    this.currentMove = this.moves.shift();
    this.executeCurrentMove();
  }
}

// --------------------------------------------------------
//                        RUBIK CONTROLS
// --------------------------------------------------------
// n: number of moves to simulate during shuffle
Rubik.prototype.shuffle = function(n) {
  if (! this.isMoving) {  
    for (let i = 0; i < n; i++) {
      var depth = randomInt(0, this.dimensions - 1);
      var direction = randomDirection();
      var axis = randomAxis();

      var move = new Move(depth, direction, axis);

      this.moves.push(move);
    }

    this.executeMoves();
  } else {
    console.log("Already moving!");
  }
}

Rubik.prototype.undo = function() {
  if (! this.isMoving) {
    var prevMove = this.completedMoves.pop();
    if (prevMove) {
      prevMove.direction *= -1;
      this.moves.push(prevMove);
      
      this.isUndoing = true;
      this.executeMoves();      
    } else {
      console.log("Cube is reset!");
    }
  } else {
    console.log("Already moving!");
  }
}
