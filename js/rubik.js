/****************************** RUBIK PROPERTIES ******************************/
// Rubiks cube face colors (Orange, Red, Blue, Green, Yellow, White)
var COLORS = [0xFF5900, 0xB90000, 0x0045AD, 0x009B48, 0xFFD500, 0xEEEEEE];

var CUBE_SIZE = 0.5; // length of each cube side
var SPACE_BETWEEN_CUBES = CUBE_SIZE / 100; // spacing between each cube

// TODO: Allow user to choose rotation speed
var ROTATION_SPEED = 0.15; // speed of cube rotation

// https://stackoverflow.com/questions/20089098/three-js-adding-and-removing-children-of-rotated-objects
var pivot = new THREE.Object3D();

var EPS = 0.01;

/****************************** HELPER FUNCTIONS ******************************/
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

/***************************** RUBIK *****************************
*
* NOTATION
*
* UPPERCASE = Turn clockwise 90 degree
* lowercase = Turn counterclockwise 90 degree
* 
* F   Front
* B   Back
* 
* L   Left
* R   Right
* 
* U   Up
* D   Down
*
* NOTATION REFERENCE:
* https://ruwix.com/the-rubiks-cube/notation/
*/
function Rubik(dimensions, texture, specular) {
  this.dimensions = dimensions; // number of cubes per row/column
  this.cubes = []; // list of cubes in the Rubik's cube
  this.moves = []; // queue of moves to execute
  this.currentMove = {}; // current move to execute
  this.activeCubes = []; // list of cubes to be rotated
  this.isMoving = false; // is a move being executed?
  this.completedMoves = []; // stack of completed moves
  this.isUndoing = false; // are we undoing a move?
  this.isSolving = false; // are we solving the Rubik's cube?
  this.texture = parseInt(texture); // texture of the stickers
  this.coordinates = []; // list of possible values that x, y, z components can take
  this.specular = specular; // specular highlights for phong texture

  var len = CUBE_SIZE + SPACE_BETWEEN_CUBES;
  var offset = (dimensions - 1) * len * 0.5;
  // set this.coordinates
  for (let i = 0; i < dimensions; i++) {
    this.coordinates.push(len * i - offset);
  }
  
  // create cubes
  for (let i = 0; i < dimensions; i++) {
    for (let j = 0; j < dimensions; j++) {
      for (let k = 0; k < dimensions; k++) {
        var x = len * i - offset;
        var y = len * j - offset;
        var z = len * k - offset;
        this.createCube(x, y, z);
      }
    }
  }
}

Rubik.prototype.createCube = function(x, y, z) {
  var cubeGeometry = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
  for (var i = 0; i < 3; i++) {
    cubeGeometry.faces[ i ].color.setHex( 0xffffff );
  }
  cubeGeometry.colorsNeedUpdate = true;

  var faceMaterials = [];
  // Default basic texture
  if (this.texture === -1) {  
    faceMaterials = COLORS.map(function(c) {
      return new THREE.MeshBasicMaterial({ color: c });
    });
  }
  else if (this.texture === 4) {
    faceMaterials = COLORS.map(function(c) {
      return new THREE.MeshLambertMaterial({ color: c });
    });
  }
  // Phong texture
  else if (this.texture === 1) {
    var specular = this.specular;
    faceMaterials = COLORS.map(function(c) {
      return new THREE.MeshPhongMaterial( { color: c, specular: specular, shininess: 30} );
    });
  }
  // Gradient texture
  else if (this.texture === 2) {
    for (let i = 0; i < COLORS.length; i++) {
      var c = COLORS[i];

      var color_1;
      var color_2;
      for (let j = 0; j < this.dimensions; j++) {
        if (equal(y, this.coordinates[j])) {
          color_1 = new THREE.Color(c).addScalar(j / this.dimensions);
          color_2 = new THREE.Color(c).addScalar((j + 1) / this.dimensions);
        }
      }

      // https://discourse.threejs.org/t/rendering-a-gradient-material-using-threejs-and-glsl/602/3
      var material = new THREE.ShaderMaterial({
        uniforms: {
          color1: {
            value: color_1
          },
          color2: {
            value: color_2
          }
        },
        vertexShader: `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 color1;
          uniform vec3 color2;
        
          varying vec2 vUv;
          
          void main() {
            
            gl_FragColor = vec4(mix(color1, color2, vUv.y), 1.0);
          }
        `,
        wireframe: false
      });

      faceMaterials.push(material);
    }
  }
  // Floral texture
  else if (this.texture === 3) {
    const loader = new THREE.TextureLoader();
    faceMaterials = [
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-1.png')}),
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-2.png')}),
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-3.png')}),
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-4.png')}),
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-5.png')}),
      new THREE.MeshBasicMaterial({map: loader.load('images/flower-6.png')}),
    ];
  }

  cube = new THREE.Mesh(cubeGeometry, faceMaterials);
  cube.castShadow = true;

  // add black edges to each cube
  var edgeGeometry = new THREE.EdgesGeometry(cube.geometry);
  var edgeMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
  var edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  cube.add(edges); // add edge as a child of the parent mesh

  cube.position.set(x, y, z);

  this.cubes.push(cube);
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
  if (this.completedMoves.length === 0) this.isSolving = false;
  
  this.executeMoves(); // execute the next move
}

Rubik.prototype.executeMoves = function() {
  if (this.moves.length > 0) {
    this.currentMove = this.moves.shift();
    this.executeCurrentMove();
  }
}

// --------------------------------------------------------
//                     RUBIK CONTROLS
// --------------------------------------------------------
// n: number of moves to simulate during shuffle
// TODO: Random shuffle sometimes undoes moves... Prevent this.
Rubik.prototype.shuffle = function(n) {
  if (! this.isMoving) {  
    for (let i = 0; i < n; i++) {
      var depth = randomInt(0, this.dimensions - 1);
      var direction = randomDirection();
      var axis = randomAxis();

      this.moves.push(new Move(depth, direction, axis));
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
  }
}

// Naive Sovler - undo all moves
// TODO: Write a generalised solve algorithm
Rubik.prototype.solve = function() {
  this.isSolving = true;
}

// Execute a sequence of moves
// sequence: a string denoting the moves to execute
Rubik.prototype.move = function(sequence) {
  if (this.isMoving) {
    console.log("Already moving!");
    return;
  }

  for (const move of sequence) {
    // rotate front face clockwise
    if (move === 'F') this.moves.push(new Move(2, -1, 'z'));
    // rotate front face counterclockwise
    else if (move === 'f') this.moves.push(new Move(2, 1, 'z'));
    // rotate back face clockwise
    else if (move === 'B') this.moves.push(new Move(0, 1, 'z'));
    // rotate back face countclockwise
    else if (move === 'b') this.moves.push(new Move(0, -1, 'z'));

    // rotate left face clockwise
    else if (move === 'L') this.moves.push(new Move(0, 1, 'x'));
    // rotate left face counterclockwise
    else if (move === 'l') this.moves.push(new Move(0, -1, 'x'));
    // rotate right face clockwise
    else if (move === 'R') this.moves.push(new Move(2, -1, 'x'));
    // rotate right face counterclockwise
    else if (move === 'r') this.moves.push(new Move(2, 1, 'x'));
    
    // rotate top face clockwise
    else if (move === 'U') this.moves.push(new Move(2, -1, 'y'));
    // rotate top face counterclockwise
    else if (move === 'u') this.moves.push(new Move(2, 1, 'y'));
    // rotate bottom face clockwise
    else if (move === 'D') this.moves.push(new Move(0, 1, 'y'));
    // rotate bottom face counterclockwise
    else if (move === 'd') this.moves.push(new Move(0, -1, 'y'));
  }

  this.executeMoves();
}
