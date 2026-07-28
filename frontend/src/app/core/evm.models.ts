/** Contrato público de la API. Los nombres reflejan literalmente los del backend. */

export type CostStatus =
  | 'UNDER_BUDGET'
  | 'ON_BUDGET'
  | 'OVER_BUDGET'
  | 'NOT_AVAILABLE';

export type ScheduleStatus =
  | 'AHEAD'
  | 'ON_SCHEDULE'
  | 'BEHIND'
  | 'NOT_AVAILABLE';

export type UnavailableReason =
  | 'NO_ACTIVITIES'
  | 'NOT_STARTED'
  | 'NO_COST_RECORDED'
  | 'NO_PLANNED_WORK'
  | 'NO_EARNED_VALUE';

export interface EvmIndicators {
  budgetAtCompletion: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
  costVariance: number;
  scheduleVariance: number;
  /** Nulo cuando el indicador es indeterminado. Nunca cero por defecto. */
  costPerformanceIndex: number | null;
  schedulePerformanceIndex: number | null;
  estimateAtCompletion: number | null;
  varianceAtCompletion: number | null;
  costStatus: CostStatus;
  costStatusReason: UnavailableReason | null;
  scheduleStatus: ScheduleStatus;
  scheduleStatusReason: UnavailableReason | null;
  forecastReason: UnavailableReason | null;
}

export interface ActivityEvm {
  id: string;
  name: string;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  indicators: EvmIndicators;
}

export interface ProjectEvmAnalysis {
  projectId: string;
  projectName: string;
  activities: ActivityEvm[];
  summary: EvmIndicators;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
}

export interface Activity {
  id: string;
  projectId: string;
  name: string;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
}

/** Los cinco campos que el líder de proyecto registra. */
export interface ActivityInput {
  name: string;
  budgetAtCompletion: number;
  plannedProgressPercent: number;
  actualProgressPercent: number;
  actualCost: number;
}
