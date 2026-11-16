import { EXAMPLES } from '../examples.js';
import { COLORS } from '../language.js';
import { analyzeProgram } from '../pipeline.js';
import { el } from './dom.js';
import { automatonView, drawingView, grammarView, parseTableView, tokensView, traceView, treeView } from './views.js';

const TABS = [
  { id: 'dibujo', label: 'Dibujo', render: drawingView },
  { id: 'tokens', label: 'Tokens', render: tokensView },
  { id: 'afd', label: 'AFD léxico', render: automatonView },
  { id: 'gramatica', label: 'Gramática', render: grammarView },
  { id: 'tabla', label: 'Tabla LL(1)', render: parseTableView },
  { id: 'traza', label: 'Traza de pila', render: traceView },
  { id: 'arbol', label: 'Árbol', render: treeView },
];

const STAGE_TITLES = {
  aceptado: 'Cadena aceptada',
  lexico: 'Rechazada: error léxico',
  sintactico: 'Rechazada: error sintáctico',
  semantico: 'Sintaxis aceptada, pero la ejecución falló',
};

const elements = {
  source: document.getElementById('source'),
  examples: document.getElementById('example-select'),
  status: document.getElementById('status'),
  tabs: document.getElementById('tabs'),
  view: document.getElementById('view'),
};

const state = { result: null, activeTab: TABS[0] };

function acceptedSummary(result) {
  const tokenCount = result.tokens.length - 1;
  return `${tokenCount} tokens · ${result.parsed.steps.length} pasos del autómata de pila`;
}

function renderStatus(result) {
  const isAccepted = result.stage === 'aceptado';
  const details = isAccepted
    ? el('span', {}, acceptedSummary(result))
    : el('ul', {}, ...result.errors.map((error) => el('li', {}, `Línea ${error.line}, columna ${error.column}: ${error.message}`)));
  elements.status.className = `status ${isAccepted ? 'ok' : 'fail'}`;
  elements.status.replaceChildren(el('strong', {}, STAGE_TITLES[result.stage]), details);
}

function renderView() {
  elements.view.replaceChildren(state.activeTab.render(state.result));
}

function renderTabs() {
  const buttons = TABS.map((tab) => {
    const button = el('button', { type: 'button', role: 'tab', 'aria-selected': String(tab === state.activeTab) }, tab.label);
    button.addEventListener('click', () => selectTab(tab));
    return button;
  });
  elements.tabs.replaceChildren(...buttons);
}

function selectTab(tab) {
  state.activeTab = tab;
  renderTabs();
  renderView();
}

function analyze() {
  state.result = analyzeProgram(elements.source.value);
  renderStatus(state.result);
  renderView();
}

function loadExample(index) {
  elements.source.value = EXAMPLES[index].source;
  analyze();
}

function setup() {
  const options = EXAMPLES.map((example, index) => el('option', { value: index }, example.name));
  elements.examples.replaceChildren(...options);
  elements.examples.addEventListener('change', () => loadExample(Number(elements.examples.value)));
  elements.source.addEventListener('input', analyze);
  document.getElementById('color-names').textContent = `(${Object.keys(COLORS).join(', ')})`;
  renderTabs();
  loadExample(0);
}

setup();
