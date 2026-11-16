import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tokenize } from '../src/lexer.js';

const typesOf = (source) => tokenize(source).tokens.map((token) => token.type);

test('reconoce una instrucción simple', () => {
  assert.deepEqual(typesOf('avanza 100'), ['avanza', 'NUM', '$']);
});

test('reconoce corchetes pegados a otros tokens', () => {
  assert.deepEqual(typesOf('repetir 4[avanza 10]'), ['repetir', 'NUM', '[', 'avanza', 'NUM', ']', '$']);
});

test('reconoce decimales y registra el recorrido del AFD', () => {
  const { tokens, errors } = tokenize('12.5');
  assert.equal(errors.length, 0);
  assert.equal(tokens[0].lexeme, '12.5');
  assert.deepEqual(tokens[0].path, ['INICIO', 'ENTERO', 'ENTERO', 'PUNTO', 'DECIMAL']);
});

test('clasifica colores y no distingue mayúsculas', () => {
  assert.deepEqual(typesOf('COLOR Rojo'), ['color', 'COLOR', '$']);
});

test('ignora comentarios y espacios', () => {
  assert.deepEqual(typesOf('# hola [ ] 12\n  sube  '), ['sube', '$']);
});

test('una cadena vacía solo produce el fin de entrada', () => {
  assert.deepEqual(typesOf(''), ['$']);
});

test('registra línea y columna de cada token', () => {
  const { tokens } = tokenize('sube\n  baja');
  assert.deepEqual([tokens[1].line, tokens[1].column], [2, 3]);
});

test('coincidencia más larga: "12." es el número 12 seguido de un error', () => {
  const { tokens, errors } = tokenize('12.');
  assert.equal(tokens[0].lexeme, '12');
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /Carácter inesperado "\."/);
  assert.equal(errors[0].column, 3);
});

test('rechaza palabras desconocidas', () => {
  const { errors } = tokenize('gira 90');
  assert.match(errors[0].message, /Palabra desconocida "gira"/);
});

test('reporta todos los caracteres inválidos, no solo el primero', () => {
  const { errors } = tokenize('avanza @ 10 %');
  assert.equal(errors.length, 2);
});
