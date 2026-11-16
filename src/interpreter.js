import { COLORS } from './language.js';

// Sin tope, un bucle anidado como "repetir 9999 [ repetir 9999 [...] ]"
// congelaría la pestaña del navegador.
export const MAX_MOVES = 20000;

class TurtleError extends Error {
  constructor(message, token) {
    super(message);
    this.line = token.line;
    this.column = token.column;
  }
}

function createTurtle() {
  return { x: 0, y: 0, heading: 0, penDown: true, color: COLORS.negro, segments: [], moves: 0 };
}

function moveForward(turtle, distance, token) {
  turtle.moves += 1;
  if (turtle.moves > MAX_MOVES) {
    throw new TurtleError(`El programa supera el límite de ${MAX_MOVES} movimientos`, token);
  }
  const radians = (turtle.heading * Math.PI) / 180;
  const from = { x: turtle.x, y: turtle.y };
  // El rumbo 0 apunta hacia arriba y en pantalla el eje Y crece hacia abajo.
  turtle.x += Math.sin(radians) * distance;
  turtle.y -= Math.cos(radians) * distance;
  if (turtle.penDown) {
    turtle.segments.push({ from, to: { x: turtle.x, y: turtle.y }, color: turtle.color });
  }
}

const MOVES = {
  avanza: (turtle, amount, token) => moveForward(turtle, amount, token),
  retrocede: (turtle, amount, token) => moveForward(turtle, -amount, token),
  derecha: (turtle, amount) => { turtle.heading += amount; },
  izquierda: (turtle, amount) => { turtle.heading -= amount; },
};

function runMove(node, turtle) {
  const [direction, amount] = node.children;
  const directionToken = direction.children[0].token;
  MOVES[directionToken.type](turtle, Number(amount.token.lexeme), directionToken);
}

function runPen(node, turtle) {
  turtle.penDown = node.children[0].token.type === 'baja';
}

function runColor(node, turtle) {
  turtle.color = COLORS[node.children[1].token.lexeme.toLowerCase()];
}

function runLoop(node, turtle) {
  const countToken = node.children[1].token;
  const count = Number(countToken.lexeme);
  // La gramática acepta cualquier NUM; que sea entero es una regla semántica
  // que una gramática libre de contexto no puede expresar con este token.
  if (!Number.isInteger(count)) {
    throw new TurtleError(`"repetir" necesita un número entero, no ${countToken.lexeme}`, countToken);
  }
  const body = node.children[3];
  for (let iteration = 0; iteration < count; iteration++) execute(body, turtle);
}

// Lista → Instruccion Lista es recursiva por la derecha; se recorre con un
// ciclo para no agotar la pila de llamadas en programas largos.
function runList(node, turtle) {
  let list = node;
  while (list.children.length === 2) {
    execute(list.children[0], turtle);
    list = list.children[1];
  }
}

function runOnlyChild(node, turtle) {
  execute(node.children[0], turtle);
}

const EXECUTORS = {
  Programa: runOnlyChild,
  Instruccion: runOnlyChild,
  Lista: runList,
  Movimiento: runMove,
  Pluma: runPen,
  Color: runColor,
  Bucle: runLoop,
};

function execute(node, turtle) {
  EXECUTORS[node.symbol](node, turtle);
}

export function run(tree) {
  const turtle = createTurtle();
  try {
    execute(tree, turtle);
    return { turtle, error: null };
  } catch (error) {
    if (!(error instanceof TurtleError)) throw error;
    return { turtle, error: { message: error.message, line: error.line, column: error.column } };
  }
}
