import * as THREE from 'three';
import ThreePointerlock from 'three-pointerlock';
import { forEach } from 'ramda';
import { onKeyDown, onKeyUp } from './utils';

class Character {
      constructor(camera, scene, obstacles) {
            this.controls = new ThreePointerlock(camera);
            this.camera = camera;
            scene.add(this.controls.getObject());
            this.scene = scene;
            this.rays = [
                  new THREE.Vector3(0, 0, 1),
                  new THREE.Vector3(1, 0, 1),
                  new THREE.Vector3(1, 0, 0),
                  new THREE.Vector3(1, 0, -1),
                  new THREE.Vector3(0, 0, -1),
                  new THREE.Vector3(-1, 0, -1),
                  new THREE.Vector3(-1, 0, 0),
                  new THREE.Vector3(-1, 0, 1),
                  new THREE.Vector3(0, 1, 0), //up
                  new THREE.Vector3(0, -1, 0) //down
            ];
            this.colisionsDistance = 6;
            this.rayCaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, this.colisionsDistance);
            this.obstacles = obstacles;

            this.direction = new THREE.Vector3();
            this.velocity = new THREE.Vector3();
            this.kick = new THREE.Vector3();
            this.movement = {
                  moveForward: false,
                  moveBackward: false,
                  moveLeft: false,
                  moveLeft: false,
                  moveRight: false,
                  canJump: false,
                  flyDown: false
            };
            this.prevTime = performance.now();
            this.initKeyboard(this.movement, this.velocity);
      }
      initKeyboard(movement, velocity) {
            document.addEventListener('keydown', onKeyDown(movement, velocity), false);
            document.addEventListener('keyup', onKeyUp(movement), false);
      }
      runProccesing(render) {
            this.movement.canJump = false;
            this.calculateMovement(render);
      }
      checkColisions() {
            const { obstacles, rays } = this;
            const collisionRays = [[], [], [], [], [], [], [], [], [], []];
            const collisionsDistance = [[], [], [], [], [], [], [], [], [], []];
            const rotation = (this.controls.getObject().rotation.y * (360 / (2 * Math.PI))) % 360;
            const kvadrant = (rotation >= 0 ? rotation : 360 + rotation) / 45;

            const check = (ray, i) => {
                  for (let height = 0; height < 10; height++) {
                        this.rayCaster.set(this.controls.getObject().position, ray);

                        if (i === 8) {
                        } else if (i === 9) {
                              this.rayCaster.ray.origin.y -= 10;
                        } else {
                              this.rayCaster.ray.origin.y -= height;
                        }
                        if (i !== 8) this.rayCaster.ray.origin.y -= height;

                        const collisions = this.rayCaster.intersectObjects(obstacles);

                        if (collisions.length > 0) {
                              let cam = this.controls.getObject();
                              collisionRays[height][i] = true;
                              collisionsDistance[height][i] = collisions.map(col => col.distance);
                              switch (i) {
                                    case 0: // vzadu
                                          collisions.map(col => {
                                                if (col.distance < this.colisionsDistance - 1) {
                                                      this.kick.z = -this.colisionsDistance + 1 + col.distance;
                                                      //        this.kick.x = -this.colisionsDistance + 1 + col.distance;
                                                }
                                          });
                                          break;
                                    case 1: // pravo/vzadu
                                          break;
                                    case 2: // vpravo
                                          collisions.map(col => {
                                                if (col.distance < this.colisionsDistance - 1) {
                                                      this.kick.x = -this.colisionsDistance + 1 + col.distance;
                                                      //          cam.position.x += -this.colisionsDistance + 1 + col.distance;
                                                }
                                                //         this.kick.x = -this.colisionsDistance + 1 + col.distance;
                                          });
                                          break;
                                    case 3: // predek/pravo
                                          //distance je vzdálenost a musí se dopočítat pohyb na jednotlivých osách,
                                          // bude stejný pohyb na obou osách
                                          //znám výšku a musím dopočítat dvě stejné ramena -> stačí jedno, úhel znám 90/2 -> bum
                                          collisions.map(col => {
                                                if (col.distance < this.colisionsDistance - 1) {
                                                      const moveOneAxis =
                                                            Math.cos(Math.PI / 4) * (this.colisionsDistance - 1 - col.distance);
                                                      this.kick.x -= moveOneAxis;
                                                      this.kick.z = moveOneAxis;
                                                }
                                          });
                                          break;
                                    case 4: //vpredu
                                          collisions.map(col => {
                                                if (col.distance < this.colisionsDistance - 1) {
                                                      this.kick.z = this.colisionsDistance - 1 - col.distance;
                                                }
                                          });
                                          break;
                                    case 5: // levo/pravo
                                          break;
                                    case 6: // vlevo
                                          collisions.map(col => {
                                                if (col.distance < this.colisionsDistance - 1) {
                                                      this.kick.x = this.colisionsDistance - 1 - col.distance;
                                                }
                                          });
                                          break;
                                    case 7: // vzadu/levo
                                          break;
                                    case 8: // nad
                                          console.log('nad');
                                          this.velocity.y = Math.min(-9.8 * 50.0 * this.delta, this.velocity.y);

                                          break;
                                    case 9: // pod
                                          console.log('pod');
                                          this.movement.canJump = true;
                                          this.velocity.y = Math.max(0, this.velocity.y);
                                          for (var i = 0; i < collisions.length; i++) {
                                                collisions[i].object.material.color.set(0xff0000);
                                          }
                                          break;
                              }
                              //          console.log((cam.rotation.y * (360/ (2 * Math.PI))) % 360)
                        }
                  }
            };
            rays.forEach(check);
            collisionRays.forEach((item, i) => this.editMovement(item, kvadrant, collisionsDistance[i]));
      }
      calculateMovement(render) {
            let cam = this.controls.getObject();
            const movement = this.movement;
            var time = performance.now();
            var delta = (time - this.prevTime) / 1000;
            this.delta = delta;

            const fastConstant = cam.position.y === 10 ? 1600 : 800.0;
            const slowingConstant = fastConstant / 40;
            const massConstant = 100.0;

            this.velocity.x -= this.velocity.x * slowingConstant * delta;
            this.velocity.z -= this.velocity.z * slowingConstant * delta;

            this.velocity.y -= 9.8 * massConstant * delta; // 100.0 = mass

            this.direction.z = Number(movement.moveForward) - Number(movement.moveBackward);
            this.direction.x = Number(movement.moveLeft) - Number(movement.moveRight);
            this.direction.normalize(); // this ensures consistent movements in all directions

            if (movement.moveForward || movement.moveBackward) this.velocity.z -= this.direction.z * fastConstant * delta;
            if (movement.moveLeft || movement.moveRight) this.velocity.x -= this.direction.x * fastConstant * delta;

            render && this.checkColisions();

            cam.translateX(this.velocity.x * delta);
            cam.translateY(this.velocity.y * delta);
            cam.translateZ(this.velocity.z * delta);
            cam.position.x += this.kick.x;
            cam.position.z += this.kick.z;

            const ve = new THREE.Vector3();

            if (cam.position.y < 0 + 10 && !movement.flyDown) {
                  //pouze pro začátek kdy je kamera dole nebo se kamera dostane pod 10

                  this.velocity.y = 0;
                  //   console.log("dole")
                  cam.position.y = 0 + 10;

                  movement.canJump = true;
            }

            //     score = Math.floor(0, this.velocity.y);
            this.prevTime = time;
            this.kick = new THREE.Vector3();
      }
      editMovement(collisionRaysOneHeight, kvadrant, colDistances) {
            //   console.log(Math.floor(kvadrant));
            switch (Math.floor(kvadrant)) {
                  case 0:
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 1:
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 2:
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 3:
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 4:
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 5:
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 6:
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
                  case 7:
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[0]) {
                              this.velocity.x = Math.min(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[6] || collisionRaysOneHeight[4]) {
                              this.velocity.x = Math.max(0, this.velocity.x);
                        }
                        if (collisionRaysOneHeight[2] || collisionRaysOneHeight[4]) {
                              this.velocity.z = Math.max(0, this.velocity.z);
                        }
                        if (collisionRaysOneHeight[0] || collisionRaysOneHeight[6]) {
                              this.velocity.z = Math.min(0, this.velocity.z);
                        }
                        break;
            }
      }
}

export default Character;
