import { Injectable } from '@nestjs/common';
import { Activity } from '../activities/activity.entity';
import { ProjectsService } from '../projects/projects.service';
import { consolidateProjectIndicators } from './domain/evm-calculator';
import { EvmIndicatorsResponse } from './dto/evm-indicators.response';
import { ProjectEvmAnalysisResponse } from './dto/project-evm-analysis.response';

/**
 * Adaptador entre la persistencia y el dominio.
 *
 * No contiene ni una fórmula: recupera las actividades, se las entrega al motor de cálculo y traduce
 * el resultado al contrato público. Toda la aritmética de Valor Ganado vive en `evm/domain`, que no
 * depende de NestJS ni de la base de datos.
 */
@Injectable()
export class EvmAnalysisService {
  constructor(private readonly projectsService: ProjectsService) {}

  async analyzeProject(projectId: string): Promise<ProjectEvmAnalysisResponse> {
    const project = await this.projectsService.findOneWithActivities(projectId);
    const activities = sortByCreation(project.activities);

    // El consolidado se obtiene sumando las magnitudes de todas las actividades y recalculando los
    // índices sobre esos totales; nunca promediando los índices individuales.
    const summary = EvmIndicatorsResponse.fromIndicators(
      consolidateProjectIndicators(activities),
    );

    return ProjectEvmAnalysisResponse.build(project, activities, summary);
  }
}

/** La relación no garantiza orden, así que se fija aquí para que la tabla y la gráfica sean estables. */
function sortByCreation(activities: Activity[]): Activity[] {
  return [...activities].sort(
    (one, other) => one.createdAt.getTime() - other.createdAt.getTime(),
  );
}
