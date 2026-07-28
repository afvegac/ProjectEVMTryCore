import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';

const PROJECT_ID = '11111111-1111-4111-8111-111111111111';
const MISSING_PROJECT_ID = '22222222-2222-4222-8222-222222222222';

type ProjectRepositoryMock = jest.Mocked<
  Pick<Repository<Project>, 'create' | 'save' | 'find' | 'findOne' | 'remove'>
>;

function buildProject(overrides: Partial<Project> = {}): Project {
  return {
    id: PROJECT_ID,
    name: 'Plataforma de Gestión Documental',
    description: 'Proyecto de ejemplo',
    activities: [],
    createdAt: new Date('2026-07-27T00:00:00.000Z'),
    updatedAt: new Date('2026-07-27T00:00:00.000Z'),
    ...overrides,
  };
}

describe('ProjectsService', () => {
  let service: ProjectsService;
  let repository: ProjectRepositoryMock;

  beforeEach(async () => {
    repository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: repository },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  describe('create', () => {
    it('persiste el proyecto construido a partir del DTO', async () => {
      const dto = { name: 'Nuevo proyecto', description: 'Descripción' };
      const built = buildProject(dto);
      repository.create.mockReturnValue(built);
      repository.save.mockResolvedValue(built);

      const created = await service.create(dto);

      expect(repository.create).toHaveBeenCalledWith(dto);
      expect(repository.save).toHaveBeenCalledWith(built);
      expect(created.name).toBe('Nuevo proyecto');
    });
  });

  describe('findAll', () => {
    it('devuelve los proyectos ordenados por fecha de creación ascendente', async () => {
      const projects = [buildProject()];
      repository.find.mockResolvedValue(projects);

      await expect(service.findAll()).resolves.toBe(projects);
      expect(repository.find).toHaveBeenCalledWith({
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('devuelve el proyecto solicitado sin cargar relaciones', async () => {
      const project = buildProject();
      repository.findOne.mockResolvedValue(project);

      await expect(service.findOne(PROJECT_ID)).resolves.toBe(project);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        relations: {},
      });
    });

    it('lanza NotFoundException incluyendo el identificador buscado', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(MISSING_PROJECT_ID)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findOne(MISSING_PROJECT_ID)).rejects.toThrow(
        MISSING_PROJECT_ID,
      );
    });
  });

  describe('findOneWithActivities', () => {
    it('carga las actividades en la misma consulta', async () => {
      const project = buildProject();
      repository.findOne.mockResolvedValue(project);

      await expect(service.findOneWithActivities(PROJECT_ID)).resolves.toBe(
        project,
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: { id: PROJECT_ID },
        relations: { activities: true },
      });
    });

    it('lanza NotFoundException cuando el proyecto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.findOneWithActivities(MISSING_PROJECT_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('conserva los campos que la petición no incluye', async () => {
      const existing = buildProject({
        name: 'Nombre original',
        description: 'Descripción original',
      });
      repository.findOne.mockResolvedValue(existing);
      repository.save.mockImplementation((project) =>
        Promise.resolve(project as Project),
      );

      const updated = await service.update(PROJECT_ID, {
        name: 'Nombre actualizado',
      });

      expect(updated.name).toBe('Nombre actualizado');
      expect(updated.description).toBe('Descripción original');
    });

    it('no intenta guardar cuando el proyecto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(
        service.update(MISSING_PROJECT_ID, { name: 'Cualquiera' }),
      ).rejects.toThrow(NotFoundException);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('elimina el proyecto localizado', async () => {
      const project = buildProject();
      repository.findOne.mockResolvedValue(project);

      await service.remove(PROJECT_ID);

      expect(repository.remove).toHaveBeenCalledWith(project);
    });

    it('no intenta eliminar cuando el proyecto no existe', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(MISSING_PROJECT_ID)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
