function Rubik(dimensions) {
	this.allCubes = [];
	this.allCubes.push(newCube(0, 0, 0));
}

function newCube(x, y, z) {
	var cubeGeometry = new THREE.BoxGeometry(1, 1, 1);
	var cubeMaterial = new THREE.MeshBasicMaterial({ color: "#433F81" });
	cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

  cube.castShadow = true;

  cube.position = new THREE.Vector3(x, y, z);
  cube.rubikPosition = cube.position.clone();

  return cube;
}