import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  /**
   * Punto único de resolución de un proyecto por identificador. Editar y eliminar pasan por aquí, de
   * modo que la comprobación de existencia y el mensaje de error no se repiten en cada operación.
   */
  async findOne(id: string): Promise<Project> {
    const project = await this.projects.findOne({ where: { id } });

    if (project === null) {
      throw new NotFoundException(
        `No existe un proyecto con el identificador ${id}`,
      );
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);

    return this.projects.save(Object.assign(project, dto));
  }

  async remove(id: string): Promise<void> {
    await this.projects.remove(await this.findOne(id));
  }
}
