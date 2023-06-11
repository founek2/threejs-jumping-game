import * as THREE from 'three';
import Stats from 'stats-js';
import file from './checkered.png';
import ThreePointerlock from 'three-pointerlock';
import { map, forEach } from 'ramda';
import Character from './Character';
import { setupPointerLock } from './utils';
import { onKeyDown, onKeyUp } from './utils';
import waterTexture from './textures/water.jpg';

const statsMS = new Stats();
const statsFPS = new Stats();

//init();
//initStats();
//animate();

function initStats() {
      statsMS.setMode(1); // Panel 1 = ms
      statsMS.domElement.style.cssText = 'position:absolute;top:0px;right:0px;';
      document.body.appendChild(statsMS.domElement);
      statsFPS.setMode(0); // Panel 0 = fps
      statsFPS.domElement.style.cssText = 'position:absolute;top:0px;left:0px;';
      document.body.appendChild(statsFPS.domElement);
}
function beginStats() {
      statsMS.begin();
      statsFPS.begin();
}
function endStats() {
      statsFPS.end();
      statsMS.end();
}

var camera, scene, renderer, controls;

var raycasterUp, raycasterDown, raycaster3;

var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');
var floorHolder = 0;
// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

var havePointerLock =
      'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

if (havePointerLock) {
      var element = document.body;

      var pointerlockchange = function(event) {
            if (
                  document.pointerLockElement === element ||
                  document.mozPointerLockElement === element ||
                  document.webkitPointerLockElement === element
            ) {
                  controlsEnabled = true;
                  controls.enabled = true;

                  blocker.style.display = 'none';
                  animate(true);
            } else {
                  controlsEnabled = false;
                  controls.enabled = false;

                  blocker.style.display = 'block';

                  instructions.style.display = '';
            }
      };

      var pointerlockerror = function(event) {
            instructions.style.display = '';
      };

      // Hook pointer lock state change events
      document.addEventListener('pointerlockchange', pointerlockchange, false);
      document.addEventListener('mozpointerlockchange', pointerlockchange, false);
      document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

      document.addEventListener('pointerlockerror', pointerlockerror, false);
      document.addEventListener('mozpointerlockerror', pointerlockerror, false);
      document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

      instructions.addEventListener(
            'click',
            function(event) {
                  instructions.style.display = 'none';

                  // Ask the browser to lock the pointer
                  element.requestPointerLock =
                        element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
                  element.requestPointerLock();
            },
            false
      );
} else {
      instructions.innerHTML = "Your browser doesn't seem to support Pointer Lock API";
}

var controlsEnabled = false;
var movement = {
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveLeft: false,
      moveRight: false,
      canJump: false,
      flyDown: false
};

var prevTime = performance.now();
var velocity = new THREE.Vector3();
var direction = new THREE.Vector3();
const objects = [];
var score = 0;
var character;

function init() {
      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000);

      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xd3dade);
      scene.fog = new THREE.Fog(0xd3dade, 0, 600);

      var light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 0.75);
      light.position.set(0.5, 1, 0.75);
      scene.add(light);

      character = new Character(camera, scene, objects);
      controls = character.controls;

      document.addEventListener('keydown', onKeyDown(movement), false);
      document.addEventListener('keyup', onKeyUp(movement), false);

      raycasterDown = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
      raycasterUp = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, 1, 0), 0, 10);

      // floor

      var floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100);
      floorGeometry.rotateX(-Math.PI / 2);

      /*   for (var i = 0, l = floorGeometry.vertices.length; i < l; i++) {
            var vertex = floorGeometry.vertices[i]; // jednotlivé segmenty geometrie a následná deformace
            vertex.x += Math.random() * 20 - 10;
            vertex.y += Math.random() * 2;
            vertex.z += Math.random() * 20 - 10;
      }

      for (var i = 0, l = floorGeometry.faces.length; i < l; i++) {
            var face = floorGeometry.faces[i]; //segmenty na které se nastavuje barva, barevný model HSL (h, s, l)
            face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
      }

      var floorMaterial = new THREE.MeshBasicMaterial({
            vertexColors: THREE.VertexColors
      }); // aplikuje barvy podle face.vertexColors
*/

      var texture = new THREE.TextureLoader().load(waterTexture);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(50, 50);

      var floorMaterial = new THREE.MeshBasicMaterial( { map: texture } );

      var floor = new THREE.Mesh(floorGeometry, floorMaterial);
      floor.add(new THREE.AxesHelper(100));
      scene.add(floor);

      // objects

      var boxGeometry = new THREE.BoxGeometry(20, 10, 20);

      for (var i = 0, l = boxGeometry.faces.length; i < l; i++) {
            var face = boxGeometry.faces[i];
            face.vertexColors[0] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[1] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
            face.vertexColors[2] = new THREE.Color().setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
      }

      var boxPosit = [[0, 0, 0], [40, 20, 20], [50, 30, 30]];
      for (var i = 0; i < boxPosit.length; i++) {
            var boxMaterial = new THREE.MeshPhongMaterial({
                  specular: 0xffffff,
                  flatShading: true,
                  vertexColors: THREE.VertexColors
            });
            boxMaterial.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);

            var box = new THREE.Mesh(boxGeometry, boxMaterial);
            box.position.x = boxPosit[i][0];
            box.position.y = boxPosit[i][1];
            box.position.z = boxPosit[i][2];

            box.add(new THREE.AxesHelper(20));
            //    scene.add(box);
            //    objects.push(box);
      }
      var box2Geometry = new THREE.BoxGeometry(10, 30, 100);
      var box2Material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      var mesh = new THREE.Mesh(box2Geometry, box2Material);
      mesh.position.set(50, 0, 60);
      mesh.rotateY(Math.PI / 4);
      mesh.material.side = THREE.DoubleSide;

      var box3Geometry = new THREE.BoxGeometry(100, 30, 40);
      box3Geometry.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
      var box3Material = new THREE.MeshBasicMaterial({ color: 0xffffff });
      var mesh2 = new THREE.Mesh(box3Geometry, box3Material);
      mesh2.material.side = THREE.DoubleSide;
      // mesh2.material.side = THREE.BackSide;
      mesh2.position.set(80, 0, -30);
      scene.add(mesh);
      objects.push(mesh);

      scene.add(mesh2);
      objects.push(mesh2);

      //
      const boxMaterial2 = new THREE.MeshPhongMaterial({
            specular: 0xffffff,
            flatShading: true,
            vertexColors: THREE.VertexColors
      });
      boxMaterial2.color.setHSL(Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75);
      boxMaterial2.side = THREE.DoubleSide;
      const box2 = new THREE.Mesh(boxGeometry, boxMaterial2);
      generateBoxes(box2, 45, 30, scene, objects);

      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      document.body.appendChild(renderer.domElement);

      //

      window.addEventListener('resize', onWindowResize, false);
      animate(false);
}

function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(infinite = false) {
      if (infinite) {
            requestAnimationFrame(animate);
      } else {
            character.runProccesing(infinite);
      }

      if (controlsEnabled === true) {
            beginStats();
            character.runProccesing(infinite);
            endStats();
      }

      renderer.render(scene, camera);
}
initStats();
init();
animate(false);

/**
 *
 * @param {Mesh} box
 * @param {Number} maxDistance
 * @param {Number} count
 * @param {Scene} scene
 * @param {Array} objects
 */
function generateBoxes(box, maxDistance, count, scene, objects) {
      let initCoord = new THREE.Vector3(0, 0, 0);

      const boxGeometry = box.geometry;
      //random číslo pro vzdálenost
      //vygenerovat y pro blok a dopočítat zbylé souřadnice
      let counter = 0;

      while (counter < count) {
            const coord = randomCoord(boxGeometry.parameters);

            const newPosition = initCoord.clone().add(coord);

            const colision = checkColisions(newPosition, boxGeometry.parameters, initCoord);
            //   const colision = false;
            if (!colision && initCoord.distanceTo(newPosition) <= maxDistance) {
                  let boxx = new THREE.Mesh(box.geometry, box.material.clone());
                  boxx.position.set(newPosition.x, newPosition.y, newPosition.z);

                  boxx.add(new THREE.AxesHelper(20));
                  scene.add(boxx);
                  objects.push(boxx);
                  initCoord = newPosition.clone();

                  counter++;
            }
      }
}

function checkColisions(coord, boxParams, initCoord) {
      const { width, depth } = boxParams;
      const newX = coord.x;
      const newZ = coord.z;
      const newY = coord.y;

      let colision = false;

      const maxHeightDistance = 60;

      const filteredObjects = [];
      forEach(item => {
            if (newY - item.position.y < maxHeightDistance) {
                  filteredObjects.push(item);
            }
      }, objects);

      for (let i = 0; i < filteredObjects.length; i++) {
            let item = filteredObjects[i];
            const { x, z } = item.position;

            if ((x - newX < 10 && x - newX > -10) || (z - newZ < 10 && z - newZ > -10)) {
                  colision = true;
                  break;
            }
      }

      return colision;
      //return false;
}

function randomCoord(boxParams) {
      const { width, depth } = boxParams;
      const randNum = (canBeNegative, min = 1, max = 70) => {
            var num = Math.floor(Math.random() * max) + min; // this will get a number between 1 and 70;
            if (canBeNegative) num *= Math.floor(Math.random() * 2) == 1 ? 1 : -1; // this will add minus sign in 50% of cases
            return num;
      };

      const x = randNum(true, width / 2, 70);
      const y = randNum(false);
      const z = randNum(true, depth / 2, 80);

      return new THREE.Vector3(x, y, z);
}

setInterval(setScore, 500);

function setScore() {
      document.querySelector('.score').innerHTML = score;
}
