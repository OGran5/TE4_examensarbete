import { sendGameState,  connectToSignalingServer, createRoom, joinRoom, onRemoteUpdate } from './webrtc.js';
import { Player } from './Player.js';
import { Sprite } from './Sprite.js';
import { CollisionBlock } from './CollisionBlock.js';
import { floorCollisions, platformCollisions } from './collisions.js';
import { collision, platformCollision } from './utils.js';
let localPlayer;
let remotePlayer;


connectToSignalingServer();

function createLocalPlayer(config) {
  localPlayer = new Player(config);
}

function createRemotePlayer(config) {
  remotePlayer = new Player({ ...config, color: 'blue' });
}

onRemoteUpdate((state) => {
  if (!remotePlayer) return;
  remotePlayer.position.x = state.x;
  remotePlayer.position.y = state.y;
});

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

const scaledCanvas = {
  width: canvas.width / 4,
  height: canvas.height / 4,
};

const floorCollisions2D = [];
for (let i = 0; i < floorCollisions.length; i += 36) {
  floorCollisions2D.push(floorCollisions.slice(i, i + 36));
}

const collisionBlocks = [];
floorCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      collisionBlocks.push(
        new CollisionBlock({ position: { x: x * 16, y: y * 16 } })
      );
    }
  });
});

const platformCollisions2D = [];
for (let j = 0; j < platformCollisions.length; j += 36) {
  platformCollisions2D.push(platformCollisions.slice(j, j + 36));
}

const platformCollisionBlocks = [];
platformCollisions2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 202) {
      platformCollisionBlocks.push(
        new CollisionBlock({
          position: { x: x * 16, y: y * 16 },
          height: 4,
        })
      );
    }
  });
});

const gravity = 0.1;

const player = new Player({
  position: { x: 100, y: 300 },
  collisionBlocks,
  platformCollisionBlocks,
  imageSrc: './img/player.png',
});


const keys = {
  d: { pressed: false },
  a: { pressed: false },
};

const background = new Sprite({
  position: { x: 0, y: 0 },
  imageSrc: './img/background.png',
});

const backgroundImageHeight = 432;

const camera = {
  position: {
    x: 0,
    y: -backgroundImageHeight + scaledCanvas.height,
  },
};

function animate() {
  sendGameState({ x: player.position.x, y: player.position.y });
  if (remotePlayer) {
    remotePlayer.update();
    console.log('[SYNC] Remote player updated at', remotePlayer.position);
  }
  window.requestAnimationFrame(animate);
  c.fillStyle = 'white';
  c.fillRect(0, 0, canvas.width, canvas.height);

  c.save();
  c.scale(4, 4);
  c.translate(camera.position.x, camera.position.y);
  background.update(c);
  if (remotePlayer) {
    remotePlayer.update({ canvas, context: c, camera });
    remotePlayer.draw(c);
  }

  player.checkForHorizontalCanvasCollision();
  player.update(c);

  player.velocity.x = 0;
  if (keys.d.pressed) {player.velocity.x = 2;
    player.lastDirection = 'right';
    player.shouldPanCameraToTheLeft({ canvas, camera });
  } else if (keys.a.pressed) {player.velocity.x = -2;
    player.lastDirection = 'left';
    player.shouldPanCameraToTheRight({ canvas, camera });
  } else if (player.velocity.y === 0) {}

  if (player.velocity.y < 0) {
    player.shouldPanCameraDown({ camera, canvas });} else if (player.velocity.y > 0) {
    player.shouldPanCameraUp({ camera, canvas });}

  sendGameState({
    x: player.position.x,
    y: player.position.y,
    animation: player.image.src,
    frame: player.currentFrame,
    direction: player.lastDirection,
  });

  c.restore();
}

function updateRemotePlayer(data) {
  remotePlayer.position.x = data.x;
  remotePlayer.position.y = data.y;
  remotePlayer.image.src = data.animation;
  remotePlayer.currentFrame = data.frame;
  remotePlayer.lastDirection = data.direction;
}

connectToSignalingServer();
onRemoteUpdate((remoteState) => {
  if (remotePlayer) {
    remotePlayer.position.x = remoteState.x;
    remotePlayer.position.y = remoteState.y;
  }
});
onRemoteUpdate(updateRemotePlayer);

animate();

window.addEventListener('keydown', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = true; break;
    case 'a': keys.a.pressed = true; break;
    case 'w': player.velocity.y = -4; break;
  }
});

window.addEventListener('keyup', (event) => {
  switch (event.key) {
    case 'd': keys.d.pressed = false; break;
    case 'a': keys.a.pressed = false; break;
  }
});

onRemoteUpdate((remoteState) => {
  if (!remotePlayer) return;
  Object.assign(remotePlayer.position, remoteState.position);
  remotePlayer.velocity = remoteState.velocity;
});

onRemoteUpdate((remoteState) => {
  if (!remotePlayer) return;
  remotePlayer.position.x = remoteState.position.x;
  remotePlayer.position.y = remoteState.position.y;
  remotePlayer.velocity = remoteState.velocity;
});