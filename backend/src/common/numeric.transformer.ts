import { ValueTransformer } from 'typeorm';

/**
 * Convierte las columnas NUMERIC de PostgreSQL a `number` de JavaScript.
 *
 * El driver `pg` devuelve NUMERIC como cadena de texto, deliberadamente: un NUMERIC(14,2) puede
 * exceder la precisión de un double y convertirlo automáticamente perdería dígitos sin avisar.
 *
 * Para este dominio esa conversión sí es segura —los montos caben de sobra en un double— y es
 * obligatoria: sin ella, el presupuesto llegaría al motor de cálculo como "10000.00" y el operador
 * `+` de la consolidación concatenaría cadenas en lugar de sumar, produciendo totales absurdos sin
 * lanzar ningún error. Es un fallo silencioso, y por eso la conversión vive en un solo lugar.
 */
export const numericTransformer: ValueTransformer = {
  to: (value: number): number => value,
  from: (value: string): number => Number(value),
};
