export const KEYWORDS = new Set([
  'avanza',
  'retrocede',
  'derecha',
  'izquierda',
  'sube',
  'baja',
  'color',
  'repetir',
]);

export const COLORS = {
  negro: '#1f2933',
  gris: '#7b8794',
  rojo: '#d64545',
  naranja: '#e8890c',
  verde: '#2e9e5b',
  azul: '#2f6fde',
  morado: '#8a4fd6',
  rosa: '#e0569b',
};

export const START_SYMBOL = 'Programa';

// Un cuerpo vacío representa la producción ε.
export const PRODUCTIONS = [
  { head: 'Programa', body: ['Lista'] },
  { head: 'Lista', body: ['Instruccion', 'Lista'] },
  { head: 'Lista', body: [] },
  { head: 'Instruccion', body: ['Movimiento'] },
  { head: 'Instruccion', body: ['Pluma'] },
  { head: 'Instruccion', body: ['Color'] },
  { head: 'Instruccion', body: ['Bucle'] },
  { head: 'Movimiento', body: ['Direccion', 'NUM'] },
  { head: 'Direccion', body: ['avanza'] },
  { head: 'Direccion', body: ['retrocede'] },
  { head: 'Direccion', body: ['derecha'] },
  { head: 'Direccion', body: ['izquierda'] },
  { head: 'Pluma', body: ['sube'] },
  { head: 'Pluma', body: ['baja'] },
  { head: 'Color', body: ['color', 'COLOR'] },
  { head: 'Bucle', body: ['repetir', 'NUM', '[', 'Lista', ']'] },
];
