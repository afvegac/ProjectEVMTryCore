import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ErrorResponseBody } from './../src/common/filters/http-exception.filter';
import { createTestApp } from './test-app';

const PROJECTS_PATH = '/api/projects';
const UNKNOWN_PROJECT_ID = '99999999-9999-4999-8999-999999999999';

interface ProjectBody {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

describe('Projects (e2e)', () => {
  let app: INestApplication;
  const createdProjectIds: string[] = [];

  const server = (): unknown => app.getHttpServer();

  async function createProject(
    name: string,
    description?: string,
  ): Promise<ProjectBody> {
    const response = await request(server())
      .post(PROJECTS_PATH)
      .send({ name, description })
      .expect(201);

    const project = response.body as ProjectBody;
    createdProjectIds.push(project.id);

    return project;
  }

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    for (const id of createdProjectIds) {
      await request(server()).delete(`${PROJECTS_PATH}/${id}`);
    }

    await app?.close();
  });

  describe(`POST ${PROJECTS_PATH}`, () => {
    it('crea el proyecto y devuelve el contrato completo', async () => {
      const project = await createProject('Proyecto de prueba', 'Descripción');

      expect(project.id).toEqual(expect.any(String));
      expect(project.name).toBe('Proyecto de prueba');
      expect(project.description).toBe('Descripción');
      expect(Date.parse(project.createdAt)).not.toBeNaN();
      expect(Date.parse(project.updatedAt)).not.toBeNaN();
    });

    it('rechaza un nombre vacío con 400 y el contrato de error uniforme', async () => {
      const response = await request(server())
        .post(PROJECTS_PATH)
        .send({ name: '' })
        .expect(400);

      const error = response.body as ErrorResponseBody;

      expect(error.statusCode).toBe(400);
      expect(error.path).toBe(PROJECTS_PATH);
      expect(error.message.length).toBeGreaterThan(0);
      expect(Date.parse(error.timestamp)).not.toBeNaN();
    });

    it('rechaza propiedades no declaradas en lugar de ignorarlas', async () => {
      const response = await request(server())
        .post(PROJECTS_PATH)
        .send({ name: 'Proyecto', presupuesto: 1000 })
        .expect(400);

      const error = response.body as ErrorResponseBody;

      expect(error.message.join(' ')).toContain('presupuesto');
    });
  });

  describe(`GET ${PROJECTS_PATH}`, () => {
    it('devuelve la colección de proyectos', async () => {
      const created = await createProject('Proyecto listado');

      const response = await request(server()).get(PROJECTS_PATH).expect(200);
      const projects = response.body as ProjectBody[];

      expect(Array.isArray(projects)).toBe(true);
      expect(projects.map((project) => project.id)).toContain(created.id);
    });

    it('devuelve un proyecto por identificador', async () => {
      const created = await createProject('Proyecto individual');

      const response = await request(server())
        .get(`${PROJECTS_PATH}/${created.id}`)
        .expect(200);

      expect((response.body as ProjectBody).name).toBe('Proyecto individual');
    });

    it('responde 400 cuando el identificador no es un UUID', async () => {
      await request(server()).get(`${PROJECTS_PATH}/no-es-uuid`).expect(400);
    });

    it('responde 404 cuando el proyecto no existe', async () => {
      const response = await request(server())
        .get(`${PROJECTS_PATH}/${UNKNOWN_PROJECT_ID}`)
        .expect(404);

      const error = response.body as ErrorResponseBody;

      expect(error.statusCode).toBe(404);
      expect(error.message.join(' ')).toContain(UNKNOWN_PROJECT_ID);
    });
  });

  describe(`PATCH ${PROJECTS_PATH}/:id`, () => {
    it('modifica solo los campos enviados', async () => {
      const created = await createProject(
        'Nombre original',
        'Descripción original',
      );

      const response = await request(server())
        .patch(`${PROJECTS_PATH}/${created.id}`)
        .send({ name: 'Nombre actualizado' })
        .expect(200);

      const updated = response.body as ProjectBody;

      expect(updated.name).toBe('Nombre actualizado');
      expect(updated.description).toBe('Descripción original');
    });

    it('responde 404 al editar un proyecto inexistente', async () => {
      await request(server())
        .patch(`${PROJECTS_PATH}/${UNKNOWN_PROJECT_ID}`)
        .send({ name: 'Cualquiera' })
        .expect(404);
    });
  });

  describe(`DELETE ${PROJECTS_PATH}/:id`, () => {
    it('elimina el proyecto y deja de encontrarlo', async () => {
      const created = await createProject('Proyecto efímero');

      await request(server())
        .delete(`${PROJECTS_PATH}/${created.id}`)
        .expect(204);

      await request(server()).get(`${PROJECTS_PATH}/${created.id}`).expect(404);
    });

    it('responde 404 al eliminar un proyecto inexistente', async () => {
      await request(server())
        .delete(`${PROJECTS_PATH}/${UNKNOWN_PROJECT_ID}`)
        .expect(404);
    });
  });
});
