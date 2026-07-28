import {
  roundIndex,
  roundMonetary,
  roundOptionalIndex,
  roundOptionalMonetary,
} from './rounding';

describe('rounding', () => {
  describe('roundMonetary', () => {
    it('deja los importes con dos decimales', () => {
      expect(roundMonetary(52_499.996)).toBe(52_500);
      expect(roundMonetary(24_000.004)).toBe(24_000);
      expect(roundMonetary(1_234.567)).toBe(1_234.57);
    });

    /** El EAC de una actividad terminada llega como 8999,999999999998 por aritmética de punto flotante. */
    it('absorbe el residuo de punto flotante de los cocientes', () => {
      expect(roundMonetary(10_000 / (10_000 / 9_000))).toBe(9_000);
    });

    /**
     * Los sobrecostos y atrasos se expresan en negativo, así que el redondeo debe comportarse igual
     * en ambos signos. Se evitan a propósito los valores exactamente a mitad de camino: `Math.round`
     * resuelve los empates hacia +∞, de modo que −0,5 va a −0 y no a −1. No es un caso alcanzable
     * aquí —los importes provienen de divisiones— pero conviene no fijarlo como expectativa.
     */
    it('conserva el signo de los valores negativos', () => {
      expect(roundMonetary(-2_500.004)).toBe(-2_500);
      expect(roundMonetary(-4_000.006)).toBe(-4_000.01);
    });
  });

  describe('roundIndex', () => {
    it('deja los índices con cuatro decimales', () => {
      expect(roundIndex(20_000 / 21_000)).toBe(0.9524);
      expect(roundIndex(20_000 / 35_000)).toBe(0.5714);
      expect(roundIndex(10_000 / 9_000)).toBe(1.1111);
    });

    it('mantiene exactos los valores que ya tienen menos decimales', () => {
      expect(roundIndex(1)).toBe(1);
      expect(roundIndex(0)).toBe(0);
    });
  });

  describe('variantes que aceptan ausencia de valor', () => {
    it('propaga el nulo en lugar de convertirlo en cero', () => {
      expect(roundOptionalMonetary(null)).toBeNull();
      expect(roundOptionalIndex(null)).toBeNull();
    });

    it('redondea igual que su variante obligatoria cuando hay valor', () => {
      expect(roundOptionalMonetary(1_234.567)).toBe(1_234.57);
      expect(roundOptionalIndex(20_000 / 21_000)).toBe(0.9524);
    });
  });
});
