import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Activity } from './../src/activities/activity.entity';
import { createTestApp } from './test-app';

const PROJECTS_PATH = '/api/projects';

const FIRST_BUDGET = 10_000;
const SECOND_BUDGET = 20_000;
const EXPECTED_TOTAL_BUDGET = FIRST_BUDGET + SECOND_BUDGET;

/**
 * Requiere la base de datos en marcha: `docker compose up -d` desde la raíz del repositorio.
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let projectId: string;

  const server = (): unknown => app.getHttpServer();

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);

    const project = await request(server())
      .post(PROJECTS_PATH)
      .send({ name: 'Proyecto de conversión numérica' })
      .expect(201);

    projectId = (project.body as { id: string }).id;

    for (const budgetAtCompletion of [FIRST_BUDGET, SECOND_BUDGET]) {
      await request(server())
        .post(`${PROJECTS_PATH}/${projectId}/activities`)
        .send({
          name: `Actividad de ${budgetAtCompletion}`,
          budgetAtCompletion,
          plannedProgressPercent: 50,
          actualProgressPercent: 25,
          actualCost: 1_000,
        })
        .expect(201);
    }
  });

  afterAll(async () => {
    await request(server()).delete(`${PROJECTS_PATH}/${projectId}`);
    await app?.close();
  });

  it('resuelve el grafo de dependencias y establece la conexión con PostgreSQL', () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  /**
   * El driver `pg` devuelve las columnas NUMERIC como cadena. Si `numericTransformer` dejara de
   * aplicarse, este `+` concatenaría en lugar de sumar y el total sería la cadena "010000.0020000.00"
   * en vez de 30000, sin que se lanzara ningún error. Por eso la comprobación se hace sobre una suma
   * y no sobre el tipo de un campo suelto.
   */
  it('suma los presupuestos como números en lugar de concatenar cadenas', async () => {
    const activities = await dataSource
      .getRepository(Activity)
      .find({ where: { projectId } });

    const totalBudget = activities.reduce(
      (total, activity) => total + activity.budgetAtCompletion,
      0,
    );

    expect(activities).toHaveLength(2);
    expect(totalBudget).toBe(EXPECTED_TOTAL_BUDGET);
  });
});
