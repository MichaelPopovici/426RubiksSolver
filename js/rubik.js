/****************************** RUBIK PROPERTIES ******************************/
// Rubiks cube face colors (Orange, Red, Blue, Green, Yellow, White)
var colors = [0xFF5900, 0xB90000, 0x0045AD, 0x009B48, 0xFFD500, 0xFFFFFF];

var cubeSize = 0.5; // length of each cube side
var spacing = cubeSize / 100; // spacing between each cube

/****************************** HELPER FUNCTIONS ******************************/
function createCube(x, y, z) {
	/* TODO: color the inside faces of each cube black
	 * (Maybe color all faces black to begin with, then "whitelist" exterior faces)
	 */
	var faceMaterials = colors.map(function(c) {
		return new THREE.MeshLambertMaterial({ color: c });
	});
	var cubeGeometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
	cube = new THREE.Mesh(cubeGeometry, faceMaterials);
	cube.castShadow = true;

	cube.position.set(x, y, z);

	return cube;
}

/***************************** RUBIK *****************************/
function Rubik(dimensions) {
	this.allCubes = [];

	var len = cubeSize + spacing;
	var offset = (dimensions - 1) * len * 0.5;
	for (let i = 0; i < dimensions; i++) {
		for (let j = 0; j < dimensions; j++) {
			for (let k = 0; k < dimensions; k++) {
				var x = len * i - offset;
				var y = len * j - offset;
				var z = len * k - offset;
				this.allCubes.push(createCube(x, y, z));
			}
		}
	}
}