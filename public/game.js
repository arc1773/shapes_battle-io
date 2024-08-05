const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var wc = canvas.width;
var hc = canvas.height;

var game_data = {};
var previousPositions = { x: 0, y: 0 };
var currentPositions = { x: 0, y: 0 };
var interpolationFactor = 0.9; // Im większa wartość, tym płynniejszy ruch

var mouse_position = {
  x: 275,
  y: 375,
};

var move = false;

var in_game = false;
var is_collision = false;

document.getElementById("play").addEventListener("click", () => {
  in_game = true;
  document.getElementById("play").style.display = "none";
  socket.emit("in_game", in_game);
});

socket.on("move", (data) => {
  game_data = data;
  previousPositions = currentPositions;
  currentPositions = game_data.clients;
  //resizeCanvas()
});
player_h = 50;
player_w = 50;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wc = canvas.width;
  hc = canvas.height;
  document.getElementById("play").style.left = wc / 2 - 100 + "px";
  document.getElementById("play").style.top = hc / 2 + "px";
}



function interpolatePosition() {
  for (let clientId in game_data.clients) {
    let interpolatedPosition = {
      x: previousPositions[clientId].position.x + (currentPositions[clientId].position.x - previousPositions[clientId].position.x) * interpolationFactor,
      y: previousPositions[clientId].position.y + (currentPositions[clientId].position.y - previousPositions[clientId].position.y) * interpolationFactor
    };
    console.log(interpolatedPosition)
    game_data.clients[clientId].position.x=interpolatedPosition.x
    game_data.clients[clientId].position.y=interpolatedPosition.y
    
  }  
  
}

function board() {
  ctx.fillStyle = "grey";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function draw_players() {
  let currentPlayer = game_data.clients[socket.id];
  let pp = currentPlayer.position;
  for (const clientId in game_data.clients) {
    let client = game_data.clients[clientId];
    if (client.in_game) {
      let drawX = client.position.x - (pp.x - wc / 2);
      let drawY = client.position.y - (pp.y - hc / 2);
      //drawPolygon(drawX, drawY, client.size, client.angles, client.angle, client.color);
      drawCircle_t(drawX, drawY, 20, "pink");
    }
  }
}

function draw_meal() {
  let pp = game_data.clients[socket.id].position;
  let ptx = pp.x - wc / 2;
  let pty = pp.y - hc / 2;
  for (let c in game_data.meal) {
    let m = game_data.meal[c];
    ctx.save();
    ctx.translate(m.x - ptx, m.y - pty);
    drawCircle(5, m.type);
    ctx.restore();
  }
}

function draw_map() {
  let height_of_map = 100;
  let width_of_map = 100;
  ctx.lineWidth = 2;
  ctx.strokeRect(wc - width_of_map, 0, width_of_map, height_of_map);
  ctx.fillStyle = "grey";
  ctx.fillRect(wc - width_of_map, 0, width_of_map, height_of_map);

  //draw players on the map
  for (const client in game_data.clients) {
    p = game_data.clients[client];

    if (p.in_game) {
      //ctx.save();
      //ctx.translate(wc - width_of_map + p.position.x / 50, p.position.y / 50);
      //ctx.rotate(p.angle);
      //drawPolygon(4, p.angles, p.color);
      //ctx.restore();
      drawCircle_t(
        wc - width_of_map + p.position.x / 50,
        p.position.y / 50,
        2,
        "pink"
      );
    }
  }
}

var angle = 0;

function draw() {
  board();
  if (in_game) {
    draw_meal();
    draw_players();
    draw_map();
  }
}

function play() {
  interpolatePosition()
  //give_to_get_data();
  //send_collision_info();
  resizeCanvas();
  send_new_position();
  draw();
}

setInterval(play, 1000 / 120);

canvas.addEventListener("click", (event) => {
  move = !move;
});

canvas.addEventListener("mousemove", (event) => {
  mouse_position = {
    x: event.clientX,
    y: event.clientY,
  };
});

//function give_to_get_data(){
//  socket.emit("give_to_get_data", {});
//}

setInterval(send_new_position, 1);

function send_new_position() {
  let inf_to_new_position = {
    mouse_position: mouse_position,
    wc: wc,
    hc: hc,
    move: move,
  };
  //let inf_to_new_position={}
  socket.emit("move", inf_to_new_position);
}
function send_collision_info() {
  socket.emit("collision", is_collision);
}

function calculate_collision() {
  for (let p in game_data.clients) {
    if (p != socket.id) {
      const fe = game_data.clients[socket.id];
      const se = game_data.clients[p];
      is_collision = checkPolygonsCollision(
        fe.size,
        fe.position,
        fe.angle,
        fe.angles,
        se.size,
        se.position,
        se.angle,
        se.angles
      );
      if (is_collision) {
        break;
      }
    }
  }
}
