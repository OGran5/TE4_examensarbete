export class Sprite {
  constructor({ position, imageSrc, scale = 1 }) {
    this.position = position;
    this.scale = scale;
    this.loaded = false;
    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
    };
    this.image.onload = () => {
      this.width = this.image.width * this.scale;
      this.height = this.image.height * this.scale;
      this.loaded = true;
    };
    this.image.src = imageSrc;
  }

  draw(context) {
  if (!this.loaded || !this.image) return;
  context.drawImage(
    this.image,
    this.position.x,
    this.position.y,
    this.width,
    this.height
  );
}

  update(context) {
    this.draw(context);
  }
}
