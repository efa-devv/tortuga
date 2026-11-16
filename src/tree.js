function placeNode(node, depth, layout) {
  const children = node.children.map((child) => placeNode(child, depth + 1, layout));
  const isLeaf = children.length === 0;
  // Cada hoja ocupa su propia columna y cada padre se centra sobre sus hijos,
  // así dos ramas nunca se cruzan.
  const x = isLeaf ? layout.columns++ : (children[0].x + children.at(-1).x) / 2;
  const placed = { x, y: depth, label: node.symbol, lexeme: node.token?.lexeme ?? null, isLeaf };

  layout.nodes.push(placed);
  for (const child of children) layout.edges.push({ from: placed, to: child });
  layout.rows = Math.max(layout.rows, depth + 1);
  return placed;
}

export function layoutTree(root) {
  const layout = { nodes: [], edges: [], columns: 0, rows: 0 };
  placeNode(root, 0, layout);
  return layout;
}

export function collectLeaves(node) {
  if (node.children.length === 0) return [node];
  return node.children.flatMap(collectLeaves);
}
