import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../projects/project.entity';
import { ProjectsService } from '../projects/projects.service';
import { ActivitiesService } from './activities.service';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const ACTIVITY_ID = '33333333-3333-4333-8333-333333333333';
const MISSING_ID = '22222222-2222-4222-8222-222222222222';

type ActivityRepositoryMock = jest.Mocked<
  Pick<Repository<Activity>, 'create' | 'save' | 'find' | 'findOne' | 'remove'>
>;

const BACKEND_DEVELOPMENT: CreateActivityDto = {
  name: 'Desarrollo del backend',
  budgetAtCompletion: 20_000,
  plannedProgressPercent: 75,
  actualProgressPercent: 50,
  actualCost: 12_000,
};

function buildActivity(overrides: Partial<Activity> = {}): Activity {
  return {
    id: ACTIVITY_ID,
    projectId: PROJECT_ID,
    project: {} as Project,
    ...BACKEND_DEVELOPMENT,
    createdAt: new Date('2026-07-27T00:00:00.000Z'),
    updatedAt: new Date('2026-07-27T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let repository: ActivityRepositoryMock;
  let projectsService: jest.Mocked<Pick<ProjectsService, 'findOne'>>;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    projectsService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: getRepositoryToken(Activity), useValue: repository },
        { provide: ProjectsService, useValue: projectsService },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  describe('create', () => {
    it('asocia la actividad al proyecto indicado', async () => {
      const activity = buildActivity();
      projectsService.findOne.mockResolvedValue({} as Project);
      repository.create.mockReturnValue(activity);
      repository.save.mockResolvedValue(activity);

      await service.create(PROJECT_ID, BACKEND_DEVELOPMENT);

      expect(repository.create).toHaveBeenCalledWith({
        ...BACKEND_DEVELOPMENT,
        projectId: PROJECT_ID,
      });
    });

    /**
     * Sin esta comprobación previa, la inserción fallaría por violación de la clave foránea y el
     * cliente recibiría un 500 en lugar de un 404 explicativo.
     */
    it('no intenta persistir cuando el proyecto no existe', async () => {
      projectsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create(MISSING_ID, BACKEND_DEVELOPMENT),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('findAllByProject', () => {
    it('devuelve las actividades del proyecto ordenadas por creación', async () => {
      const activities = [buildActivity()];
      projectsService.findOne.mockResolvedValue({} as Project);
      repository.find.mockResolvedValue(activities);

      await expect(service.findAllByProject(PROJECT_ID)).resolves.toBe(
        activities,
      );
      expect(repository.find).toHaveBeenCalledWith({
        where: { projectId: PROJECT_ID },
        order: { createdAt: 'ASC' },
      });
    });

    it('propaga el 404 cuando el proyecto no existe', async () => {
      projectsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.findAllByProject(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('devuelve la actividad solicitada', async () => {
      const activity = buildActivity();
      repository.findOne.mockResolvedValue(activity);

      await expect(service.findOne(ACTIVITY_ID)).resolves.toBe(activity);
    });

    it('lanza NotFoundException incluyendo el identificador buscado', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(MISSING_ID)).rejects.toThrow(MISSING_ID);
    });
  });

  describe('update', () => {
    /**
     * El caso de uso más frecuente: registrar avance enviando solo el porcentaje real y el costo,
     * sin repetir el presupuesto. Si la edición sobrescribiera con undefined los campos ausentes,
     * el BAC se perdería y todos los indicadores quedarían mal.
     */
    it('registra avance sin alterar el presupuesto planificado', async () => {
      repository.findOne.mockResolvedValue(buildActivity());
      repository.save.mockImplementation((activity) =>
        Promise.resolve(activity as Activity),
      );

      const updated = await service.update(ACTIVITY_ID, {
        actualProgressPercent: 80,
        actualCost: 18_000,
      });

      expect(updated.actualProgressPercent).toBe(80);
      expect(updated.actualCost).toBe(18_000);
      expect(updated.budgetAtCompletion).toBe(20_000);
      expect(updated.plannedProgressPercent).toBe(75);
      expect(updated.name).toBe('Desarrollo del backend');
    });

    it('no intenta guardar cuando la actividad no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(MISSING_ID, { actualCost: 1 }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina la actividad localizada', async () => {
      const activity = buildActivity();
      repository.findOne.mockResolvedValue(activity);

      await service.remove(ACTIVITY_ID);

      expect(repository.remove).toHaveBeenCalledWith(activity);
    });

    it('no intenta eliminar cuando la actividad no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(MISSING_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
