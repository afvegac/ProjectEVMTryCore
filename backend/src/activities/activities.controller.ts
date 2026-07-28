import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiIdentifiedResourceErrors } from '../common/decorators/api-error-responses.decorator';
import { ActivitiesService } from './activities.service';
import { ActivityResponse } from './dto/activity.response';
import { UpdateActivityDto } from './dto/update-activity.dto';

const ACTIVITY_NOT_FOUND = 'No existe una actividad con ese identificador.';

@ApiTags('Actividades')
@ApiParam({ name: 'id', format: 'uuid' })
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Consultar una actividad' })
  @ApiOkResponse({ type: ActivityResponse })
  @ApiIdentifiedResourceErrors(ACTIVITY_NOT_FOUND)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ActivityResponse> {
    return ActivityResponse.fromEntity(
      await this.activitiesService.findOne(id),
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Registrar avance o corregir una actividad',
    description:
      'Solo se modifican los campos incluidos. Enviar únicamente el avance real y el costo deja intacto el presupuesto planificado.',
  })
  @ApiOkResponse({ type: ActivityResponse })
  @ApiIdentifiedResourceErrors(ACTIVITY_NOT_FOUND)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityResponse> {
    return ActivityResponse.fromEntity(
      await this.activitiesService.update(id, dto),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una actividad' })
  @ApiNoContentResponse({ description: 'Actividad eliminada.' })
  @ApiIdentifiedResourceErrors(ACTIVITY_NOT_FOUND)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.activitiesService.remove(id);
  }
}
