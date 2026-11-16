const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function fill(element, attributes, children) {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
  element.append(...children.filter((child) => child !== null));
  return element;
}

// Todo el contenido se inserta como nodos de texto, nunca como HTML: el
// programa del usuario se muestra en varias vistas y no debe interpretarse.
export function el(tag, attributes = {}, ...children) {
  return fill(document.createElement(tag), attributes, children);
}

export function svg(tag, attributes = {}, ...children) {
  return fill(document.createElementNS(SVG_NAMESPACE, tag), attributes, children);
}

export function table(headers, rows) {
  const head = el('tr', {}, ...headers.map((header) => el('th', {}, header)));
  return el('table', {}, el('thead', {}, head), el('tbody', {}, ...rows));
}

export function scrollBox(...children) {
  return el('div', { class: 'scroll' }, ...children);
}

export function note(text) {
  return el('p', { class: 'note' }, text);
}
