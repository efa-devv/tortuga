export const EPSILON = 'ε';
export const END = '$';

export function createGrammar(productions, startSymbol) {
  const nonterminals = new Set(productions.map((production) => production.head));
  const terminals = new Set();
  for (const symbol of productions.flatMap((production) => production.body)) {
    if (!nonterminals.has(symbol)) terminals.add(symbol);
  }
  return { productions, startSymbol, nonterminals, terminals };
}

export function formatProduction({ head, body }) {
  return `${head} → ${body.length > 0 ? body.join(' ') : EPSILON}`;
}

function addAll(target, source) {
  const sizeBefore = target.size;
  for (const item of source) target.add(item);
  return target.size > sizeBefore;
}

function withoutEpsilon(symbols) {
  return [...symbols].filter((symbol) => symbol !== EPSILON);
}

function createEmptySets(grammar) {
  const sets = {};
  for (const nonterminal of grammar.nonterminals) sets[nonterminal] = new Set();
  return sets;
}

export function firstOfSequence(symbols, firstSets, grammar) {
  const result = new Set();
  for (const symbol of symbols) {
    const symbolFirst = grammar.nonterminals.has(symbol) ? firstSets[symbol] : new Set([symbol]);
    addAll(result, withoutEpsilon(symbolFirst));
    if (!symbolFirst.has(EPSILON)) return result;
  }
  result.add(EPSILON);
  return result;
}

// Punto fijo: PRIMEROS de un no terminal depende de los de otros, así que se
// repite hasta que una pasada completa no agregue nada.
export function computeFirstSets(grammar) {
  const firstSets = createEmptySets(grammar);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { head, body } of grammar.productions) {
      const added = addAll(firstSets[head], firstOfSequence(body, firstSets, grammar));
      changed = changed || added;
    }
  }
  return firstSets;
}

function propagateFollow({ head, body }, followSets, firstSets, grammar) {
  let changed = false;
  body.forEach((symbol, index) => {
    if (!grammar.nonterminals.has(symbol)) return;
    const restFirst = firstOfSequence(body.slice(index + 1), firstSets, grammar);
    const inherited = restFirst.has(EPSILON) ? followSets[head] : [];
    const added = addAll(followSets[symbol], [...withoutEpsilon(restFirst), ...inherited]);
    changed = changed || added;
  });
  return changed;
}

export function computeFollowSets(grammar, firstSets) {
  const followSets = createEmptySets(grammar);
  followSets[grammar.startSymbol].add(END);
  let changed = true;
  while (changed) {
    changed = false;
    for (const production of grammar.productions) {
      const added = propagateFollow(production, followSets, firstSets, grammar);
      changed = changed || added;
    }
  }
  return followSets;
}

function lookaheadsFor({ head, body }, firstSets, followSets, grammar) {
  const bodyFirst = firstOfSequence(body, firstSets, grammar);
  const fromFollow = bodyFirst.has(EPSILON) ? followSets[head] : [];
  return new Set([...withoutEpsilon(bodyFirst), ...fromFollow]);
}

// Una celda con dos producciones significa que la gramática no es LL(1); se
// reporta como conflicto en vez de sobrescribir en silencio.
export function buildParseTable(grammar, firstSets, followSets) {
  const table = {};
  const conflicts = [];
  for (const nonterminal of grammar.nonterminals) table[nonterminal] = {};

  grammar.productions.forEach((production, productionIndex) => {
    const row = table[production.head];
    for (const lookahead of lookaheadsFor(production, firstSets, followSets, grammar)) {
      if (lookahead in row) conflicts.push({ nonterminal: production.head, lookahead });
      row[lookahead] = productionIndex;
    }
  });
  return { table, conflicts };
}

export function analyzeGrammar(productions, startSymbol) {
  const grammar = createGrammar(productions, startSymbol);
  const firstSets = computeFirstSets(grammar);
  const followSets = computeFollowSets(grammar, firstSets);
  const { table, conflicts } = buildParseTable(grammar, firstSets, followSets);
  return { grammar, firstSets, followSets, table, conflicts };
}
