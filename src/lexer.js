import { END } from './grammar.js';
import { COLORS, KEYWORDS } from './language.js';

export const INITIAL_STATE = 'INICIO';

export const CHAR_CLASSES = ['digito', 'letra', 'punto', '[', ']', '#', 'espacio', 'salto', 'otro'];

const ANY_EXCEPT_NEWLINE = Object.fromEntries(
  CHAR_CLASSES.filter((charClass) => charClass !== 'salto').map((charClass) => [charClass, 'COMENTARIO']),
);

// Función de transición δ: TRANSITIONS[estado][clase] = siguiente estado.
// Una entrada ausente significa que el autómata se detiene.
export const TRANSITIONS = {
  INICIO: {
    digito: 'ENTERO',
    letra: 'PALABRA',
    '[': 'ABRE',
    ']': 'CIERRA',
    '#': 'COMENTARIO',
    espacio: 'ESPACIO',
    salto: 'ESPACIO',
  },
  ENTERO: { digito: 'ENTERO', punto: 'PUNTO' },
  PUNTO: { digito: 'DECIMAL' },
  DECIMAL: { digito: 'DECIMAL' },
  PALABRA: { letra: 'PALABRA' },
  ABRE: {},
  CIERRA: {},
  COMENTARIO: ANY_EXCEPT_NEWLINE,
  ESPACIO: { espacio: 'ESPACIO', salto: 'ESPACIO' },
};

const SKIPPED = 'OMITIR';
const WORD = 'PALABRA';

// PUNTO no es de aceptación: "12." no es un número válido.
export const ACCEPTING = {
  ENTERO: 'NUM',
  DECIMAL: 'NUM',
  PALABRA: WORD,
  ABRE: '[',
  CIERRA: ']',
  COMENTARIO: SKIPPED,
  ESPACIO: SKIPPED,
};

const SINGLE_CHAR_CLASSES = { '.': 'punto', '[': '[', ']': ']', '#': '#', '\n': 'salto' };

export function classifyChar(char) {
  if (char in SINGLE_CHAR_CLASSES) return SINGLE_CHAR_CLASSES[char];
  if (/\d/.test(char)) return 'digito';
  if (/\p{L}/u.test(char)) return 'letra';
  if (/\s/.test(char)) return 'espacio';
  return 'otro';
}

// Coincidencia más larga: el autómata sigue hasta atascarse y se queda con el
// último estado de aceptación visitado, no con el primero.
function scanLongestMatch(source, start) {
  let state = INITIAL_STATE;
  let lastAccept = null;
  const path = [state];
  for (let index = start; index < source.length; index++) {
    state = TRANSITIONS[state][classifyChar(source[index])];
    if (state === undefined) break;
    path.push(state);
    if (state in ACCEPTING) lastAccept = { end: index + 1, state, pathLength: path.length };
  }
  if (lastAccept === null) return null;
  return { end: lastAccept.end, state: lastAccept.state, path: path.slice(0, lastAccept.pathLength) };
}

function classifyWord(lexeme) {
  const word = lexeme.toLowerCase();
  if (KEYWORDS.has(word)) return word;
  if (word in COLORS) return 'COLOR';
  return null;
}

function buildToken(match, lexeme, cursor) {
  const category = ACCEPTING[match.state];
  if (category === SKIPPED) return {};
  const type = category === WORD ? classifyWord(lexeme) : category;
  if (type === null) return { error: `Palabra desconocida "${lexeme}"` };
  return { token: { type, lexeme, line: cursor.line, column: cursor.column, path: match.path } };
}

function advanceCursor(cursor, lexeme) {
  for (const char of lexeme) {
    const isNewline = char === '\n';
    cursor.line += isNewline ? 1 : 0;
    cursor.column = isNewline ? 1 : cursor.column + 1;
  }
  cursor.index += lexeme.length;
}

export function tokenize(source) {
  const tokens = [];
  const errors = [];
  const cursor = { index: 0, line: 1, column: 1 };

  while (cursor.index < source.length) {
    const match = scanLongestMatch(source, cursor.index);
    // Sin coincidencia se descarta un solo carácter para poder seguir y
    // reportar todos los errores léxicos de una vez.
    const lexeme = match ? source.slice(cursor.index, match.end) : source[cursor.index];
    const result = match ? buildToken(match, lexeme, cursor) : { error: `Carácter inesperado "${lexeme}"` };
    if (result.error) errors.push({ message: result.error, line: cursor.line, column: cursor.column });
    if (result.token) tokens.push(result.token);
    advanceCursor(cursor, lexeme);
  }

  tokens.push({ type: END, lexeme: '', line: cursor.line, column: cursor.column, path: [] });
  return { tokens, errors };
}
