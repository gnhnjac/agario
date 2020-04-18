const express = require('express');
const socket = require('socket.io');
require('dotenv').config()

const port = process.env.PORT || 3000;

var app = express();

var server = app.listen(port, () => {

  console.log('listening on port ' + port);

});

app.use(express.static('public'));

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function blobData() {

  this.x = getRandomInt(-actualWidth / 2, actualWidth / 2);
  this.y = getRandomInt(-actualHeight / 2, actualHeight / 2);
  this.color = 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)'

}

function Vector(x, y) {

  this.x = x;
  this.y = y;

  this.Mag = Math.sqrt(x * x + y * y);

}

Vector.prototype.normalize = function () {

  this.x /= this.Mag;
  this.y /= this.Mag;

  this.Mag = 0;

}

Vector.prototype.setMag = function (m) {

  this.normalize();

  this.x *= m;
  this.y *= m;

  this.Mag = m;

}

Vector.prototype.add = function (v) {

  this.x += v.x;
  this.y += v.y;

  this.Mag = Math.sqrt(this.x * this.x + this.y * this.y);

}

Vector.prototype.set = function (x, y) {

  this.x = x;
  this.y = y;

  this.Mag = Math.sqrt(x * x + y * y);

}

Vector.prototype.limitX = function (min, max) {

  this.x = Math.min(Math.max(parseInt(this.x), min), max);

}

Vector.prototype.limitY = function (min, max) {

  this.y = Math.min(Math.max(parseInt(this.y), min), max);

}

function playerData(id, name, canvasW, canvasH) {

  this.pos = new Vector(getRandomInt(-actualWidth / 2, actualWidth / 2), getRandomInt(-actualHeight / 2, actualHeight / 2));

  this.m = 5;
  this.originalM = 5;

  this.r = Math.sqrt(this.m / Math.PI) * 40;
  this.originalR = this.r;

  this.color = 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)';

  this.id = id;

  this.name = name;

  this.canvas = { w: canvasW, h: canvasH };

}

playerData.prototype.acc = function (v) {

  this.pos.add(v);

  this.pos.limitX(-actualWidth / 2, actualWidth / 2);

  this.pos.limitY(-actualHeight / 2, actualHeight / 2);

}

playerData.prototype.addMass = function (m) {

  this.m += m;
  this.r = Math.sqrt(this.m / Math.PI) * 40;

}

playerData.prototype.shrink = function () {

  if (this.m > this.originalM + this.m / 20000) {

    this.addMass(-this.m / 20000);

  }

}

playerData.prototype.reset = function () {

  this.pos.set(getRandomInt(-actualWidth / 2, actualWidth / 2), getRandomInt(-actualHeight / 2, actualHeight / 2));

  this.m = 5;

  this.r = Math.sqrt(this.m / Math.PI) * 40;

  this.color = 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)';


}

playerData.prototype.see = function (blob) {

  return (blob.x >= this.pos.x - this.r && blob.x <= this.pos.x + this.r && blob.y >= this.pos.y - this.r && blob.y <= this.pos.y + this.r);

}

playerData.prototype.collideBlob = function (blob) {

  let side1 = blob.x - this.pos.x;

  let side2 = blob.y - this.pos.y;

  return (Math.sqrt(side1 * side1 + side2 * side2) < this.r + Math.sqrt(1 / Math.PI) * 40);

}

playerData.prototype.checkEat = function (otherplayer) {

  let side1 = otherplayer.pos.x - this.pos.x;

  let side2 = otherplayer.pos.y - this.pos.y;

  if (Math.sqrt(side1 * side1 + side2 * side2) < this.r && this.m > otherplayer.m * 1.25) {

    return true;

  }

  return false;

}

var io = socket(server);

let actualWidth = 30000;
let actualHeight = 30000;

let blobs = [];
let eaten_blob_indices = [];
let players = [];

let maxBlobs = process.env.FOOD;

for (let x = 0; x < maxBlobs; x++) {

  blobs.push(new blobData(getRandomInt(-actualWidth / 2, actualWidth / 2), getRandomInt(-actualHeight / 2, actualHeight / 2)));

}

function findPlayerIndex(id) {

  let index = 0;
  for (player of players) {

    if (player.id == id) {
      return index;
    }

    index++;

  }

}

function secondOperations() {

  for (player of players) {
    player.shrink();
  }

}

setInterval(secondOperations, 1000);

io.on('connection', (socket) => {

  console.log('New connection from', socket.id);

  socket.on('init', (data) => {

    let newPlayer = new playerData(socket.id, data.name, data.canvas.w, data.canvas.h);

    players.push(newPlayer);

    socket.emit('playerData', newPlayer);

    socket.emit('blobData', blobs);

  });

  socket.on('mouseData', (data) => {

    let playerIndex = findPlayerIndex(socket.id);

    let player = players[playerIndex];

    let vel = new Vector(data.mX - player.canvas.w / 2, data.mY - player.canvas.h / 2);

    vel.setMag(2.2 * Math.pow(player.r, -0.439) * 40);

    player.acc(vel);

    let index = 0;
    for (blob of blobs) {

      if (player.see(blob)) {

        if (player.collideBlob(blob)) {

          blobs.splice(index, 1);
          eaten_blob_indices.push(index);

          player.addMass(1);

        }
      }
      index++;

    }

    for (otherplayer of players) {

      if (otherplayer.id != player.id) {

        if(player.checkEat(otherplayer)) {
          
          player.addMass(otherplayer.m);

          otherplayer.reset();

          io.sockets.connected[otherplayer.id].emit('playerData', otherplayer);

        }

      }

    }

    socket.emit('playerData', player);
    io.emit('eatenBlobs', eaten_blob_indices);
    io.emit('Players', players);

    eaten_blob_indices = [];

  });

  socket.on('disconnect', () => {
    console.log(socket.id, "has disconnected");
    players.splice(findPlayerIndex(socket.id), 1);
  });

})
