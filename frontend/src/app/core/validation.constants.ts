/**
 * Réplica de los límites que valida el backend. Se duplican a propósito: permiten avisar al usuario
 * antes de enviar la petición, pero el servidor sigue siendo la autoridad y vuelve a comprobarlos.
 */
export const NAME_MAX_LENGTH = 150;
export const MIN_BUDGET_AT_COMPLETION = 0.01;
export const MIN_PROGRESS_PERCENT = 0;
export const MAX_PROGRESS_PERCENT = 100;
export const MIN_ACTUAL_COST = 0;
