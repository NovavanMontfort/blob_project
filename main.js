//imports
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import gsap from 'gsap'

//canvas en renderer
const canvas = document.getElementById('webgl')
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.outputEncoding = THREE.sRGBEncoding

//scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0xeeeeee)

//camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
)
camera.position.set(2, 1.5, 10)
scene.add(camera)

//orbitControls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

//licht
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
directionalLight.position.set(5, 5, 5)
scene.add(directionalLight)

//raycaster en muis variabelen
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

//variabelen om de blob te tracken en rotatie te beheren
let blobMesh = null
let isHovering = false
let lastMousePos = new THREE.Vector2()
let rotationVelocity = new THREE.Vector2(0, 0)

//GLTF Loader laad de blob en bewaar de referentie in blobMesh
const loader = new GLTFLoader()
loader.load(
  '/models/blob.glb', //zorg dat blob.glb in de juiste map staat
  (gltf) => {
    blobMesh = gltf.scene
    scene.add(blobMesh)

    //centering en scaling
    blobMesh.position.set(0, 0, 0)
    blobMesh.scale.set(0.04, 0.04, 0.04) //sizing van blob
  },
  undefined,
  (error) => {
    console.error('Fout bij laden model:', error)
  }
)

//muis beweging event listener
window.addEventListener('mousemove', (event) => {
  //zet muispositie om naar normalized device coordinates (-1 tot 1)
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

  if (!blobMesh) return //als blob nog niet geladen, doe niks

  //raycaster update met muis en camera
  raycaster.setFromCamera(mouse, camera)

  //check of muis over de blob is
  const intersects = raycaster.intersectObject(blobMesh, true)
  if (intersects.length > 0) {
    isHovering = true

    if (lastMousePos.x !== undefined && lastMousePos.y !== undefined) {
      //bereken delta beweging van muis
      const deltaX = mouse.x - lastMousePos.x
      const deltaY = mouse.y - lastMousePos.y

      //voor zachte overgang naar nieuwe rotatie snelheid
      rotationVelocity.x = THREE.MathUtils.lerp(rotationVelocity.x, -deltaY, 0.1) // *-1 hier om de richting te fixen
      rotationVelocity.y = THREE.MathUtils.lerp(rotationVelocity.y, deltaX, 0.1)

    }
    lastMousePos.set(mouse.x, mouse.y)
  } else {
    isHovering = false
    //zet rotatie velocity langzaam terug naar nul wanneer niet hoveren
    rotationVelocity.multiplyScalar(0.9)
  }
})

//resize gedrag
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

//animatie loop
function animate() {
  requestAnimationFrame(animate)

  if (blobMesh) {
    if (isHovering) {
      //pas rotatie toe gebaseerd op muis beweging
      blobMesh.rotation.x += rotationVelocity.x * 0.7
      blobMesh.rotation.y += rotationVelocity.y * 0.7
    } else {
      //als niet hoveren, zorg dat rotatie langzaam stopt
      rotationVelocity.multiplyScalar(0.97)
      blobMesh.rotation.x += rotationVelocity.x * 0.9
      blobMesh.rotation.y += rotationVelocity.y * 0.9
    }
  }

  controls.update()
  renderer.render(scene, camera)
}

animate()

//instellingen schaal limits
const minScale = 0.05;  //let op: kleiner dan maxScale
const maxScale = 0.2;

//camera positie limits
const minCameraZ = 5;
const maxCameraZ = 15;

window.addEventListener('wheel', (event) => {
  if (!blobMesh) return;

  const delta = event.deltaY * 0.01; //scroll snelheid

  //nieuwe schaal berekenen en clampen
  let newScale = blobMesh.scale.x - delta * 0.1;
  newScale = THREE.MathUtils.clamp(newScale, minScale, maxScale);

  blobMesh.scale.set(newScale, newScale, newScale);

  //pas camera positie aan en clampen
  let newCameraZ = camera.position.z + delta;
  newCameraZ = THREE.MathUtils.clamp(newCameraZ, minCameraZ, maxCameraZ);
  camera.position.z = newCameraZ;
});


