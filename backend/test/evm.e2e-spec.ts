import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from './../src/evm/domain/evm-status.enum';
import { ProjectEvmAnalysisResponse } from './../src/evm/dto/project-evm-analysis.response';
import { createTestApp } from './test-app';

const PROJECTS_PATH = '/api/projects';
const UNKNOWN_PROJECT_ID = '99999999-9999-4999-8999-999999999999';

/**
 * Las tres actividades del caso de referencia, calculado a mano antes de implementar el motor.
 *
 * La prueba construye su propio proyecto en lugar de apoyarse en el que siembra `02-seed.sql`: los
 * datos de ejemplo existen para la demostración y cualquiera puede modificarlos desde el dashboard,
 * de modo que depender de ellos haría fallar la suite por un motivo ajeno al código.
 */
const REFERENCE_ACTIVITIES = [
  {
    name: 'Diseño de arquitectura',
    budgetAtCompletion: 10_000,
    plannedProgressPercent: 100,
    actualProgressPercent: 100,
    actualCost: 9_000,
  },
  {
    name: 'Desarrollo del backend',
    budgetAtCompletion: 20_000,
    plannedProgressPercent: 75,
    actualProgressPercent: 50,
    actualCost: 12_000,
  },
  {
    name: 'Pruebas de integración',
    budgetAtCompletion: 20_000,
    plannedProgressPercent: 50,
    actualProgressPercent: 0,
    actualCost: 0,
  },
];

/**
 * Verificación de extremo a extremo del caso de referencia.
 *
 * Los valores esperados provienen del cálculo manual hecho ANTES de implementar el motor, no de la
 * salida del código. Esta prueba es la que permite afirmar que los números tienen sentido y no solo
 * que el sistema responde: recorre HTTP, servicio, ORM, PostgreSQL y dominio.
 */
describe('EVM analysis (e2e)', () => {
  let app: INestApplication;
  let projectId: string;
  let analysis: ProjectEvmAnalysisResponse;

  const server = (): unknown => app.getHttpServer();

  beforeAll(async () => {
    app = await createTestApp();

    const project = await request(server())
      .post(PROJECTS_PATH)
      .send({ name: 'Caso de referencia EVM' })
      .expect(201);

    projectId = (project.body as { id: string }).id;

    // En serie y no en paralelo: el orden de creación es el que determina el de la respuesta.
    for (const activity of REFERENCE_ACTIVITIES) {
      await request(server())
        .post(`${PROJECTS_PATH}/${projectId}/activities`)
        .send(activity)
        .expect(201);
    }

    const response = await request(server())
      .get(`${PROJECTS_PATH}/${projectId}/evm`)
      .expect(200);

    analysis = response.body as ProjectEvmAnalysisResponse;
  });

  afterAll(async () => {
    await request(server()).delete(`${PROJECTS_PATH}/${projectId}`);
    await app?.close();
  });

  describe('consolidado del proyecto', () => {
    it('suma las magnitudes monetarias de las tres actividades', () => {
      expect(analysis.summary.budgetAtCompletion).toBe(50_000);
      expect(analysis.summary.plannedValue).toBe(35_000);
      expect(analysis.summary.earnedValue).toBe(20_000);
      expect(analysis.summary.actualCost).toBe(21_000);
    });

    it('reporta 1.000 de sobrecosto y 15.000 de atraso valorizado', () => {
      expect(analysis.summary.costVariance).toBe(-1_000);
      expect(analysis.summary.scheduleVariance).toBe(-15_000);
    });

    it('recalcula los índices sobre los totales', () => {
      expect(analysis.summary.costPerformanceIndex).toBe(0.9524);
      expect(analysis.summary.schedulePerformanceIndex).toBe(0.5714);
    });

    it('proyecta 52.500 de costo final y 2.500 de desviación', () => {
      expect(analysis.summary.estimateAtCompletion).toBe(52_500);
      expect(analysis.summary.varianceAtCompletion).toBe(-2_500);
    });

    it('interpreta el proyecto como sobre presupuesto y atrasado', () => {
      expect(analysis.summary.costStatus).toBe(CostStatus.OverBudget);
      expect(analysis.summary.scheduleStatus).toBe(ScheduleStatus.Behind);
      expect(analysis.summary.costStatusReason).toBeNull();
    });
  });

  describe('actividad terminada bajo presupuesto', () => {
    it('confirma que el pronóstico converge al costo real', () => {
      const { name, indicators } = analysis.activities[0];

      expect(name).toBe('Diseño de arquitectura');
      expect(indicators.plannedValue).toBe(10_000);
      expect(indicators.earnedValue).toBe(10_000);
      expect(indicators.costVariance).toBe(1_000);
      expect(indicators.scheduleVariance).toBe(0);
      expect(indicators.costPerformanceIndex).toBe(1.1111);
      expect(indicators.schedulePerformanceIndex).toBe(1);
      expect(indicators.estimateAtCompletion).toBe(9_000);
      expect(indicators.varianceAtCompletion).toBe(1_000);
      expect(indicators.costStatus).toBe(CostStatus.UnderBudget);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.OnSchedule);
    });
  });

  describe('actividad atrasada y con sobrecosto', () => {
    it('publica los indicadores del caso nominal', () => {
      const { name, indicators } = analysis.activities[1];

      expect(name).toBe('Desarrollo del backend');
      expect(indicators.plannedValue).toBe(15_000);
      expect(indicators.earnedValue).toBe(10_000);
      expect(indicators.costVariance).toBe(-2_000);
      expect(indicators.scheduleVariance).toBe(-5_000);
      expect(indicators.costPerformanceIndex).toBe(0.8333);
      expect(indicators.schedulePerformanceIndex).toBe(0.6667);
      expect(indicators.estimateAtCompletion).toBe(24_000);
      expect(indicators.varianceAtCompletion).toBe(-4_000);
      expect(indicators.costStatus).toBe(CostStatus.OverBudget);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.Behind);
    });
  });

  describe('actividad sin iniciar', () => {
    it('distingue lo indeterminado de lo nulo', () => {
      const { name, indicators } = analysis.activities[2];

      expect(name).toBe('Pruebas de integración');
      expect(indicators.plannedValue).toBe(10_000);
      expect(indicators.earnedValue).toBe(0);
      expect(indicators.scheduleVariance).toBe(-10_000);

      // El CPI es 0/0: indeterminado, no cero.
      expect(indicators.costPerformanceIndex).toBeNull();
      expect(indicators.costStatus).toBe(CostStatus.NotAvailable);
      expect(indicators.costStatusReason).toBe(UnavailableReason.NotStarted);
      expect(indicators.estimateAtCompletion).toBeNull();
      expect(indicators.varianceAtCompletion).toBeNull();

      // El SPI sí es cero: había trabajo planificado y no se ganó nada de él.
      expect(indicators.schedulePerformanceIndex).toBe(0);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.Behind);
    });
  });

  describe('consolidación frente a promedio', () => {
    /**
     * Promediar los CPI de las actividades daría 0,9722 y además obligaría a decidir
     * arbitrariamente qué hacer con la actividad cuyo índice es nulo.
     */
    it('el CPI consolidado no coincide con el promedio de los individuales', () => {
      const individualIndices = analysis.activities
        .map((activity) => activity.indicators.costPerformanceIndex)
        .filter((index): index is number => index !== null);

      const average =
        individualIndices.reduce((total, index) => total + index, 0) /
        individualIndices.length;

      expect(individualIndices).toHaveLength(2);
      expect(average).toBeCloseTo(0.9722, 4);
      expect(analysis.summary.costPerformanceIndex).toBe(0.9524);
    });
  });

  describe('errores', () => {
    it('responde 404 cuando el proyecto no existe', async () => {
      await request(server())
        .get(`${PROJECTS_PATH}/${UNKNOWN_PROJECT_ID}/evm`)
        .expect(404);
    });

    it('responde 400 cuando el identificador no es un UUID', async () => {
      await request(server())
        .get(`${PROJECTS_PATH}/no-es-uuid/evm`)
        .expect(400);
    });
  });

  describe('proyecto recién creado', () => {
    it('devuelve el consolidado en cero con la razón explícita', async () => {
      const created = await request(server())
        .post(PROJECTS_PATH)
        .send({ name: 'Proyecto sin actividades' })
        .expect(201);

      const emptyProjectId = (created.body as { id: string }).id;

      const response = await request(server())
        .get(`${PROJECTS_PATH}/${emptyProjectId}/evm`)
        .expect(200);

      const empty = response.body as ProjectEvmAnalysisResponse;

      expect(empty.activities).toHaveLength(0);
      expect(empty.summary.budgetAtCompletion).toBe(0);
      expect(empty.summary.costPerformanceIndex).toBeNull();
      expect(empty.summary.costStatusReason).toBe(
        UnavailableReason.NoActivities,
      );

      await request(server()).delete(`${PROJECTS_PATH}/${emptyProjectId}`);
    });
  });
});
