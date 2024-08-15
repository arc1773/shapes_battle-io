const socket = io();

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.height = 500;

var wc = canvas.width;
var hc = canvas.height;

var gap_between_lines = 50;
var map_size = 10000;

var players_data = {};
var meals_data = {};

socket.on("init", (data) => {
  for (var i in data.meal) {
    console.log(1);
    meals_data[i] = data.meal[i];
  }
});

socket.on("update", function (data) {
  players_data = data.player;
});

socket.on("remove", (data) => {
  for (var i in data.meal) {
    delete meals_data[data.meal[i]];
  }
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wc = canvas.width;
  hc = canvas.height;
  socket.emit("change_canvas_size", { x: wc, y: hc });
}

function draw_player(position, size) {
  let player = players_data[socket.id].position;
  let drawX = position.x - (player.x - wc / 2);
  let drawY = position.y - (player.y - hc / 2);
  ctx.fillStyle = "black";
  ctx.fillRect(drawX - size / 2, drawY - size / 2, size, size);
}

function draw_meal(data) {
  let player_p = players_data[socket.id].position;
  let drawX = data.position.x - (player_p.x - wc / 2);
  let drawY = data.position.y - (player_p.y - hc / 2);
  ctx.fillStyle = data.color;
  ctx.fillRect(drawX, drawY, 7, 7);
}

function draw_map() {
  let player_p = players_data[socket.id].position;
  ctx.fillStyle = "#E6E8E6";
  ctx.fillRect(0, 0, wc, hc);
  if (player_p) {
    ctx.strokeStyle = "#B8BAC8";
    ctx.lineWidth = 1;
    for (let i = 0; i <= map_size / gap_between_lines; i++) {
      let start_drawX = gap_between_lines * i - (player_p.x - wc / 2);
      let start_drawY = 0 - (player_p.y - hc / 2);
      let stop_drawX = gap_between_lines * i - (player_p.x - wc / 2);
      let stop_drawY = map_size - (player_p.y - hc / 2);
      ctx.beginPath();
      ctx.moveTo(start_drawX, start_drawY);
      ctx.lineTo(stop_drawX, stop_drawY);
      ctx.stroke();
    }
    for (let i = 0; i <= map_size / gap_between_lines; i++) {
      let start_drawX = 0 - (player_p.x - wc / 2);
      let start_drawY = gap_between_lines * i - (player_p.y - hc / 2);
      let stop_drawX = map_size - (player_p.x - wc / 2);
      let stop_drawY = gap_between_lines * i - (player_p.y - hc / 2);
      ctx.beginPath();
      ctx.moveTo(start_drawX, start_drawY);
      ctx.lineTo(stop_drawX, stop_drawY);
      ctx.stroke();
    }
  }
}

function draw_minimap() {
  ctx.fillStyle = "#E6E8E6";
  ctx.fillRect(wc - 100, 0, 100, 100);
  ctx.strokeStyle = "red";
  ctx.strokeRect(wc - 100, 0, 100, 100);

  for (var i in players_data) {
    let player = players_data[i];
    ctx.fillStyle = "black";
    ctx.fillRect(
      player.position.x / 100 + (wc - 100),
      player.position.y / 100,
      2,
      2
    );
  }
}

setInterval(function () {
  resizeCanvas();
  ctx.clearRect(0, 0, 500, 500);
  if (players_data[socket.id] != null) {
    draw_map();
    for (var i in meals_data) {
      draw_meal(meals_data[i]);
    }
    for (var i in players_data) {
      draw_player(players_data[i].position, players_data[i].parametrs.size);
    }
    draw_minimap();
  }
}, 40);

document.onkeydown = function (event) {
  if (event.keyCode === 68) {
    socket.emit("keyPress", { inputId: "right", state: true });
  } else if (event.keyCode === 83) {
    socket.emit("keyPress", { inputId: "up", state: true });
  } else if (event.keyCode === 65) {
    socket.emit("keyPress", { inputId: "left", state: true });
  } else if (event.keyCode === 87) {
    socket.emit("keyPress", { inputId: "down", state: true });
  }
};
document.onkeyup = function (event) {
  if (event.keyCode === 68) {
    socket.emit("keyPress", { inputId: "right", state: false });
  } else if (event.keyCode === 83) {
    socket.emit("keyPress", { inputId: "up", state: false });
  } else if (event.keyCode === 65) {
    socket.emit("keyPress", { inputId: "left", state: false });
  } else if (event.keyCode === 87) {
    socket.emit("keyPress", { inputId: "down", state: false });
  }
};

canvas.addEventListener("click", (event) => {
  socket.emit("stop_start_move");
});

canvas.addEventListener("mousemove", (event) => {
  let mouse_position = {
    x: event.clientX,
    y: event.clientY,
  };
  socket.emit("mouse_position", mouse_position);
});
