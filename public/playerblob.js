class Player extends BlobBody {

  constructor(x, y, m, id, name) {

    super(x, y, m);

    this.id = id;

    this.name = name;

    this.won = false;

  }

}

Player.prototype.show = function(ctx) {

  ctx.beginPath();

  this.r = Math.sqrt(player.mass / Math.PI) * 40;

  ctx.fillStyle = this.color;
  ctx.arc(this.pos.x, this.pos.y, this.r, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = 'white';

  let fontSize = 20*(this.r/this.originalR);

  ctx.font = fontSize+"px Ariel";
  ctx.fillText(Math.floor(this.mass), this.pos.x-fontSize/2, this.pos.y+this.r/2);

  ctx.fillStyle = 'black';
  ctx.fillText(this.name, this.pos.x-fontSize/2*this.name.length/2, this.pos.y+this.r);



  ctx.closePath();

}

Player.prototype.setData = function(data) {

  this.pos.x = data.x;
  this.pos.y = data.y;
  this.mass = data.m;
  this.color = data.color;
  this.id = data.id;
  this.name = data.name;

}