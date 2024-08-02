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