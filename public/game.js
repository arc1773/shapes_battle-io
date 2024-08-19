function drawPoligon(x, y, size, liczbaKatow, katNachylenia, color = "black") {
  const kat = (2 * Math.PI) / liczbaKatow; // Kąt pomiędzy wierzchołkami

  ctx.beginPath();
  for (let i = 0; i < liczbaKatow; i++) {
    const currentAngle = i * kat + katNachylenia;
    const px = x + size * Math.cos(currentAngle);
    const py = y + size * Math.sin(currentAngle);
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill(); // Wypełnia wnętrze poligonu kolorem
  ctx.strokeStyle = color;
  ctx.stroke();
}

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
players_data[socket.id] = {};

var THE_PLAYER = players_data[socket.id];

var meals_data = {};

socket.on("init", (data) => {
  for (var i in data.meal) {
    meals_data[i] = data.meal[i];
  }
});

socket.on("update", function (data) {
  players_data = data.player;
  THE_PLAYER = players_data[socket.id];
});

socket.on("remove", (data) => {
  for (var i in data.meal) {
    delete meals_data[data.meal[i]];
  }
});

var button_of_start_game = document.getElementById("button");
var main_menue_div = document.getElementById("main_menu");
var game_div = document.getElementById("game");
button_of_start_game.addEventListener("click", () => {
  socket.emit("join_to_game");
});

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wc = canvas.width;
  hc = canvas.height;
  socket.emit("change_canvas_size", { x: wc, y: hc });
}

function draw_player(data) {
  let player = THE_PLAYER.position;
  let drawX = data.position.x - (player.x - wc / 2);
  let drawY = data.position.y - (player.y - hc / 2);
  drawPoligon(
    drawX,
    drawY,
    data.parametrs.size,
    data.parametrs.number_of_angles,
    data.angle,
    data.parametrs.color
  );
}

function draw_meal(data) {
  let player_p = THE_PLAYER.position;
  let drawX = data.position.x - (player_p.x - wc / 2);
  let drawY = data.position.y - (player_p.y - hc / 2);
  ctx.fillStyle = data.color;
  ctx.fillRect(drawX, drawY, 7, 7);
}

function draw_map() {
  let player_p = THE_PLAYER.position;
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

var list_of_updates = {
  move_speed: document.getElementById("move_speed"),
  size: document.getElementById("size"),
  rotation_speed: document.getElementById("rotation_speed"),
  number_of_angles: document.getElementById("num_of_angles"),
};

var list_of_titles = {
  move_speed: "title_move_speed",
  size: "title_size",
  rotation_speed: "title_rotation_speed",
  number_of_angles: "title_num_of_angles",
};

function update_to_update_param() {
  for (var i in list_of_updates) {
    var update = list_of_updates[i];
    var points = update.getElementsByClassName("point");
    var active_points = [];
    for (var p = 0; p < points.length; p++) {
      if (points[p].className == "point") {
        active_points[p] = points[p];
      }
    }
    var innactive_points = update.getElementsByClassName("point inactive");
    if (active_points.length < THE_PLAYER.to_update_param[i]) {
      innactive_points[0].className = "point";
    }
    if (active_points.length > THE_PLAYER.to_update_param[i]) {
      active_points[active_points.length - 1].className = "point inactive";
    }
    //speed
    let el = document.getElementById(list_of_titles[i]);
    if (i == "move_speed") {
      let num = THE_PLAYER.levels[i];
      el.textContent = `speed lv${num}`;
    } else if (i == "size") {
      let num = THE_PLAYER.levels[i];
      el.textContent = `size lv${num}`;
    } else if (i == "rotation_speed") {
      let num = THE_PLAYER.levels[i];
      el.textContent = `rotation speed lv${num}`;
    } else if (i == "number_of_angles") {
      let num = THE_PLAYER.levels[i];
      el.textContent = `angles lv${num}`;
    }
  }
}

var health = document.getElementById("red");
function update_helath() {
  health.style.width = THE_PLAYER.health + "px";
}

setInterval(function () {
  resizeCanvas();
  if (THE_PLAYER != null) {
      main_menue_div.style.display = "none";
      game_div.style.display = "block";
      update_helath();
      update_to_update_param();
      ctx.clearRect(0, 0, 500, 500);

      draw_map();
      for (var i in meals_data) {
        draw_meal(meals_data[i]);
      }
      for (var i in players_data) {
        draw_player(players_data[i]);
      }
      draw_minimap();
  }else{
    main_menue_div.style.display = "flex";
    game_div.style.display = "none";
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
