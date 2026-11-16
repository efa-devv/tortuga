export const EXAMPLES = [
  {
    name: 'Cuadrado',
    source: `# Un cuadrado de lado 120
repetir 4 [
  avanza 120
  derecha 90
]`,
  },
  {
    name: 'Estrella',
    source: `color naranja
repetir 5 [
  avanza 180
  derecha 144
]`,
  },
  {
    name: 'Flor (bucles anidados)',
    source: `color morado
repetir 36 [
  repetir 4 [
    avanza 90
    derecha 90
  ]
  derecha 10
]`,
  },
  {
    name: 'Línea punteada (sube / baja)',
    source: `derecha 90
color azul
repetir 8 [
  avanza 20
  sube
  avanza 12.5
  baja
]`,
  },
  {
    name: 'Error léxico',
    source: `avanza 100
gira 90
avanza 12.
derecha 90 @`,
  },
  {
    name: 'Error sintáctico',
    source: `repetir 4 [
  avanza 100
  derecha
]`,
  },
  {
    name: 'Error semántico',
    source: `repetir 2.5 [
  avanza 100
]`,
  },
];
