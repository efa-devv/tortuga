import { END, EPSILON, formatProduction } from './grammar.js';

function createNode(symbol) {
  return { symbol, children: [], token: null };
}

function describeToken(token) {
  return token.type === END ? 'fin del programa' : `"${token.lexeme}"`;
}

function buildError(token, expected) {
  return {
    message: `Se encontró ${describeToken(token)} pero se esperaba: ${expected.join(', ')}`,
    line: token.line,
    column: token.column,
    expected,
  };
}

function matchTerminal(top, token) {
  if (top.symbol !== token.type) return { error: buildError(token, [top.symbol]) };
  if (top.node) top.node.token = token;
  const action = top.symbol === END ? 'Aceptar' : `Emparejar ${describeToken(token)}`;
  return { action, consumed: 1 };
}

function expandNonterminal(top, token, stack, grammar, table) {
  const productionIndex = table[top.symbol][token.type];
  if (productionIndex === undefined) {
    return { error: buildError(token, Object.keys(table[top.symbol])) };
  }
  const production = grammar.productions[productionIndex];
  const children = production.body.map(createNode);
  top.node.children = children.length > 0 ? children : [createNode(EPSILON)];
  // Se apila al revés para que el símbolo más a la izquierda quede en la cima.
  for (const child of [...children].reverse()) stack.push({ symbol: child.symbol, node: child });
  return { action: `Expandir ${formatProduction(production)}`, consumed: 0 };
}

// Analizador predictivo LL(1): un autómata de pila determinista. La pila guarda
// lo que falta por reconocer y la tabla decide cada movimiento con un solo
// token de anticipación.
export function parse(tokens, grammar, table) {
  const tree = createNode(grammar.startSymbol);
  const stack = [
    { symbol: END, node: null },
    { symbol: grammar.startSymbol, node: tree },
  ];
  const steps = [];
  let position = 0;

  while (stack.length > 0) {
    const snapshot = stack.map((entry) => entry.symbol);
    const top = stack.pop();
    const token = tokens[position];
    const outcome = grammar.nonterminals.has(top.symbol)
      ? expandNonterminal(top, token, stack, grammar, table)
      : matchTerminal(top, token);

    if (outcome.error) {
      steps.push({ stack: snapshot, position, action: `Error: ${outcome.error.message}` });
      return { accepted: false, steps, tree, error: outcome.error };
    }
    steps.push({ stack: snapshot, position, action: outcome.action });
    position += outcome.consumed;
  }
  return { accepted: true, steps, tree, error: null };
}
