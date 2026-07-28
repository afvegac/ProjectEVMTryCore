/** Interpretación del CPI: eficiencia en costo. */
export enum CostStatus {
  /** CPI > 1: se gana más valor del que se gasta. */
  UnderBudget = 'UNDER_BUDGET',
  /** CPI = 1 (dentro de la tolerancia): se gasta exactamente lo presupuestado. */
  OnBudget = 'ON_BUDGET',
  /** CPI < 1: se gasta más de lo que se avanza. */
  OverBudget = 'OVER_BUDGET',
  /** El CPI no se puede calcular. La razón se informa por separado. */
  NotAvailable = 'NOT_AVAILABLE',
}

/** Interpretación del SPI: eficiencia en cronograma. */
export enum ScheduleStatus {
  /** SPI > 1: se avanza más rápido de lo planificado. */
  Ahead = 'AHEAD',
  /** SPI = 1 (dentro de la tolerancia): se avanza al ritmo planificado. */
  OnSchedule = 'ON_SCHEDULE',
  /** SPI < 1: se avanza más lento de lo planificado. */
  Behind = 'BEHIND',
  /** El SPI no se puede calcular. La razón se informa por separado. */
  NotAvailable = 'NOT_AVAILABLE',
}

/**
 * Motivo por el cual un indicador no se pudo calcular.
 *
 * Se informa junto al estado NOT_AVAILABLE en lugar de devolver 0: con costo real en cero y valor
 * ganado positivo, la eficiencia no es nula sino indeterminada, y comunicar 0 diría lo contrario de
 * lo que ocurre. El código explícito permite que la interfaz explique al líder por qué falta el dato.
 */
export enum UnavailableReason {
  /** El proyecto no tiene actividades registradas. */
  NoActivities = 'NO_ACTIVITIES',
  /** Sin avance real y sin costo incurrido: la actividad no ha comenzado. */
  NotStarted = 'NOT_STARTED',
  /** Hay avance real pero aún no se ha registrado costo, así que el CPI es indeterminado. */
  NoCostRecorded = 'NO_COST_RECORDED',
  /** No hay trabajo planificado a la fecha de corte, así que el SPI es indeterminado. */
  NoPlannedWork = 'NO_PLANNED_WORK',
  /** Sin valor ganado no hay eficiencia sobre la cual proyectar el costo final. */
  NoEarnedValue = 'NO_EARNED_VALUE',
}
