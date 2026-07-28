import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectsService } from '../projects/projects.service';
import { Activity } from './activity.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectRepository(Activity)
    private readonly activities: Repository<Activity>,
    private readonly projectsService: ProjectsService,
  ) {}

  /**
   * Comprueba primero que el proyecto exista, para responder 404 en lugar de dejar que la clave
   * foránea falle con un error de integridad que el cliente no podría interpretar.
   */
  async create(projectId: string, dto: CreateActivityDto): Promise<Activity> {
    await this.projectsService.findOne(projectId);

    return this.activities.save(this.activities.create({ ...dto, projectId }));
  }

  async findAllByProject(projectId: string): Promise<Activity[]> {
    await this.projectsService.findOne(projectId);

    return this.activities.find({
      where: { projectId },
      order: { createdAt: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Activity> {
    const activity = await this.activities.findOne({ where: { id } });

    if (activity === null) {
      throw new NotFoundException(
        `No existe una actividad con el identificador ${id}`,
      );
    }

    return activity;
  }

  async update(id: string, dto: UpdateActivityDto): Promise<Activity> {
    const activity = await this.findOne(id);

    return this.activities.save(Object.assign(activity, dto));
  }

  async remove(id: string): Promise<void> {
    await this.activities.remove(await this.findOne(id));
  }
}
