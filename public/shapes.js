function drawCircle(radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();
}

function drawCircle_t(x, y, radius, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
}


// Rysowanie kwadratu
function drawSquare(sideLength, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(-sideLength / 2, -sideLength / 2);
    ctx.lineTo(sideLength / 2, -sideLength / 2);
    ctx.lineTo(sideLength / 2, sideLength / 2);
    ctx.lineTo(-sideLength / 2, sideLength / 2);
    ctx.closePath();
    ctx.fill();
}

// Rysowanie wielokąta
//function drawPolygon(radius, sides, color) {
//    if (sides < 3) return;
//    ctx.fillStyle = color;
//    ctx.beginPath();
//    const angleStep = (2 * Math.PI) / sides;
//    for (let i = 0; i < sides; i++) {
//        const angle = i * angleStep - Math.PI / 2;
//        const xOffset = radius * Math.cos(angle);
//        const yOffset = radius * Math.sin(angle);
//        if (i === 0) {
//            ctx.moveTo(xOffset, yOffset);
//        } else {
//            ctx.lineTo(xOffset, yOffset);
//        }
//    }
//    ctx.closePath();
//    ctx.fill();
//}

function drawPolygon(x, y, radius, sides, startAngle, color) {
    if (sides < 3) return; // Wielokąt musi mieć co najmniej 3 boki

    ctx.beginPath();
    ctx.moveTo(
        x + radius * Math.cos(startAngle),
        y + radius * Math.sin(startAngle)
    );

    for (let i = 1; i < sides; i++) {
        ctx.lineTo(
            x + radius * Math.cos(startAngle + (i * 2 * Math.PI) / sides),
            y + radius * Math.sin(startAngle + (i * 2 * Math.PI) / sides)
        );
    }

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}