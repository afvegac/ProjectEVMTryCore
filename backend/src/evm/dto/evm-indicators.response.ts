import {
  roundMonetary,
  roundOptionalIndex,
  roundOptionalMonetary,
} from '../../common/rounding';
import { EvmIndicators } from '../domain/evm-indicators.model';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from '../domain/evm-status.enum';

/**
 * Indicadores de Valor Ganado tal y como los publica la API.
 *
 * Aquí es donde ocurre el único redondeo del sistema: el dominio calcula con precisión completa y
 * esta capa presenta importes con dos decimales e índices con cuatro.
 */
export class EvmIndicatorsResponse {
  /** BAC — presupuesto total planificado. */
  budgetAtCompletion: number;
  /** PV — valor planificado a la fecha de corte. */
  plannedValue: number;
  /** EV — valor ganado. */
  earnedValue: number;
  /** AC — costo real incurrido. */
  actualCost: number;

  /** CV = EV − AC. Negativo indica sobrecosto. */
  costVariance: number;
  /** SV = EV − PV. Negativo indica atraso. */
  scheduleVariance: number;

  /** CPI = EV / AC. Nulo cuando no se puede calcular; la razón se indica aparte. */
  costPerformanceIndex: number | null;
  /** SPI = EV / PV. Nulo cuando no se puede calcular; la razón se indica aparte. */
  schedulePerformanceIndex: number | null;
  /** EAC = BAC / CPI. */
  estimateAtCompletion: number | null;
  /** VAC = BAC − EAC. */
  varianceAtCompletion: number | null;

  costStatus: CostStatus;
  costStatusReason: UnavailableReason | null;
  scheduleStatus: ScheduleStatus;
  scheduleStatusReason: UnavailableReason | null;
  /** Motivo por el que no hay pronóstico. Aplica tanto al EAC como al VAC. */
  forecastReason: UnavailableReason | null;

  static fromIndicators(indicators: EvmIndicators): EvmIndicatorsResponse {
    return {
      budgetAtCompletion: roundMonetary(indicators.budgetAtCompletion),
      plannedValue: roundMonetary(indicators.plannedValue),
      earnedValue: roundMonetary(indicators.earnedValue),
      actualCost: roundMonetary(indicators.actualCost),
      costVariance: roundMonetary(indicators.costVariance),
      scheduleVariance: roundMonetary(indicators.scheduleVariance),
      costPerformanceIndex: roundOptionalIndex(indicators.costPerformanceIndex),
      schedulePerformanceIndex: roundOptionalIndex(
        indicators.schedulePerformanceIndex,
      ),
      estimateAtCompletion: roundOptionalMonetary(
        indicators.estimateAtCompletion,
      ),
      varianceAtCompletion: roundOptionalMonetary(
        indicators.varianceAtCompletion,
      ),
      costStatus: indicators.costStatus,
      costStatusReason: indicators.costStatusReason,
      scheduleStatus: indicators.scheduleStatus,
      scheduleStatusReason: indicators.scheduleStatusReason,
      forecastReason: indicators.forecastReason,
    };
  }
}
