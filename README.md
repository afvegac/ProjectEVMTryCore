# Gestión de proyectos con Valor Ganado (EVM)

Herramienta para que un líder de proyecto registre el avance de sus actividades y sepa, en cualquier
momento, si el proyecto va bien o mal en cronograma y presupuesto.

La pregunta que responde es la que los reportes tradicionales no pueden: *«gasté el 60 % del presupuesto,
¿eso es bueno o malo?»*. Comparar presupuesto contra gasto no dice nada, porque no informa cuánto trabajo se
compró con ese gasto. El **Valor Ganado** añade una tercera magnitud —el trabajo completado, valorizado en
dinero— y permite comparar plan, avance y costo en la misma unidad.

- **Diseño y decisiones técnicas:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Proceso de desarrollo y uso de IA:** [`AI_PROCESS.md`](AI_PROCESS.md)

---

## Requisitos

| Herramienta | Versión |
|---|---|
| Node.js | ≥ 22.13 |
| npm | ≥ 10 |
| Docker Desktop | cualquiera con `docker compose` |

---

## Puesta en marcha

### 1. Base de datos

Desde la raíz del repositorio:

```bash
docker compose up -d --wait
```

Levanta PostgreSQL 16 y ejecuta automáticamente los scripts de inicialización:

| Script | Contenido |
|---|---|
| [`db/init/01-schema.sql`](db/init/01-schema.sql) | Esquema: tablas, restricciones e índices |
| [`db/init/02-seed.sql`](db/init/02-seed.sql) | Proyecto de ejemplo con tres actividades |

> El contenedor publica el puerto **5433** y no el 5432, para no chocar con una instalación local de
> PostgreSQL. Credenciales por defecto: usuario `evm`, contraseña `evm`, base `evm`.

Los scripts solo se ejecutan la primera vez que se crea el volumen. Para partir de cero:

```bash
docker compose down -v && docker compose up -d --wait
```

### 2. Backend

```bash
cd backend
npm install
npm run start:dev
```

Queda escuchando en **http://localhost:3000**. No hace falta configurar nada: los valores por defecto
coinciden con los del contenedor. Si necesitas cambiarlos, copia [`backend/.env.example`](backend/.env.example)
como `.env`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Dashboard en **http://localhost:4200**.

---

## Documentación de la API

Con el backend en marcha:

| Recurso | URL |
|---|---|
| Documentación interactiva | http://localhost:3000/api-docs |
| Documento OpenAPI | http://localhost:3000/api-docs-json |

### Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/projects` | Crear proyecto |
| `GET` | `/api/projects` | Listar proyectos |
| `GET` | `/api/projects/:id` | Consultar proyecto |
| `PATCH` | `/api/projects/:id` | Editar proyecto |
| `DELETE` | `/api/projects/:id` | Eliminar proyecto y sus actividades |
| `POST` | `/api/projects/:projectId/activities` | Registrar actividad |
| `GET` | `/api/projects/:projectId/activities` | Listar actividades |
| `GET` | `/api/activities/:id` | Consultar actividad |
| `PATCH` | `/api/activities/:id` | Registrar avance o corregir |
| `DELETE` | `/api/activities/:id` | Eliminar actividad |
| `GET` | `/api/projects/:projectId/evm` | **Análisis de Valor Ganado** |

El último devuelve en una sola llamada las actividades con sus indicadores y el consolidado del proyecto,
que es todo lo que el dashboard necesita.

---

## Pruebas

```bash
cd backend

npm run test:cov    # unitarias, con informe de cobertura
npm run test:e2e    # integración contra la base de datos real
npm run lint        # ESLint + Prettier
```

```bash
cd frontend

npm test -- --watch=false --browsers=ChromeHeadless
npm run lint
```

> `test:e2e` requiere el contenedor en marcha. Las pruebas crean y eliminan sus propios datos, así que no
> dependen del proyecto de ejemplo ni lo alteran.

El umbral de cobertura está declarado en `backend/package.json`: el comando **falla** si la capa de negocio
baja del 80 %. Actualmente el motor de cálculo está al 100 % en líneas, ramas y funciones.

---

## Verificar que los números son correctos

Los indicadores del proyecto de ejemplo se calcularon **a mano antes** de escribir el motor. Con todo en
marcha, la salida del API debe coincidir dígito a dígito:

```bash
curl http://localhost:3000/api/projects/11111111-1111-4111-8111-111111111111/evm
```

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

Lectura: el proyecto costará 52.500 en vez de los 50.000 presupuestados y avanza al 57 % del ritmo
planeado. Rojo en ambos ejes, en la mitad del recorrido — que es exactamente el momento en que todavía se
puede hacer algo.

La tercera actividad devuelve `null` y no `0` en CPI, EAC y VAC. Con avance y costo en cero el índice es
`0/0`: **indeterminado, no nulo**. Devolver `0` diría «eficiencia pésima» cuando la realidad es «aún no ha
empezado». La respuesta acompaña cada ausencia con su motivo (`NOT_STARTED`) y la interfaz lo muestra.

---

## Estructura

```
├── docker-compose.yml          PostgreSQL 16
├── db/init/                    esquema y datos de ejemplo
├── docs/ARCHITECTURE.md        diseño y decisiones
├── AI_PROCESS.md               proceso de desarrollo
├── backend/                    NestJS
│   └── src/
│       ├── evm/domain/         motor de cálculo — funciones puras, sin framework
│       ├── evm/                endpoint de análisis
│       ├── projects/           CRUD de proyectos
│       ├── activities/         CRUD de actividades
│       ├── common/             transformers, filtros, constantes
│       └── config/             base de datos y OpenAPI
└── frontend/                   Angular
    └── src/app/
        ├── core/               modelos y cliente HTTP
        └── dashboard/          tarjetas, tabla, gráfica y formulario
```

El corazón es [`backend/src/evm/domain/evm-calculator.ts`](backend/src/evm/domain/evm-calculator.ts): un
módulo de funciones puras que no importa nada de NestJS, TypeORM ni HTTP. Recibe números y devuelve números.
Por eso se puede probar sin levantar el framework ni la base de datos, y por eso la lógica de negocio no
puede acabar en un controlador.
