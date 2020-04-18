const canvas = document.getElementById('game');

const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const actualWidth = 30000;
const actualHeight = 30000;

let map = new Map(0, 0, 200, 200);

let blobs = [];

let player = new Player(0, 0, 5, 0, 'a');

let otherPlayers = [];

let leaderboard = [];

let mouseX = null;
let mouseY = null;

document.addEventListener('mousemove', (e) => {

  mouseX = e.clientX;
  mouseY = e.clientY;

});

var socket = io();

var startDiv = document.getElementById("start");
var nameStr = document.getElementById("name");
var button = document.getElementById("startbtn");

button.addEventListener('click', () => {

  socket.emit('init', {
    name: nameStr.value || 'Player', canvas: {
      w: canvas.width,
      h: canvas.height
    }
  });

  startDiv.innerHTML = "";

  setInterval(main, 10);

});

socket.on('playerData', (data) => {

  player.setData(data);

});

socket.on('Players', (data) => {

  otherPlayers = [];
  for (let i = 0; i < data.length; i++) {

    if (data[i].id != player.id) {

      let newPlayer = new Player(data[i].pos.x, data[i].pos.y, data[i].m, data[i].id, data[i].name);
      newPlayer.color = data[i].color;
      newPlayer.originalR = data.originalR;

      otherPlayers.push(newPlayer);

    }
  }

})

socket.on('blobData', (data) => {

  blobs = [];
  for (let x = 0; x < data.length; x++) {

    let b = new BlobBody(data[x].x, data[x].y, 1);
    b.color = data[x].color;

    blobs.push(b);

  }

});

socket.on('eatenBlobs', (data) => {

  for (index of data) {

    blobs.splice(index, 1);

  }

});

socket.on('leaderboardData', (data)=> {

  leaderboard=data;

})

function main() {

  ctx.fillStyle = 'white';
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fill();

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(player.originalR / player.r, player.originalR / player.r);
  ctx.translate(-player.pos.x, -player.pos.y);

  ctx.beginPath();
  ctx.fillStyle = 'black';
  ctx.strokeRect(-actualWidth / 2, -actualHeight / 2, actualWidth, actualHeight);
  ctx.stroke();
  ctx.closePath();

  for (blob of blobs) {

    if (blob.inWindow(player.pos.x, player.pos.y, canvas.width * (player.r / player.originalR), canvas.height * (player.r / player.originalR))) {
      blob.show(ctx);
    }

  }

  for (oplayer of otherPlayers) {

    oplayer.show(ctx);

  }

  player.show(ctx);

  ctx.setTransform(1, 0, 0, 1, 0, 0);

  map.show(ctx, player.pos.x, player.pos.y, player.r, actualWidth, actualHeight);

  ctx.fillStyle = "rgba(57, 59, 60, 0.3)";

  ctx.rect(canvas.width-350, 0, 300, 400);

  ctx.fill();

  ctx.fillStyle = 'black';
  ctx.font = "bold 30px Helvetica";

  ctx.fillText("Leaderboard", canvas.width-295, 30);

  for (let i = 0; i < leaderboard.length; i++) {

    ctx.fillText(i+1+". "+leaderboard[i].name+": "+leaderboard[i].score, canvas.width-340, 70+i*30);

  }

  socket.emit('mouseData', {
    mX: mouseX,
    mY: mouseY,
  });

}
