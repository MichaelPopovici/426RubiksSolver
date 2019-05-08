if (!Detector.webgl) Detector.addGetWebGLMessage();

var container;
var controls;
var camera, scene, renderer;
var time;

var cubeObject;
var cubeGeometry;
var cubeMaterial;

var DIMENSIONS = 3;
var rubik = new Rubik(DIMENSIONS);

init();
animate();

function init() {
 	container = document.createElement("div");
	document.body.appendChild(container);

	// Create an empty scene
	scene = new THREE.Scene();

	// Create a basic perspective camera
	camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
	camera.position.z = 4;

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

	// Add Rubiks cube
  let cubes = rubik.allCubes;
  for (let i = 0; i < cubes.length; i++) {
  	scene.add(cubes[i]);
  }

	// event listeners
	window.addEventListener("resize", onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
	requestAnimationFrame(animate);

	time = Date.now();

	simulate();
	render();
	controls.update();
}

function render() {
  let timer = Date.now() * 0.0002;

  camera.lookAt(scene.position);

  // Render the scene
  renderer.render(scene, camera);
}
