import { ApiProperty } from '@nestjs/swagger';
import { Activity } from '../activity.entity';

export class ActivityResponse {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  projectId: string;

  @ApiProperty({ example: 'Desarrollo del backend' })
  name: string;

  @ApiProperty({
    example: 20000,
    description: 'BAC — presupuesto total planificado.',
  })
  budgetAtCompletion: number;

  @ApiProperty({ example: 75 })
  plannedProgressPercent: number;

  @ApiProperty({ example: 50 })
  actualProgressPercent: number;

  @ApiProperty({ example: 12000, description: 'AC — costo real incurrido.' })
  actualCost: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;

  static fromEntity(activity: Activity): ActivityResponse {
    return {
      id: activity.id,
      projectId: activity.projectId,
      name: activity.name,
      budgetAtCompletion: activity.budgetAtCompletion,
      plannedProgressPercent: activity.plannedProgressPercent,
      actualProgressPercent: activity.actualProgressPercent,
      actualCost: activity.actualCost,
      createdAt: activity.createdAt.toISOString(),
      updatedAt: activity.updatedAt.toISOString(),
    };
  }
}
