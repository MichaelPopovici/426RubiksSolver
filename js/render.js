if (!Detector.webgl) Detector.addGetWebGLMessage();

var container;
var controls;
var camera, scene, renderer;

var cubeObject;
var cubeGeometry;
var cubeMaterial;

var DIMENSIONS = 3; // default is a 3x3 cube
var rubik;

// list of premade patterns
var PATTERNS = ["ffBBllRRuuDD", "lRfBuDlR", "ffBBllRRuuDDlRfBuDlR"]; 

init();
animate();

function init() {
  container = document.createElement("div");
  document.body.appendChild(container);

  // Create an empty scene
  scene = new THREE.Scene();

  // Create a basic perspective camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(1.9, 1.9, 3);

  scene.add(camera);

  // Create a renderer with Antialiasing
  renderer = new THREE.WebGLRenderer({ antialias: true, devicePixelRatio: 1 });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0xcce0ff);

  container.appendChild(renderer.domElement);
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  // mouse controls
  controls = new THREE.TrackballControls(camera, renderer.domElement);

  // lights
  scene.add(new THREE.AmbientLight(0xffffff));

  // Add Rubik's cube
  addRubiksCube();

  // event listeners
  addEventListeners();
}

function addRubiksCube(size, texture) {
  size = size || DIMENSIONS;
  texture = texture || -1;
  rubik = new Rubik(size, texture);
  let cubes = rubik.cubes;
  for (let i = 0; i < cubes.length; i++) {
    scene.add(cubes[i]);
  }
}

function removeRubiksCube() {
  let cubes = rubik.cubes;
  for (let i = 0; i < cubes.length; i++) {
    scene.remove(cubes[i]);
  }
}

function addEventListeners() {
  window.addEventListener("resize", onWindowResize, false);

  document.addEventListener("keydown", onKeyDown, false);

  // TODO: Allow user to select number of moves for shuffle
  $("#button-shuffle").on('click', function(e) {
    e.preventDefault();
    var nMoves = 20 + Math.floor(20 * Math.random());
    rubik.shuffle(nMoves);
  });

  $("#button-solve").on('click', function(e) {
    e.preventDefault();
    rubik.solve();
  });

  $("#button-undo").on('click', function(e) {
    e.preventDefault();
    rubik.undo();
  });

  $("#button-reset").on('click', function(e) {
    e.preventDefault();
    if (! rubik.isMoving) {    
      removeRubiksCube();
      addRubiksCube($("#select-size").val());
      $("#select-pattern").val(-1);
      $("#select-texture").val(-1);
    }
  });

  $("#select-size").on('change', function() { 
    if (! rubik.isMoving) {    
      removeRubiksCube();
      addRubiksCube($(this).val(), $("#select-texture").val());
      $("#select-pattern").val(-1);

      // hide patterns for cubes bigger than 3x3
      if ($(this).val() !== "3") {
        $("#pattern-li").hide()
      } else {
        $("#pattern-li").show()
      }
    }
  });

  $("#select-pattern").on('change', function() { 
    if (! rubik.isMoving) {
      var patternIndex = $(this).val();
      if (patternIndex !== -1) {
        rubik.move(PATTERNS[patternIndex]);
      }
    }
  });

  $("#select-background").on('change', function() { 
      var backgroundIndex = $(this).val();
      var loader = new THREE.TextureLoader();
      if (backgroundIndex == -1) {
        scene.background = {};
      }
      if (backgroundIndex == 0) {
        loader.load('images/cos426.png' , function(texture) {
          texture.flipY = false;
          scene.background = texture;
        });
      }
      if (backgroundIndex == 1) {
        loader.load('images/flower.png' , function(texture) {
          scene.background = texture;
        });
      }
      if (backgroundIndex == 2) {
        loader.load('images/grid.png' , function(texture) {
          scene.background = texture;
        });
      }
      if (backgroundIndex == 3) {
        loader.load('images/rayTracer.png' , function(texture) {
          scene.background = texture;
        });
      }
      if (backgroundIndex == 4) {
        loader.load('images/wireKettle.png' , function(texture) {
          scene.background = texture;
        });
      }
      if (backgroundIndex == 5) {
        loader.load('images/cloth.png' , function(texture) {
          scene.background = texture;
        });
      }
      if (backgroundIndex == 6) {
        loader.load('images/finkel.png' , function(texture) {
          scene.background = texture;
        });
      }
  });

  $("#select-texture").on('change', function() { 
    if (! rubik.isMoving) {
      removeRubiksCube();
      addRubiksCube($("#select-size").val(), $(this).val());
      $("#select-pattern").val(-1);
    }
  });
}

function onKeyDown(event) {
  var key = event.key;
  if (key.length === 1) {
    rubik.move(event.key);
  }
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  render();
  controls.update();
}

function render() {
  camera.lookAt(scene.position);

  if (rubik.isMoving) {
    rubik.rotate();
  }

  if (rubik.isSolving) {
    rubik.undo();
  }

  // Render the scene
  renderer.render(scene, camera);
}
