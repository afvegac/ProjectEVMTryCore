import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ErrorResponseBody } from './../src/common/filters/http-exception.filter';
import { createTestApp } from './test-app';

const PROJECTS_PATH = '/api/projects';
const ACTIVITIES_PATH = '/api/activities';
const UNKNOWN_ID = '99999999-9999-4999-8999-999999999999';

interface ActivityBody {
  id: string;
  projectId: string;
  name: string;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
}

const VALID_ACTIVITY = {
  name: 'Desarrollo del backend',
  budgetAtCompletion: 20_000,
  plannedProgressPercent: 75,
  actualProgressPercent: 50,
  actualCost: 12_000,
};

describe('Activities (e2e)', () => {
  let app: INestApplication;
  let projectId: string;

  const server = (): unknown => app.getHttpServer();

  beforeAll(async () => {
    app = await createTestApp();

    const response = await request(server())
      .post(PROJECTS_PATH)
      .send({ name: 'Proyecto para actividades' })
      .expect(201);

    projectId = (response.body as { id: string }).id;
  });

  afterAll(async () => {
    // Eliminar el proyecto arrastra sus actividades por la cascada del esquema.
    await request(server()).delete(`${PROJECTS_PATH}/${projectId}`);
    await app?.close();
  });

  function activitiesPathFor(id: string): string {
    return `${PROJECTS_PATH}/${id}/activities`;
  }

  async function createActivity(
    overrides: Partial<typeof VALID_ACTIVITY> = {},
  ): Promise<ActivityBody> {
    const response = await request(server())
      .post(activitiesPathFor(projectId))
      .send({ ...VALID_ACTIVITY, ...overrides })
      .expect(201);

    return response.body as ActivityBody;
  }

  describe('POST /api/projects/:projectId/activities', () => {
    it('crea la actividad devolviendo los importes como números', async () => {
      const activity = await createActivity({ name: 'Actividad creada' });

      expect(activity.projectId).toBe(projectId);
      expect(activity.budgetAtCompletion).toBe(20_000);
      expect(typeof activity.budgetAtCompletion).toBe('number');
      expect(typeof activity.actualCost).toBe('number');
    });

    it('rechaza un presupuesto que no sea positivo', async () => {
      const response = await request(server())
        .post(activitiesPathFor(projectId))
        .send({ ...VALID_ACTIVITY, budgetAtCompletion: 0 })
        .expect(400);

      expect((response.body as ErrorResponseBody).message.join(' ')).toContain(
        'budgetAtCompletion',
      );
    });

    it('rechaza un porcentaje de avance mayor a 100', async () => {
      const response = await request(server())
        .post(activitiesPathFor(projectId))
        .send({ ...VALID_ACTIVITY, actualProgressPercent: 150 })
        .expect(400);

      expect((response.body as ErrorResponseBody).message.join(' ')).toContain(
        'actualProgressPercent',
      );
    });

    it('acepta costo real en cero para una actividad sin iniciar', async () => {
      const activity = await createActivity({
        name: 'Pruebas de integración',
        actualProgressPercent: 0,
        actualCost: 0,
      });

      expect(activity.actualCost).toBe(0);
    });

    /** Sin la comprobación previa del proyecto esto sería un 500 por clave foránea. */
    it('responde 404 cuando el proyecto no existe', async () => {
      await request(server())
        .post(activitiesPathFor(UNKNOWN_ID))
        .send(VALID_ACTIVITY)
        .expect(404);
    });
  });

  describe('GET /api/projects/:projectId/activities', () => {
    it('devuelve las actividades del proyecto', async () => {
      const created = await createActivity({ name: 'Actividad listada' });

      const response = await request(server())
        .get(activitiesPathFor(projectId))
        .expect(200);

      const activities = response.body as ActivityBody[];

      expect(activities.map((activity) => activity.id)).toContain(created.id);
    });

    it('responde 404 cuando el proyecto no existe', async () => {
      await request(server()).get(activitiesPathFor(UNKNOWN_ID)).expect(404);
    });
  });

  describe(`PATCH ${ACTIVITIES_PATH}/:id`, () => {
    it('registra avance sin alterar el presupuesto planificado', async () => {
      const created = await createActivity({ name: 'Actividad a actualizar' });

      const response = await request(server())
        .patch(`${ACTIVITIES_PATH}/${created.id}`)
        .send({ actualProgressPercent: 80, actualCost: 18_000 })
        .expect(200);

      const updated = response.body as ActivityBody;

      expect(updated.actualProgressPercent).toBe(80);
      expect(updated.actualCost).toBe(18_000);
      expect(updated.budgetAtCompletion).toBe(20_000);
      expect(updated.plannedProgressPercent).toBe(75);
    });

    it('responde 404 al editar una actividad inexistente', async () => {
      await request(server())
        .patch(`${ACTIVITIES_PATH}/${UNKNOWN_ID}`)
        .send({ actualCost: 100 })
        .expect(404);
    });
  });

  describe(`DELETE ${ACTIVITIES_PATH}/:id`, () => {
    it('elimina la actividad y deja de encontrarla', async () => {
      const created = await createActivity({ name: 'Actividad efímera' });

      await request(server())
        .delete(`${ACTIVITIES_PATH}/${created.id}`)
        .expect(204);

      await request(server())
        .get(`${ACTIVITIES_PATH}/${created.id}`)
        .expect(404);
    });
  });

  describe('Cascada al eliminar el proyecto', () => {
    it('elimina las actividades junto con su proyecto', async () => {
      const owner = await request(server())
        .post(PROJECTS_PATH)
        .send({ name: 'Proyecto desechable' })
        .expect(201);

      const ownerId = (owner.body as { id: string }).id;

      const activity = await request(server())
        .post(activitiesPathFor(ownerId))
        .send(VALID_ACTIVITY)
        .expect(201);

      await request(server()).delete(`${PROJECTS_PATH}/${ownerId}`).expect(204);

      await request(server())
        .get(`${ACTIVITIES_PATH}/${(activity.body as ActivityBody).id}`)
        .expect(404);
    });
  });
});
