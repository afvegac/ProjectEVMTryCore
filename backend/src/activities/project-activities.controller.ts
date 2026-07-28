import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiIdentifiedResourceErrors } from '../common/decorators/api-error-responses.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityResponse } from './dto/activity.response';
import { CreateActivityDto } from './dto/create-activity.dto';

const PROJECT_NOT_FOUND = 'No existe un proyecto con ese identificador.';

/**
 * Operaciones en las que la actividad depende de su proyecto. Crear y listar cuelgan de la ruta del
 * proyecto porque no tienen sentido fuera de él; editar y eliminar viven en ActivitiesController,
 * donde el identificador de la actividad basta para localizarla.
 */
@ApiTags('Actividades')
@ApiParam({ name: 'projectId', format: 'uuid' })
@Controller('projects/:projectId/activities')
export class ProjectActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar una actividad en un proyecto',
    description:
      'Comprueba primero que el proyecto exista, de modo que un identificador inválido devuelva 404 y no un error de integridad.',
  })
  @ApiCreatedResponse({ type: ActivityResponse })
  @ApiIdentifiedResourceErrors(PROJECT_NOT_FOUND)
  async create(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateActivityDto,
  ): Promise<ActivityResponse> {
    return ActivityResponse.fromEntity(
      await this.activitiesService.create(projectId, dto),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Listar las actividades de un proyecto' })
  @ApiOkResponse({ type: [ActivityResponse] })
  @ApiIdentifiedResourceErrors(PROJECT_NOT_FOUND)
  async findAll(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ActivityResponse[]> {
    const activities = await this.activitiesService.findAllByProject(projectId);

    return activities.map((activity) => ActivityResponse.fromEntity(activity));
  }
}
