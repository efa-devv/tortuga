import { ACCEPTING, CHAR_CLASSES, INITIAL_STATE, TRANSITIONS } from '../lexer.js';
import { EPSILON } from '../grammar.js';
import { svg } from './dom.js';

const STATE_BOX = { width: 104, height: 32 };

const STATE_POSITIONS = {
  INICIO: { x: 80, y: 235 },
  ENTERO: { x: 280, y: 60, loop: 'top' },
  PUNTO: { x: 460, y: 60 },
  DECIMAL: { x: 640, y: 60, loop: 'top' },
  PALABRA: { x: 280, y: 130, loop: 'right' },
  ABRE: { x: 280, y: 200 },
  CIERRA: { x: 280, y: 270 },
  COMENTARIO: { x: 280, y: 340, loop: 'right' },
  ESPACIO: { x: 280, y: 410, loop: 'right' },
};

function describeClasses(classes) {
  // Listar 8 de 9 clases en una flecha es ilegible; se nombra la excepción.
  if (classes.length <= CHAR_CLASSES.length / 2) return classes.join(', ');
  const missing = CHAR_CLASSES.filter((charClass) => !classes.includes(charClass));
  return `todo excepto ${missing.join(', ')}`;
}

function groupTransitions(state) {
  const classesByTarget = {};
  for (const [charClass, target] of Object.entries(TRANSITIONS[state])) {
    (classesByTarget[target] ??= []).push(charClass);
  }
  return Object.entries(classesByTarget).map(([target, classes]) => ({ target, label: describeClasses(classes) }));
}

function loopEdge({ x, y, loop }, label) {
  const halfWidth = STATE_BOX.width / 2;
  const halfHeight = STATE_BOX.height / 2;
  const isTop = loop === 'top';
  const path = isTop
    ? `M ${x - 14} ${y - halfHeight} C ${x - 36} ${y - 54}, ${x + 36} ${y - 54}, ${x + 14} ${y - halfHeight}`
    : `M ${x + halfWidth} ${y - 8} C ${x + 96} ${y - 28}, ${x + 96} ${y + 28}, ${x + halfWidth} ${y + 8}`;
  const labelAttributes = isTop
    ? { x, y: y - 48, 'text-anchor': 'middle' }
    : { x: x + 90, y: y + 3, 'text-anchor': 'start' };
  return [
    svg('path', { class: 'edge', d: path, 'marker-end': 'url(#arrow)' }),
    svg('text', { class: 'edge-label', ...labelAttributes }, label),
  ];
}

function straightEdge(from, to, label) {
  const start = { x: from.x + STATE_BOX.width / 2, y: from.y };
  const end = { x: to.x - STATE_BOX.width / 2, y: to.y };
  // La etiqueta va cerca del destino: junto al origen se amontonarían las
  // seis flechas que salen de INICIO.
  const isHorizontal = start.y === end.y;
  const labelX = start.x + (end.x - start.x) * (isHorizontal ? 0.5 : 0.7) - (isHorizontal ? 0 : 8);
  const labelY = start.y + (end.y - start.y) * 0.7 - (isHorizontal ? 6 : 0);
  return [
    svg('line', { class: 'edge', x1: start.x, y1: start.y, x2: end.x, y2: end.y, 'marker-end': 'url(#arrow)' }),
    svg('text', { class: 'edge-label', x: labelX, y: labelY, 'text-anchor': isHorizontal ? 'middle' : 'end' }, label),
  ];
}

function stateEdges(state) {
  const from = STATE_POSITIONS[state];
  return groupTransitions(state).flatMap(({ target, label }) =>
    target === state ? loopEdge(from, label) : straightEdge(from, STATE_POSITIONS[target], label),
  );
}

function stateNode(state) {
  const { x, y } = STATE_POSITIONS[state];
  const { width, height } = STATE_BOX;
  const isAccepting = state in ACCEPTING;
  const box = (inset, cssClass) =>
    svg('rect', {
      class: cssClass,
      x: x - width / 2 + inset,
      y: y - height / 2 + inset,
      width: width - inset * 2,
      height: height - inset * 2,
      rx: 8,
    });
  return [
    box(0, isAccepting ? 'node accepting' : 'node'),
    isAccepting ? box(3, 'node inner') : null,
    svg('text', { class: 'node-label', x, y }, state),
  ];
}

export function automatonDiagram() {
  const states = Object.keys(TRANSITIONS);
  const arrow = svg(
    'marker',
    { id: 'arrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto' },
    svg('path', { class: 'arrow', d: 'M 0 0 L 10 5 L 0 10 z' }),
  );
  const initial = STATE_POSITIONS[INITIAL_STATE];
  const initialArrow = svg('line', {
    class: 'edge',
    x1: 0,
    y1: initial.y,
    x2: initial.x - STATE_BOX.width / 2,
    y2: initial.y,
    'marker-end': 'url(#arrow)',
  });
  return svg(
    'svg',
    { class: 'diagram', viewBox: '0 0 720 440', width: 720, height: 440, role: 'img', 'aria-label': 'Diagrama del AFD léxico' },
    svg('defs', {}, arrow),
    initialArrow,
    ...states.flatMap(stateEdges),
    ...states.flatMap(stateNode),
  );
}

const TREE_CELL = { width: 100, height: 66 };
const TREE_BOX = { width: 90, height: 26 };

function treeNodeClass(node) {
  if (node.label === EPSILON) return 'node epsilon';
  return node.isLeaf ? 'node leaf' : 'node';
}

function treePoint({ x, y }) {
  return { x: x * TREE_CELL.width + TREE_CELL.width / 2, y: y * TREE_CELL.height + TREE_BOX.height };
}

function treeNode(node) {
  const { x, y } = treePoint(node);
  const showsLexeme = node.lexeme !== null && node.lexeme.toLowerCase() !== node.label;
  return [
    svg('rect', {
      class: treeNodeClass(node),
      x: x - TREE_BOX.width / 2,
      y: y - TREE_BOX.height / 2,
      width: TREE_BOX.width,
      height: TREE_BOX.height,
      rx: 6,
    }),
    svg('text', { x, y }, node.label),
    showsLexeme ? svg('text', { class: 'lexeme', x, y: y + TREE_BOX.height }, node.lexeme) : null,
  ];
}

function treeEdge({ from, to }) {
  const start = treePoint(from);
  const end = treePoint(to);
  return svg('line', {
    class: 'edge',
    x1: start.x,
    y1: start.y + TREE_BOX.height / 2,
    x2: end.x,
    y2: end.y - TREE_BOX.height / 2,
  });
}

export function treeDiagram(layout) {
  const width = layout.columns * TREE_CELL.width;
  const height = layout.rows * TREE_CELL.height + TREE_BOX.height;
  return svg(
    'svg',
    { class: 'tree', viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': 'Árbol de derivación' },
    ...layout.edges.map(treeEdge),
    ...layout.nodes.flatMap(treeNode),
  );
}

const DRAWING_PADDING = 30;
const MIN_DRAWING_SIZE = 120;

function drawingBounds(turtle) {
  const points = [{ x: 0, y: 0 }, turtle, ...turtle.segments.flatMap((segment) => [segment.from, segment.to])];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  return {
    minX,
    minY,
    width: Math.max(Math.max(...xs) - minX, MIN_DRAWING_SIZE),
    height: Math.max(Math.max(...ys) - minY, MIN_DRAWING_SIZE),
  };
}

function turtleMarker(turtle, size) {
  const points = `0,${-size} ${size * 0.6},${size * 0.7} ${-size * 0.6},${size * 0.7}`;
  return svg('polygon', {
    points,
    fill: '#0f7b63',
    transform: `translate(${turtle.x} ${turtle.y}) rotate(${turtle.heading})`,
  });
}

export function drawingDiagram(turtle) {
  const bounds = drawingBounds(turtle);
  const viewBox = [
    bounds.minX - DRAWING_PADDING,
    bounds.minY - DRAWING_PADDING,
    bounds.width + DRAWING_PADDING * 2,
    bounds.height + DRAWING_PADDING * 2,
  ].join(' ');
  const lines = turtle.segments.map(({ from, to, color }) =>
    svg('line', {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      stroke: color,
      'stroke-width': 2,
      'stroke-linecap': 'round',
      'vector-effect': 'non-scaling-stroke',
    }),
  );
  const markerSize = Math.max(bounds.width, bounds.height) * 0.035;
  return svg(
    'svg',
    { class: 'paper', viewBox, role: 'img', 'aria-label': 'Dibujo de la tortuga' },
    ...lines,
    turtleMarker(turtle, markerSize),
  );
}
