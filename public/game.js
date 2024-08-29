function executeRecaptcha(action, callback) {
  grecaptcha.ready(function () {
    grecaptcha
      .execute("6Lf5GS8qAAAAAJS54-8ATIYTIMzO8AO4kNUm6xc0", { action: action })
      .then(function (token) {
        callback(token);
      });
  });
}

function getdata() {
  return new Promise((resolve, reject) => {
    socket.once("captcha-verified", (data) => {
      resolve(data.success);
    });

    // Opcjonalnie: można dodać timeout na przypadku, gdy zdarzenie się nie pojawi
    // setTimeout(() => reject('Timeout'), 10000); // 10 sekund na timeout
  });
}

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

function lerp(start, end, t) {
  var playersPos = {};
  for (var i in start) {
    if (end[i]) {
      playersPos[i] = {
        x: start[i].position.x + t * (end[i].position.x - start[i].position.x),
        y: start[i].position.y + t * (end[i].position.y - start[i].position.y),
      };
    }
  }
  return playersPos;
}

var t = 0;

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

var THE_PLAYER = null;

var meals_data = {};

var captcha_verified = false;

let previousPlayersPos = null;
let currentPlayersPos = null;

var interpolatedPlayersPos = null;

socket.on("init", (data) => {
  for (var i in data.meals) {
    meals_data[i] = data.meals[i];
  }
});

socket.on("update", function (data) {
  previousPlayersPos = currentPlayersPos;
  currentPlayersPos = data.players;

  t = 0;

  players_data = data.players;
  THE_PLAYER = players_data[socket.id];
});

socket.on("remove", (data) => {
  for (var i in data.meals) {
    console.log("del");
    delete meals_data[data.meals[i]];
  }
});

socket.on("kick", () => {
  THE_PLAYER = null;
  meals_data = {};
  players_data = {};
});

var button_of_start_game = document.getElementById("play");
var main_menue_div = document.getElementById("main_menu");
var game_div = document.getElementById("game");
var err_text = document.getElementById("err");
button_of_start_game.addEventListener("click", async () => {
  if (!captcha_verified) {
    executeRecaptcha("play", function (token) {
      socket.emit("verify-recaptcha", token);
    });
    captcha_verified = await getdata();
  }

  if (captcha_verified) {
    let nickname = document.getElementById("nickname").value;
    let mode = document.getElementById("mode").value;

    if (nickname.length <= 3) {
      err_text.style.display = "block";
      err_text.textContent = "nickname is too short";
    } else if (nickname.length > 8) {
      err_text.style.display = "block";
      err_text.textContent = "nickname is too long";
    } else {
      socket.emit("join_to_game", { nickname: nickname, mode: mode });
      err_text.style.display = "none";
    }
  }
});

var button_of_exit_game = document.getElementById("exit-button");
var confirm_dialog = document.getElementById("confirm-dialog");
var yesButton = document.getElementById("yesButton");
var noButton = document.getElementById("noButton");
button_of_exit_game.addEventListener("click", () => {
  confirm_dialog.style.display = "block";
  button_of_exit_game.style.display = "none";
});

yesButton.addEventListener("click", () => {
  socket.emit("leave_game");
  confirm_dialog.style.display = "none";
  button_of_exit_game.style.display = "block";
});
noButton.addEventListener("click", () => {
  confirm_dialog.style.display = "none";
  button_of_exit_game.style.display = "block";
});

var last_canvas_size = { x: 500, y: 500 };

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wc = canvas.width;
  hc = canvas.height;
  if (last_canvas_size != { x: wc, y: hc })
    socket.emit("change_canvas_size", { x: wc, y: hc });
}

function draw_player(pos, data) {
  let player = interpolatedPlayersPos[socket.id];
  let drawX = pos.x - (player.x - wc / 2);
  let drawY = pos.y - (player.y - hc / 2);
  drawPoligon(
    drawX,
    drawY,
    data.parametrs.size,
    data.parametrs.number_of_angles,
    data.angle,
    data.parametrs.color
  );

  //nick name
  ctx.fillStyle = "green";
  let text = data.nickname;
  let fontSize = 15;
  ctx.font = `${fontSize}px Arial`;

  let textWidth = ctx.measureText(text).width;

  let x = drawX - textWidth / 2;
  let y = drawY - fontSize / 2 - data.parametrs.size;

  ctx.fillText(text, x, y);
}

function draw_meal(data) {
  let player_p = interpolatedPlayersPos[socket.id];
  if (!player_p) {
    player_p = players_data[socket.id];
  }
  let drawX = data.position.x - (player_p.x - wc / 2);
  let drawY = data.position.y - (player_p.y - hc / 2);
  ctx.fillStyle = data.color;

  //ctx.fillStyle = data.color;
  ctx.fillRect(drawX, drawY, 7, 7);
}

function draw_map() {
  let player_p = interpolatedPlayersPos[socket.id];
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
  ctx.fillRect(wc - 105, hc - 105, 100, 100);
  ctx.strokeStyle = "red";
  ctx.strokeRect(wc - 105, hc - 105, 100, 100);

  for (var i in players_data) {
    let player = players_data[i];
    ctx.fillStyle = "black";
    if (i == socket.id) {
      ctx.fillStyle = "blue";
    }
    ctx.fillRect(
      player.position.x / 100 - 1.5 + (wc - 105),
      player.position.y / 100 - 1.5 + (hc - 105),
      3,
      3
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

var lis = document.getElementById("top_5").querySelectorAll("li");
function update_list_of_top_5() {
  var players = {};

  for (let i in players_data) {
    players[i] = {
      score: players_data[i].score,
      nickname: players_data[i].nickname,
    };
  }

  if (Object.keys(players).length <= 5) {
    for (let i = 0; i < 5; i++) {
      if (i < Object.keys(players).length) {
        lis[i].style.display = "list-item";
      } else {
        lis[i].style.display = "none";
      }
    }
  }

  let graczeArray = Object.entries(players);
  graczeArray.sort((a, b) => b[1].score - a[1].score);
  let c = 0;
  for (let i in graczeArray) {
    if (c < 5)
      lis[i].textContent =
        graczeArray[i][1].nickname + "-" + graczeArray[i][1].score;
    c++;
  }
}

function draw_helath() {
  //health bar
  ctx.fillStyle = "red";
  ctx.fillRect(
    wc / 2 - 25,
    hc / 2 - THE_PLAYER.parametrs.size - 30,
    (THE_PLAYER.health / THE_PLAYER.haracteristics.max_health) * 50,
    10
  );
  ctx.strokeStyle = "black";
  ctx.strokeRect(wc / 2 - 25, hc / 2 - THE_PLAYER.parametrs.size - 30, 50, 10);
}

function draw() {
  draw_map();
  for (var i in meals_data) {
    draw_meal(meals_data[i]);
  }
  for (var i in interpolatedPlayersPos) {
    draw_player(interpolatedPlayersPos[i], players_data[i]);
  }
  draw_minimap();
  draw_helath();
}

setInterval(function () {
  var recaptchaBadge = document.querySelector(".grecaptcha-badge");
  resizeCanvas();
  if (THE_PLAYER != null) {
    if (recaptchaBadge) {
      recaptchaBadge.style.display = "none"; // lub użyj visibility: hidden;
    }
    t += 1 / 5;

    interpolatedPlayersPos = lerp(previousPlayersPos, currentPlayersPos, t);

    main_menue_div.style.display = "none";
    game_div.style.display = "block";
    update_to_update_param();
    update_list_of_top_5();
    ctx.clearRect(0, 0, 500, 500);

    draw();
  } else {
    main_menue_div.style.display = "block";
    game_div.style.display = "none";
  }
}, 9);

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
