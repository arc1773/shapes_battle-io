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
      x: 5000,
      y: 5000,
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
      move_speed: 3,
      size: 20,
      number_of_angles: 3,
      rotation_speed: 1,
    },
    moving: false,
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
    //colision
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
          player.parametrs.size += 1;
        } else if (meals_data[n].color == "pink") {
          player.parametrs.move_speed += 1;
        }

        delete meals_data[n];
        meals_to_remove.push(n);
      }
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
      angle: player.angle,
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
    let chance = .5;
    if (position.x>5000) {
      chance = .25
    }else{
      chance = .75
    }
    if (Math.random() > chance) {
      color_of_meal = "red";
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
