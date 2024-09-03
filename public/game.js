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

function lerp(start, end, t) {
  var playersPos = {};
  for (var i in end) {
    if (start && start[i]) {
      playersPos[i] = {
        x: start[i].position.x + t * (end[i].position.x - start[i].position.x),
        y: start[i].position.y + t * (end[i].position.y - start[i].position.y),
        angle: start[i].angle + t * (end[i].angle - start[i].angle),
      };
    } else {
      playersPos[i] = {
        x: end[i].position.x,
        y: end[i].position.y,
        angle: end[i].angle,
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

var previousPlayersPos = null;
var currentPlayersPos = null;

var interpolatedPlayersPos = null;

var filling_up_servers = { FFA1: 0, FFA2: 0 };

socket.on("init", (data) => {
  for (let i in data.meals) {
    meals_data[i] = data.meals[i];
  }
  for (let i in data.players) {
    players_data[i] = data.players[i];
  }
});

socket.on("update", function (data) {
  for (let i in data.players) {
    for (let m in data.players[i]) {
      players_data[i][m] = data.players[i][m];
    }
  }
  THE_PLAYER = players_data[socket.id];

  previousPlayersPos = currentPlayersPos;
  currentPlayersPos = data.players;

  for(let g in players_data){
    if(!currentPlayersPos[g]){
      console.log(currentPlayersPos[g])
      currentPlayersPos[g] = players_data[g]
      console.log(currentPlayersPos[g])
    }
  }
  
  
 

  t = 0;
});

socket.on("remove", (data) => {
  for (var i in data.meals) {
    delete meals_data[data.meals[i]];
  }
  for (var i in data.players) {
    delete players_data[data.players[i]];
  }
});

socket.on("filling_up_servers", (data) => {
  filling_up_servers.FFA1 = data.FFA1;
  filling_up_servers.FFA2 = data.FFA2;
  document.getElementById(
    "FFA1"
  ).textContent = `FFA1 ${filling_up_servers.FFA1}/15`;
  document.getElementById(
    "FFA2"
  ).textContent = `FFA2 ${filling_up_servers.FFA2}/15`;
});

socket.on("kick", () => {
  reset();
});

var button_of_start_game = document.getElementById("play");
var main_menue_div = document.getElementById("main_menu");
var game_div = document.getElementById("game");
var err_text = document.getElementById("err");
var loader = document.getElementById("loader");
var txt = document.getElementById("txt");
button_of_start_game.addEventListener("click", async () => {
  loader.style.display = "block";
  txt.style.display = "none";

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

      txt.style.display = "block";
      loader.style = "none";
    } else if (nickname.length > 8) {
      err_text.style.display = "block";
      err_text.textContent = "nickname is too long";

      txt.style.display = "block";
      loader.style = "none";
    } else if (filling_up_servers[mode] >= 15) {
      err_text.style.display = "block";
      err_text.textContent = "the server is full. try another.";

      txt.style.display = "block";
      loader.style = "none";
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

function reset() {
  THE_PLAYER = null;
  meals_data = {};
  players_data = {};
  previousPlayersPos = null;
  currentPlayersPos = null;

  interpolatedPlayersPos = null;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  wc = canvas.width;
  hc = canvas.height;
  if (last_canvas_size != { x: wc, y: hc })
    socket.emit("change_canvas_size", { x: wc, y: hc });
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

setInterval(function () {
  var recaptchaBadge = document.querySelector(".grecaptcha-badge");
  resizeCanvas();
  if (THE_PLAYER != null) {
    if (recaptchaBadge) {
      recaptchaBadge.style.display = "none"; // lub użyj visibility: hidden;
    }
    t += 1 / 10;

    interpolatedPlayersPos = lerp(previousPlayersPos, currentPlayersPos, t);
    for (let f in players_data) {
      if (!interpolatedPlayersPos[f]) {
        console.log("3");
        console.log(interpolatedPlayersPos);
        console.log(f);
        console.log(players_data);
        console.log(currentPlayersPos);
      }
    }
    update_to_update_param();
    update_list_of_top_5();

    //ctx.clearRect(0, 0, 500, 500);
    draw();

    if (game_div.style.display == "none") {
      setTimeout(() => {
        game_div.style.display = "block";
        txt.style.display = "block";
        loader.style = "none";
      }, 75);
    }

    //zmień na grę
  } else {
    game_div.style.display = "none";

    //mień na główne munu
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



document.addEventListener("keydown", function(event) {
  if (event.key === "F12" || (event.ctrlKey && event.shiftKey && event.key === "I")) {
      event.preventDefault();
  }
});

document.addEventListener("contextmenu", function(event) {
  event.preventDefault();
});
