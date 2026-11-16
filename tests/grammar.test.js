import assert from 'node:assert/strict';
import { test } from 'node:test';
import { analyzeGrammar } from '../src/grammar.js';
import { ANALYSIS } from '../src/pipeline.js';

const sorted = (set) => [...set].sort();

// Gramática de expresiones del libro de texto: sus conjuntos son conocidos y
// sirven para validar el algoritmo de forma independiente de Tortuga.
const EXPRESSION_PRODUCTIONS = [
  { head: 'E', body: ['T', 'Er'] },
  { head: 'Er', body: ['+', 'T', 'Er'] },
  { head: 'Er', body: [] },
  { head: 'T', body: ['F', 'Tr'] },
  { head: 'Tr', body: ['*', 'F', 'Tr'] },
  { head: 'Tr', body: [] },
  { head: 'F', body: ['(', 'E', ')'] },
  { head: 'F', body: ['id'] },
];

test('PRIMEROS de la gramática de expresiones', () => {
  const { firstSets } = analyzeGrammar(EXPRESSION_PRODUCTIONS, 'E');
  assert.deepEqual(sorted(firstSets.E), ['(', 'id']);
  assert.deepEqual(sorted(firstSets.Er), ['+', 'ε']);
  assert.deepEqual(sorted(firstSets.Tr), ['*', 'ε']);
});

test('SIGUIENTES de la gramática de expresiones', () => {
  const { followSets } = analyzeGrammar(EXPRESSION_PRODUCTIONS, 'E');
  assert.deepEqual(sorted(followSets.E), ['$', ')']);
  assert.deepEqual(sorted(followSets.T), ['$', ')', '+']);
  assert.deepEqual(sorted(followSets.F), ['$', ')', '*', '+']);
});

test('la gramática de Tortuga es LL(1): la tabla no tiene conflictos', () => {
  assert.deepEqual(ANALYSIS.conflicts, []);
});

test('SIGUIENTES(Lista) decide cuándo aplicar Lista → ε', () => {
  assert.deepEqual(sorted(ANALYSIS.followSets.Lista), ['$', ']']);
  assert.equal(ANALYSIS.table.Lista[']'], 2);
  assert.equal(ANALYSIS.table.Lista.$, 2);
});

test('detecta gramáticas que no son LL(1)', () => {
  const ambiguous = [
    { head: 'S', body: ['a', 'b'] },
    { head: 'S', body: ['a', 'c'] },
  ];
  const { conflicts } = analyzeGrammar(ambiguous, 'S');
  assert.deepEqual(conflicts, [{ nonterminal: 'S', lookahead: 'a' }]);
});
