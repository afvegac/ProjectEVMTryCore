/**
 * Base de los porcentajes de avance en toda la aplicación: se expresan de 0 a 100, nunca de 0 a 1.
 * La conversión a fracción ocurre en un único punto del dominio para evitar que convivan dos
 * representaciones distintas, que es una fuente silenciosa de errores de un factor de 100.
 */
export const PERCENT_BASE = 100;

/** Valor de un índice de desempeño (CPI/SPI) que representa una ejecución exactamente conforme al plan. */
export const NEUTRAL_INDEX = 1;

/**
 * Margen para considerar que un índice equivale a NEUTRAL_INDEX. La igualdad exacta con 1 casi nunca
 * ocurre en aritmética de punto flotante. El valor está alineado con los dos decimales que muestra la
 * interfaz: si en pantalla se lee 1.00, el estado debe decir "conforme al plan".
 */
export const INDEX_STATUS_TOLERANCE = 0.005;
