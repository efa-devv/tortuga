import assert from 'node:assert/strict';
import { test } from 'node:test';
import { EXAMPLES } from '../src/examples.js';
import { MAX_MOVES } from '../src/interpreter.js';
import { COLORS } from '../src/language.js';
import { analyzeProgram } from '../src/pipeline.js';

const TOLERANCE = 1e-9;

test('un cuadrado traza 4 segmentos y vuelve al origen', () => {
  const { stage, drawing } = analyzeProgram('repetir 4 [ avanza 100 derecha 90 ]');
  assert.equal(stage, 'aceptado');
  assert.equal(drawing.turtle.segments.length, 4);
  assert.ok(Math.abs(drawing.turtle.x) < TOLERANCE);
  assert.ok(Math.abs(drawing.turtle.y) < TOLERANCE);
});

test('avanza mueve hacia arriba y retrocede hacia abajo', () => {
  assert.equal(analyzeProgram('avanza 50').drawing.turtle.y, -50);
  assert.equal(analyzeProgram('retrocede 50').drawing.turtle.y, 50);
});

test('con la pluma arriba la tortuga se mueve sin dibujar', () => {
  const { turtle } = analyzeProgram('sube avanza 50 baja avanza 10').drawing;
  assert.equal(turtle.segments.length, 1);
  assert.equal(turtle.y, -60);
});

test('color cambia el color de los segmentos siguientes', () => {
  const { turtle } = analyzeProgram('avanza 1 color rojo avanza 1').drawing;
  assert.deepEqual(turtle.segments.map((segment) => segment.color), [COLORS.negro, COLORS.rojo]);
});

test('repetir con un número decimal es un error semántico', () => {
  const { stage, errors } = analyzeProgram('repetir 2.5 [ avanza 1 ]');
  assert.equal(stage, 'semantico');
  assert.match(errors[0].message, /número entero/);
});

test('un programa demasiado largo se detiene en el límite de movimientos', () => {
  const { stage, drawing } = analyzeProgram('repetir 9999 [ repetir 9999 [ avanza 1 ] ]');
  assert.equal(stage, 'semantico');
  assert.equal(drawing.turtle.segments.length, MAX_MOVES);
});

test('cada etapa se detiene en su propio tipo de error', () => {
  assert.equal(analyzeProgram('avanza @').stage, 'lexico');
  assert.equal(analyzeProgram('avanza').stage, 'sintactico');
});

test('los ejemplos de la interfaz dan el resultado que anuncian', () => {
  const expectedStage = (name) => name.match(/^Error (\S+)/)?.[1].replace(/[éá]/g, (c) => ({ é: 'e', á: 'a' })[c]) ?? 'aceptado';
  for (const { name, source } of EXAMPLES) {
    assert.equal(analyzeProgram(source).stage, expectedStage(name), name);
  }
});
