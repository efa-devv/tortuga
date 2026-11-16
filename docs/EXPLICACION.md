# Explicación del código y relación con la asignatura

Guía para la sustentación. Cada sección indica el archivo y la función donde está lo que se explica.

## 1. Problema

**Entrada:** un programa escrito en el lenguaje Tortuga.
**Procesamiento:** decidir si la cadena pertenece al lenguaje y, si pertenece, ejecutarla.
**Salida:** aceptada o rechazada (con línea, columna y lo que se esperaba), más los tokens, la traza del autómata de pila, el árbol de derivación y el dibujo.

El problema es de reconocimiento de lenguajes. Se resuelve en dos niveles, igual que un compilador:

| Nivel | Tipo de lenguaje | Máquina que lo reconoce |
|---|---|---|
| Léxico (palabras, números) | Regular | Autómata finito determinista |
| Sintáctico (bloques anidados) | Libre de contexto | Autómata de pila |

Los corchetes de `repetir` pueden anidarse a cualquier profundidad y deben cerrar en orden. Ese lenguaje no es regular, por eso un AFD no basta y hace falta la pila.

## 2. Flujo de datos

```
texto ─► tokenize ─► tokens ─► parse ─► árbol ─► run ─► segmentos ─► SVG
         lexer.js             parser.js         interpreter.js
```

`analyzeProgram` en `src/pipeline.js` encadena las etapas y se detiene en la primera que falla. Devuelve `stage`: `lexico`, `sintactico`, `semantico` o `aceptado`.

## 3. Análisis léxico: el AFD (`src/lexer.js`)

La quíntupla (Q, Σ, δ, q0, F) está escrita como datos:

| Elemento | En el código | Valor |
|---|---|---|
| Q (estados) | claves de `TRANSITIONS` | INICIO, ENTERO, PUNTO, DECIMAL, PALABRA, ABRE, CIERRA, COMENTARIO, ESPACIO |
| Σ (alfabeto) | `CHAR_CLASSES` y `classifyChar` | Los caracteres se agrupan en 9 clases: digito, letra, punto, `[`, `]`, `#`, espacio, salto, otro |
| δ (transición) | `TRANSITIONS[estado][clase]` | Entrada ausente = el autómata se detiene |
| q0 (inicial) | `INITIAL_STATE` | INICIO |
| F (aceptación) | claves de `ACCEPTING` | Todos menos INICIO y PUNTO |

Expresiones regulares equivalentes:

- `NUM` = `digito+ ( . digito+ )?`
- `PALABRA` = `letra+`
- Comentario = `# (cualquiera excepto salto)*`

**Algoritmo de coincidencia más larga** (`scanLongestMatch`). El autómata avanza mientras exista transición y recuerda el último estado de aceptación visitado. Cuando se atasca, el token termina en ese punto. Ejemplo: con `12.` pasa por ENTERO, ENTERO, PUNTO y se queda sin entrada; PUNTO no acepta, así que el token es `12` y el `.` se reporta como error.

**Palabras reservadas** (`classifyWord`). El AFD solo reconoce `PALABRA`. Después una tabla decide si es palabra reservada, nombre de color o palabra desconocida. Así el autómata tiene 9 estados en vez de uno por cada letra de cada palabra.

Cada token guarda `type`, `lexeme`, `line`, `column` y `path` (los estados recorridos, que se ven en la pestaña Tokens).

## 4. Gramática (`src/language.js`, `src/grammar.js`)

G = (V, T, P, S) con S = `Programa`:

```
0  Programa    → Lista
1  Lista       → Instruccion Lista
2  Lista       → ε
3  Instruccion → Movimiento
4  Instruccion → Pluma
5  Instruccion → Color
6  Instruccion → Bucle
7  Movimiento  → Direccion NUM
8  Direccion   → avanza
9  Direccion   → retrocede
10 Direccion   → derecha
11 Direccion   → izquierda
12 Pluma       → sube
13 Pluma       → baja
14 Color       → color COLOR
15 Bucle       → repetir NUM [ Lista ]
```

En el código cada producción es `{ head, body }` y un `body` vacío es ε. Los no terminales son los símbolos que aparecen como `head`; el resto son terminales (`createGrammar`).

La gramática es LL(1): no tiene recursión por la izquierda y cada alternativa empieza con un terminal distinto. La prueba `la tabla no tiene conflictos` lo comprueba.

**PRIMEROS** (`computeFirstSets`). PRIMEROS(A) son los terminales con los que puede empezar una cadena derivada de A. Como unos conjuntos dependen de otros, se repite el recorrido de todas las producciones hasta que una pasada completa no agrega nada (punto fijo).

**SIGUIENTES** (`computeFollowSets`). SIGUIENTES(A) son los terminales que pueden aparecer justo después de A. Para cada A en un cuerpo `α A β` se agrega PRIMEROS(β); si β puede derivar ε, se agrega también SIGUIENTES de la cabeza.

**Tabla LL(1)** (`buildParseTable`). Para cada producción `A → α`, se coloca en `M[A, a]` para cada `a` en PRIMEROS(α). Si α deriva ε, también para cada `a` en SIGUIENTES(A). Dos producciones en la misma celda son un conflicto.

El caso clave es `Lista → ε`: SIGUIENTES(Lista) = { `$`, `]` }, así que la lista termina cuando el siguiente token es el fin del programa o un corchete de cierre.

## 5. Análisis sintáctico: el autómata de pila (`src/parser.js`)

`parse` es un autómata de pila determinista:

| Elemento del autómata | En el código |
|---|---|
| Alfabeto de entrada | Tipos de token |
| Alfabeto de pila | Terminales, no terminales y `$` |
| Pila inicial | `[$, Programa]` |
| Transición | La tabla LL(1) y el token actual |
| Aceptación | Pila vacía después de emparejar `$` |

En cada paso se saca la cima de la pila:

- **No terminal** (`expandNonterminal`): se busca `M[cima, token]`. Si existe, se apila el cuerpo de la producción al revés, para que el símbolo de la izquierda quede arriba. Si no existe, es un error y los tokens esperados son las columnas con valor de esa fila.
- **Terminal** (`matchTerminal`): debe ser igual al tipo del token actual; se consume el token. Si no coincide, es un error.

Cada entrada de la pila lleva también el nodo del árbol que le corresponde. Al expandir se crean los hijos y al emparejar se guarda el token en la hoja, de modo que el árbol de derivación se construye durante el mismo recorrido.

Cada paso se guarda en `steps` con una copia de la pila, la posición en la entrada y la acción. Eso es lo que muestra la pestaña Traza de pila.

## 6. Árbol de derivación (`src/tree.js`)

`layoutTree` recorre el árbol en postorden. Cada hoja recibe la siguiente columna libre y cada nodo interno se centra entre su primer y último hijo. La fila es la profundidad. Con eso las ramas no se cruzan.

Las hojas, leídas de izquierda a derecha, forman la cadena de entrada. La prueba `las hojas del árbol reproducen la cadena de entrada` lo verifica.

## 7. Ejecución (`src/interpreter.js`)

`run` recorre el árbol. `EXECUTORS` asocia cada no terminal con su función:

| No terminal | Función | Qué hace |
|---|---|---|
| Lista | `runList` | Ejecuta la instrucción y avanza a la sublista, con un ciclo |
| Movimiento | `runMove` | Mueve o gira según la palabra de `Direccion` |
| Pluma | `runPen` | Cambia `penDown` |
| Color | `runColor` | Cambia el color actual |
| Bucle | `runLoop` | Ejecuta la `Lista` interna N veces |

El estado de la tortuga es `{ x, y, heading, penDown, color, segments, moves }`. `moveForward` calcula la nueva posición con seno y coseno del rumbo y, si la pluma está abajo, agrega un segmento.

Dos comprobaciones ocurren aquí y no en la gramática: que `repetir` reciba un entero y que el programa no supere 20 000 movimientos.

## 8. Interfaz (`src/ui/`)

| Archivo | Responsabilidad |
|---|---|
| `main.js` | Lee el texto, llama a `analyzeProgram`, pinta el estado y la pestaña activa |
| `views.js` | Una función por pestaña que devuelve los elementos a mostrar |
| `diagrams.js` | Dibujos SVG: AFD, árbol y tortuga |
| `dom.js` | Funciones cortas para crear elementos |

La interfaz no contiene lógica de reconocimiento. El diagrama y la tabla del AFD se generan a partir de `TRANSITIONS`, y las tablas de la gramática a partir de `PRODUCTIONS`: si se cambia el lenguaje, las vistas cambian solas.

## 9. Pruebas

Se ejecutan con `node --test`. Resultado: 33 de 33 aprobadas.

| Entrada | Esperado | Obtenido |
|---|---|---|
| `avanza 100` | Tokens `avanza NUM $` | Igual |
| `repetir 4[avanza 10]` | 6 tokens aunque no haya espacios | Igual |
| `12.5` | Un `NUM`; recorrido INICIO → ENTERO → ENTERO → PUNTO → DECIMAL | Igual |
| `COLOR Rojo` | `color COLOR $` (sin distinguir mayúsculas) | Igual |
| `12.` | `NUM` 12 y error léxico en la columna 3 | Igual |
| `gira 90` | Error léxico: palabra desconocida | Igual |
| `avanza @ 10 %` | Dos errores léxicos | Igual |
| *(vacío)* | Aceptada | Igual |
| `repetir 2 [ repetir 3 [ avanza 1 ] sube ]` | Aceptada | Igual |
| `repetir 4 [ avanza 100` | Rechazada: se esperaba `]` | Igual |
| `avanza 100 ]` | Rechazada: se esperaba `$` | Igual |
| `avanza` + salto + `derecha 90` | Rechazada en línea 2, columna 1: se esperaba `NUM` | Igual |
| `color 5` | Rechazada | Igual |
| `repetir 4 [ avanza 100 derecha 90 ]` | 4 segmentos y la tortuga vuelve a (0, 0) | Igual |
| `sube avanza 50 baja avanza 10` | 1 segmento | Igual |
| `repetir 2.5 [ avanza 1 ]` | Error semántico: número entero | Igual |
| `repetir 9999 [ repetir 9999 [ avanza 1 ] ]` | Se detiene en 20 000 movimientos | Igual |
| Gramática de expresiones del libro | PRIMEROS y SIGUIENTES conocidos | Igual |
| `S → a b \| a c` | Conflicto en `M[S, a]` | Igual |

## 10. Preguntas probables en la sustentación

**¿Por qué dos autómatas y no uno?** Los tokens forman un lenguaje regular y un AFD los reconoce en tiempo lineal. La estructura anidada no es regular y necesita memoria de pila.

**¿Dónde está la función de transición?** En `TRANSITIONS` de `src/lexer.js`; la del autómata de pila es la tabla que devuelve `buildParseTable`.

**¿Por qué `Lista → Instruccion Lista` y no `Lista → Lista Instruccion`?** La segunda es recursiva por la izquierda y un analizador LL(1) entraría en un ciclo infinito expandiéndola.

**¿Qué pasa si se agrega una instrucción nueva?** Se agrega la palabra a `KEYWORDS`, la producción a `PRODUCTIONS` y su función a `EXECUTORS`. La tabla LL(1) y las vistas se recalculan solas.

**¿Qué no hace la aplicación?** Ver "Limitaciones conocidas" en el [README](../README.md).
