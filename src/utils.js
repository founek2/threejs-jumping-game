export const onKeyDown = (movement, velocity) =>
      function(event) {
            switch (event.keyCode) {
                  case 38: // up
                  case 87: // w
                        movement.moveForward = true;
                        break;

                  case 37: // left
                  case 65: // a
                        movement.moveLeft = true;
                        break;

                  case 40: // down
                  case 83: // s
                        movement.moveBackward = true;
                        break;

                  case 39: // right
                  case 68: // d
                        movement.moveRight = true;
                        break;

                  case 32: // space
                        if (movement.canJump === true) velocity.y += 320;
                        movement.canJump = false;
                        break;
                  case 16: // shift
                        movement.flyDown = true;
                        break;
            }
      };

export const onKeyUp = movement =>
      function(event) {
            switch (event.keyCode) {
                  case 38: // up
                  case 87: // w
                        movement.moveForward = false;
                        break;

                  case 37: // left
                  case 65: // a
                        movement.moveLeft = false;
                        break;

                  case 40: // down
                  case 83: // s
                        movement.moveBackward = false;
                        break;

                  case 39: // right
                  case 68: // d
                        movement.moveRight = false;
                        break;
                  case 16: // shift
                        movement.flyDown = false;
                        break;
            }
      };

export const setupPointerLock = (blocker, instructions, controlsEnabled, controls) => {
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
                  } else {
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
};
