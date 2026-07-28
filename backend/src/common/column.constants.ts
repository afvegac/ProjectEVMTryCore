/**
 * Definiciones de columna compartidas entre las entidades. Se centralizan aquí para que la precisión
 * del dinero y de los porcentajes no quede repetida como número suelto en cada entidad, y para que
 * coincida con lo declarado en db/init/01-schema.sql.
 */

/** Longitud máxima de los nombres de proyecto y de actividad. */
export const NAME_MAX_LENGTH = 150;

/** NUMERIC(14, 2): suficiente para presupuestos de doce cifras con centavos. */
export const MONETARY_PRECISION = 14;
export const MONETARY_SCALE = 2;

/** NUMERIC(5, 2): porcentajes de 0,00 a 100,00. */
export const PERCENT_PRECISION = 5;
export const PERCENT_SCALE = 2;
