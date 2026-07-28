import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Activity } from '../activities/activity.entity';
import { Project } from '../projects/project.entity';
import { ProjectsService } from '../projects/projects.service';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from './domain/evm-status.enum';
import { EvmAnalysisService } from './evm-analysis.service';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const MISSING_PROJECT_ID = '99999999-9999-4999-8999-999999999999';

/** Las tres actividades del caso de referencia, calculado a mano antes de implementar. */
const REFERENCE_ACTIVITIES = [
  {
    name: 'Diseño de arquitectura',
    budgetAtCompletion: 10_000,
    plannedProgressPercent: 100,
    actualProgressPercent: 100,
    actualCost: 9_000,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
  },
  {
    name: 'Desarrollo del backend',
    budgetAtCompletion: 20_000,
    plannedProgressPercent: 75,
    actualProgressPercent: 50,
    actualCost: 12_000,
    createdAt: new Date('2026-07-02T00:00:00.000Z'),
  },
  {
    name: 'Pruebas de integración',
    budgetAtCompletion: 20_000,
    plannedProgressPercent: 50,
    actualProgressPercent: 0,
    actualCost: 0,
    createdAt: new Date('2026-07-03T00:00:00.000Z'),
  },
];

function buildActivities(): Activity[] {
  return REFERENCE_ACTIVITIES.map(
    (activity, index) =>
      ({
        ...activity,
        id: `0000000${index}-0000-4000-8000-000000000000`,
        projectId: PROJECT_ID,
        updatedAt: activity.createdAt,
      }) as Activity,
  );
}

function buildProject(activities: Activity[]): Project {
  return {
    id: PROJECT_ID,
    name: 'Plataforma de Gestión Documental',
    description: null,
    activities,
    createdAt: new Date('2026-07-01T00:00:00.000Z'),
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
  };
}

describe('EvmAnalysisService', () => {
  let service: EvmAnalysisService;
  let projectsService: jest.Mocked<
    Pick<ProjectsService, 'findOneWithActivities'>
  >;

  beforeEach(async () => {
    projectsService = { findOneWithActivities: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EvmAnalysisService,
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();

    service = module.get(EvmAnalysisService);
  });

  describe('con el caso de referencia', () => {
    beforeEach(() => {
      projectsService.findOneWithActivities.mockResolvedValue(
        buildProject(buildActivities()),
      );
    });

    it('consolida las magnitudes sumando las de todas las actividades', async () => {
      const { summary } = await service.analyzeProject(PROJECT_ID);

      expect(summary.budgetAtCompletion).toBe(50_000);
      expect(summary.plannedValue).toBe(35_000);
      expect(summary.earnedValue).toBe(20_000);
      expect(summary.actualCost).toBe(21_000);
    });

    it('publica los índices consolidados redondeados a cuatro decimales', async () => {
      const { summary } = await service.analyzeProject(PROJECT_ID);

      expect(summary.costPerformanceIndex).toBe(0.9524);
      expect(summary.schedulePerformanceIndex).toBe(0.5714);
    });

    /** Derivar el EAC de un CPI ya redondeado daría 52.498,95 en lugar de 52.500. */
    it('deriva el pronóstico del índice sin redondear', async () => {
      const { summary } = await service.analyzeProject(PROJECT_ID);

      expect(summary.estimateAtCompletion).toBe(52_500);
      expect(summary.varianceAtCompletion).toBe(-2_500);
    });

    it('interpreta el proyecto como sobre presupuesto y atrasado', async () => {
      const { summary } = await service.analyzeProject(PROJECT_ID);

      expect(summary.costStatus).toBe(CostStatus.OverBudget);
      expect(summary.scheduleStatus).toBe(ScheduleStatus.Behind);
    });

    it('devuelve las actividades en orden de creación', async () => {
      const { activities } = await service.analyzeProject(PROJECT_ID);

      expect(activities.map((activity) => activity.name)).toEqual([
        'Diseño de arquitectura',
        'Desarrollo del backend',
        'Pruebas de integración',
      ]);
    });

    it('calcula los indicadores de cada actividad por separado', async () => {
      const { activities } = await service.analyzeProject(PROJECT_ID);

      expect(activities[0].indicators.costPerformanceIndex).toBe(1.1111);
      expect(activities[0].indicators.estimateAtCompletion).toBe(9_000);
      expect(activities[1].indicators.costPerformanceIndex).toBe(0.8333);
      expect(activities[1].indicators.varianceAtCompletion).toBe(-4_000);
    });

    it('informa la actividad sin iniciar como indeterminada y no como cero', async () => {
      const { activities } = await service.analyzeProject(PROJECT_ID);
      const notStarted = activities[2].indicators;

      expect(notStarted.costPerformanceIndex).toBeNull();
      expect(notStarted.costStatusReason).toBe(UnavailableReason.NotStarted);
      expect(notStarted.estimateAtCompletion).toBeNull();
      expect(notStarted.schedulePerformanceIndex).toBe(0);
    });
  });

  describe('proyecto sin actividades', () => {
    it('devuelve el consolidado en cero sin inventar índices', async () => {
      projectsService.findOneWithActivities.mockResolvedValue(buildProject([]));

      const { activities, summary } = await service.analyzeProject(PROJECT_ID);

      expect(activities).toHaveLength(0);
      expect(summary.budgetAtCompletion).toBe(0);
      expect(summary.costPerformanceIndex).toBeNull();
      expect(summary.schedulePerformanceIndex).toBeNull();
      expect(summary.costStatusReason).toBe(UnavailableReason.NoActivities);
    });
  });

  it('propaga el 404 cuando el proyecto no existe', async () => {
    projectsService.findOneWithActivities.mockRejectedValue(
      new NotFoundException(),
    );

    await expect(service.analyzeProject(MISSING_PROJECT_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
