// Funkcja generująca wierzchołki wielokąta
function generatePolygonVertices({ x, y }, size, sides, angle) {
  const vertices = [];
  const angleStep = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const currentAngle = angle + i * angleStep;
    vertices.push({
      x: x + size * Math.cos(currentAngle),
      y: y + size * Math.sin(currentAngle),
    });
  }
  return vertices;
}

// Funkcja do sprawdzania kolizji między dwoma wielokątami
function polygonsCollision(poly1, poly2) {
  const getAxes = (poly) =>
    poly.map((_, i) => {
      const next = poly[(i + 1) % poly.length];
      return { x: next.y - poly[i].y, y: poly[i].x - next.x };
    });

  const project = (axis, poly) => poly.map((v) => v.x * axis.x + v.y * axis.y);
  const overlap = (proj1, proj2) =>
    Math.max(...proj1) >= Math.min(...proj2) &&
    Math.max(...proj2) >= Math.min(...proj1);

  const axes = [...getAxes(poly1), ...getAxes(poly2)];
  return axes.every((axis) =>
    overlap(project(axis, poly1), project(axis, poly2))
  );
}

// Główna funkcja sprawdzająca kolizję na podstawie parametrów wielokątów
function checkPolygonsCollision(
  size1,
  position1,
  angle1,
  sides1,
  size2,
  position2,
  angle2,
  sides2
) {
  const poly1 = generatePolygonVertices(position1, size1, sides1, angle1);
  const poly2 = generatePolygonVertices(position2, size2, sides2, angle2);
  return polygonsCollision(poly1, poly2);
}
function generatePolygonVertices({ x, y }, size, sides, angle) {
  const vertices = [];
  const angleStep = (2 * Math.PI) / sides;
  for (let i = 0; i < sides; i++) {
    const currentAngle = angle + i * angleStep;
    vertices.push({
      x: x + size * Math.cos(currentAngle),
      y: y + size * Math.sin(currentAngle),
    });
  }
  return vertices;
}

function circlePolygonCollision(circle, polygon) {
  const vertices = generatePolygonVertices(
    polygon.position,
    polygon.size,
    polygon.angles,
    polygon.angle
  );

  // Sprawdzenie kolizji krawędzi wielokąta z okręgiem
  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i];
    const end = vertices[(i + 1) % vertices.length];

    if (lineCircleCollision(start, end, circle.position, circle.radius)) {
      return true;
    }
  }

  // Sprawdzenie, czy środek koła jest wewnątrz wielokąta
  if (isPointInPolygon(circle.position, vertices)) {
    return true;
  }

  return false;
}

function lineCircleCollision(start, end, circle, radius) {
  const ax = start.x - circle.x;
  const ay = start.y - circle.y;
  const bx = end.x - circle.x;
  const by = end.y - circle.y;

  const a = (bx - ax) ** 2 + (by - ay) ** 2;
  const b = 2 * (ax * (bx - ax) + ay * (by - ay));
  const c = ax ** 2 + ay ** 2 - radius ** 2;

  let disc = b ** 2 - 4 * a * c;
  if (disc <= 0) return false;
  disc = Math.sqrt(disc);

  const t1 = (-b - disc) / (2 * a);
  const t2 = (-b + disc) / (2 * a);

  if ((t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1)) return true;
  return false;
}

function isPointInPolygon(point, vertices) {
  let collision = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];
    if (
      vi.y > point.y !== vj.y > point.y &&
      point.x < ((vj.x - vi.x) * (point.y - vi.y)) / (vj.y - vi.y) + vi.x
    ) {
      collision = !collision;
    }
  }
  return collision;
}
const { randomInt } = require("crypto");
//Server
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

var game_data = {
  clients: {},
  meal: [],
};

app.use(express.static("public"));

io.on("connection", (socket) => {
  console.log("a user connected");
  game_data.clients[socket.id] = {
    position: {
      x: 275,
      y: 375,
    },
    in_game: false,
    size: 10,
    move_speed: 5,
    rotation_speed: 0.02,
    angles: 3,
    counter_to_angles: 0,
    angle: 0,
    color: "pink",
  };

  socket.on("move", (data) => {
    if(game_data.clients[socket.id].in_game){
      if (data.move) {
        game_data.clients[socket.id].position.x +=game_data.clients[socket.id].move_speed*((data.mouse_position.x-(data.wc/2))/(data.wc/2));
        game_data.clients[socket.id].position.y +=game_data.clients[socket.id].move_speed*((data.mouse_position.y-(data.hc/2))/(data.hc/2));
      }
    }
    //game_data.clients[socket.id].position.x+=1
    //game_data.clients[socket.id].position.y+=0
    io.emit("move", game_data);
  });
  socket.on("in_game", (data) => {
    game_data.clients[socket.id].in_game = data;
  });

  //socket.on("collision", (data) => {
  //  if (data) {
  //    game_data.clients[socket.id].color = "red";
  //  } else {
  //    game_data.clients[socket.id].color = "pink";
  //  }
  //});

  socket.on("disconnect", () => {
    delete game_data.clients[socket.id];
    console.log("user disconnected");
  });
});

function server_loop() {
  //send_game_data()
  counters_of_characteristic();
  change_angle();
  check_colision();
  
}
setInterval(server_loop, 1000 / 60);

function send_game_data() {
  io.emit("move", game_data);
}

//setInterval(send_game_data, 1)
function change_angle() {
  for (let p in game_data.clients) {
    game_data.clients[p].angle += game_data.clients[p].rotation_speed;
  }
}

function check_colision() {
  for (let f in game_data.clients) {
    let fe = game_data.clients[f];
    //with player
    for (let s in game_data.clients) {
      if (
        f != s &&
        game_data.clients[s].in_game &&
        game_data.clients[f].in_game
      ) {
        let se = game_data.clients[s];
        let col = checkPolygonsCollision(
          fe.size,
          fe.position,
          fe.angle,
          fe.angles,
          se.size,
          se.position,
          se.angle,
          se.angles
        );
        if (col) {
          fe.color = "red";
          se.color = "red";
          break;
        } else {
          fe.color = "pink";
          se.color = "pink";
        }
      }
    }
    //with meal
    for (let c in game_data.meal) {
      let meal = game_data.meal[c];
      const circle = {
        position: { x: meal.x, y: meal.y },
        radius: 5,
      };
      const polygon = {
        position: { x: fe.position.x, y: fe.position.y },
        size: fe.size,
        angles: fe.angles,
        angle: fe.angle,
      };
      let collision_c = circlePolygonCollision(circle, polygon);
      if (collision_c) {
        if (meal.type == "green") {
          fe.counter_to_angles += 1;
        } else if (meal.type == "yellow") {
          fe.move_speed += 1;
        } else if (meal.type == "purple") {
          fe.rotation_speed += 0.07;
        }
        game_data.meal.splice(c, 1);
      }
    }
  }
}

function counters_of_characteristic() {
  for (let c in game_data.clients) {
    let client = game_data.clients[c];
    if (client.counter_to_angles >= 5) {
      client.counter_to_angles = 0;
      client.angles += 1;
    }
  }
}

function spawn_meal() {
  if (game_data.meal.length <= 100) {
    let meal_x = Math.random() * 5000;
    let meal_y = Math.random() * 5000;
    let meal_type = Math.random();

    if (meal_type >= 0.66) {
      meal_type = "yellow";
    } else if (meal_type < 0.33) {
      meal_type = "green";
    } else if (meal_type >= 0.33) {
      meal_type = "purple";
    }
    game_data.meal.push({
      x: meal_x,
      y: meal_y,
      type: meal_type,
    });
  }
}
setInterval(spawn_meal, 500);

server.listen(443, () => {
  console.log("listening on *:443");
});
