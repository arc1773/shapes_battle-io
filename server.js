//localhost site key: 6Le-0C4qAAAAAJhLPePhAAtiav4BeOU8dKiCm8rr
//localhost secret key: 6Le-0C4qAAAAAJrzCFxl3UnS0kfwsJmnD4xmCp50

//arturs.online site key: 6LcMGS8qAAAAABR_ueTrKT98fFAK0eMdDPh32NO9
//arturs.online secret key: 6LcMGS8qAAAAAMbHx_RjwGep0_-B-uhmcq7WFIDR

//shapes-battle-io.onrender.com site key: 6Lf5GS8qAAAAAJS54-8ATIYTIMzO8AO4kNUm6xc0
//shapes-battle-io.onrender.com secret key: 6Lf5GS8qAAAAANvjUa9povmDhIPL-90CK-et_kw8

// Listy z elementami, które będą tworzyć nicki
const prefixes = [
  "Super",
  "Mega",
  "Ultra",
  "Hyper",
  "Crazy",
  "Epic",
  "Dark",
  "Light",
];
const suffixes = [
  "Hero",
  "Master",
  "Warrior",
  "Ninja",
  "Dragon",
  "Wolf",
  "Hunter",
  "Shadow",
];

function generateNickname() {
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]; // Losowanie prefiksu
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]; // Losowanie sufiksu
  const number = Math.floor(Math.random() * 90) + 10; // Losowanie liczby od 10 do 99

  return `${prefix}${suffix}${number}`; // Składanie nicku
}

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

var sone_online = false;

class Player {
  constructor(id, nickname, mode, bot) {
    this.id = id;
    this.position = {
      x: Math.random() * 10000,
      y: Math.random() * 10000,
    };
    this.parametrs = {
      move_speed: 7, //move_speed
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
    update_packs[this.mode].players[this.id] = {};
    this.move();
    update_packs[this.mode].players[this.id].position = {
      x: this.position.x,
      y: this.position.y,
    };

    this.regeneration();

    this.angle += this.parametrs.rotation_speed;
    update_packs[this.mode].players[this.id].angle = this.angle;
  }

  move() {
    //move
    if (this.bot) {
      let closestTarget = null;
      let minDistance = 500; // Maksymalna odległość, w której bot reaguje

      // Szukanie najbliższego gracza
      for (let p of players.keys()) {
        if (p !== this.id) {
          const player2 = players.get(p);
          if (player2.mode == this.mode) {
            const distX = player2.position.x - this.position.x;
            const distY = player2.position.y - this.position.y;
            const distance = Math.sqrt(distX * distX + distY * distY); // Odległość euklidesowa

            if (distance < minDistance) {
              minDistance = distance;
              closestTarget = player2;
            }
          }
        }
      }

      // Szukanie najbliższego jedzenia
      for (let meal_i in meals_data) {
        let food = meals_data[meal_i];
        if (food.mode == this.mode) {
          const distX = food.position.x - this.position.x;
          const distY = food.position.y - this.position.y;
          const distance = Math.sqrt(distX * distX + distY * distY); // Odległość euklidesowa

          if (distance < minDistance) {
            minDistance = distance;
            closestTarget = food;
          }
        }
      }

      if (closestTarget) {
        const directionX = closestTarget.position.x - this.position.x;
        const directionY = closestTarget.position.y - this.position.y;

        this.spdX =
          this.parametrs.move_speed *
          Math.min(Math.abs(directionX) / this.parametrs.move_speed, 1) *
          Math.sign(directionX);
        this.spdY =
          this.parametrs.move_speed *
          Math.min(Math.abs(directionY) / this.parametrs.move_speed, 1) *
          Math.sign(directionY);
      } else {
        // Bot nie wykrył żadnego gracza ani jedzenia w zasięgu, może tutaj np. patrolować
        this.spdX = 0;
        this.spdY = 0;
      }
    }

    if (this.moving || this.bot) {
      this.position.x += this.spdX;
      this.position.y += this.spdY;
    }
  }
  regeneration() {
    if (!this.coliding) {
      if (this.health < this.haracteristics.max_health) {
        this.health += this.haracteristics.regeneration;
        if (this.health > this.haracteristics.max_health) {
          this.health = this.haracteristics.max_health;
        } else {
          update_packs[this.mode].players[this.id].health = this.health;
        }
      }
    }
  }
  death() {
    players_to_remove[this.mode].push(this.id);
    players.delete(this.id);
  }
}

var players = new Map();

var SOCKETS = {};
//var players_data = {}; //123123:{...},
var meals_data = {};
var meals_data_count=0

const SECRET_KEY = "6Lf5GS8qAAAAANvjUa9povmDhIPL-90CK-et_kw8";

app.use(express.static("public"));

server.listen(443);
console.log("server started listen on port 443");

io.on("connection", (socket) => {
  console.log("a user connected");
  SOCKETS[socket.id] = socket;

  socket.on("join_to_game", function (data) {
    if (filling_up_servers[data.mode] < 30) {
      add_player(socket.id, data.nickname, data.mode, false);
    }
  });

  socket.on("leave_game", function () {
    players.get(socket.id).death();
    socket.emit("kick");
  });

  socket.on("stop_start_move", function () {
    if (players.get(socket.id)) {
      players.get(socket.id).moving = !players.get(socket.id).moving;
    }
  });
  socket.on("spd", function (data) {
    if (players.get(socket.id)) {
      players.get(socket.id).spdX = data.x;
      players.get(socket.id).spdY = data.y;
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

function add_player(socketId, nickname, mode, bot) {
  players.set(socketId, new Player(socketId, nickname, mode, bot));
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
  if (!bot) {
    SOCKETS[socketId].emit(
      "init",
      get_first_init_pack(players.get(socketId).mode)
    );
  }
}

function player_dead(socketId) {
  let player = players.get(socketId);
  if (player) {
    if (!players.get(socketId).bot) {
      SOCKETS[socketId].emit("kick");
    }
  }
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

function players_check_colision_meal(player) {
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
          if (meals_data[n].type == "size") {
            player.to_update_param.size += 1;
            if (player.to_update_param.size >= 10) {
              player.to_update_param.size = 0;
              player.levels.size += 1;
              player.parametrs.size = 1.5 * player.levels.size + 20;
              player.haracteristics.max_health = player.parametrs.size * 2.5;
            }
          } else if (meals_data[n].type == "speed") {
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
          } else if (meals_data[n].type == "angles") {
            player.to_update_param.number_of_angles += 1;
            if (player.to_update_param.number_of_angles >= 10) {
              player.to_update_param.number_of_angles = 0;
              player.levels.number_of_angles += 1;
              player.parametrs.number_of_angles =
                player.levels.number_of_angles + 2;
              player.haracteristics.damage =
                player.parametrs.number_of_angles / 10;
            }
          } else if (meals_data[n].type == "rotation") {
            player.to_update_param.rotation_speed += 1;
            if (player.to_update_param.rotation_speed >= 10) {
              player.to_update_param.rotation_speed = 0;
              player.levels.rotation_speed += 1;
              player.parametrs.rotation_speed =
                player.levels.rotation_speed * 0.06;
              player.haracteristics.regeneration =
                player.parametrs.rotation_speed;
            }
          }
          update_packs[player.mode].players[player.id].score = player.score;
          update_packs[player.mode].players[player.id].to_update_param =
            player.to_update_param;
          update_packs[player.mode].players[player.id].levels = player.levels;
          update_packs[player.mode].players[player.id].haracteristics =
            player.haracteristics;

          meals_to_remove[meals_data[n].mode].push(n);
          meals_data_count--;
          delete meals_data[n];
        }
      }
    }
  }
}

function players_check_colision_player(
  player,
  i,
  liczbaGraczy,
  graczeKlucze,
  map_of_points_of_poligon_of_players,
  points_of_poligon_of_the_player
) {
  for (let j = i + 1; j < liczbaGraczy; j++) {
    var player2 = players.get(graczeKlucze[j]);
    if (!players.get(graczeKlucze[i])) break;
    if (!player2) continue;
    if (player.mode == player2.mode) {
      if (obliczOdleglosc(player.position, player2.position) < 100) {
        if (!map_of_points_of_poligon_of_players.get(player2.id)) {
          map_of_points_of_poligon_of_players.set(
            player2.id,
            generujPunktyPoligonu(
              player2.position.x,
              player2.position.y,
              player2.parametrs.size,
              player2.parametrs.number_of_angles,
              player2.angle
            )
          );
        }
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
}

function players_update() {
  var map_of_points_of_poligon_of_players = new Map();

  for (let p of players.keys()) {
    let player = players.get(p);
    player.update();
  }

  let graczeKlucze = Array.from(players.keys());
  let liczbaGraczy = graczeKlucze.length;

  for (let i = 0; i < liczbaGraczy; i++) {
    var player = players.get(graczeKlucze[i]);

    if (!player) continue;

    //colision

    if (!map_of_points_of_poligon_of_players.get(player.id)) {
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
    var points_of_poligon_of_the_player =
      map_of_points_of_poligon_of_players.get(player.id);

    //with meal
    players_check_colision_meal(player);
    //with players
    players_check_colision_player(
      player,
      i,
      liczbaGraczy,
      graczeKlucze,
      map_of_points_of_poligon_of_players,
      points_of_poligon_of_the_player
    );

    for (let p of players.keys()) {
      if (player.coliding) {
        player.parametrs.color = "red";
        update_packs[player.mode].players[player.id].health = player.health;
      } else {
        player.parametrs.color = "black";
      }
      update_packs[player.mode].players[player.id].parametrs = player.parametrs;
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
      let player = players.get(i);
      pack.players[i] = {
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

function make_new_meal() {
  let id_of_meal = Math.random();
  let position = {
    x: 10000 * Math.random(),
    y: 10000 * Math.random(),
  };
  let type_of_meal = "speed";

  let color_num = Math.random();
  if (color_num > 0.7) {
    type_of_meal = "size";
  } else if (color_num > 0.4) {
    type_of_meal = "rotation";
  } else if (color_num >= 0.1) {
    type_of_meal = "speed";
  } else if (color_num < 0.1) {
    type_of_meal = "angles";
  }

  var mode = "FFA1";
  if (Math.random() > 0.5) {
    mode = "FFA2";
  }

  return {
    id: id_of_meal,
    data: {
      position: position,
      type: type_of_meal,
      mode: mode,
    },
  };
}

function meals_update() {
  if (meals_data_count < 3000) {
    let new_meal = make_new_meal();
    meals_data_count++;
    meals_data[new_meal.id] = new_meal.data;
    meals_to_add[new_meal.data.mode][new_meal.id] = meals_data[new_meal.id];
  }
}

function spawn_bots() {
  if (players.size < 7) {
    add_player(Math.random(), generateNickname(), "FFA1", true);
  }
}

//ought to be optimized
function send_data(init_packs, update_packs, remove_packs) {
  for (const [id, player] of players.entries()) {
    if (!player.bot) {
      const mode = player.mode;

      const init_data = init_packs[mode];
      const update_data = update_packs[mode];
      const remove_data = remove_packs[mode];

      // Sprawdź, czy trzeba wysłać dane inicjalizacyjne
      if (
        (init_data.meals && Object.keys(init_data.meals).length > 0) ||
        (init_data.players && Object.keys(init_data.players).length > 0)
      ) {
        SOCKETS[id].emit("init", init_data);
      }

      // Wyślij dane aktualizacji, jeśli istnieją
      if (Object.keys(update_data).length > 0) {
        SOCKETS[id].emit("update", update_data);
      }

      // Wyślij dane usunięcia, jeśli istnieją
      if (Object.keys(remove_data).length > 0) {
        SOCKETS[id].emit("remove", remove_data);
      }
    }
  }
}

const modes = ["FFA1", "FFA2"];

var init_packs = {};
var update_packs = { FFA1: { players: {} }, FFA2: { players: {} } };
var remove_packs = {};

setInterval(function () {
  init_packs = {};
  remove_packs = {};
  if (sone_online) {
    modes.forEach((mode) => {
      update_packs[mode].players = {};
      //for (var i of players.keys()) {
      //  if(players.get(i).mode==mode){
      //    update_packs[mode].players[i] = {};
      //  }
      //
      //}
    });
    meals_update();
    spawn_bots();
    players_update();

    modes.forEach((mode) => {
      init_packs[mode] = get_init_pack(mode);
      //update_packs[mode] = get_update_pack(mode);
      remove_packs[mode] = get_remove_pack(mode);
    });

    send_data(init_packs, update_packs, remove_packs);

    meals_to_add = { FFA1: {}, FFA2: {} };
    meals_to_remove = { FFA1: [], FFA2: [] };
    players_to_add = { FFA1: {}, FFA2: {} };
    players_to_remove = { FFA1: [], FFA2: [] };
  }

  filling_up_servers = { FFA1: 0, FFA2: 0 };

  players.forEach((player) => {
    if (player.mode === "FFA1") {
      filling_up_servers.FFA1++;
    } else if (player.mode === "FFA2") {
      filling_up_servers.FFA2++;
    }
  });
}, 1000 / 15);

var filling_up_servers = { FFA1: 0, FFA2: 0 };

setInterval(function () {
  sone_online = false;
  for (let i of players.keys()) {
    if (!players.get(i).bot) {
      sone_online = true;
      break;
    }
  }

  io.emit("filling_up_servers", filling_up_servers);
}, 1000);

//25

//Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

//clinic flame -- node server.js

//Set-ExecutionPolicy Restricted -Scope CurrentUser
