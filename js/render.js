if (!Detector.webgl) Detector.addGetWebGLMessage();

var container;
var stats;
var controls;
var camera, scene, renderer;
var time;

var cubeObject;
var cubeGeometry;
var cubeMaterial;

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

	// This gives us stats on how well the simulation is running
	stats = new Stats();
	container.appendChild(stats.domElement);

	// mouse controls
	controls = new THREE.TrackballControls(camera, renderer.domElement);

	// lights (fourth thing you need is lights)
	let light, materials;
	scene.add(new THREE.AmbientLight(0x666666));
	light = new THREE.DirectionalLight(0xdfebff, 1.75);
	light.position.set(50, 200, 100);
	light.position.multiplyScalar(1.3);
	light.castShadow = true;
	light.shadow.mapSize.width = 1024;
	light.shadow.mapSize.height = 1024;

	let d = 300;
	light.shadow.camera.left = -d;
	light.shadow.camera.right = d;
	light.shadow.camera.top = d;
	light.shadow.camera.bottom = -d;
	light.shadow.camera.far = 1000;

	scene.add(light);

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
	stats.update();
	controls.update();
}

function render() {
  let timer = Date.now() * 0.0002;

  let cubes = rubik.allCubes;
  for (let i = 0; i < cubes.length; i++) {
  	scene.add(cubes[i]);
  }

  camera.lookAt(scene.position);

  // Render the scene
  renderer.render(scene, camera);
}
