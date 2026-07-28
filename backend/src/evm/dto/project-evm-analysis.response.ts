import { Activity } from '../../activities/activity.entity';
import { Project } from '../../projects/project.entity';
import { calculateActivityIndicators } from '../domain/evm-calculator';
import { EvmIndicatorsResponse } from './evm-indicators.response';

/** Una actividad con sus indicadores, tal como la consume la tabla del dashboard. */
export class ActivityEvmResponse {
  id: string;
  name: string;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  indicators: EvmIndicatorsResponse;

  /**
   * La entidad declara los mismos nombres de campo que espera el motor de cálculo, así que se le
   * puede entregar directamente sin una capa intermedia de traducción.
   */
  static fromEntity(activity: Activity): ActivityEvmResponse {
    return {
      id: activity.id,
      name: activity.name,
      plannedProgressPercent: activity.plannedProgressPercent,
      actualProgressPercent: activity.actualProgressPercent,
      indicators: EvmIndicatorsResponse.fromIndicators(
        calculateActivityIndicators(activity),
      ),
    };
  }
}

/**
 * Análisis completo de un proyecto: todo lo que el dashboard necesita en una sola llamada, para que
 * la tabla, las tarjetas del consolidado y la gráfica se dibujen desde una única respuesta coherente.
 */
export class ProjectEvmAnalysisResponse {
  projectId: string;
  projectName: string;
  activities: ActivityEvmResponse[];
  /** Consolidado del proyecto: suma de las magnitudes e índices recalculados sobre esos totales. */
  summary: EvmIndicatorsResponse;

  static build(
    project: Project,
    activities: readonly Activity[],
    summary: EvmIndicatorsResponse,
  ): ProjectEvmAnalysisResponse {
    return {
      projectId: project.id,
      projectName: project.name,
      activities: activities.map((activity) =>
        ActivityEvmResponse.fromEntity(activity),
      ),
      summary,
    };
  }
}
