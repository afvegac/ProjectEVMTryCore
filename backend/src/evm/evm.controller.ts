import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ApiIdentifiedResourceErrors } from '../common/decorators/api-error-responses.decorator';
import { ProjectEvmAnalysisResponse } from './dto/project-evm-analysis.response';
import { EvmAnalysisService } from './evm-analysis.service';

/**
 * El análisis es un recurso aparte del CRUD: los proyectos y las actividades se gestionan, y el
 * Valor Ganado se consulta. Separarlos mantiene cada controlador con una sola responsabilidad.
 */
@ApiTags('Análisis EVM')
@Controller('projects/:projectId/evm')
export class EvmController {
  constructor(private readonly evmAnalysisService: EvmAnalysisService) {}

  @Get()
  @ApiOperation({
    summary: 'Calcular los indicadores de Valor Ganado de un proyecto',
    description:
      'Devuelve en una sola llamada las actividades con sus indicadores y el consolidado del proyecto, que es todo lo que necesita un dashboard. Un proyecto sin actividades responde con las magnitudes en cero, los índices nulos y la razón NO_ACTIVITIES.',
  })
  @ApiParam({ name: 'projectId', format: 'uuid' })
  @ApiOkResponse({ type: ProjectEvmAnalysisResponse })
  @ApiIdentifiedResourceErrors('No existe un proyecto con ese identificador.')
  analyze(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectEvmAnalysisResponse> {
    return this.evmAnalysisService.analyzeProject(projectId);
  }
}
