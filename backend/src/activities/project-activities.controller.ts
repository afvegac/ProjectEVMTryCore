import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivityResponse } from './dto/activity.response';
import { CreateActivityDto } from './dto/create-activity.dto';

/**
 * Operaciones en las que la actividad depende de su proyecto. Crear y listar cuelgan de la ruta del
 * proyecto porque no tienen sentido fuera de él; editar y eliminar viven en ActivitiesController,
 * donde el identificador de la actividad basta para localizarla.
 */
@Controller('projects/:projectId/activities')
export class ProjectActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateActivityDto,
  ): Promise<ActivityResponse> {
    return ActivityResponse.fromEntity(
      await this.activitiesService.create(projectId, dto),
    );
  }

  @Get()
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ActivityResponse[]> {
    const activities = await this.activitiesService.findAllByProject(projectId);

    return activities.map((activity) => ActivityResponse.fromEntity(activity));
  }
}
