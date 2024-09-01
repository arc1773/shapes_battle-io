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

function draw_player(pos, data) {
  let player = interpolatedPlayersPos[socket.id];
  let drawX = pos.x - (player.x - wc / 2);
  let drawY = pos.y - (player.y - hc / 2);
  drawPoligon(
    drawX,
    drawY,
    data.parametrs.size,
    data.parametrs.number_of_angles,
    pos.angle,
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

  let size = 7;
  let angles = 4;
  let color = "orange";
  let angle = 0;

  switch (data.type) {
    case "angles":
      color = "green";
      angles = 5;
      break;
    case "rotation":
      color = "blue";
      angle = 75;
      break;
    case "size":
      color = "red";
      size = 8;
      break;
    case "speed":
      color = "orange";
      break;
  }

  if (angles == 4 && angle == 0) {
    ctx.fillStyle = color;
    ctx.fillRect(drawX, drawY, size, size);
  } else {
    drawPoligon(drawX, drawY, size / 1.75, angles, angle, color);
  }
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
