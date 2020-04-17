function remap(OldValue, OldMin, OldMax, NewMin, NewMax) {


  let OldRange = (OldMax - OldMin);
  let NewRange = (NewMax - NewMin);
  let NewValue = (((OldValue - OldMin) * NewRange) / OldRange) + NewMin;

  return NewValue;

}


function Map(x,y,w,h) {

    this.pos = {
      x: x,
      y: y
    };

    this.w = w;
    this.h = h;

}

Map.prototype.show = function(ctx, player_x, player_y, r, map_w, map_h) {

  ctx.beginPath();

  ctx.strokeStyle = 'black';
  ctx.strokeRect(this.pos.x, this.pos.y, this.w, this.h);

  ctx.moveTo(this.pos.x + this.w / 2, 0);
  ctx.lineTo(this.pos.x + this.w / 2, this.h);
  ctx.stroke();
  ctx.moveTo(0, this.pos.y+this.h / 2);
  ctx.lineTo(this.w, this.pos.y+this.h / 2);
  ctx.stroke();

  ctx.fillStyle = 'red';
  ctx.rect(this.pos.x+remap(player_x,-map_w/2,map_w/2, 0, this.w), this.pos.y+remap(player_y,-map_h/2,map_h/2, 0, this.h), remap(r*2,0,map_w,0,this.w), remap(r*2,0,map_h,0,this.h));
  ctx.fill();



  ctx.closePath();
}
