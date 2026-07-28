/**
 * Motor de cálculo de Valor Ganado (Earned Value Management).
 *
 * Este módulo es deliberadamente puro: no importa nada de NestJS, TypeORM ni HTTP. Recibe números y
 * devuelve números, de modo que se puede probar sin levantar el framework ni la base de datos y la
 * lógica de negocio queda fuera de los controladores por construcción.
 *
 * Fórmulas implementadas:
 *
 *   PV  = (% planificado / 100) × BAC       CV  = EV − AC        CPI = EV / AC
 *   EV  = (% real        / 100) × BAC       SV  = EV − PV        SPI = EV / PV
 *   EAC = BAC / CPI                         VAC = BAC − EAC
 *
 * El valor ganado se valoriza siempre con el presupuesto y nunca con el costo real: si una actividad
 * presupuestada en 10.000 va al 50 %, gana 5.000 aunque se hayan gastado 30.000. El sobrecosto vive
 * en el AC y no contamina el EV; esa separación es lo que hace funcionar la técnica.
 */
import {
  INDEX_STATUS_TOLERANCE,
  NEUTRAL_INDEX,
  PERCENT_BASE,
} from './evm.constants';
import { EvmBaseValues, EvmIndicators, EvmInput } from './evm-indicators.model';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from './evm-status.enum';

interface IndexAnalysis<TStatus> {
  index: number | null;
  status: TStatus;
  reason: UnavailableReason | null;
}

/**
 * Estados que puede tomar un índice según su posición respecto al valor neutro.
 *
 * Van agrupados en un objeto y no como parámetros sueltos porque los tres son del mismo tipo
 * genérico: pasarlos en el orden equivocado compilaría sin error y devolvería el estado contrario.
 * Con nombres, el orden deja de importar.
 */
interface IndexStatuses<TStatus> {
  above: TStatus;
  at: TStatus;
  below: TStatus;
}

/**
 * Descripción completa de un índice de desempeño: qué divide, cómo se interpreta el resultado y qué
 * informar cuando el divisor es cero. Costo y cronograma solo difieren en estos datos, así que el
 * procedimiento vive una sola vez en `analyzeIndex`.
 */
interface IndexDefinition<TStatus> {
  numerator: number;
  denominator: number;
  statuses: IndexStatuses<TStatus>;
  /** Estado a reportar cuando el índice no se puede calcular. */
  unavailableStatus: TStatus;
  /** Motivo por el que el índice no se puede calcular, propio de cada índice. */
  unavailableReason: UnavailableReason;
}

interface ForecastAnalysis {
  estimateAtCompletion: number | null;
  varianceAtCompletion: number | null;
  reason: UnavailableReason | null;
}

const NO_BASE_VALUES: EvmBaseValues = {
  budgetAtCompletion: 0,
  plannedValue: 0,
  earnedValue: 0,
  actualCost: 0,
};

/** Calcula los indicadores de una actividad individual. */
export function calculateActivityIndicators(input: EvmInput): EvmIndicators {
  return computeIndicators(toBaseValues(input));
}

/**
 * Consolida los indicadores de un proyecto a partir de sus actividades.
 *
 * Suma las magnitudes monetarias —que sí son aditivas— y recalcula los índices sobre esos totales.
 * Promediar los CPI y SPI de las actividades produce un número distinto e incorrecto, y además es
 * inviable cuando alguna actividad tiene el índice indefinido: excluirla o contarla como cero son
 * decisiones igualmente arbitrarias. Sumar primero resuelve ambos problemas.
 */
export function consolidateProjectIndicators(
  inputs: readonly EvmInput[],
): EvmIndicators {
  if (inputs.length === 0) {
    return computeIndicators(NO_BASE_VALUES, UnavailableReason.NoActivities);
  }

  const totals = inputs.map(toBaseValues).reduce(addBaseValues, NO_BASE_VALUES);
  return computeIndicators(totals);
}

/**
 * Única función que deriva indicadores a partir de magnitudes monetarias. Actividad y proyecto pasan
 * por aquí, de modo que ambos niveles no pueden divergir.
 *
 * @param overrideReason motivo que sustituye al deducido de los datos, para el caso de un proyecto
 *                       sin actividades, donde los ceros no significan "no iniciado" sino "sin datos".
 */
function computeIndicators(
  base: EvmBaseValues,
  overrideReason: UnavailableReason | null = null,
): EvmIndicators {
  const cost = analyzeCost(base, overrideReason);
  const schedule = analyzeSchedule(base, overrideReason);
  const forecast = analyzeForecast(base.budgetAtCompletion, cost);

  return {
    ...base,
    costVariance: base.earnedValue - base.actualCost,
    scheduleVariance: base.earnedValue - base.plannedValue,
    costPerformanceIndex: cost.index,
    costStatus: cost.status,
    costStatusReason: cost.reason,
    schedulePerformanceIndex: schedule.index,
    scheduleStatus: schedule.status,
    scheduleStatusReason: schedule.reason,
    estimateAtCompletion: forecast.estimateAtCompletion,
    varianceAtCompletion: forecast.varianceAtCompletion,
    forecastReason: forecast.reason,
  };
}

/** Traduce los porcentajes de avance a magnitudes monetarias. */
function toBaseValues(input: EvmInput): EvmBaseValues {
  return {
    budgetAtCompletion: input.budgetAtCompletion,
    plannedValue: toMonetaryValue(
      input.plannedProgressPercent,
      input.budgetAtCompletion,
    ),
    earnedValue: toMonetaryValue(
      input.actualProgressPercent,
      input.budgetAtCompletion,
    ),
    actualCost: input.actualCost,
  };
}

/** Único punto donde un porcentaje se convierte en fracción. */
function toMonetaryValue(
  progressPercent: number,
  budgetAtCompletion: number,
): number {
  return (progressPercent / PERCENT_BASE) * budgetAtCompletion;
}

function addBaseValues(
  total: EvmBaseValues,
  current: EvmBaseValues,
): EvmBaseValues {
  return {
    budgetAtCompletion: total.budgetAtCompletion + current.budgetAtCompletion,
    plannedValue: total.plannedValue + current.plannedValue,
    earnedValue: total.earnedValue + current.earnedValue,
    actualCost: total.actualCost + current.actualCost,
  };
}

/**
 * Procedimiento único para analizar un índice de desempeño.
 *
 * CPI y SPI son la misma operación sobre divisores distintos: ambos dividen el valor ganado, ambos
 * quedan indefinidos si el divisor es cero y ambos se interpretan comparando contra el valor neutro.
 * Describir cada índice como datos y compartir el procedimiento evita que costo y cronograma se
 * desincronicen al corregir uno solo de los dos.
 *
 * @param overrideReason motivo que sustituye al propio del índice, para el caso de un proyecto sin
 *                       actividades, donde el divisor en cero no significa lo mismo.
 */
function analyzeIndex<TStatus>(
  definition: IndexDefinition<TStatus>,
  overrideReason: UnavailableReason | null,
): IndexAnalysis<TStatus> {
  const { numerator, denominator, statuses } = definition;

  if (denominator === 0) {
    return {
      index: null,
      status: definition.unavailableStatus,
      reason: overrideReason ?? definition.unavailableReason,
    };
  }

  const index = numerator / denominator;

  return {
    index,
    status: classifyIndex(index, statuses),
    reason: null,
  };
}

/** CPI = EV / AC. Un índice por encima de 1 significa eficiencia en costos. */
function analyzeCost(
  { earnedValue, actualCost }: EvmBaseValues,
  overrideReason: UnavailableReason | null,
): IndexAnalysis<CostStatus> {
  return analyzeIndex(
    {
      numerator: earnedValue,
      denominator: actualCost,
      statuses: {
        above: CostStatus.UnderBudget,
        at: CostStatus.OnBudget,
        below: CostStatus.OverBudget,
      },
      unavailableStatus: CostStatus.NotAvailable,
      // Sin costo registrado el CPI es indefinido, pero el motivo no siempre es el mismo: con valor
      // ganado hay trabajo hecho cuyo costo falta por imputar; sin él, la actividad no ha arrancado.
      unavailableReason:
        earnedValue > 0
          ? UnavailableReason.NoCostRecorded
          : UnavailableReason.NotStarted,
    },
    overrideReason,
  );
}

/** SPI = EV / PV. Un índice por encima de 1 significa adelanto respecto al cronograma. */
function analyzeSchedule(
  { earnedValue, plannedValue }: EvmBaseValues,
  overrideReason: UnavailableReason | null,
): IndexAnalysis<ScheduleStatus> {
  return analyzeIndex(
    {
      numerator: earnedValue,
      denominator: plannedValue,
      statuses: {
        above: ScheduleStatus.Ahead,
        at: ScheduleStatus.OnSchedule,
        below: ScheduleStatus.Behind,
      },
      unavailableStatus: ScheduleStatus.NotAvailable,
      unavailableReason: UnavailableReason.NoPlannedWork,
    },
    overrideReason,
  );
}

/**
 * Proyecta el costo final a partir de la eficiencia observada.
 *
 * El EAC se calcula desde el CPI sin redondear: con los datos del caso de referencia, tomar el CPI
 * con dos decimales desplaza el pronóstico en más de 130 unidades monetarias. El redondeo pertenece
 * a la frontera de serialización, nunca a un paso intermedio del cálculo.
 */
function analyzeForecast(
  budgetAtCompletion: number,
  cost: IndexAnalysis<CostStatus>,
): ForecastAnalysis {
  if (cost.index === null) {
    return {
      estimateAtCompletion: null,
      varianceAtCompletion: null,
      reason: cost.reason,
    };
  }

  if (cost.index === 0) {
    return {
      estimateAtCompletion: null,
      varianceAtCompletion: null,
      reason: UnavailableReason.NoEarnedValue,
    };
  }

  const estimateAtCompletion = budgetAtCompletion / cost.index;

  return {
    estimateAtCompletion,
    varianceAtCompletion: budgetAtCompletion - estimateAtCompletion,
    reason: null,
  };
}

/** Regla única de interpretación de un índice de desempeño, compartida por costo y cronograma. */
function classifyIndex<TStatus>(
  index: number,
  statuses: IndexStatuses<TStatus>,
): TStatus {
  if (Math.abs(index - NEUTRAL_INDEX) < INDEX_STATUS_TOLERANCE) {
    return statuses.at;
  }

  return index > NEUTRAL_INDEX ? statuses.above : statuses.below;
}
