import { MONETARY_SCALE } from './column.constants';

/** Decimales con los que se publican los índices de desempeño (CPI y SPI). */
const INDEX_DECIMAL_PLACES = 4;

/**
 * Redondeo de presentación.
 *
 * Pertenece exclusivamente a la frontera de serialización y **nunca** a un paso intermedio del
 * cálculo. Con los datos del caso de referencia, derivar el EAC de un CPI ya redondeado a dos
 * decimales desplaza el pronóstico en más de 130 unidades monetarias:
 *
 *   CPI exacto   = 0,952380952…  →  EAC = 52.500,00
 *   CPI a 2 dec. = 0,95          →  EAC = 52.631,58
 *
 * Por eso el motor de cálculo trabaja siempre con los valores sin redondear y estas funciones se
 * aplican solo al construir la respuesta.
 */
export function roundMonetary(value: number): number {
  return roundTo(value, MONETARY_SCALE);
}

export function roundOptionalMonetary(value: number | null): number | null {
  return value === null ? null : roundMonetary(value);
}

export function roundIndex(value: number): number {
  return roundTo(value, INDEX_DECIMAL_PLACES);
}

export function roundOptionalIndex(value: number | null): number | null {
  return value === null ? null : roundIndex(value);
}

function roundTo(value: number, decimalPlaces: number): number {
  const factor = 10 ** decimalPlaces;

  return Math.round(value * factor) / factor;
}
