# Tortuga

**Demo en línea:** <https://efa-devv.github.io/tortuga/>

Mini lenguaje de dibujo (estilo Logo) que muestra, paso a paso, cómo se reconoce un programa. Proyecto de la asignatura **Autómatas y Lenguajes Formales**, desarrollado con asistencia de Inteligencia Artificial.

```
repetir 4 [
  avanza 120
  derecha 90
]
```

## Qué muestra

| Pestaña | Concepto de la asignatura |
|---|---|
| Tokens | Análisis léxico: tokens y recorrido de estados de cada lexema |
| AFD léxico | Autómata finito determinista: diagrama y función de transición δ |
| Gramática | Gramática libre de contexto, conjuntos PRIMEROS y SIGUIENTES |
| Tabla LL(1) | Tabla de análisis predictivo construida a partir de la gramática |
| Traza de pila | Autómata de pila: pila, entrada restante y acción en cada paso |
| Árbol | Árbol de derivación de la cadena |
| Dibujo | Resultado de ejecutar el programa aceptado |

## Cómo ejecutarlo

No tiene dependencias ni paso de compilación. Los módulos de JavaScript necesitan un servidor HTTP (no funcionan abriendo el archivo con doble clic):

```bash
python3 -m http.server 8000
```

Luego abrir <http://localhost:8000>.

## Pruebas

Requiere Node.js 20 o superior.

```bash
node --test
```

Son 33 casos que cubren entradas válidas e inválidas de cada etapa. La tabla de resultados esperados y obtenidos está en [docs/EXPLICACION.md](docs/EXPLICACION.md).

## El lenguaje

| Instrucción | Efecto |
|---|---|
| `avanza N`, `retrocede N` | Mueve la tortuga N pasos |
| `derecha N`, `izquierda N` | Gira N grados |
| `sube`, `baja` | Levanta o apoya la pluma |
| `color NOMBRE` | negro, gris, rojo, naranja, verde, azul, morado, rosa |
| `repetir N [ ... ]` | Repite el bloque N veces (se puede anidar) |
| `# texto` | Comentario hasta el fin de línea |

## Estructura

```
index.html, styles.css   Interfaz web
src/language.js          Palabras reservadas, colores y producciones
src/lexer.js             AFD y análisis léxico
src/grammar.js           PRIMEROS, SIGUIENTES y tabla LL(1)
src/parser.js            Analizador LL(1) con pila explícita
src/tree.js              Posiciones del árbol de derivación
src/interpreter.js       Ejecución del árbol (tortuga)
src/pipeline.js          Encadena las etapas
src/ui/                  Vistas y diagramas SVG
tests/                   Pruebas automáticas
docs/PROMPTS.md          Registro de prompts y decisiones
docs/EXPLICACION.md      Explicación del código y relación con la asignatura
```

## Limitaciones conocidas

- El analizador sintáctico se detiene en el primer error; no intenta recuperarse para reportar varios.
- El lenguaje no tiene variables, expresiones aritméticas, procedimientos ni números negativos.
- Que `repetir` reciba un entero se valida al ejecutar, no en la gramática, porque el token `NUM` cubre enteros y decimales.
- La ejecución se corta a los 20 000 movimientos para no bloquear el navegador.
- La traza de pila muestra como máximo 1 500 filas.
- Árboles de programas muy largos son anchos y requieren desplazamiento horizontal.

## Herramienta de IA

Código generado con Claude Code (modelo Claude Fable 5.2, de Anthropic). El proceso está documentado en [docs/PROMPTS.md](docs/PROMPTS.md).
