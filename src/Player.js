import { Sprite } from './Sprite.js';
import { collision, platformCollision } from './utils.js';

const gravity = 0.1;

export class Player extends Sprite {
  constructor({ position, collisionBlocks, platformCollisionBlocks, imageSrc, scale = 0.5 }) {
    super({ position, imageSrc, scale, frameRate: 1, frameBuffer: 1 });
    this.position = position;
    this.velocity = { x: 0, y: 1 };
    this.collisionBlocks = collisionBlocks;
    this.platformCollisionBlocks = platformCollisionBlocks;
    this.hitbox = {
      position: { x: this.position.x, y: this.position.y },
      width: 10,
      height: 10,
    };

    this.camerabox = {
      position: { x: this.position.x, y: this.position.y },
      width: 200,
      height: 80,
    };
  }

  updateCamerabox() {
    this.camerabox = {
      position: { x: this.position.x - 50, y: this.position.y },
      width: 200,
      height: 80,
    };
  }

  checkForHorizontalCanvasCollision() {
    if (
      this.hitbox.position.x + this.hitbox.width + this.velocity.x >= 576 ||
      this.hitbox.position.x + this.velocity.x <= 0
    ) {
      this.velocity.x = 0;
    }
  }

  shouldPanCameraToTheLeft({ canvas, camera }) {
    const cameraboxRightSide = this.camerabox.position.x + this.camerabox.width;
    const scaledDownCanvasWidth = canvas.width / 4;
    if (cameraboxRightSide >= 576) return;
    if (cameraboxRightSide >= scaledDownCanvasWidth + Math.abs(camera.position.x)) {
      camera.position.x -= this.velocity.x;
    }
  }

  shouldPanCameraToTheRight({ canvas, camera }) {
    if (this.camerabox.position.x <= 0) return;
    if (this.camerabox.position.x <= Math.abs(camera.position.x)) {
      camera.position.x -= this.velocity.x;
    }
  }

  shouldPanCameraDown({ canvas, camera }) {
    if (this.camerabox.position.y + this.velocity.y <= 0) return;
    if (this.camerabox.position.y <= Math.abs(camera.position.y)) {
      camera.position.y -= this.velocity.y;
    }
  }

  shouldPanCameraUp({ canvas, camera }) {
    if (this.camerabox.position.y + this.camerabox.height + this.velocity.y >= 432) return;
    const scaledCanvasHeight = canvas.height / 4;
    if (this.camerabox.position.y + this.camerabox.height >= Math.abs(camera.position.y) + scaledCanvasHeight) {
      camera.position.y -= this.velocity.y;
    }
  }

  update(context) {
    this.updateHitbox();
    this.updateCamerabox();
    this.draw(context);

    this.position.x += this.velocity.x;
    this.updateHitbox();
    this.checkForHorizontalCollisions();
    this.applyGravity();
    this.updateHitbox();
    this.checkForVerticalCollisions();
  }

  updateHitbox() {
    this.hitbox = {
      position: { x: this.position.x + 35, y: this.position.y + 26 },
      width: 14,
      height: 27,
    };
  }

  checkForHorizontalCollisions() {
    for (const block of this.collisionBlocks) {
      if (collision({ object1: this.hitbox, object2: block })) {
        if (this.velocity.x > 0) {
          this.velocity.x = 0;
          const offset = this.hitbox.position.x - this.position.x + this.hitbox.width;
          this.position.x = block.position.x - offset - 0.01;
          break;
        } else if (this.velocity.x < 0) {
          this.velocity.x = 0;
          const offset = this.hitbox.position.x - this.position.x;
          this.position.x = block.position.x + block.width - offset + 0.01;
          break;
        }
      }
    }
  }

  applyGravity() {
    this.velocity.y += gravity;
    this.position.y += this.velocity.y;
  }

  checkForVerticalCollisions() {
    for (const block of this.collisionBlocks) {
      if (collision({ object1: this.hitbox, object2: block })) {
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
          this.position.y = block.position.y - offset - 0.01;
          break;
        } else if (this.velocity.y < 0) {
          this.velocity.y = 0;
          const offset = this.hitbox.position.y - this.position.y;
          this.position.y = block.position.y + block.height - offset + 0.01;
          break;
        }
      }
    }

    for (const block of this.platformCollisionBlocks) {
      if (platformCollision({ object1: this.hitbox, object2: block })) {
        if (this.velocity.y > 0) {
          this.velocity.y = 0;
          const offset = this.hitbox.position.y - this.position.y + this.hitbox.height;
          this.position.y = block.position.y - offset - 0.01;
          break;
        }
      }
    }
  }
}
