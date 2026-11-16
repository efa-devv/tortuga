import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tokenize } from '../src/lexer.js';
import { parse } from '../src/parser.js';
import { ANALYSIS } from '../src/pipeline.js';
import { collectLeaves, layoutTree } from '../src/tree.js';

const parseSource = (source) => parse(tokenize(source).tokens, ANALYSIS.grammar, ANALYSIS.table);

test('acepta un programa válido', () => {
  assert.equal(parseSource('avanza 100 derecha 90').accepted, true);
});

test('acepta el programa vacío', () => {
  assert.equal(parseSource('').accepted, true);
});

test('acepta bucles anidados', () => {
  assert.equal(parseSource('repetir 2 [ repetir 3 [ avanza 1 ] sube ]').accepted, true);
});

test('las hojas del árbol reproducen la cadena de entrada', () => {
  const { tree } = parseSource('repetir 4 [ avanza 100 ]');
  const leaves = collectLeaves(tree).filter((leaf) => leaf.symbol !== 'ε');
  assert.deepEqual(leaves.map((leaf) => leaf.token.lexeme), ['repetir', '4', '[', 'avanza', '100', ']']);
});

test('la traza termina con la pila vacía y la acción Aceptar', () => {
  const { steps } = parseSource('sube');
  assert.deepEqual(steps[0].stack, ['$', 'Programa']);
  assert.deepEqual(steps.at(-1).stack, ['$']);
  assert.equal(steps.at(-1).action, 'Aceptar');
});

test('rechaza un corchete sin cerrar', () => {
  const { accepted, error } = parseSource('repetir 4 [ avanza 100');
  assert.equal(accepted, false);
  assert.match(error.message, /fin del programa/);
  assert.ok(error.expected.includes(']'));
});

test('rechaza un corchete de cierre sobrante', () => {
  const { accepted, error } = parseSource('avanza 100 ]');
  assert.equal(accepted, false);
  assert.deepEqual(error.expected, ['$']);
});

test('rechaza un movimiento sin número e indica la posición', () => {
  const { error } = parseSource('avanza\nderecha 90');
  assert.deepEqual(error.expected, ['NUM']);
  assert.deepEqual([error.line, error.column], [2, 1]);
});

test('rechaza un color que no es un nombre de color', () => {
  assert.equal(parseSource('color 5').accepted, false);
});

test('el dibujo del árbol asigna una columna distinta a cada hoja', () => {
  const layout = layoutTree(parseSource('sube baja').tree);
  const leafColumns = layout.nodes.filter((node) => node.isLeaf).map((node) => node.x);
  assert.equal(new Set(leafColumns).size, leafColumns.length);
});
