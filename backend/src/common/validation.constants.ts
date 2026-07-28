/** Límites de validación compartidos por los DTO. Replican las restricciones CHECK del esquema. */

export const MIN_PROGRESS_PERCENT = 0;
export const MAX_PROGRESS_PERCENT = 100;

/** El presupuesto debe ser estrictamente positivo: una actividad sin presupuesto no tiene valor que ganar. */
export const MIN_BUDGET_AT_COMPLETION = 0.01;

/** El costo real sí puede ser cero: una actividad puede no haber consumido presupuesto todavía. */
export const MIN_ACTUAL_COST = 0;
