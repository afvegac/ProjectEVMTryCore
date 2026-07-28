import { Activity } from '../activity.entity';

export class ActivityResponse {
  id: string;
  projectId: string;
  name: string;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
  createdAt: string;
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
