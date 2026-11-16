# Registro de prompts y decisiones

**Herramienta:** Claude Code (modelo Claude Fable 5.2, de Anthropic), en la aplicación de escritorio.
**Fecha de la sesión:** 16 de noviembre de 2026.

Los prompts se copian tal como se escribieron. Las respuestas de la IA están resumidas.

## 1. Prompt inicial

Se pegó el enunciado completo de la tarea y a continuación:

> Do this for me rq, I choose you to do the project and throw it in github but first align with me which app we will make, something unique in the best most optimal language you can think of also align with me the coding style we will use (alot of comments, no deeper than 3 inside for better logic and flow, how to name the functions, the algorithms you will use to solve the problem and all that is asked)

**Respuesta de la IA.** No escribió código. Propuso:

- La aplicación *Tortuga*: un mini lenguaje de dibujo que muestra su AFD léxico, su analizador LL(1) con pila, el árbol de derivación y el dibujo.
- Los algoritmos: AFD dirigido por tabla con coincidencia más larga, PRIMEROS y SIGUIENTES por punto fijo, tabla LL(1) construida a partir de ellos, analizador predictivo con pila explícita y recorrido recursivo del árbol.
- El estilo: funciones pequeñas con nombre `verboSustantivo`, máximo 3 niveles de anidamiento, autómata y gramática guardados como tablas de datos, un módulo por etapa.

Luego hizo cuatro preguntas de opción múltiple.

## 2. Decisiones de alineación

| Pregunta de la IA | Opciones | Elegida |
|---|---|---|
| ¿Qué aplicación? | Tortuga · Laboratorio de regex a AFD · Simulador de autómata de pila | Tortuga |
| ¿Qué lenguaje e interfaz? | JavaScript web · TypeScript web · Python | JavaScript web, sin dependencias |
| ¿Idioma del código? | Todo español · Código en inglés y comentarios en español · Todo inglés | Código en inglés, comentarios en español |
| ¿Cómo crear el repositorio? | Público con Pages · Público sin Pages · Privado | Público con GitHub Pages |

**Por qué estas decisiones.**

- *Tortuga* cubre cuatro conceptos de la asignatura en una sola aplicación y el resultado se comprueba a simple vista con el dibujo.
- JavaScript sin dependencias evita explicar herramientas de compilación y permite una demostración en línea.
- TypeScript se descartó porque agrega un paso de compilación que el grupo tendría que explicar.

## 3. Prompts para corregir el estilo del código

Mientras la IA escribía los primeros módulos se enviaron dos correcciones:

> Btw, minimal comments, LIKE MINIMAL, only if the code looks confusing dont indent more than 3 inside, this is no bueno follow good practices

> For the comments, always the why never the what

**Efecto.** La propuesta original incluía un comentario de cabecera por archivo y uno por función. Se cambió a comentarios solo donde el motivo no es evidente (por ejemplo, por qué `PUNTO` no es estado de aceptación o por qué se apila el cuerpo de la producción al revés). Para respetar los 3 niveles de anidamiento, los ciclos internos se extrajeron a funciones con nombre (`propagateFollow`, `lookaheadsFor`, `scanLongestMatch`).

## 4. Decisiones de diseño tomadas por la IA

| Decisión | Motivo |
|---|---|
| El autómata y la gramática son tablas de datos (`TRANSITIONS`, `PRODUCTIONS`) | Se puede señalar δ o una producción directamente en el código |
| La tabla LL(1) se calcula, no se escribe a mano | Demuestra el algoritmo y detecta conflictos si se cambia la gramática |
| `repetir` exige entero en la ejecución, no en la gramática | El token `NUM` cubre enteros y decimales; separar los tokens complicaba el AFD sin aportar |
| El análisis léxico reporta todos los errores; el sintáctico solo el primero | Recuperarse de errores sintácticos en LL(1) requiere modo pánico y quedó fuera del alcance |
| Límite de 20 000 movimientos | Un bucle anidado grande bloqueaba la pestaña |
| El contenido se inserta como nodos de texto, nunca como HTML | El programa del usuario se muestra en varias vistas y no debe interpretarse |

## 5. Errores encontrados y cómo se resolvieron

| Error | Causa | Corrección |
|---|---|---|
| `node --test tests/` fallaba con `Cannot find module` | En Node 22 un directorio como argumento se trata como archivo | Se usa `node --test`, que busca los archivos `*.test.js` |
| En el diagrama del AFD la etiqueta "espacio, salto" quedaba encima de otra flecha | Las seis flechas que salen de `INICIO` tenían la etiqueta centrada | Las etiquetas se movieron hacia el estado destino y se alinean a la derecha |
| La posición final aparecía como `(-0.0, -0.0)` | Error de redondeo de seno y coseno al cerrar una figura | Se redondea y se normaliza el cero negativo antes de mostrar |

La IA verificó cada etapa ejecutando las 33 pruebas automáticas y abriendo la aplicación en un navegador para revisar cada pestaña con los ejemplos válidos e inválidos.

## 6. Modificaciones del grupo

Registrar aquí cualquier prompt o cambio manual posterior a esta sesión.

| Fecha | Prompt o cambio | Resultado |
|---|---|---|
| | | |
