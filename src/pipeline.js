import { analyzeGrammar } from './grammar.js';
import { run } from './interpreter.js';
import { PRODUCTIONS, START_SYMBOL } from './language.js';
import { tokenize } from './lexer.js';
import { parse } from './parser.js';

export const ANALYSIS = analyzeGrammar(PRODUCTIONS, START_SYMBOL);

// Cada etapa solo corre si la anterior terminó sin errores: no tiene sentido
// analizar la sintaxis de tokens inválidos ni ejecutar un árbol incompleto.
export function analyzeProgram(source) {
  const { tokens, errors: lexErrors } = tokenize(source);
  if (lexErrors.length > 0) return { stage: 'lexico', tokens, errors: lexErrors, parsed: null, drawing: null };

  const parsed = parse(tokens, ANALYSIS.grammar, ANALYSIS.table);
  if (!parsed.accepted) return { stage: 'sintactico', tokens, errors: [parsed.error], parsed, drawing: null };

  const drawing = run(parsed.tree);
  if (drawing.error) return { stage: 'semantico', tokens, errors: [drawing.error], parsed, drawing };

  return { stage: 'aceptado', tokens, errors: [], parsed, drawing };
}
