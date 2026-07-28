import {
  calculateActivityIndicators,
  consolidateProjectIndicators,
} from './evm-calculator';
import { EvmInput } from './evm-indicators.model';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from './evm-status.enum';

/**
 * Caso de referencia calculado a mano ANTES de implementar el motor. Los valores esperados de estas
 * pruebas provienen de ese cálculo manual, no de la salida del código, que es lo que permite afirmar
 * que los números tienen sentido y no solo que la función devuelve algo.
 *
 * Cada actividad ejerce a propósito un escenario distinto.
 */

/** Terminada, bajo presupuesto. Verifica la convergencia EAC = AC al 100 % de avance. */
const ARCHITECTURE_DESIGN: EvmInput = {
  budgetAtCompletion: 10_000,
  plannedProgressPercent: 100,
  actualProgressPercent: 100,
  actualCost: 9_000,
};

/** Caso nominal con desviación simultánea en costo y cronograma. */
const BACKEND_DEVELOPMENT: EvmInput = {
  budgetAtCompletion: 20_000,
  plannedProgressPercent: 75,
  actualProgressPercent: 50,
  actualCost: 12_000,
};

/** Sin iniciar: EV = 0 y AC = 0 hacen que el CPI sea indeterminado (0/0), no cero. */
const INTEGRATION_TESTING: EvmInput = {
  budgetAtCompletion: 20_000,
  plannedProgressPercent: 50,
  actualProgressPercent: 0,
  actualCost: 0,
};

const REFERENCE_PROJECT: readonly EvmInput[] = [
  ARCHITECTURE_DESIGN,
  BACKEND_DEVELOPMENT,
  INTEGRATION_TESTING,
];

describe('calculateActivityIndicators', () => {
  describe('actividad terminada y bajo presupuesto', () => {
    const indicators = calculateActivityIndicators(ARCHITECTURE_DESIGN);

    it('deriva las magnitudes monetarias desde el presupuesto', () => {
      expect(indicators.plannedValue).toBe(10_000);
      expect(indicators.earnedValue).toBe(10_000);
      expect(indicators.actualCost).toBe(9_000);
    });

    it('reporta ahorro en costo y cero desviación de cronograma', () => {
      expect(indicators.costVariance).toBe(1_000);
      expect(indicators.scheduleVariance).toBe(0);
    });

    it('calcula CPI por encima de 1 y SPI exactamente en 1', () => {
      expect(indicators.costPerformanceIndex).toBeCloseTo(1.1111, 4);
      expect(indicators.schedulePerformanceIndex).toBe(1);
    });

    it('proyecta un costo final igual al costo ya incurrido', () => {
      expect(indicators.estimateAtCompletion).toBeCloseTo(9_000, 6);
      expect(indicators.varianceAtCompletion).toBeCloseTo(1_000, 6);
    });

    it('interpreta el desempeño como bajo presupuesto y conforme al cronograma', () => {
      expect(indicators.costStatus).toBe(CostStatus.UnderBudget);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.OnSchedule);
      expect(indicators.costStatusReason).toBeNull();
      expect(indicators.scheduleStatusReason).toBeNull();
    });
  });

  describe('actividad atrasada y con sobrecosto', () => {
    const indicators = calculateActivityIndicators(BACKEND_DEVELOPMENT);

    it('deriva las magnitudes monetarias desde el presupuesto', () => {
      expect(indicators.plannedValue).toBe(15_000);
      expect(indicators.earnedValue).toBe(10_000);
    });

    it('reporta desviación negativa en costo y en cronograma', () => {
      expect(indicators.costVariance).toBe(-2_000);
      expect(indicators.scheduleVariance).toBe(-5_000);
    });

    it('calcula ambos índices por debajo de 1', () => {
      expect(indicators.costPerformanceIndex).toBeCloseTo(0.8333, 4);
      expect(indicators.schedulePerformanceIndex).toBeCloseTo(0.6667, 4);
    });

    it('proyecta un sobrecosto de 4.000 al cierre', () => {
      expect(indicators.estimateAtCompletion).toBeCloseTo(24_000, 6);
      expect(indicators.varianceAtCompletion).toBeCloseTo(-4_000, 6);
    });

    it('interpreta el desempeño como sobre presupuesto y atrasado', () => {
      expect(indicators.costStatus).toBe(CostStatus.OverBudget);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.Behind);
    });
  });

  describe('actividad sin iniciar', () => {
    const indicators = calculateActivityIndicators(INTEGRATION_TESTING);

    it('reconoce trabajo planificado pero ningún valor ganado', () => {
      expect(indicators.plannedValue).toBe(10_000);
      expect(indicators.earnedValue).toBe(0);
      expect(indicators.scheduleVariance).toBe(-10_000);
    });

    it('deja el CPI indeterminado en lugar de reportarlo como cero', () => {
      expect(indicators.costPerformanceIndex).toBeNull();
      expect(indicators.costStatus).toBe(CostStatus.NotAvailable);
      expect(indicators.costStatusReason).toBe(UnavailableReason.NotStarted);
    });

    it('calcula el SPI en cero porque sí había trabajo planificado', () => {
      expect(indicators.schedulePerformanceIndex).toBe(0);
      expect(indicators.scheduleStatus).toBe(ScheduleStatus.Behind);
    });

    it('no emite pronóstico sin eficiencia de costo observable', () => {
      expect(indicators.estimateAtCompletion).toBeNull();
      expect(indicators.varianceAtCompletion).toBeNull();
      expect(indicators.forecastReason).toBe(UnavailableReason.NotStarted);
    });
  });
});

describe('casos borde de división indefinida', () => {
  it('distingue "sin costo registrado" de "sin iniciar" cuando AC es cero', () => {
    const withProgress = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 50,
      actualProgressPercent: 50,
      actualCost: 0,
    });

    expect(withProgress.costPerformanceIndex).toBeNull();
    expect(withProgress.costStatusReason).toBe(
      UnavailableReason.NoCostRecorded,
    );
    expect(withProgress.schedulePerformanceIndex).toBe(1);
    expect(withProgress.forecastReason).toBe(UnavailableReason.NoCostRecorded);
  });

  it('deja el SPI indeterminado cuando no hay trabajo planificado a la fecha', () => {
    const aheadOfPlan = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 0,
      actualProgressPercent: 20,
      actualCost: 1_000,
    });

    expect(aheadOfPlan.schedulePerformanceIndex).toBeNull();
    expect(aheadOfPlan.scheduleStatus).toBe(ScheduleStatus.NotAvailable);
    expect(aheadOfPlan.scheduleStatusReason).toBe(
      UnavailableReason.NoPlannedWork,
    );
    expect(aheadOfPlan.costPerformanceIndex).toBe(2);
    expect(aheadOfPlan.estimateAtCompletion).toBe(5_000);
  });

  it('suprime el pronóstico cuando hay costo pero ningún valor ganado', () => {
    const spendingWithoutProgress = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 50,
      actualProgressPercent: 0,
      actualCost: 3_000,
    });

    expect(spendingWithoutProgress.costPerformanceIndex).toBe(0);
    expect(spendingWithoutProgress.costStatus).toBe(CostStatus.OverBudget);
    expect(spendingWithoutProgress.estimateAtCompletion).toBeNull();
    expect(spendingWithoutProgress.varianceAtCompletion).toBeNull();
    expect(spendingWithoutProgress.forecastReason).toBe(
      UnavailableReason.NoEarnedValue,
    );
  });
});

describe('tolerancia de igualdad de los índices', () => {
  it('clasifica como conforme al plan una desviación que se muestra como 1.00', () => {
    const withinTolerance = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 100,
      actualProgressPercent: 99.8,
      actualCost: 10_020,
    });

    expect(withinTolerance.costPerformanceIndex).toBeCloseTo(0.996, 3);
    expect(withinTolerance.schedulePerformanceIndex).toBeCloseTo(0.998, 3);
    expect(withinTolerance.scheduleStatus).toBe(ScheduleStatus.OnSchedule);
  });

  it('clasifica como sobre presupuesto una desviación fuera de la tolerancia', () => {
    const outsideTolerance = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 100,
      actualProgressPercent: 100,
      actualCost: 10_100,
    });

    expect(outsideTolerance.costPerformanceIndex).toBeCloseTo(0.9901, 4);
    expect(outsideTolerance.costStatus).toBe(CostStatus.OverBudget);
  });

  it('clasifica como adelantado un avance por encima del plan', () => {
    const ahead = calculateActivityIndicators({
      budgetAtCompletion: 10_000,
      plannedProgressPercent: 40,
      actualProgressPercent: 60,
      actualCost: 5_000,
    });

    expect(ahead.scheduleStatus).toBe(ScheduleStatus.Ahead);
    expect(ahead.costStatus).toBe(CostStatus.UnderBudget);
  });
});

describe('consolidateProjectIndicators', () => {
  const project = consolidateProjectIndicators(REFERENCE_PROJECT);

  it('suma las magnitudes monetarias de todas las actividades', () => {
    expect(project.budgetAtCompletion).toBe(50_000);
    expect(project.plannedValue).toBe(35_000);
    expect(project.earnedValue).toBe(20_000);
    expect(project.actualCost).toBe(21_000);
  });

  it('reporta las desviaciones consolidadas', () => {
    expect(project.costVariance).toBe(-1_000);
    expect(project.scheduleVariance).toBe(-15_000);
  });

  it('recalcula los índices sobre los totales', () => {
    expect(project.costPerformanceIndex).toBeCloseTo(0.9524, 4);
    expect(project.schedulePerformanceIndex).toBeCloseTo(0.5714, 4);
  });

  it('proyecta 52.500 de costo final y 2.500 de sobrecosto', () => {
    expect(project.estimateAtCompletion).toBeCloseTo(52_500, 6);
    expect(project.varianceAtCompletion).toBeCloseTo(-2_500, 6);
  });

  it('interpreta el proyecto como sobre presupuesto y atrasado', () => {
    expect(project.costStatus).toBe(CostStatus.OverBudget);
    expect(project.scheduleStatus).toBe(ScheduleStatus.Behind);
  });

  it('no se ve impedido por una actividad con el CPI indeterminado', () => {
    expect(
      calculateActivityIndicators(INTEGRATION_TESTING).costPerformanceIndex,
    ).toBeNull();
    expect(project.costPerformanceIndex).not.toBeNull();
  });

  describe('proyecto sin actividades', () => {
    const empty = consolidateProjectIndicators([]);

    it('devuelve todas las magnitudes en cero', () => {
      expect(empty.budgetAtCompletion).toBe(0);
      expect(empty.plannedValue).toBe(0);
      expect(empty.earnedValue).toBe(0);
      expect(empty.actualCost).toBe(0);
      expect(empty.costVariance).toBe(0);
      expect(empty.scheduleVariance).toBe(0);
    });

    it('no inventa índices ni pronóstico', () => {
      expect(empty.costPerformanceIndex).toBeNull();
      expect(empty.schedulePerformanceIndex).toBeNull();
      expect(empty.estimateAtCompletion).toBeNull();
      expect(empty.varianceAtCompletion).toBeNull();
    });

    it('atribuye la ausencia de datos a la falta de actividades y no a un avance nulo', () => {
      expect(empty.costStatusReason).toBe(UnavailableReason.NoActivities);
      expect(empty.scheduleStatusReason).toBe(UnavailableReason.NoActivities);
      expect(empty.forecastReason).toBe(UnavailableReason.NoActivities);
    });
  });
});

describe('consolidación por suma frente a promedio de índices', () => {
  const project = consolidateProjectIndicators(REFERENCE_PROJECT);

  const averageOfDefinedIndices = (
    select: (input: EvmInput) => number | null,
  ): { average: number; discardedCount: number } => {
    const indices = REFERENCE_PROJECT.map(select);
    const defined = indices.filter((index): index is number => index !== null);

    return {
      average: defined.reduce((sum, index) => sum + index, 0) / defined.length,
      discardedCount: indices.length - defined.length,
    };
  };

  it('produce un CPI distinto del promedio de los CPI de las actividades', () => {
    const { average } = averageOfDefinedIndices(
      (input) => calculateActivityIndicators(input).costPerformanceIndex,
    );

    expect(project.costPerformanceIndex).toBeCloseTo(0.9524, 4);
    expect(average).toBeCloseTo(0.9722, 4);
    expect(project.costPerformanceIndex).not.toBeCloseTo(average, 3);
  });

  it('produce un SPI distinto del promedio de los SPI de las actividades', () => {
    const { average } = averageOfDefinedIndices(
      (input) => calculateActivityIndicators(input).schedulePerformanceIndex,
    );

    expect(project.schedulePerformanceIndex).toBeCloseTo(0.5714, 4);
    expect(average).toBeCloseTo(0.5556, 4);
    expect(project.schedulePerformanceIndex).not.toBeCloseTo(average, 3);
  });

  it('demuestra que promediar además obliga a descartar actividades sin índice', () => {
    const { discardedCount } = averageOfDefinedIndices(
      (input) => calculateActivityIndicators(input).costPerformanceIndex,
    );

    expect(discardedCount).toBe(1);
  });
});

describe('precisión del pronóstico', () => {
  it('calcula el EAC desde el CPI sin redondear', () => {
    const project = consolidateProjectIndicators(REFERENCE_PROJECT);
    const roundedIndex = Number(
      (project.earnedValue / project.actualCost).toFixed(4),
    );
    const estimateFromRoundedIndex = project.budgetAtCompletion / roundedIndex;

    expect(project.estimateAtCompletion).toBeCloseTo(52_500, 6);
    expect(estimateFromRoundedIndex).toBeCloseTo(52_498.95, 2);
    expect(project.estimateAtCompletion).not.toBeCloseTo(
      estimateFromRoundedIndex,
      1,
    );
  });
});

describe('invariantes del modelo', () => {
  const CASES_WITH_DEFINED_INDICES: readonly EvmInput[] = [
    ARCHITECTURE_DESIGN,
    BACKEND_DEVELOPMENT,
    {
      budgetAtCompletion: 5_000,
      plannedProgressPercent: 40,
      actualProgressPercent: 60,
      actualCost: 2_500,
    },
    {
      budgetAtCompletion: 8_000,
      plannedProgressPercent: 20,
      actualProgressPercent: 10,
      actualCost: 1_200,
    },
  ];

  it.each(CASES_WITH_DEFINED_INDICES)(
    'el signo de CV concuerda con la posición del CPI respecto a 1 (%#)',
    (input) => {
      const { costVariance, costPerformanceIndex } =
        calculateActivityIndicators(input);

      expect(costPerformanceIndex).not.toBeNull();
      expect(Math.sign(costVariance)).toBe(
        Math.sign((costPerformanceIndex as number) - 1),
      );
    },
  );

  it.each(CASES_WITH_DEFINED_INDICES)(
    'el signo de SV concuerda con la posición del SPI respecto a 1 (%#)',
    (input) => {
      const { scheduleVariance, schedulePerformanceIndex } =
        calculateActivityIndicators(input);

      expect(schedulePerformanceIndex).not.toBeNull();
      expect(Math.sign(scheduleVariance)).toBe(
        Math.sign((schedulePerformanceIndex as number) - 1),
      );
    },
  );

  it.each(CASES_WITH_DEFINED_INDICES)(
    'el VAC comparte signo con el CV, porque ambos se derivan del CPI (%#)',
    (input) => {
      const { costVariance, varianceAtCompletion } =
        calculateActivityIndicators(input);

      expect(varianceAtCompletion).not.toBeNull();
      expect(Math.sign(varianceAtCompletion as number)).toBe(
        Math.sign(costVariance),
      );
    },
  );

  it.each([
    ARCHITECTURE_DESIGN,
    { ...ARCHITECTURE_DESIGN, actualCost: 12_000 },
  ])(
    'al 100 % de avance el EAC converge al costo real (%#)',
    (completedActivity) => {
      const { estimateAtCompletion } =
        calculateActivityIndicators(completedActivity);

      expect(estimateAtCompletion).toBeCloseTo(completedActivity.actualCost, 6);
    },
  );

  it('los totales del proyecto son la suma exacta de los de sus actividades', () => {
    const project = consolidateProjectIndicators(REFERENCE_PROJECT);
    const activities = REFERENCE_PROJECT.map(calculateActivityIndicators);
    const sumOf = (
      select: (activity: (typeof activities)[number]) => number,
    ): number =>
      activities.reduce((total, activity) => total + select(activity), 0);

    expect(project.budgetAtCompletion).toBe(sumOf((a) => a.budgetAtCompletion));
    expect(project.plannedValue).toBe(sumOf((a) => a.plannedValue));
    expect(project.earnedValue).toBe(sumOf((a) => a.earnedValue));
    expect(project.actualCost).toBe(sumOf((a) => a.actualCost));
  });
});
