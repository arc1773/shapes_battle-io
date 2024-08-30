//localhost site key: 6Le-0C4qAAAAAJhLPePhAAtiav4BeOU8dKiCm8rr
//localhost secret key: 6Le-0C4qAAAAAJrzCFxl3UnS0kfwsJmnD4xmCp50

//arturs.online site key: 6LcMGS8qAAAAABR_ueTrKT98fFAK0eMdDPh32NO9
//arturs.online secret key: 6LcMGS8qAAAAAMbHx_RjwGep0_-B-uhmcq7WFIDR

//shapes-battle-io.onrender.com site key: 6Lf5GS8qAAAAAJS54-8ATIYTIMzO8AO4kNUm6xc0
//shapes-battle-io.onrender.com secret key: 6Lf5GS8qAAAAANvjUa9povmDhIPL-90CK-et_kw8

function generujPunktyPoligonu(x, y, size, liczbaKatow, katNachylenia) {
  const kat = (2 * Math.PI) / liczbaKatow;
  const punkty = new Array(liczbaKatow);

  for (let i = 0; i < liczbaKatow; i++) {
    const currentAngle = i * kat + katNachylenia;
    const px = x + size * Math.cos(currentAngle);
    const py = y + size * Math.sin(currentAngle);
    punkty[i] = { x: px, y: py };
  }

  return punkty;
}

function projVec(p, axis) {
  return p.x * axis.x + p.y * axis.y;
}

function rzutujNaOś(punkty, axis) {
  let min = projVec(punkty[0], axis);
  let max = min;

  for (let i = 1; i < punkty.length; i++) {
    const p = projVec(punkty[i], axis);
    if (p < min) min = p;
    if (p > max) max = p;
  }

  return { min, max };
}

function sprawdzKolizjePoligonow(punkty1, punkty2) {
  const osie = [];

  // Generujemy osie dla pierwszego poligonu
  for (let i = 0; i < punkty1.length; i++) {
    const j = (i + 1) % punkty1.length;
    const normal = {
      x: -(punkty1[j].y - punkty1[i].y),
      y: punkty1[j].x - punkty1[i].x,
    };
    osie.push(normal);
  }

  // Generujemy osie dla drugiego poligonu
  for (let i = 0; i < punkty2.length; i++) {
    const j = (i + 1) % punkty2.length;
    const normal = {
      x: -(punkty2[j].y - punkty2[i].y),
      y: punkty2[j].x - punkty2[i].x,
    };
    osie.push(normal);
  }

  // Sprawdzamy każdą oś
  for (let axis of osie) {
    const rzut1 = rzutujNaOś(punkty1, axis);
    const rzut2 = rzutujNaOś(punkty2, axis);

    // Jeśli przedziały się nie pokrywają, nie ma kolizji
    if (rzut1.max < rzut2.min || rzut2.max < rzut1.min) {
      return false;
    }
  }

  // Jeśli nie znaleziono żadnej rozdzielającej osi, poligony kolidują
  return true;
}

function logFunction(x, minValue, maxValue) {
  const a = (maxValue - minValue) / Math.log(20); // Obliczenie współczynnika 'a' na podstawie przedziału wartości
  const d = minValue; // Ustawienie minimalnej wartości jako przesunięcia pionowego

  return a * Math.log(x) + d;
}

function obliczOdleglosc(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

const { Console } = require("console");
const express = require("express");
const http = require("http");
const { emit } = require("process");
const socketIo = require("socket.io");
const axios = require("axios");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

class Player {
  constructor(id, nickname, mode, bot) {
    this.id = id;
    this.position = {
      x: Math.random() * 10000,
      y: Math.random() * 10000,
    };
    this.mouse_position = {
      x: 250,
      y: 250,
    };
    this.screen_size = {
      x: 500,
      y: 500,
    };
    this.parametrs = {
      move_speed: 12, //move_speed
      size: 20, //health
      number_of_angles: 3, //damage
      rotation_speed: 0.06, //regeneration
      color: "black",
    };
    this.haracteristics = {
      max_health: 50,
      damage: 0.3,
      regeneration: 0.06,
    };
    this.health = 50;
    this.to_update_param = {
      move_speed: 0,
      size: 0,
      number_of_angles: 0,
      rotation_speed: 0,
    };
    this.levels = {
      move_speed: 1,
      size: 1,
      number_of_angles: 1,
      rotation_speed: 1,
    };
    this.moving = false;
    this.angle = 0;
    this.spdX = 0;
    this.spdY = 0;
    this.coliding = false;
    this.nickname = nickname;
    this.score = 0;
    this.mode = mode;
    this.bot = bot;
  }
  update() {
    this.move();

    this.regeneration();

    this.angle += this.parametrs.rotation_speed;

    this.haracteristics.max_health = this.parametrs.size * 2.5;
    this.haracteristics.damage = this.parametrs.number_of_angles / 10;
    this.haracteristics.regeneration = this.parametrs.rotation_speed;
  }

  move() {
    //move

    this.spdX = 0;
    this.spdY = 0;

    if (this.moving) {
      var mouse_positon = this.mouse_position;
      if (mouse_positon.x > this.screen_size.x * 0.75) {
        mouse_positon.x = this.screen_size.x * 0.75;
      } else if (mouse_positon.x < this.screen_size.x * 0.25) {
        mouse_positon.x = this.screen_size.x * 0.25;
      }
      if (mouse_positon.y > this.screen_size.y * 0.75) {
        mouse_positon.y = this.screen_size.y * 0.75;
      } else if (mouse_positon.y < this.screen_size.y * 0.25) {
        mouse_positon.y = this.screen_size.y * 0.25;
      }

      this.spdX =
        this.parametrs.move_speed *
        ((mouse_positon.x - this.screen_size.x / 2) / (this.screen_size.x / 4));
      this.spdY =
        this.parametrs.move_speed *
        ((mouse_positon.y - this.screen_size.y / 2) / (this.screen_size.y / 4));
    }

    //bots' move
    if (this.bot) {
      for (let p of players.keys()) {
        if (p != this.id) {
          var player2 = players.get(p);
          if (
            Math.abs(player2.position.x - this.position.x) < 350 &&
            Math.abs(player2.position.y - this.position.y) < 350
          ) {
            this.spdX =
              this.parametrs.move_speed *
              Math.min(Math.abs(player2.position.x - this.position.x) / 11, 1) *
              Math.sign(player2.position.x - this.position.x);
            this.spdY =
              this.parametrs.move_speed *
              Math.min(Math.abs(player2.position.y - this.position.y) / 11, 1) *
              Math.sign(player2.position.y - this.position.y);
          }
        }
      }
    }

    this.position.x += this.spdX;
    this.position.y += this.spdY;
  }
  regeneration() {
    if (this.health < this.haracteristics.max_health) {
      this.health += this.haracteristics.regeneration;
      if (this.health > this.haracteristics.max_health) {
        this.health = this.haracteristics.max_health;
      }
    }
  }
  death() {
    players.delete(this.id);
  }
}

var players = new Map();

var SOCKETS = {};
//var players_data = {}; //123123:{...},
var meals_data = {};

const SECRET_KEY = "6Lf5GS8qAAAAANvjUa9povmDhIPL-90CK-et_kw8";

app.use(express.static("public"));

server.listen(443);
console.log("server started(listan on port 443");

io.on("connection", (socket) => {
  console.log("a user connected");
  SOCKETS[socket.id] = socket;

  socket.on("join_to_game", function (data) {
    add_player(socket.id, data.nickname, data.mode);
  });

  socket.on("leave_game", function () {
    players.get(socket.id).death();
    socket.emit("kick");
  });

  socket.on("stop_start_move", function () {
    players.get(socket.id).moving = !players.get(socket.id).moving;
  });

  socket.on("mouse_position", function (data) {
    if (players.get(socket.id)) {
      players.get(socket.id).mouse_position = data;
    }
  });

  socket.on("change_canvas_size", function (data) {
    if (players.get(socket.id)) {
      players.get(socket.id).screen_size = data;
    }
  });

  socket.on("verify-recaptcha", async (token) => {
    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify?secret=${SECRET_KEY}&response=${token}`
      );
      const data = response.data;

      if (data.success && data.score > 0.7) {
        console.log("reCAPTCHA verified successfully");
        socket.emit("captcha-verified", { success: true });
      } else {
        console.log("reCAPTCHA verification failed");
        socket.emit("captcha-verified", { success: false });
      }
    } catch (error) {
      console.error("Error during reCAPTCHA verification:", error);
      socket.emit("captcha-verified", { success: false });
    }
  });

  socket.on("disconnect", () => {
    delete SOCKETS[socket.id];
    if (players.get(socket.id)) {
      players.get(socket.id).death();
    }
    console.log("user disconnected");
  });
});

function add_player(socketId, nickname, mode) {
  players.set(socketId, new Player(socketId, nickname, mode, false));
  let player = players.get(socketId);
  players_to_add[mode][socketId] = {
    position: player.position,
    parametrs: player.parametrs,
    to_update_param: player.to_update_param,
    angle: player.angle,
    levels: player.levels,
    haracteristics: player.haracteristics,
    health: player.health,
    nickname: player.nickname,
    score: player.score,
  };
  SOCKETS[socketId].emit(
    "init",
    get_first_init_pack(players.get(socketId).mode)
  );
}

function player_dead(socketId) {
  let player = players.get(socketId);
  if (!players.get(socketId).bot) {
    SOCKETS[socketId].emit("kick");
  }
  players_to_remove[player.mode].push(socketId);
  players.get(socketId).death();
}

function areSquaresColliding(square2, square1) {
  return !(
    (
      square1.x + square1.size < square2.x || // Kwadrat 1 jest po lewej stronie kwadratu 2
      square1.x > square2.x + square2.size || // Kwadrat 1 jest po prawej stronie kwadratu 2
      square1.y + square1.size < square2.y || // Kwadrat 1 jest powyżej kwadratu 2
      square1.y > square2.y + square2.size
    ) // Kwadrat 1 jest poniżej kwadratu 2
  );
}

function players_update() {
  var map_of_points_of_poligon_of_players = new Map();

  for (let p of players.keys()) {
    let player = players.get(p);
    map_of_points_of_poligon_of_players.set(
      player.id,
      generujPunktyPoligonu(
        player.position.x,
        player.position.y,
        player.parametrs.size,
        player.parametrs.number_of_angles,
        player.angle
      )
    );
  }

  const graczeKlucze = Array.from(players.keys());
  const liczbaGraczy = graczeKlucze.length;

  for (let i = 0; i < liczbaGraczy; i++) {
    var player = players.get(graczeKlucze[i]);

    player.update();

    //colision

    var points_of_poligon_of_the_player =
      map_of_points_of_poligon_of_players.get(player.id);

    //with meal
    for (var n in meals_data) {
      var meal = meals_data[n];
      if (meal.mode == player.mode) {
        if (obliczOdleglosc(player.position, meal.position) < 100) {
          if (
            areSquaresColliding(
              {
                x: player.position.x - player.parametrs.size / 2,
                y: player.position.y - player.parametrs.size / 2,
                size: player.parametrs.size,
              },
              {
                x: meal.position.x - 7 / 2,
                y: meal.position.y - 7 / 2,
                size: 7,
              }
            )
          ) {
            player.score += 1;
            if (meals_data[n].color == "red") {
              player.to_update_param.size += 1;
              if (player.to_update_param.size >= 10) {
                player.to_update_param.size = 0;
                player.levels.size += 1;
                player.parametrs.size = 1.5 * player.levels.size + 20;
              }
            } else if (meals_data[n].color == "orange") {
              player.to_update_param.move_speed += 1;
              if (player.to_update_param.move_speed >= 10) {
                player.to_update_param.move_speed = 0;
                player.levels.move_speed += 1;
                player.parametrs.move_speed = logFunction(
                  player.levels.move_speed,
                  3,
                  15
                );
              }
            } else if (meals_data[n].color == "green") {
              player.to_update_param.number_of_angles += 1;
              if (player.to_update_param.number_of_angles >= 10) {
                player.to_update_param.number_of_angles = 0;
                player.levels.number_of_angles += 1;
                player.parametrs.number_of_angles =
                  player.levels.number_of_angles + 2;
              }
            } else if (meals_data[n].color == "blue") {
              player.to_update_param.rotation_speed += 1;
              if (player.to_update_param.rotation_speed >= 10) {
                player.to_update_param.rotation_speed = 0;
                player.levels.rotation_speed += 1;
                player.parametrs.rotation_speed =
                  player.levels.rotation_speed * 0.06;
              }
            }
            meals_to_remove[meals_data[n].mode].push(n);
            delete meals_data[n];
          }
        }
      }
    }
    //with players

    for (let j = i + 1; j < liczbaGraczy; j++) {
      var player2 = players.get(graczeKlucze[j]);
      if (player.mode == player2.mode) {
        if (obliczOdleglosc(player.position, player2.position) < 100) {
          var points_of_poligon_of_second_player =
            map_of_points_of_poligon_of_players.get(player2.id);
          if (
            sprawdzKolizjePoligonow(
              points_of_poligon_of_the_player,
              points_of_poligon_of_second_player
            )
          ) {
            player.coliding = true;
            player2.coliding = true;
            player.health -= player2.haracteristics.damage;
            player2.health -= player.haracteristics.damage;
            if (player2.health <= 0) {
              player.score += player2.score / 2;
              player_dead(graczeKlucze[j]);
            }
            if (player.health <= 0) {
              player2.score += player.score / 2;
              player_dead(graczeKlucze[i]);
            }
          }
        }
      }
    }
    for (var p of players.keys()) {
      if (player.coliding) {
        player.parametrs.color = "red";
      } else {
        player.parametrs.color = "black";
      }
    }

    player.coliding = false;

    //border

    if (player.position.y - player.parametrs.size / 2 < 0) {
      player.position.y = 0 + player.parametrs.size / 2;
    } else if (player.position.y + player.parametrs.size / 2 > 10000) {
      player.position.y = 10000 - player.parametrs.size / 2;
    }

    if (player.position.x - player.parametrs.size / 2 < 0) {
      player.position.x = 0 + player.parametrs.size / 2;
    } else if (player.position.x + player.parametrs.size / 2 > 10000) {
      player.position.x = 10000 - player.parametrs.size / 2;
    }
  }
}

function get_first_init_pack(mode) {
  var pack = { meals: {}, players: {} };
  for (let i in meals_data) {
    if (meals_data[i].mode == mode) {
      pack.meals[i] = meals_data[i];
    }
  }
  for (let i of players.keys()) {
    if (players.get(i).mode == mode) {
      pack.players[i] = players.get(i);
    }
  }

  return pack;
}

function get_init_pack(mode) {
  var pack = {};
  pack.meals = meals_to_add[mode];
  pack.players = players_to_add[mode];
  return pack;
}

function get_update_pack(mode) {
  var pack = { players: {} };
  for (var i of players.keys()) {
    var player = players.get(i);
    if (player.mode == mode) {
      pack.players[i] = {
        position: player.position,
        parametrs: player.parametrs,
        to_update_param: player.to_update_param,
        angle: player.angle,
        levels: player.levels,
        haracteristics: player.haracteristics,
        health: player.health,
        score: player.score,
      };
    }
  }
  return pack;
}

function get_remove_pack(mode) {
  var pack = {};
  pack.meals = meals_to_remove[mode];
  pack.players = players_to_remove[mode];
  return pack;
}

var meals_to_add = { FFA1: {}, FFA2: {} };
var meals_to_remove = { FFA1: [], FFA2: [] };

var players_to_add = { FFA1: {}, FFA2: {} };
var players_to_remove = { FFA1: [], FFA2: [] };

function meals_update() {
  if (Object.keys(meals_data).length < 3000) {
    let id_of_meal = Math.random();
    let position = {
      x: 10000 * Math.random(),
      y: 10000 * Math.random(),
    };
    let color_of_meal = "orange";

    let color_num = Math.random();
    if (color_num > 0.7) {
      color_of_meal = "red";
    } else if (color_num > 0.4) {
      color_of_meal = "blue";
    } else if (color_num >= 0.1) {
      color_of_meal = "orange";
    } else if (color_num < 0.1) {
      color_of_meal = "green";
    }

    var mode = "FFA1";
    if (Math.random() > 0.5) {
      mode = "FFA2";
    }

    meals_data[id_of_meal] = {
      position: position,
      color: color_of_meal,
      mode: mode,
    };
    meals_to_add[mode][id_of_meal] = meals_data[id_of_meal];
  }
}

setInterval(function () {
  meals_update();
  //bots_update();
  players_update();

  var init_packs = {
    FFA1: get_init_pack("FFA1"),
    FFA2: get_init_pack("FFA2"),
  };

  var update_placks = {
    FFA1: get_update_pack("FFA1"),
    FFA2: get_update_pack("FFA2"),
  };

  var remove_packs = {
    FFA1: get_remove_pack("FFA1"),
    FFA2: get_remove_pack("FFA2"),
  };

  for (var i of players.keys()) {
    let player = players.get(i);
    if (!player.bot) {
      let mode = player.mode;
      if (
        (init_packs[mode].meals &&
          Object.keys(init_packs[mode].meals).length !== 0) ||
        (init_packs[mode].players &&
          Object.keys(init_packs[mode].players).length !== 0)
      ) {
        SOCKETS[i].emit("init", init_packs[mode]);
      }
      SOCKETS[i].emit("update", update_placks[mode]);
      SOCKETS[i].emit("remove", remove_packs[mode]);
    }
  }
  meals_to_add = { FFA1: {}, FFA2: {} };
  meals_to_remove = { FFA1: [], FFA2: [] };
  players_to_add = { FFA1: {}, FFA2: {} };
  players_to_remove = { FFA1: [], FFA2: [] };
}, 1000 / 15);
//25
