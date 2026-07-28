import { CostStatus, ScheduleStatus, UnavailableReason } from './evm.models';

/**
 * Traducción de los enums del backend a lo que ve el usuario.
 *
 * El backend nunca envía texto de presentación: viaja el código y aquí se resuelve la etiqueta. Cada
 * estado lleva además un símbolo, porque un semáforo que comunica solo por color es ilegible para
 * quien no distingue rojo de verde. El color acompaña; el texto es el que informa.
 */

export type StatusTone = 'good' | 'critical' | 'neutral';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
  symbol: string;
}

const NOT_AVAILABLE: StatusPresentation = {
  label: 'Sin dato',
  tone: 'neutral',
  symbol: '–',
};

export const COST_STATUS_PRESENTATION: Record<CostStatus, StatusPresentation> =
  {
    UNDER_BUDGET: {
      label: 'Bajo presupuesto',
      tone: 'good',
      symbol: '▲',
    },
    ON_BUDGET: { label: 'En presupuesto', tone: 'good', symbol: '=' },
    OVER_BUDGET: { label: 'Sobre presupuesto', tone: 'critical', symbol: '▼' },
    NOT_AVAILABLE,
  };

export const SCHEDULE_STATUS_PRESENTATION: Record<
  ScheduleStatus,
  StatusPresentation
> = {
  AHEAD: { label: 'Adelantado', tone: 'good', symbol: '▲' },
  ON_SCHEDULE: { label: 'A tiempo', tone: 'good', symbol: '=' },
  BEHIND: { label: 'Atrasado', tone: 'critical', symbol: '▼' },
  NOT_AVAILABLE,
};

/** Explica por qué falta un indicador, para que un "sin dato" no deje al líder sin diagnóstico. */
export const UNAVAILABLE_REASON_LABEL: Record<UnavailableReason, string> = {
  NO_ACTIVITIES: 'El proyecto todavía no tiene actividades',
  NOT_STARTED: 'Sin avance ni costo registrado: la actividad no ha comenzado',
  NO_COST_RECORDED: 'Hay avance pero aún no se ha registrado costo',
  NO_PLANNED_WORK: 'No hay trabajo planificado a la fecha de corte',
  NO_EARNED_VALUE: 'Sin valor ganado no hay eficiencia sobre la cual proyectar',
};
