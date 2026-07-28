import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from './evm-status.enum';

/**
 * Datos que el líder de proyecto registra para una actividad. Son los cinco campos de entrada
 * del modelo: el nombre no interviene en el cálculo y por eso no forma parte del dominio.
 */
export interface EvmInput {
  /** BAC — presupuesto total planificado de la actividad. */
  budgetAtCompletion: number;
  /** Porcentaje de avance planificado a la fecha de corte, de 0 a 100. */
  plannedProgressPercent: number;
  /** Porcentaje de avance real completado, de 0 a 100. */
  actualProgressPercent: number;
  /** AC — costo real incurrido hasta la fecha. */
  actualCost: number;
}

/**
 * Magnitudes monetarias de las que se derivan todos los indicadores. Son aditivas, lo que permite
 * consolidar un proyecto sumando las de sus actividades antes de recalcular los índices.
 */
export interface EvmBaseValues {
  budgetAtCompletion: number;
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
}

/** Conjunto completo de indicadores de Valor Ganado, con su interpretación. */
export interface EvmIndicators extends EvmBaseValues {
  /** CV = EV − AC. Negativo indica sobrecosto. */
  costVariance: number;
  /** SV = EV − PV. Negativo indica atraso. */
  scheduleVariance: number;

  /** CPI = EV / AC. Nulo cuando AC es cero. */
  costPerformanceIndex: number | null;
  costStatus: CostStatus;
  costStatusReason: UnavailableReason | null;

  /** SPI = EV / PV. Nulo cuando PV es cero. */
  schedulePerformanceIndex: number | null;
  scheduleStatus: ScheduleStatus;
  scheduleStatusReason: UnavailableReason | null;

  /** EAC = BAC / CPI. Nulo cuando el CPI es nulo o cero. */
  estimateAtCompletion: number | null;
  /** VAC = BAC − EAC. Nulo siempre que el EAC lo sea. */
  varianceAtCompletion: number | null;
  /** Motivo por el que no hay pronóstico. Cubre tanto el EAC como el VAC. */
  forecastReason: UnavailableReason | null;
}
