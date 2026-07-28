# AI_PROCESS.md

Documento de proceso de la prueba técnica **Ingeniero de Desarrollo — Trycore Colombia**.

Registro vivo: se escribe **durante** el desarrollo, no al final. Cada prompt se transcribe en el mismo turno
en que ocurre, textualmente y sin parafrasear.

- **Repositorio:** https://github.com/afvegac/ProjectEVMTryCore
- **Inicio del ejercicio:** 27 de julio de 2026

---

## 1. Herramientas de IA utilizadas

| Herramienta | Uso |
|---|---|
| **Claude Code (Opus 5)** en terminal | Herramienta principal. Aprendizaje de EVM, diseño de arquitectura, implementación, pruebas y documentación. |

**Por qué esta herramienta:** corre dentro de la terminal con acceso directo al sistema de archivos y a Git,
así que trabaja sobre el repositorio real en lugar de sobre fragmentos copiados y pegados. Eso importa en
esta prueba concretamente por dos razones: el historial de Git es parte calificada de la entrega, y este
documento exige registrar prompts en orden cronológico —algo que se sostiene mucho mejor cuando la
conversación y el código viven en el mismo lugar.

> ✍️ **Pendiente de completar por el candidato:** si usaste otras herramientas (búsquedas, videos, ChatGPT
> para contrastar), agrégalas aquí con el motivo. Este cuadro debe reflejar tu proceso real.

---

## 2. Registro cronológico de prompts

Transcripción textual, sin resumir ni corregir redacción.

### Prompt 1

> Vamos a iniciar a hacer un desarrollo, es una aplicacion que permita gestionar proyectos y sus activiaddes, y que calcule automaticamente los indicadores de valor ganado. Practicamente vamos a una app para poder saber el estado de nuestro proyecto en cualquier momento y con eso vamos a poder tomar desiciones de manera temprana, con la tecnica de valor ganado TECNICA EVM. Quiero que me expliques un poco que es esa tecnica, como se usa y como la podemos aplicar, yo ya estuve viendo videos y tengo claro el uso. pero lo hago para que tu enfoques y trabajemos sobre el mismo conocimiento.

**Respuesta de la IA:** explicación completa de EVM: las tres variables base (PV, EV, AC), los métodos de
acreditación del avance, variaciones (CV, SV), índices (CPI, SPI), pronósticos (EAC, ETC, VAC, TCPI),
Earned Schedule, y un ejemplo numérico. Cerró proponiendo un cuestionario sobre stack y alcance.

### Prompt 2

> Te compartire un documento, quiero que lo analises y entiendas por completo, la idea es primero que podamos trabajar la arquitectura y empezar a hacer lo que dice el documento. Ya tenemos el proyecto con git C:\Users\VICTUS\source\Projects Vega\ProjectEVMTryCore es el repo en el que nos encontramos trabajando. El documento referencia esta C:\Users\VICTUS\Downloads/Ingeniero de Desarrollo — Trycore Colombia (2).pdf

**Respuesta de la IA:** lectura del PDF y replanteamiento del encuadre. Identificó que el modelo EVM pedido
es más simple que el estándar PMI completo (sin línea de tiempo, sin Earned Schedule, 8 indicadores), que el
peso de la evaluación está en el video y en este documento, y que `AI_PROCESS.md` exige prompts textuales
desde el inicio.

**Decisiones tomadas en este punto** (respuestas a preguntas de la IA):

| Pregunta | Decisión |
|---|---|
| Backend | Node + NestJS |
| Frontend | Angular |
| Base de datos | PostgreSQL con docker-compose |
| Alcance | Estricto al documento |

### Prompt 3

> Quiero que tal como dice el documento trabajemos le estructura de ramas feature por cada funcionalidad, no vas a hacer commits sin tener mi aprobación y suipervición. Adicional el archivo AI_PROCESS.md debemos crearlo desde el principio ya que como entregable este debe tener la documentación y cada uno de los prompt que trabajamos.

**Respuesta de la IA:** ajustó el plan para mover `AI_PROCESS.md` de la última rama a la primera, como
archivo vivo actualizado en cada rama, y añadió la regla de aprobación previa a los commits.

### Prompt 4

> analisemos bien las formulas para verq ue estan claras y no vamos a hacer reprocesos

**Respuesta de la IA:** análisis fórmula por fórmula, con caso de referencia calculado a mano, política de
divisiones indefinidas, cuatro invariantes matemáticas y demostración numérica de por qué no se pueden
promediar los índices al consolidar. Detalle en la sección 3.

**Decisión tomada en este punto:**

| Pregunta | Decisión |
|---|---|
| Estado cuando un índice es indefinido pero CV/SV sí informa | `NOT_AVAILABLE` + nota explicativa (código de razón) |

### Prompt 5

> ls .claude/skills

**Respuesta de la IA:** verificó que no existen directorios de skills ni en el proyecto ni a nivel de usuario.

### Prompt 6

> para el front usa el skill frontend-design.

**Respuesta de la IA:** confirmó que esa skill no existe (`Unknown skill: frontend-design`) y propuso
`dataviz` como sustituto real para la gráfica PV/EV/AC, las tarjetas de indicadores y los semáforos
accesibles, a cargar en la rama del dashboard.

### Prompt 7

> Haz el manejo de git tu, lo unico que va a requerir mi autorizacion y revision seran los commit

**Respuesta de la IA:** acotó la regla del Prompt 3: la IA maneja ramas, merges, push y PRs de forma
autónoma; solo los commits requieren autorización y revisión.

### Prompt 8

> dale, aprueba el commit sin las dos ultimas lineas

**Contexto:** la IA propuso el mensaje del primer commit incluyendo las líneas de atribución
`Co-Authored-By: Claude Opus 5` y `Claude-Session`. Se aprobó el commit sin ellas.

**Respuesta de la IA:** ejecutó el commit `9ddaa56` con 37 archivos, publicó `develop` y
`feature/project-setup`, y abrió el Pull Request #1 hacia `develop`.

### Prompt 9

> continuemos con el desarrollo

**Contexto:** la IA había propuesto el commit del motor de cálculo EVM y esperaba aprobación.

**Respuesta de la IA:** al revisar el estado del repositorio detectó unos treinta archivos que no había
escrito (módulos `projects/`, `activities/`, `evm/`, `docker-compose.yml`, `db/init.sql`) y se detuvo a
preguntar por su origen en lugar de incorporarlos al commit.

### Prompt 10

> continuemos con el desarrollo

**Contexto:** repetido tras interrumpir el cuestionario de la IA sobre el origen de esos archivos.

**Respuesta de la IA:** continuó sin insistir. Al volver a inspeccionar encontró que el commit del motor
EVM ya estaba hecho (`edcf315`, integrado en el PR #2) con exactamente los siete archivos propuestos, y que
el código no identificado había sido descartado del árbol de trabajo. Continuó con la rama
`feature/database-schema`.

### Prompt 11

> instala docker y crea la imagen que necesitamos

**Respuesta de la IA:** instaló Docker Desktop 4.84.0 con winget, arrancó el servicio y el motor sobre WSL2,
y levantó el contenedor de PostgreSQL 16. Aclaró que no se construye una imagen propia: se usa la oficial
`postgres:16-alpine` con los scripts montados en `/docker-entrypoint-initdb.d`, que es el mecanismo que
PostgreSQL provee para ejecutarlos al crear el volumen.

### Prompt 12

> donde tenemos el plan?

**Respuesta de la IA:** indicó la ruta del plan de trabajo, fuera del repositorio, y resumió el avance
frente a la secuencia de ramas.

### Prompt 13

> copia el plan al repo en docs/ARCHITECTURE.md

**Respuesta de la IA:** trasladó el plan al repositorio como documento de arquitectura, actualizándolo con
las decisiones tomadas después de escribirlo (puerto 5433, conversión de NUMERIC, versión de TypeORM) y
omitiendo las secciones de proceso que ya viven en este documento.

### Prompt 14

> si

**Contexto:** aprobación de los dos commits propuestos para la rama `feature/database-schema`, después de
verificar la capa de persistencia contra el contenedor en marcha.

**Respuesta de la IA:** ejecutó ambos commits, abrió el PR #3, lo integró en `develop` y continuó con la
rama `feature/project-crud`.

### Prompt 15

> levanta el app quiero verla

**Respuesta de la IA:** advirtió primero que el dashboard todavía no existía —el frontend seguía siendo el
scaffold de Angular— y levantó el API y el servidor de desarrollo. Demostró el CRUD sobre los datos
sembrados y los cuatro casos del contrato de error (nombre vacío, propiedad no declarada, identificador
inexistente e identificador que no es UUID), que devuelven el mismo esquema con distinto código.

### Prompt 16

> si dale, sigue con actividades y el endpoint EVM

**Respuesta de la IA:** integró el PR #4 y continuó con `feature/activity-crud`.

### Prompt 17

> si, dale con el endpoint EVM

**Respuesta de la IA:** integró el PR #5 y construyó `feature/evm-api-endpoint`: el redondeo de
presentación, el adaptador entre persistencia y dominio, y `GET /api/projects/:projectId/evm`. Verificó la
salida contra el caso de referencia a través de toda la pila.

### Prompt 18

> lo veo bien y sin errores de compilación, sube y continuemos con al front

**Respuesta de la IA:** integró el PR #6 y construyó el dashboard en Angular. Antes de escribir la gráfica
cargó una guía de visualización de datos y **validó la paleta con su script** en lugar de elegir colores a
ojo. Advirtió que no dispone de navegador para comprobar el resultado renderizado.

### Prompt 19

> El dashboard esta ocupando mas de la pantalla, ajustalo para que se acople a la panatlla

**Respuesta de la IA:** diagnosticó la causa —los hijos de una rejilla CSS arrancan con `min-width: auto`,
así que la tabla ancha imponía su ancho mínimo y empujaba el documento entero— y la corrigió con
`min-width: 0`, además de sanear el `overflow` del SVG y la posición del tooltip.

### Prompt 20

> la pantalla aun queda muy grande y se ven barras y scrolls innecesarios

**Respuesta de la IA:** redujo el alto de la página: el motivo de cada indicador pasó a tooltip dentro de la
tabla, los dos estados se plegaron en las celdas de CPI y SPI, y la gráfica se hizo más apaisada con tope de
alto.

### Prompt 21

> solo elimina el scroll horizontal

**Respuesta de la IA:** reorganizó la tabla en fichas apiladas por debajo de 1200 px para eliminar todo
desplazamiento horizontal.

### Prompt 22

> No me gusta, el scroll de las actividades si estaba bien, el que estaba mal era el scroll de la pagina completa.

**Respuesta de la IA:** revirtió la reorganización en fichas, devolvió a la tabla su desplazamiento propio y
conservó solo las correcciones que afectaban al desplazamiento de la página.

### Prompt 23

> Bien, verificado y aprobado

---

## 3. Cómo aprendí EVM y cómo validé las fórmulas

### Punto de partida

Antes de escribir código pedí una explicación completa de la técnica (Prompt 1) y, tras leer el documento de
la prueba, un análisis específico de las ocho fórmulas exigidas (Prompt 4). El objetivo explícito fue evitar
reprocesos en el motor de cálculo, que es la pieza más cara de rehacer.

### Los tres conceptos que resultaron ser el núcleo

**1. El EV se valoriza con el presupuesto, nunca con el costo real.** Una actividad presupuestada en 10.000
que va al 50% gana 5.000 de valor, aunque se hayan gastado 30.000 en ella. El sobrecosto aparece en el AC y
no contamina el EV. Esa separación es literalmente lo que hace funcionar la técnica: sin ella, gastar más
"produciría" más valor ganado y los índices no significarían nada.

**2. CV y CPI son el mismo hecho expresado de dos maneras** —en dinero y en ratio—, porque ambos comparan EV
contra AC. Lo mismo ocurre con SV y SPI respecto a PV. De ahí se deduce una invariante verificable: el signo
de CV y la posición de CPI respecto a 1 nunca pueden contradecirse.

**3. `EAC = BAC / CPI` se puede reescribir como `EAC = BAC × AC / EV`.** Esta forma revela que EAC también
es indefinido cuando `EV = 0` (no solo cuando `AC = 0`), y produce una prueba de sanidad excelente: al 100%
de avance `EV = BAC`, luego `EAC = AC`. La proyección converge al costo real cuando ya no queda trabajo.

### Validación antes de implementar

Se construyó un caso de referencia de 3 actividades y se calcularon **todos los indicadores a mano**, antes
de escribir una línea del calculador. Ese mismo caso sirve de fixture de los tests unitarios, contenido del
`seed.sql` y demo del video.

| # | Actividad | BAC | %plan | %real | AC |
|---|---|---:|---:|---:|---:|
| 1 | Diseño de arquitectura | 10.000 | 100 | 100 | 9.000 |
| 2 | Desarrollo del backend | 20.000 | 75 | 50 | 12.000 |
| 3 | Pruebas de integración | 20.000 | 50 | 0 | 0 |

| Indicador | Act. 1 | Act. 2 | Act. 3 | **Proyecto** |
|---|---:|---:|---:|---:|
| PV | 10.000 | 15.000 | 10.000 | **35.000** |
| EV | 10.000 | 10.000 | 0 | **20.000** |
| AC | 9.000 | 12.000 | 0 | **21.000** |
| CV | +1.000 | −2.000 | 0 | **−1.000** |
| SV | 0 | −5.000 | −10.000 | **−15.000** |
| CPI | 1,1111 | 0,8333 | `null` | **0,9524** |
| SPI | 1,0000 | 0,6667 | 0,0000 | **0,5714** |
| EAC | 9.000 | 24.000 | `null` | **52.500** |
| VAC | +1.000 | −4.000 | `null` | **−2.500** |

Cada actividad ejerce un escenario distinto a propósito: la 1 confirma la invariante `EAC = AC` al 100%; la
2 es el caso nominal con desviación en costo y cronograma; la 3 es el borde `EV = 0` y `AC = 0`, donde CPI
es `0/0` —indeterminado, no cero—.

> ✍️ **Pendiente de completar por el candidato:** describe con tus palabras cómo contrastaste estos números
> por tu cuenta (hoja de cálculo, calculadora, comparación con un ejemplo de un video). El documento pide
> explicar cómo validaste que **entendiste** las fórmulas, no solo que la IA las produjo.

---

## 4. Decisiones donde no seguí lo que la IA sugirió

### Decisión 1 — Redirigir el ejercicio al documento fuente

**Qué propuso la IA:** tras explicar EVM, abrió un cuestionario para definir stack y alcance como si se
tratara de un producto abierto: preguntó si incluir Earned Schedule, si modelar una EDT jerárquica, si
soportar múltiples métodos de acreditación del avance, y si construir autenticación multiusuario.

**Qué hice:** interrumpí el cuestionario y le entregué el PDF de la prueba, indicándole que primero
analizara el documento completo y que trabajáramos sobre lo que ahí se pide.

**Por qué:** existía un contrato de requisitos explícito. La IA estaba diseñando funcionalidad que nadie
pidió —Earned Schedule, curva S temporal, EDT jerárquica— mientras el documento define un modelo
deliberadamente más simple: cinco campos por actividad y ocho indicadores. Construir de más habría consumido
un plazo de un día y se habría leído como no saber interpretar un requerimiento.

### Decisión 2 — Estado explícito en vez de deducirlo de la variación

**Qué propuso la IA:** ante el caso de un índice indefinido (por ejemplo `AC = 0` con `EV > 0`, donde CPI no
existe pero CV = +5.000 sí indica "bajo presupuesto"), recomendó devolver `NOT_AVAILABLE` a secas, por ser
lo más literal al documento y lo más simple de defender.

**Qué hice:** opté por `NOT_AVAILABLE` **acompañado de un código de razón** (`NO_COST_RECORDED`,
`NOT_STARTED`, `NO_PLANNED_WORK`, `NO_EARNED_VALUE`, `NO_ACTIVITIES`).

**Por qué:** el propósito de la herramienta es que el líder entienda de un vistazo el estado de su proyecto.
Un `N/A` sin explicación deja al usuario sin diagnóstico y sin saber si debe actuar o si simplemente faltan
datos por cargar. Con la razón explícita, el semáforo queda en gris y el motivo es evidente. El costo es un
campo adicional en el contrato; el beneficio es que la interfaz informa en lugar de callar.

### Decisión 3 — Rechazar la reorganización de la tabla en fichas

**Qué propuso la IA:** ante la petición de eliminar el desplazamiento horizontal, argumentó que catorce
columnas de cifras no rompibles no caben en cualquier pantalla y reorganizó la tabla en fichas apiladas por
debajo de 1200 px.

**Qué hice:** lo rechacé. El desplazamiento de la tabla nunca fue el problema; el que sobraba era el de la
página completa.

**Por qué:** una tabla ancha con su propio desplazamiento es la solución correcta para trece indicadores —
permite comparar filas alineadas, que es justamente para lo que sirve. Convertirla en fichas destruye esa
comparación para resolver un problema que no existía. La IA tomó la petición al pie de la letra en lugar de
preguntar cuál de los dos desplazamientos molestaba.

> ✍️ **Pendiente de completar por el candidato:** revisa que estas decisiones estén redactadas como las
> viviste y ajusta el razonamiento a tus palabras. Si surgen más desacuerdos durante el desarrollo, agrégalos
> aquí en el momento en que ocurran.

---

## 5. Cómo verifiqué que los cálculos son correctos

No basta con que el código corra: los números tienen que tener sentido. La estrategia de verificación tiene
tres capas.

**Capa 1 — Cálculo manual previo.** El caso de referencia de la sección 3 se resolvió a mano *antes* de
implementar. Los tests unitarios comparan contra esos valores fijos, no contra lo que produzca el código.

**Capa 2 — Invariantes matemáticas.** Son propiedades que deben cumplirse siempre; si alguna falla, hay un
bug aunque los tests de caso nominal pasen:

1. `signo(CV)` coincide con la posición de CPI respecto a 1 (y `signo(SV)` con SPI).
2. Al 100 % de avance, `EAC = AC`.
3. `ΣPV`, `ΣEV`, `ΣAC` y `ΣBAC` del proyecto son la suma exacta de sus actividades.
4. `VAC` **comparte signo** con `CV` siempre que EAC esté definido.

**Un error de la IA que las pruebas detectaron.** Al planificar, la IA afirmó como invariante que "VAC
tiene signo opuesto a CV". Al escribir la prueba correspondiente resultó falso. Desarrollando la fórmula:

```
VAC = BAC − EAC = BAC − BAC/CPI = BAC · (1 − 1/CPI)
```

Si CPI > 1, entonces `1/CPI < 1` y VAC es positivo — igual que CV. Los signos coinciden, no se invierten.
Los propios datos del caso de referencia lo confirman: la Actividad 2 tiene CV = −2.000 y VAC = −4.000.

Este episodio es la mejor evidencia de por qué las invariantes valen la pena: los tests de caso nominal
habrían pasado igual, porque el error estaba en una afirmación *sobre* el modelo y no en el código.

**Capa 3 — Dos errores sutiles detectados y demostrados con números.**

*Promediar índices al consolidar da resultados incorrectos:*

```
CPI promediando = (1,1111 + 0,8333) / 2      = 0,9722   ✗   correcto: 0,9524
SPI promediando = (1,0000 + 0,6667 + 0) / 3  = 0,5556   ✗   correcto: 0,5714
```

Además, el promedio ni siquiera puede ejecutarse: la Actividad 3 tiene CPI `null`, y excluirla o contarla
como cero son decisiones igualmente arbitrarias. Sumar primero y dividir después degrada con elegancia.

*Redondear antes de tiempo introduce error medible:*

```
CPI exacto   = 0,952380952…  →  EAC = 52.500,00   ✓
CPI a 4 dec. = 0,9524        →  EAC = 52.498,95   ✗  (−1,05)
CPI a 2 dec. = 0,95          →  EAC = 52.631,58   ✗  (+131,58)
```

Por eso `EAC` se calcula desde el CPI sin redondear y el redondeo se aplica solo al serializar la respuesta.

**Capa 4 — Un fallo silencioso previsto y cubierto con una prueba.** El driver `pg` devuelve las columnas
`NUMERIC` como **cadena de texto**, a propósito, para no perder precisión. Sin una conversión explícita, el
presupuesto llegaría al motor como `"10000.00"` y en la consolidación el operador `+` **concatenaría en
lugar de sumar**, produciendo `"010000.0020000.0020000.00"` en vez de `50000` — sin lanzar ningún error.

La prueba de integración no comprueba el tipo de un campo suelto, sino que **suma los tres presupuestos
sembrados y exige 50.000**, que es exactamente la forma en que el defecto se manifestaría.

**Capa 5 — Verificación de extremo a extremo.** `GET /api/projects/:projectId/evm` sobre el proyecto
sembrado devuelve exactamente la tabla calculada a mano, atravesando HTTP, servicio, ORM, PostgreSQL y
dominio. El consolidado sale `CPI 0,9524`, `SPI 0,5714`, `EAC 52.500` y `VAC −2.500`, y la actividad sin
iniciar publica `costPerformanceIndex: null` con razón `NOT_STARTED` en lugar de un cero engañoso.

**Un error propio que las pruebas atraparon.** Al escribir el redondeo se afirmó que `−4.000,005` debía
quedar en `−4.000,01`. Es falso: `Math.round` de JavaScript resuelve los empates hacia +∞, de modo que
`−0,5` va a `−0` y no a `−1`. La expectativa estaba mal, no el código. Se corrigió la prueba y se documentó
el comportamiento, evitando fijar como contrato un caso que además no es alcanzable aquí —los importes
provienen de divisiones y nunca caen exactamente en la mitad—.

> ✍️ **Pendiente de completar por el candidato:** una vez el API esté corriendo, compara la salida de
> `GET /api/projects/:id/evm` contra la tabla de la sección 3, dígito a dígito, y deja constancia aquí del
> resultado.

---

## 6. Decisión de arquitectura tomada de forma independiente

**El motor de cálculo EVM es un módulo de funciones puras, sin una sola dependencia de framework.**

`backend/src/evm/domain/evm-calculator.ts` no importa nada de NestJS, TypeORM ni HTTP. Recibe números y
devuelve números. Los adaptadores (`evm.service.ts`) traducen entidades de base de datos a ese dominio y su
resultado a DTOs de respuesta.

**Consecuencias concretas:**

- Se prueba sin levantar el framework ni la base de datos, lo que hace alcanzable la cobertura del 80 %
  exigida sin escribir tests artificiales.
- Garantiza por construcción que la lógica de negocio no vive en los controladores.
- Actividad y proyecto pasan por la **misma** función núcleo `computeIndicators(bac, pv, ev, ac)`, así que
  ambos niveles no pueden divergir. Cumple además el "si un bloque se repite más de dos veces, abstráelo".

**El corolario más importante:** la consolidación a nivel proyecto **suma PV, EV, AC y BAC y recalcula los
índices sobre los totales**, en lugar de promediar los índices de las actividades. Es el error clásico de
EVM y la demostración numérica está en la sección 5.

---

## 7. Reflexión honesta

> ✍️ **Pendiente de completar por el candidato al cierre del ejercicio.**
>
> El documento pide una reflexión honesta sobre qué harías diferente si repitieras el ejercicio. Esta
> sección debe escribirse con tus palabras, al final, cuando tengas la perspectiva completa. Algunas
> preguntas que pueden ayudarte a arrancar:
>
> - ¿En qué momento la IA te llevó por un camino que tuviste que corregir, y cuánto tiempo costó?
> - ¿Qué parte del sistema entiendes menos bien de lo que quisieras?
> - ¿Qué decidiste no construir, y te parece que fue la decisión correcta?
> - ¿Qué harías distinto en el orden de trabajo?

---

## Bitácora de ramas

| Rama | Estado |
|---|---|
| `develop` | Rama de integración |
| `feature/project-setup` | Integrada vía PR #1 |
| `feature/evm-calculation-engine` | Integrada vía PR #2 |
| `feature/database-schema` | Integrada vía PR #3 |
| `feature/project-crud` | Integrada vía PR #4 |
| `feature/activity-crud` | Integrada vía PR #5 |
| `feature/evm-api-endpoint` | Integrada vía PR #6 |
| `feature/angular-dashboard` | Integrada vía PR #7 |
| `feature/openapi-documentation` | Pendiente |
| `feature/documentation` | Pendiente |
