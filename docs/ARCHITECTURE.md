# Arquitectura

Documento de diseño de la herramienta de gestión de proyectos con indicadores de **Valor Ganado
(Earned Value Management)**. Recoge las decisiones técnicas y su justificación; el registro del proceso de
desarrollo está en [`AI_PROCESS.md`](../AI_PROCESS.md) y las instrucciones de ejecución en el
[`README.md`](../README.md).

---

## Contexto y alcance

El problema: un líder de proyecto no puede saber si su proyecto va bien o mal mirando el presupuesto gastado
y el avance logrado por separado. EVM introduce una tercera magnitud —el trabajo completado valorizado en
dinero— y con ella permite comparar plan, avance y costo en la misma unidad.

El alcance implementado es **estrictamente** el modelo definido en el enunciado, que es más simple que el
estándar PMI completo:

- **No hay línea de tiempo.** El porcentaje de avance planificado a la fecha de corte lo ingresa el usuario;
  no se deriva de un cronograma. Por tanto: sin curva S, sin distribución temporal, sin Earned Schedule y
  sin ETC/TCPI.
- La gráfica compara **PV/EV/AC por actividad** (barras agrupadas), no una curva en el tiempo.
- Exactamente **ocho indicadores**, con `EAC = BAC / CPI` como única variante de pronóstico.

---

## Stack

| Capa | Elección | Justificación |
|---|---|---|
| Backend | **NestJS + TypeScript** | Su arquitectura de módulos e inyección de dependencias impone por diseño la separación controlador / servicio / dominio que el proyecto exige. |
| Frontend | **Angular** | Comparte TypeScript, decoradores, DI y módulos con NestJS: un solo modelo mental de punta a punta. |
| Base de datos | **PostgreSQL 16** vía docker-compose | Un solo comando levanta la base con esquema y datos de ejemplo aplicados. |
| ORM | **TypeORM 1.x** | Integración oficial con Nest. Se eligió primero la línea 0.3 por prudencia ante un *major* recién publicado, y se cambió al comprobar que la 0.3 arrastra cuatro avisos de seguridad de severidad alta en dependencias de producción (`glob` → `minimatch` → `brace-expansion`) que la 1.x ya no tiene. |
| Pruebas | **Jest + Supertest** | El umbral de cobertura se declara en `package.json`, de modo que el 80 % es verificable y no una afirmación. |
| Documentación API | **@nestjs/swagger** | Genera OpenAPI desde los propios DTOs. |
| Linter | **ESLint + Prettier** | Configuración versionada en el repositorio, en backend y frontend. |

---

## Estructura del repositorio

```
ProjectEVMTryCore/
├── docker-compose.yml            # PostgreSQL 16
├── db/init/01-schema.sql         # esquema — fuente de verdad
├── db/init/02-seed.sql           # caso de referencia: 1 proyecto + 3 actividades
├── docs/ARCHITECTURE.md
├── AI_PROCESS.md
├── README.md
├── backend/                      # NestJS
└── frontend/                     # Angular
```

**Los scripts SQL son la fuente de verdad del esquema.** TypeORM se ejecuta con `synchronize: false` y mapea
contra ellos, en lugar de generarlos. Un esquema producido automáticamente por el ORM no es un artefacto
legible ni revisable, y dejar que el ORM altere tablas por su cuenta convierte el script de inicialización
en documentación desactualizada.

Docker ejecuta los scripts en orden alfabético al crear el volumen, montándolos en
`/docker-entrypoint-initdb.d`. No hace falta un `Dockerfile` propio: se usa la imagen oficial
`postgres:16-alpine`.

> El contenedor publica el puerto **5433** y no el 5432, para no chocar con una instalación local de
> PostgreSQL, que es habitual en máquinas de desarrollo.

### Estructura del backend

```
backend/src/
├── evm/
│   ├── domain/
│   │   ├── evm-calculator.ts            ← NÚCLEO PURO: sin Nest, sin TypeORM, sin HTTP
│   │   ├── evm-indicators.model.ts
│   │   ├── evm-status.enum.ts
│   │   └── evm.constants.ts
│   ├── evm-analysis.service.ts          # adaptador: entidades → dominio → DTO
│   ├── evm.controller.ts
│   ├── evm.module.ts
│   └── dto/                             # respuesta de indicadores y de análisis
├── projects/                            # controller / service / entity / dto / spec
├── activities/                          # dos controladores: anidado y por identificador
├── common/
│   ├── filters/                         # contrato de error uniforme
│   ├── decorators/                      # respuestas de error compartidas en OpenAPI
│   ├── dto/                             # forma publicada del error
│   ├── numeric.transformer.ts           # NUMERIC de PostgreSQL → number
│   ├── rounding.ts                      # redondeo de presentación
│   ├── column.constants.ts
│   └── validation.constants.ts
├── config/
│   ├── database.config.ts
│   └── swagger.config.ts
├── app.setup.ts                         # configuración transversal compartida
└── main.ts
```

**`app.setup.ts` existe por una razón concreta.** El prefijo `/api`, el `ValidationPipe` y el filtro de
errores se aplican desde una función que usan **tanto el arranque como las pruebas de integración**. Si se
configuraran solo en `main.ts`, las pruebas verificarían una aplicación sin *pipes* —un contrato distinto del
que ve el cliente real—, que es la forma habitual de que los fallos de validación pasen inadvertidos.

### Estructura del frontend

```
frontend/src/app/
├── core/
│   ├── evm.models.ts                    # espejo del contrato de la API
│   ├── evm-status.presentation.ts       # enum → etiqueta en español + símbolo
│   ├── evm-api.service.ts
│   ├── api.config.ts
│   └── validation.constants.ts
└── dashboard/
    ├── dashboard.ts                     # único componente con estado
    ├── summary-cards/                   # consolidado del proyecto
    ├── activities-table/                # tabla e indicadores por actividad
    ├── evm-bar-chart/                   # SVG escrito a mano
    ├── activity-form/                   # alta y edición
    └── status-badge/                    # semáforo con símbolo y texto
```

El estado vive únicamente en `dashboard.ts`; el resto son componentes de presentación. Así, cualquier cambio
dispara una sola recarga del análisis y toda la pantalla queda coherente.

### Decisión de arquitectura principal

**`evm-calculator.ts` es un módulo de funciones puras, sin una sola dependencia de framework.** No importa
nada de NestJS, TypeORM ni HTTP: recibe números y devuelve números.

Consecuencias:

- Se prueba sin levantar el framework ni la base de datos, lo que hace alcanzable una cobertura alta sin
  escribir pruebas artificiales.
- Garantiza **por construcción** que la lógica de negocio no vive en los controladores.
- Actividad y proyecto pasan por la **misma** función núcleo, así que ambos niveles no pueden divergir.

---

## Modelo de datos

```sql
projects    (id UUID PK, name VARCHAR(150) NOT NULL, description TEXT,
             created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)

activities  (id UUID PK, project_id UUID FK → projects ON DELETE CASCADE,
             name VARCHAR(150) NOT NULL,
             budget_at_completion     NUMERIC(14,2) CHECK (> 0),
             planned_progress_percent NUMERIC(5,2)  CHECK (BETWEEN 0 AND 100),
             actual_progress_percent  NUMERIC(5,2)  CHECK (BETWEEN 0 AND 100),
             actual_cost              NUMERIC(14,2) CHECK (>= 0),
             created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ)
```

Los cinco campos de actividad son exactamente los que enumera el enunciado. Se usa `NUMERIC` y no punto
flotante: el dinero nunca debe representarse en binario. Las restricciones `CHECK` replican en la base las
mismas reglas que valida la API, de modo que el dato queda protegido aunque se inserte por fuera.

### Conversión de NUMERIC a número

El driver `pg` devuelve las columnas `NUMERIC` **como cadena de texto**, deliberadamente: un `NUMERIC(14,2)`
puede exceder la precisión de un `double` y convertirlo en silencio perdería dígitos.

Para este dominio la conversión sí es segura, y es **obligatoria**: sin ella el presupuesto llegaría al motor
de cálculo como `"10000.00"` y en la consolidación el operador `+` concatenaría cadenas en lugar de sumar,
produciendo totales absurdos **sin lanzar ningún error**. Es un fallo silencioso, y por eso la conversión
vive en un único lugar: `common/numeric.transformer.ts`.

---

## Motor de cálculo EVM

### Fórmulas

```
PV  = (% planificado / 100) × BAC       CV  = EV − AC        CPI = EV / AC
EV  = (% real        / 100) × BAC       SV  = EV − PV        SPI = EV / PV
EAC = BAC / CPI                         VAC = BAC − EAC
```

El valor ganado se valoriza **siempre con el presupuesto, nunca con el costo real**: una actividad
presupuestada en 10.000 que va al 50 % gana 5.000, aunque se hayan gastado 30.000. El sobrecosto vive en el
AC y no contamina el EV. Esa separación es lo que hace funcionar la técnica: sin ella, gastar más
"produciría" más valor ganado y los índices no significarían nada.

### Decisiones de diseño

**1. Una sola función núcleo.** Actividad y proyecto pasan por el mismo `computeIndicators(base)`. Cumple el
principio de abstraer la lógica repetida y garantiza que ambos niveles no puedan divergir.

**2. Consolidación por suma, nunca por promedio.** PV, EV, AC y BAC son aditivos. **CPI y SPI no se
promedian**: se recalculan sobre los totales (`CPI_proyecto = ΣEV / ΣAC`). Promediar índices da un número
distinto e incorrecto; es el error clásico de EVM. La demostración numérica está más abajo.

**3. Política explícita de división indefinida.**

| Condición | CPI | SPI | EAC | VAC | Estado | Razón |
|---|---|---|---|---|---|---|
| Caso nominal | EV/AC | EV/PV | BAC/CPI | BAC−EAC | según índice | — |
| `AC = 0`, `EV > 0` | `null` | EV/PV | `null` | `null` | costo `NOT_AVAILABLE` | `NO_COST_RECORDED` |
| `AC = 0`, `EV = 0` | `null` | EV/PV | `null` | `null` | costo `NOT_AVAILABLE` | `NOT_STARTED` |
| `PV = 0` | EV/AC | `null` | normal | normal | cronograma `NOT_AVAILABLE` | `NO_PLANNED_WORK` |
| `EV = 0`, `AC > 0` | `0` | `0` si PV>0 | `null` | `null` | `OVER_BUDGET` / `BEHIND` | `NO_EARNED_VALUE` |
| Proyecto sin actividades | `null` | `null` | `null` | `null` | ambos `NOT_AVAILABLE` | `NO_ACTIVITIES` |

Se devuelve **`null`, no `0` ni `Infinity`**. Con `AC = 0` y `EV > 0` la eficiencia no es cero: es
indefinida —hay trabajo hecho sin costo registrado aún—. Devolver `0` comunicaría exactamente lo contrario
de lo que ocurre. `null` serializa en JSON como una ausencia honesta de dato y el frontend renderiza `N/A`.

**4. Interpretación como enum, acompañada de una razón.**

```ts
CostStatus        = UNDER_BUDGET | ON_BUDGET | OVER_BUDGET | NOT_AVAILABLE
ScheduleStatus    = AHEAD | ON_SCHEDULE | BEHIND | NOT_AVAILABLE
UnavailableReason = NO_ACTIVITIES | NOT_STARTED | NO_COST_RECORDED
                  | NO_PLANNED_WORK | NO_EARNED_VALUE
```

Cuando el índice es `null`, el estado es `NOT_AVAILABLE` y se acompaña de un código de razón.

Se evaluó y **se descartó deducir el estado del signo de CV/SV**: mostraría un semáforo verde junto a un
`CPI: N/A`, lo que se lee como incoherente. Con razón explícita, el semáforo queda en gris y el líder
entiende *por qué* no hay dato. Estado y razón viajan como enum, nunca como texto libre; la etiqueta en
español se resuelve en la interfaz, de modo que el backend queda libre de cadenas de presentación.

**5. Tolerancia de igualdad.** Un `CPI === 1` exacto casi nunca ocurre en punto flotante. Se compara contra
`INDEX_STATUS_TOLERANCE = 0.005`, alineada con los dos decimales que muestra la interfaz: si en pantalla se
lee `1.00`, el estado debe decir "conforme al plan".

**6. Redondeo solo en la frontera de serialización**, nunca como entrada de otro cálculo. No es una
preferencia estética: con los datos del caso de referencia el error es medible.

```
CPI exacto   = 0,952380952…  →  EAC = 52.500,00   ✓
CPI a 4 dec. = 0,9524        →  EAC = 52.498,95   ✗  (−1,05)
CPI a 2 dec. = 0,95          →  EAC = 52.631,58   ✗  (+131,58)
```

Se evaluó y se descartó `decimal.js`: añade una dependencia y las magnitudes de este dominio no justifican
aritmética decimal exacta. La decisión queda documentada, no asumida por omisión.

**7. Porcentajes en base 100, en una sola representación.** La API, la base de datos y el calculador usan
0–100; la división entre 100 ocurre en un único punto, con la constante `PERCENT_BASE`. Mantener dos
representaciones conviviendo (0–1 y 0–100) es una fuente silenciosa de errores de un factor de cien.

**8. Ningún argumento posicional del mismo tipo repetido.** La primera versión de la regla de clasificación
recibía tres parámetros del mismo tipo genérico en fila:

```ts
classifyIndex(index, aboveNeutral, atNeutral, belowNeutral)   // frágil
```

Intercambiar dos de ellos compila sin una sola advertencia y clasifica mal **todas** las actividades en
silencio; unas pruebas escritas contra el mismo orden equivocado tampoco lo detectarían. El compilador no
puede ayudar cuando todo comparte tipo. Se agrupan en un objeto nombrado, donde el error deja de existir:

```ts
classifyIndex(index, {
  above: CostStatus.UnderBudget,
  at:    CostStatus.OnBudget,
  below: CostStatus.OverBudget,
})
```

El mismo criterio se aplica a `analyzeIndex`, que recibe
`{ numerator, denominator, statuses, unavailableStatus, unavailableReason }`. En una aplicación cuyo único
propósito es que los números sean correctos, una firma que permite equivocarse en silencio es un defecto.

### Invariantes del modelo

Propiedades matemáticas que deben cumplirse siempre. Si alguna falla, hay un defecto, aunque las pruebas de
caso nominal pasen:

1. **`signo(CV)` coincide con la posición de CPI respecto a 1**, y `signo(SV)` con SPI. Ambos pares comparan
   las mismas magnitudes, uno en dinero y otro en ratio.
2. **Al 100 % de avance, `EAC = AC`.** Porque `EAC = BAC × AC / EV` y con `EV = BAC` se reduce a `AC`: la
   proyección converge al costo real cuando ya no queda trabajo.
3. **`ΣPV`, `ΣEV`, `ΣAC` y `ΣBAC` del proyecto son la suma exacta de los de sus actividades.**
4. **`VAC` comparte signo con `CV`** siempre que EAC esté definido, porque `VAC = BAC · (1 − 1/CPI)`.

---

## Caso de referencia

Un único conjunto de datos que sirve simultáneamente como fixture de las pruebas unitarias, contenido de
`db/init/02-seed.sql` y demostración del sistema. Los valores se calcularon **a mano antes** de implementar
el motor, y las pruebas comparan contra ellos.

**Proyecto: "Plataforma de Gestión Documental"**

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
| Costo | UNDER_BUDGET | OVER_BUDGET | N/A (`NOT_STARTED`) | **OVER_BUDGET** |
| Cronograma | ON_SCHEDULE | BEHIND | BEHIND | **BEHIND** |

Cada actividad ejerce a propósito un escenario distinto: la 1 confirma la invariante `EAC = AC` al 100 %; la
2 es el caso nominal con desviación en ambos ejes; la 3 es el borde `EV = 0` y `AC = 0`, donde el CPI es
`0/0` —indeterminado, no cero—.

### Por qué no se promedian los índices

```
CPI promediando = (1,1111 + 0,8333) / 2      = 0,9722   ✗   correcto: 0,9524
SPI promediando = (1,0000 + 0,6667 + 0) / 3  = 0,5556   ✗   correcto: 0,5714
```

Además, el promedio **ni siquiera puede ejecutarse**: la Actividad 3 tiene el CPI `null`, y excluirla o
contarla como cero son decisiones igualmente arbitrarias. Sumar primero degrada con elegancia — la
Actividad 3 aporta 0 a EV y AC, 10.000 a PV, y el CPI del proyecto queda perfectamente definido.

---

## Contrato de la API

```
POST   /api/projects                        crear proyecto
GET    /api/projects                        listar
GET    /api/projects/:id                    detalle
PATCH  /api/projects/:id                    editar
DELETE /api/projects/:id                    eliminar (cascada a actividades)

POST   /api/projects/:projectId/activities  crear actividad
GET    /api/projects/:projectId/activities  listar actividades
GET    /api/activities/:id                  consultar actividad
PATCH  /api/activities/:id                  editar
DELETE /api/activities/:id                  eliminar

GET    /api/projects/:projectId/evm         análisis completo
```

Crear y listar actividades cuelgan de la ruta del proyecto porque una actividad no existe fuera de él;
consultar, editar y eliminar viven bajo `/api/activities/:id`, donde el identificador basta para localizarla.

`GET /api/projects/:projectId/evm` devuelve en **una sola llamada** todo lo que el dashboard necesita: las
actividades con sus indicadores más el consolidado del proyecto. El CRUD permanece CRUD; el análisis es un
recurso aparte.

### Contrato de error

Validación con `class-validator` en los DTOs; el `ValidationPipe` global traduce los fallos a **400**, con
`forbidNonWhitelisted` activo para que una propiedad no declarada **rechace la petición** en lugar de
descartarse en silencio. Un identificador que no es UUID también da **400**; un recurso inexistente, **404**.

Todos los errores comparten una única forma, para cualquier código de estado:

```json
{
  "statusCode": 400,
  "error": "BadRequestException",
  "message": ["property presupuesto should not exist"],
  "path": "/api/projects",
  "timestamp": "2026-07-28T04:23:05.483Z"
}
```

El filtro captura **todas** las excepciones y no solo las de tipo `HttpException`: si un fallo inesperado se
escapara, el cliente recibiría una respuesta con forma distinta a la documentada. Los errores no previstos se
registran completos en el log y se devuelven como 500 sin trazas internas.

Ese contrato único es lo que permite al frontend traducir fallos con **un solo camino** en lugar de un caso
por endpoint. Todo queda declarado en OpenAPI, incluida la propia forma del error.

---

## Frontend

Una sola vista de dashboard, con componentes standalone:

- Selector de proyecto y formulario de alta y edición de actividades.
- **Tarjetas** con los indicadores consolidados; CPI y SPI destacados como cifra principal.
- **Gráfica de barras agrupadas** PV vs EV vs AC por actividad, con tooltip por grupo.
- **Tabla de actividades** con BAC, %plan, %real, AC y los ocho indicadores calculados.

Los valores `null` se renderizan `N/D` junto a su razón, nunca como `0`.

### El frontend no calcula ningún indicador

Todos los números vienen del backend. Replicar las fórmulas en el cliente crearía dos fuentes de verdad que
se desincronizan en cuanto una de las dos cambie. El frontend solo traduce enums a etiquetas en español.

### La gráfica se dibuja a mano, sin librería

Son tres series sobre un eje. Escribir el SVG directamente evita una dependencia de varios cientos de
kilobytes —el paquete queda en **92 kB transferidos**— y permite cumplir al detalle reglas que las librerías
imponen a su manera: separación de 2 px entre barras contiguas resuelta con espacio y no con un borde
dibujado, extremo de dato redondeado con base recta anclada al cero, y retícula de una sola *hairline*.

### El color nunca es el único canal

La paleta de las tres series se validó **con herramienta**, no a ojo: supera la banda de luminosidad, el piso
de croma, la separación para daltonismo y el contraste contra la superficie, en modo claro y oscuro. El
validador señaló que el color del AC queda en 2,74:1 sobre fondo claro, por debajo del umbral de 3:1; la
regla de relieve exige entonces etiquetas visibles o vista de tabla, y el dashboard tiene ambas.

Los semáforos llevan **símbolo y texto** además de color —«▼ Sobre presupuesto»—, porque un estado cromático
es ilegible para quien no distingue rojo de verde y se pierde al imprimir.

### Contenido ancho

La tabla tiene catorce columnas y no cabe en cualquier pantalla, así que se desplaza **dentro de su propia
tarjeta**. Que eso funcione exige `min-width: 0` en los hijos de la rejilla: por omisión arrancan con
`min-width: auto`, de modo que su contenido mínimo se impone sobre la columna y el desplazamiento horizontal
aparece en el documento entero en lugar de quedarse donde corresponde.

---

## Estrategia de pruebas

**Unitarias del dominio** — `evm-calculator.spec.ts`. Se prueba contra el caso de referencia calculado a
mano, más los bordes (`AC = 0`, `PV = 0`, avance real `0`, proyecto sin actividades), cada razón del enum
`UnavailableReason` con su condición disparadora, las cuatro invariantes, la prueba dedicada a que consolidar
sumando difiere de promediar índices, y la frontera de la tolerancia de estado.

Cada prueba afirma **valores numéricos concretos**, no que la función devuelva algo.

**Unitarias de servicios** — con repositorios simulados.

**Integración (e2e con Supertest)** — al menos una prueba por endpoint, validando el contrato de respuesta y
los códigos de error contra una base de datos real. Requieren el contenedor en marcha.

**Cada prueba de integración construye sus propios datos y los elimina al terminar.** No se apoyan en el
proyecto que siembra `02-seed.sql`: esos datos existen para la demostración y cualquiera puede modificarlos
desde el dashboard, de modo que depender de ellos haría fallar la suite por un motivo ajeno al código. Ocurrió
—una actividad añadida desde la interfaz rompió seis pruebas— y esa fue la corrección.

**Cobertura** — `coverageThreshold` de Jest al 80 % sobre la capa de negocio: el comando falla si baja. El
motor de cálculo está al 100 % en líneas, ramas y funciones.

---

## Dependencias y seguridad

`npm audit --omit=dev` devuelve **cero vulnerabilidades**. Llegar ahí exigió dos decisiones:

- **Subir TypeORM a la línea 1.x.** La 0.3 arrastra cuatro avisos de severidad alta por la cadena
  `glob` → `minimatch` → `brace-expansion`.
- **Acotar un `override` de `js-yaml` bajo `@nestjs/swagger`**, en lugar de aplicarlo globalmente.

Se intentó también forzar `brace-expansion` a su versión parcheada mediante un `override` general. **Rompió
ESLint** con `TypeError: expand is not a function`, porque la versión 5 cambió su forma de exportación y
`minimatch@3` la consume esperando una función: el «arreglo» era un cambio de ruptura disfrazado. Se revirtió.

Los avisos que permanecen viven exclusivamente en herramientas de desarrollo —ESLint, Jest, el CLI de Nest— y
no se despliegan. Corregirlos exigiría degradar esas herramientas a versiones mayores anteriores, que es peor
que el problema.

---

## Flujo de trabajo con Git

Ramas: `main` (producción) · `develop` (integración) · `feature/*` · `release/*`.
Cada funcionalidad entra a `develop` mediante Pull Request. Los mensajes de commit son descriptivos, en
imperativo y en inglés.

| PR | Rama | Contenido |
|---|---|---|
| #1 | `feature/project-setup` | Scaffolding Nest + Angular, linters, estructura del monorepo |
| #2 | `feature/evm-calculation-engine` | Calculador puro y su suite de pruebas unitarias |
| #3 | `feature/database-schema` | docker-compose, scripts SQL, configuración de TypeORM y entidades |
| #4 | `feature/project-crud` | Módulo de proyectos, contrato de error y configuración transversal |
| #5 | `feature/activity-crud` | Módulo de actividades |
| #6 | `feature/evm-api-endpoint` | `GET /projects/:projectId/evm` y pruebas de integración |
| #7 | `feature/angular-dashboard` | Tarjetas, gráfica, tabla y formulario |
| #8 | `feature/openapi-documentation` | Swagger en `/api-docs` y saneamiento de dependencias |
| #9 | `feature/documentation` | `README.md` y cierre de `AI_PROCESS.md` |

Cierre: `release/1.0.0` → merge a `main` con tag `v1.0.0`.

---

## Verificación de extremo a extremo

| # | Comprobación | Resultado esperado |
|---|---|---|
| 1 | `docker compose up -d --wait` | Contenedor `healthy`; `01-schema.sql` y `02-seed.sql` aplicados |
| 2 | `npm run test:cov` en `backend/` | 84 pruebas; cobertura ≥ 80 % en la capa de negocio |
| 3 | `npm run test:e2e` en `backend/` | 36 pruebas contra la base real |
| 4 | `npm run lint` en `backend/` y `frontend/` | Cero advertencias |
| 5 | `npm audit --omit=dev` en `backend/` | Cero vulnerabilidades |
| 6 | `npm run build` y `npm test` en `frontend/` | Compila; 4 pruebas en verde |
| 7 | `npm run start:dev` → `http://localhost:3000/api-docs` | 11 operaciones con esquemas y códigos de error |
| 8 | `npm start` en `frontend/` → `http://localhost:4200` | Dashboard con tarjetas, gráfica, tabla y formulario |
| 9 | `git log --graph --oneline --all` | Historial con los nueve PR a `develop` y el release a `main` |

**Verificación numérica manual —la que de verdad importa.** Comparar la salida de
`GET /api/projects/11111111-1111-4111-8111-111111111111/evm` contra la tabla del caso de referencia, dígito a
dígito. Recorre HTTP, controlador, servicio, ORM, PostgreSQL y dominio, así que valida la cadena completa y no
solo la función de cálculo. Que el código corra no significa que los números tengan sentido.
