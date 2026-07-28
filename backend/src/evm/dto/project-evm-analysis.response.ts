import { ApiProperty } from '@nestjs/swagger';
import { Activity } from '../../activities/activity.entity';
import { Project } from '../../projects/project.entity';
import { calculateActivityIndicators } from '../domain/evm-calculator';
import { EvmIndicatorsResponse } from './evm-indicators.response';

/** Una actividad con sus indicadores, tal como la consume la tabla del dashboard. */
export class ActivityEvmResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ example: 'Desarrollo del backend' })
  name: string;

  @ApiProperty({ example: 75 })
  plannedProgressPercent: number;

  @ApiProperty({ example: 50 })
  actualProgressPercent: number;

  @ApiProperty({ type: EvmIndicatorsResponse })
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
  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ example: 'Plataforma de Gestión Documental' })
  projectName: string;

  @ApiProperty({ type: [ActivityEvmResponse] })
  activities: ActivityEvmResponse[];

  @ApiProperty({
    type: EvmIndicatorsResponse,
    description:
      'Consolidado del proyecto: suma de las magnitudes monetarias e índices recalculados sobre esos totales, nunca el promedio de los índices individuales.',
  })
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
