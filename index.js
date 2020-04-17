const express = require('express');
const socket = require('socket.io');

require('dotenv').config()

const port = process.env.PORT;

let app = express();

let server = app.listen(port, () => {

  console.log('listening on port ' + port);

});

app.use(express.static('public'));

let io = socket(server);

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let actualWidth = process.env.MAP_WIDTH;
let actualHeight = process.env.MAP_HEIGHT;

let blobs = [];
let eaten_blob_indices = [];
let players = [];

let maxBlobs = process.env.FOOD;

for (let x = 0; x < maxBlobs; x++) {

  blobs.push({
    x: getRandomInt(-actualWidth / 2, actualWidth / 2),
    y: getRandomInt(-actualHeight / 2, actualHeight / 2),
    color: 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)'
  });

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

  // if (blobs.length < maxBlobs) {
  //   blobs.push({
  //     x: getRandomInt(-actualWidth / 2, actualWidth / 2),
  //     y: getRandomInt(-actualHeight / 2, actualHeight / 2),
  //     color: 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)'
  //   });
  // }

  for (player of players) {
    if (player.m > player.omass + player.mass / 20000) {
      player.m -= player.mass / 20000;
    }
  }

  io.emit('Players', players)

}

setInterval(secondOperations, 1000);

io.on('connection', (socket) => {

  console.log('New connection from', socket.id);

  let newPlayer = {
    x: random(-actualWidth/2, actualWidth/2),
    y: random(-actualHeight/2, actualHeight/2),
    m: 5,
    omass: 5,
    color: 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)',
    id: socket.id,
    name: socket.handshake.query.name
  };

  players.push(newPlayer);

  socket.emit('playerData', newPlayer);

  socket.emit('blobData', blobs);

  socket.on('mouseData', (data) => {

    let playerIndex = findPlayerIndex(socket.id);

    let player = players[playerIndex];

    let playerR = Math.sqrt(player.m / Math.PI) * 40;

    if (player.x <= -actualWidth / 2) {
      player.x = -actualWidth / 2;
    }
    if (player.x >= actualWidth / 2) {
      player.x = actualWidth / 2;
    }
    if (player.y <= -actualHeight / 2) {
      player.y = -actualHeight / 2;
    }
    if (player.y >= actualHeight / 2) {
      player.y = actualHeight / 2;
    }

    let vel = {x: data.mX - data.canvas.w / 2, y: data.mY - data.canvas.h / 2};

    let velMag = Math.sqrt(vel.x*vel.x + vel.y*vel.y);

    vel.x /= velMag;
    vel.y /= velMag;

    vel.x *= 2.2 * Math.pow(player.m, -0.439)*15;
    vel.y *= 2.2 * Math.pow(player.m, -0.439)*15;

    player.x += vel.x;
    player.y += vel.y;

    let index = 0;
    for (blob of blobs) {

      if (blob.x >= player.x - playerR && blob.x <= player.x + playerR && blob.y >= player.y - playerR && blob.y <= player.y + playerR) {
        let side1 = blob.x - player.x;

        let side2 = blob.y - player.y;

        if (Math.sqrt(side1 * side1 + side2 * side2) < playerR + Math.sqrt(1 / Math.PI) * 40) {

          blobs.splice(index, 1);
          eaten_blob_indices.push(index);

          player.m += 1;

        }
      }
      index++;

    }

    index = 0;
    for (otherplayer of players) {

      if (otherplayer.id != player.id) {

        let side1 = otherplayer.x - player.x;

        let side2 = otherplayer.y - player.y;

        let otherplayerR = Math.sqrt(otherplayer.m / Math.PI) * 40;

        if (Math.sqrt(side1 * side1 + side2 * side2) < playerR && playerR > otherplayerR + otherplayerR / 4) {

          player.m += otherplayer.m;

          let newPlayer = {
            x: random(-actualWidth/2, actualWidth/2),
            y: random(-actualHeight/2, actualHeight/2),
            m: 5,
            omass: 5,
            color: 'hsl(' + Math.floor(255 * Math.random()) + ',100%,50%)',
            id: otherplayer.id,
            name: otherplayer.name
          };

          players[index] = newPlayer;

          io.sockets.connected[otherplayer.id].emit('playerData', newPlayer);

        }

      }
      index++;

    }

    socket.emit('playerData', player);
    io.emit('eatenBlobs', eaten_blob_indices);

    eaten_blob_indices = [];

  })

  socket.on('disconnect', () => {
    console.log(socket.id, "has disconnected");
    players.splice(findPlayerIndex(socket.id), 1);
  });

})
