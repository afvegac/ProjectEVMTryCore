import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { Project } from './project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projects: Repository<Project>,
  ) {}

  create(dto: CreateProjectDto): Promise<Project> {
    return this.projects.save(this.projects.create(dto));
  }

  findAll(): Promise<Project[]> {
    return this.projects.find({ order: { createdAt: 'ASC' } });
  }

  findOne(id: string): Promise<Project> {
    return this.requireProject(id, {});
  }

  /** Carga el proyecto con sus actividades en una sola consulta, para el análisis de Valor Ganado. */
  findOneWithActivities(id: string): Promise<Project> {
    return this.requireProject(id, { activities: true });
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    return this.projects.save(Object.assign(project, dto));
  }

  async remove(id: string): Promise<void> {
    await this.projects.remove(await this.findOne(id));
  }

  /**
   * Punto único de resolución de un proyecto por identificador. Todas las operaciones pasan por aquí,
   * de modo que la comprobación de existencia y el mensaje de error no se repiten.
   */
  private async requireProject(
    id: string,
    relations: FindOptionsRelations<Project>,
  ): Promise<Project> {
    const project = await this.projects.findOne({ where: { id }, relations });

    if (project === null) {
      throw new NotFoundException(
        `No existe un proyecto con el identificador ${id}`,
      );
    }

    return project;
  }
}
