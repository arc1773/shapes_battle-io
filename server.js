function generujPunktyPoligonu(x, y, size, liczbaKatow, katNachylenia) {
  const kat = (2 * Math.PI) / liczbaKatow;
  const punkty = [];

  for (let i = 0; i < liczbaKatow; i++) {
    const currentAngle = i * kat + katNachylenia;
    const px = x + size * Math.cos(currentAngle);
    const py = y + size * Math.sin(currentAngle);
    punkty.push({ x: px, y: py });
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

function sprawdzKolizjePoligonow(
  x1,
  y1,
  size1,
  liczbaKatow1,
  katNachylenia1,
  x2,
  y2,
  size2,
  liczbaKatow2,
  katNachylenia2
) {
  const punkty1 = generujPunktyPoligonu(
    x1,
    y1,
    size1,
    liczbaKatow1,
    katNachylenia1
  );
  const punkty2 = generujPunktyPoligonu(
    x2,
    y2,
    size2,
    liczbaKatow2,
    katNachylenia2
  );

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


const { Console } = require("console");
const express = require("express");
const http = require("http");
const { emit } = require("process");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

var players_data = {}; //123123:{...},
var meals_data = {};

app.use(express.static("public"));

server.listen(443);
console.log("server started(listan on port 443");

io.on("connection", (socket) => {
  console.log("a user connected");
  players_data[socket.id] = {
    position: {
      x: Math.random()*1000,
      y: Math.random()*1000,
    },
    mouse_position: {
      x: 250,
      y: 250,
    },
    screen_size: {
      x: 500,
      y: 500,
    },
    parametrs: {
      move_speed: 3,//move_speed
      size: 20,//health
      number_of_angles: 3,//damage
      rotation_speed: 0.06,//attack_speed
      color: "black",
    },
    haracteristics:{
      max_health:50,
      damage:0.3,
      regeneration: 0.2,
    },
    health: 50,
    to_update_param:{
      move_speed: 0,
      size: 0,
      number_of_angles: 0,
      rotation_speed: 0,
    },
    levels:{
      move_speed: 1,
      size: 1,
      number_of_angles: 1,
      rotation_speed: 1,
    },
    moving: false,
    in_game: true,
    angle: 0,
    spdX: 0,
    spdY: 0,
  };
  socket.emit("init", { meal: meals_data });

  socket.on("stop_start_move", function () {
    players_data[socket.id].moving = !players_data[socket.id].moving;
  });

  socket.on("mouse_position", function (data) {
    players_data[socket.id].mouse_position = data;
  });

  socket.on("change_canvas_size", function (data) {
    players_data[socket.id].screen_size = data;
  });

  socket.on("disconnect", () => {
    delete players_data[socket.id];
    console.log("user disconnected");
  });
});

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
  var pack = {};
  for (var i in players_data) {
    var player = players_data[i];
    player.angle += player.parametrs.rotation_speed;

    //death
    if(player.health<=0 && player.in_game){
      player.in_game=false;
    }    

    //regeneration
    if(player.health<player.haracteristics.max_health){
      player.health += player.haracteristics.regeneration
      if(player.health>player.haracteristics.max_health){
        player.health=player.haracteristics.max_health
      }
    }

    //colision
    //with meal
    for (var n in meals_data) {
      var meal = meals_data[n];
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
        if (meals_data[n].color == "red") {
          player.to_update_param.size += 1;
          if(player.to_update_param.size>=10){
            player.to_update_param.size=0
            player.levels.size+=1;
            player.parametrs.size = 1.5*player.levels.size+20;
           
          }
        } else if (meals_data[n].color == "pink") {
          player.to_update_param.move_speed += 1;
          if(player.to_update_param.move_speed>=10){
            player.to_update_param.move_speed=0
            player.levels.move_speed += 1;
            player.parametrs.move_speed = logFunction(player.levels.move_speed, 3, 15);
          }
        } else if (meals_data[n].color == "green") {
          player.to_update_param.number_of_angles += 1;
          if(player.to_update_param.number_of_angles>=10){
            player.to_update_param.number_of_angles=0
            player.levels.number_of_angles+=1;
            player.parametrs.number_of_angles = player.levels.number_of_angles+2;
            player.haracteristics.damage = player.parametrs.number_of_angles/10
            
          }
        } else if (meals_data[n].color == "blue") {
          player.to_update_param.rotation_speed += 1;
          if(player.to_update_param.rotation_speed>=10){
            player.to_update_param.rotation_speed=0
            player.levels.rotation_speed+=1;
            player.parametrs.rotation_speed = player.levels.rotation_speed*0.06;
          }
        }

        delete meals_data[n];
        meals_to_remove.push(n);
      }
    }
    //with players
    for (var p in players_data) {
      var player2 = players_data[p];
      if (i != p) {
        if (
          sprawdzKolizjePoligonow(
            player.position.x,
            player.position.y,
            player.parametrs.size,
            player.parametrs.number_of_angles,
            player.angle,
            player2.position.x,
            player2.position.y,
            player2.parametrs.size,
            player2.parametrs.number_of_angles,
            player2.angle
          )
        ) {
          player.parametrs.color = "red";
          player2.parametrs.color = "red";
          player.health -= player2.haracteristics.damage;
          player2.health -= player.haracteristics.damage;
        } else {
          player.parametrs.color = "black";
          player2.parametrs.color = "black";
        }
      }
    }

    if(!player.in_game){
      player.parametrs.size=1
    }

    //move
    if (player.moving) {
      var mouse_positon = player.mouse_position;
      if (mouse_positon.x > player.screen_size.x * 0.75) {
        mouse_positon.x = player.screen_size.x * 0.75;
      } else if (mouse_positon.x < player.screen_size.x * 0.25) {
        mouse_positon.x = player.screen_size.x * 0.25;
      }
      if (mouse_positon.y > player.screen_size.y * 0.75) {
        mouse_positon.y = player.screen_size.y * 0.75;
      } else if (mouse_positon.y < player.screen_size.y * 0.25) {
        mouse_positon.y = player.screen_size.y * 0.25;
      }

      player.spdX =
        player.parametrs.move_speed *
        ((mouse_positon.x - player.screen_size.x / 2) /
          (player.screen_size.x / 4));
      player.spdY =
        player.parametrs.move_speed *
        ((mouse_positon.y - player.screen_size.y / 2) /
          (player.screen_size.y / 4));

      player.position.x += player.spdX;
      player.position.y += player.spdY;
    }
    pack[i] = {
      position: player.position,
      parametrs: player.parametrs,
      to_update_param: player.to_update_param,
      angle: player.angle,
      levels: player.levels,
      haracteristics: player.haracteristics,
      health: player.health,
    };
  }
  return pack;
}

var meals_to_add = {};
var meals_to_remove = [];

function meals_update() {
  //spawn
  //if(meals_data.lenth<=100){
  if (true) {
    let id_of_meal = Math.random();
    let position = {
      x: 10000 * Math.random(),
      y: 10000 * Math.random(),
    };
    let color_of_meal = "pink";

    if (position.x > 5000 && position.y > 5000) {
      color_of_meal = "red";
    } else if (position.x > 5000 && position.y < 5000) {
      color_of_meal = "blue";
    } else if (position.x < 5000 && position.y > 5000) {
      color_of_meal = "green";
    } else if (position.x < 5000 && position.y < 5000) {
      color_of_meal = "pink";
    }

    meals_data[id_of_meal] = {
      position: position,
      color: color_of_meal,
    };
    meals_to_add[id_of_meal] = meals_data[id_of_meal];
  }
}

setInterval(function () {
  meals_update();
  io.emit("init", { meal: meals_to_add });
  io.emit("update", {
    player: players_update(),
  });
  io.emit("remove", { meal: meals_to_remove });
  meals_to_add = {};
  meals_to_remove = [];
}, 1000 / 25);
