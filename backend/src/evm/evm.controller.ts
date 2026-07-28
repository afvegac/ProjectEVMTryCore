import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ProjectEvmAnalysisResponse } from './dto/project-evm-analysis.response';
import { EvmAnalysisService } from './evm-analysis.service';

/**
 * El análisis es un recurso aparte del CRUD: los proyectos y las actividades se gestionan, y el
 * Valor Ganado se consulta. Separarlos mantiene cada controlador con una sola responsabilidad.
 */
@Controller('projects/:projectId/evm')
export class EvmController {
  constructor(private readonly evmAnalysisService: EvmAnalysisService) {}

  @Get()
  analyze(
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<ProjectEvmAnalysisResponse> {
    return this.evmAnalysisService.analyzeProject(projectId);
  }
}
