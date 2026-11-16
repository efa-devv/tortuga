import { END, EPSILON, formatProduction } from '../grammar.js';
import { ACCEPTING, CHAR_CLASSES, INITIAL_STATE, TRANSITIONS } from '../lexer.js';
import { ANALYSIS } from '../pipeline.js';
import { layoutTree } from '../tree.js';
import { automatonDiagram, drawingDiagram, treeDiagram } from './diagrams.js';
import { el, note, scrollBox, table } from './dom.js';

// Más filas que estas vuelven lento el navegador sin aportar a la lectura.
const MAX_TRACE_ROWS = 1500;

const row = (cells, attributes = {}) => el('tr', attributes, ...cells.map((cell) => el('td', {}, cell)));

const formatSet = (symbols) => `{ ${[...symbols].join(', ')} }`;

function needsParse(result, render) {
  if (result.parsed === null) return note('Corrige los errores léxicos para ver esta vista.');
  return render(result.parsed);
}

export function drawingView(result) {
  if (result.drawing === null) return note('El dibujo aparece cuando el programa es aceptado.');
  const { turtle } = result.drawing;
  // El "|| 0" evita mostrar "-0.0" por errores de redondeo del seno y coseno.
  const round = (value) => (Math.round(value * 10) / 10 || 0).toFixed(1);
  const summary = `${turtle.segments.length} segmentos · posición final (${round(turtle.x)}, ${round(turtle.y)})`;
  return el('div', {}, drawingDiagram(turtle), note(summary));
}

export function tokensView(result) {
  const rows = result.tokens.map((token, index) =>
    row([String(index + 1), token.type, token.lexeme, String(token.line), String(token.column), token.path.join(' → ')]),
  );
  return el(
    'div',
    {},
    note('Cada token es la coincidencia más larga que el AFD aceptó. El recorrido muestra los estados visitados.'),
    scrollBox(table(['#', 'Tipo', 'Lexema', 'Línea', 'Columna', 'Recorrido en el AFD'], rows)),
  );
}

function transitionRow(state) {
  const marks = `${state === INITIAL_STATE ? '→ ' : ''}${state in ACCEPTING ? '* ' : ''}`;
  const cells = CHAR_CLASSES.map((charClass) => {
    const target = TRANSITIONS[state][charClass];
    return el('td', target ? {} : { class: 'empty' }, target ?? '—');
  });
  return el('tr', {}, el('th', {}, `${marks}${state}`), ...cells, el('td', {}, ACCEPTING[state] ?? ''));
}

export function automatonView() {
  const rows = Object.keys(TRANSITIONS).map(transitionRow);
  return el(
    'div',
    {},
    el('h2', {}, 'Diagrama de estados'),
    note('Los estados de doble borde son de aceptación. El alfabeto se agrupa en clases de caracteres.'),
    el('div', { class: 'scroll plain' }, automatonDiagram()),
    el('h2', {}, 'Función de transición δ'),
    note('→ estado inicial · * estado de aceptación · — sin transición (el autómata se detiene).'),
    scrollBox(table(['Estado', ...CHAR_CLASSES, 'Token que produce'], rows)),
  );
}

export function grammarView() {
  const { grammar, firstSets, followSets } = ANALYSIS;
  const productionRows = grammar.productions.map((production, index) =>
    row([String(index), formatProduction(production)]),
  );
  const setRows = [...grammar.nonterminals].map((nonterminal) =>
    row([nonterminal, formatSet(firstSets[nonterminal]), formatSet(followSets[nonterminal])]),
  );
  return el(
    'div',
    {},
    el('h2', {}, 'Producciones'),
    note(`Gramática libre de contexto. Símbolo inicial: ${grammar.startSymbol}. Terminales: ${[...grammar.terminals].join(' ')}`),
    scrollBox(table(['#', 'Producción'], productionRows)),
    el('h2', {}, 'Conjuntos PRIMEROS y SIGUIENTES'),
    note('Calculados por iteración de punto fijo; de ellos se construye la tabla LL(1).'),
    scrollBox(table(['No terminal', 'PRIMEROS', 'SIGUIENTES'], setRows)),
  );
}

function parseTableRow(nonterminal, terminals) {
  const cells = terminals.map((terminal) => {
    const productionIndex = ANALYSIS.table[nonterminal][terminal];
    if (productionIndex === undefined) return el('td', { class: 'empty' }, '—');
    const production = ANALYSIS.grammar.productions[productionIndex];
    return el('td', { title: formatProduction(production) }, production.body.join(' ') || EPSILON);
  });
  return el('tr', {}, el('th', {}, nonterminal), ...cells);
}

export function parseTableView() {
  const terminals = [...ANALYSIS.grammar.terminals, END];
  const rows = [...ANALYSIS.grammar.nonterminals].map((nonterminal) => parseTableRow(nonterminal, terminals));
  return el(
    'div',
    {},
    note('M[no terminal, token] indica por qué cuerpo reemplazar el no terminal en la cima de la pila. Una celda vacía es un error de sintaxis.'),
    scrollBox(table(['', ...terminals], rows)),
  );
}

function remainingInput(tokens, position) {
  return tokens.slice(position).map((token) => token.lexeme || END).join(' ');
}

function stackCells(stack) {
  return stack.map((symbol, index) =>
    el('span', { class: index === stack.length - 1 ? 'cell top' : 'cell' }, symbol),
  );
}

function traceStepper(steps, tokens, rows) {
  const slider = el('input', { type: 'range', min: 1, max: steps.length, value: 1, 'aria-label': 'Paso' });
  const label = el('span', { class: 'mono' });
  const stack = el('div', { class: 'stack' });
  const input = note('');
  let current = 0;

  const show = (index) => {
    rows[current]?.classList.remove('current');
    current = Math.min(Math.max(index, 0), steps.length - 1);
    slider.value = current + 1;
    label.textContent = `Paso ${current + 1} de ${steps.length}`;
    stack.replaceChildren(el('span', { class: 'note' }, 'Pila:'), ...stackCells(steps[current].stack));
    input.textContent = `Entrada restante: ${remainingInput(tokens, steps[current].position)}`;
    rows[current]?.classList.add('current');
    rows[current]?.scrollIntoView({ block: 'nearest' });
  };

  const previous = el('button', { type: 'button' }, '← Anterior');
  const next = el('button', { type: 'button' }, 'Siguiente →');
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  slider.addEventListener('input', () => show(Number(slider.value) - 1));
  show(0);

  return el('div', {}, el('div', { class: 'stepper' }, previous, slider, next, label), stack, input);
}

function traceRow(step, index, tokens) {
  const isError = step.action.startsWith('Error');
  const cells = [String(index + 1), step.stack.join(' '), remainingInput(tokens, step.position), step.action];
  return row(cells, isError ? { class: 'error' } : {});
}

export function traceView(result) {
  return needsParse(result, ({ steps }) => {
    const rows = steps.slice(0, MAX_TRACE_ROWS).map((step, index) => traceRow(step, index, result.tokens));
    const truncated = steps.length > MAX_TRACE_ROWS
      ? note(`La tabla muestra los primeros ${MAX_TRACE_ROWS} de ${steps.length} pasos.`)
      : null;
    return el(
      'div',
      {},
      note('El analizador LL(1) es un autómata de pila: la cima es el símbolo de la derecha. Expandir reemplaza un no terminal; emparejar consume un token.'),
      traceStepper(steps, result.tokens, rows),
      scrollBox(table(['Paso', 'Pila', 'Entrada restante', 'Acción'], rows)),
      truncated,
    );
  });
}

export function treeView(result) {
  return needsParse(result, ({ tree, accepted }) => {
    const message = accepted
      ? 'Árbol de derivación: las hojas, leídas de izquierda a derecha, forman el programa.'
      : 'Árbol parcial: la derivación se detuvo en el error de sintaxis.';
    return el('div', {}, note(message), scrollBox(treeDiagram(layoutTree(tree))));
  });
}
