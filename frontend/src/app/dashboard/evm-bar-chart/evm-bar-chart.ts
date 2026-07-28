import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import { ActivityEvm } from '../../core/evm.models';

/**
 * Comparación de PV, EV y AC por actividad, en barras agrupadas.
 *
 * Se dibuja en SVG a mano en lugar de con una librería de gráficas: son tres series sobre un eje y
 * hacerlo directamente evita una dependencia de varios cientos de kilobytes, además de permitir
 * cumplir al detalle las reglas de marca —separación de 2 px entre barras contiguas, extremo de dato
 * redondeado con base recta, retícula de una hairline— que las librerías imponen a su manera.
 */

/**
 * La relación de aspecto del lienzo es deliberadamente apaisada: al escalarse al ancho de la tarjeta,
 * una proporción más cuadrada haría que en pantallas anchas la gráfica ocupara media página de alto.
 */
const VIEW_WIDTH = 960;
const VIEW_HEIGHT = 280;
const MARGIN_TOP = 12;
const MARGIN_RIGHT = 12;
const MARGIN_BOTTOM = 48;
const MARGIN_LEFT = 76;

const PLOT_WIDTH = VIEW_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const PLOT_HEIGHT = VIEW_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

const GRID_INTERVALS = 4;
/** Separación entre barras contiguas: se resuelve con espacio, nunca con un borde dibujado. */
const BAR_GAP = 2;
const MAX_BAR_WIDTH = 30;
const CORNER_RADIUS = 4;
const GROUP_PADDING_RATIO = 0.3;
const MAX_LABEL_LENGTH = 16;
const CENTER_PERCENT = 50;
/** Margen mínimo del tooltip respecto a los bordes de la gráfica, en porcentaje del ancho. */
const TOOLTIP_EDGE_MARGIN_PERCENT = 14;

interface SeriesDefinition {
  label: string;
  shortLabel: string;
  color: string;
  read: (activity: ActivityEvm) => number;
}

const SERIES: readonly SeriesDefinition[] = [
  {
    label: 'PV — Valor planificado',
    shortLabel: 'PV',
    color: 'var(--series-planned)',
    read: (activity) => activity.indicators.plannedValue,
  },
  {
    label: 'EV — Valor ganado',
    shortLabel: 'EV',
    color: 'var(--series-earned)',
    read: (activity) => activity.indicators.earnedValue,
  },
  {
    label: 'AC — Costo real',
    shortLabel: 'AC',
    color: 'var(--series-actual)',
    read: (activity) => activity.indicators.actualCost,
  },
];

interface ChartBar {
  path: string;
  color: string;
}

interface TooltipEntry {
  label: string;
  color: string;
  value: number;
}

interface ChartGroup {
  name: string;
  truncatedName: string;
  centerX: number;
  hitX: number;
  hitWidth: number;
  bars: ChartBar[];
  entries: TooltipEntry[];
}

interface GridLine {
  y: number;
  value: number;
}

@Component({
  selector: 'app-evm-bar-chart',
  imports: [DecimalPipe],
  templateUrl: './evm-bar-chart.html',
  styleUrl: './evm-bar-chart.scss',
})
export class EvmBarChart {
  readonly activities = input.required<ActivityEvm[]>();

  protected readonly viewBox = `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`;
  protected readonly series = SERIES;
  protected readonly plotTop = MARGIN_TOP;
  protected readonly plotBottom = MARGIN_TOP + PLOT_HEIGHT;
  protected readonly plotLeft = MARGIN_LEFT;
  protected readonly plotRight = MARGIN_LEFT + PLOT_WIDTH;
  protected readonly labelY = MARGIN_TOP + PLOT_HEIGHT + 24;

  protected readonly hoveredIndex = signal<number | null>(null);

  /** Techo del eje redondeado a una cifra legible, para que las marcas de la retícula sean limpias. */
  private readonly scaleMax = computed(() => {
    const values = this.activities().flatMap((activity) =>
      SERIES.map((series) => series.read(activity)),
    );
    const highest = Math.max(...values, 0);

    return highest === 0 ? 1 : niceCeiling(highest);
  });

  protected readonly gridLines = computed<GridLine[]>(() => {
    const scaleMax = this.scaleMax();

    return Array.from({ length: GRID_INTERVALS + 1 }, (_unused, index) => {
      const ratio = index / GRID_INTERVALS;

      return {
        y: MARGIN_TOP + PLOT_HEIGHT - ratio * PLOT_HEIGHT,
        value: ratio * scaleMax,
      };
    });
  });

  protected readonly groups = computed<ChartGroup[]>(() => {
    const activities = this.activities();

    if (activities.length === 0) {
      return [];
    }

    const scaleMax = this.scaleMax();
    const groupWidth = PLOT_WIDTH / activities.length;
    const usableWidth = groupWidth * (1 - GROUP_PADDING_RATIO);
    const barWidth = Math.min(
      MAX_BAR_WIDTH,
      (usableWidth - BAR_GAP * (SERIES.length - 1)) / SERIES.length,
    );
    const clusterWidth =
      barWidth * SERIES.length + BAR_GAP * (SERIES.length - 1);

    return activities.map((activity, index) => {
      const groupStart = MARGIN_LEFT + groupWidth * index;
      const clusterStart = groupStart + (groupWidth - clusterWidth) / 2;

      return {
        name: activity.name,
        truncatedName: truncate(activity.name),
        centerX: groupStart + groupWidth / 2,
        hitX: groupStart,
        hitWidth: groupWidth,
        bars: SERIES.map((series, seriesIndex) => {
          const height = (series.read(activity) / scaleMax) * PLOT_HEIGHT;

          return {
            path: buildBarPath(
              clusterStart + seriesIndex * (barWidth + BAR_GAP),
              MARGIN_TOP + PLOT_HEIGHT - height,
              barWidth,
              height,
            ),
            color: series.color,
          };
        }),
        entries: SERIES.map((series) => ({
          label: series.shortLabel,
          color: series.color,
          value: series.read(activity),
        })),
      };
    });
  });

  protected readonly hoveredGroup = computed<ChartGroup | null>(() => {
    const index = this.hoveredIndex();

    return index === null ? null : (this.groups()[index] ?? null);
  });

  /**
   * Posición horizontal del tooltip en porcentaje, para que siga a la gráfica al escalarse. Se
   * mantiene apartada de los bordes: centrado sobre el primer o el último grupo, el globo se saldría
   * de la tarjeta y arrastraría el desplazamiento horizontal de la página.
   */
  protected readonly tooltipLeftPercent = computed(() => {
    const group = this.hoveredGroup();

    if (group === null) {
      return CENTER_PERCENT;
    }

    const raw = (group.centerX / VIEW_WIDTH) * 100;

    return Math.min(
      Math.max(raw, TOOLTIP_EDGE_MARGIN_PERCENT),
      100 - TOOLTIP_EDGE_MARGIN_PERCENT,
    );
  });

  protected show(index: number): void {
    this.hoveredIndex.set(index);
  }

  protected hide(): void {
    this.hoveredIndex.set(null);
  }
}

/** Redondea hacia arriba a un múltiplo legible (5.000, 10.000, 50.000…). */
function niceCeiling(value: number): number {
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = magnitude / 2;

  return Math.ceil(value / step) * step;
}

/**
 * Extremo de dato redondeado y base recta: la barra queda anclada visualmente a la línea cero.
 * Un valor de cero no dibuja barra; su cifra exacta se lee en la tabla y en el tooltip.
 */
function buildBarPath(
  x: number,
  y: number,
  width: number,
  height: number,
): string {
  if (height <= 0) {
    return '';
  }

  const radius = Math.min(CORNER_RADIUS, width / 2, height);
  const bottom = y + height;

  return [
    `M ${x} ${bottom}`,
    `L ${x} ${y + radius}`,
    `Q ${x} ${y} ${x + radius} ${y}`,
    `L ${x + width - radius} ${y}`,
    `Q ${x + width} ${y} ${x + width} ${y + radius}`,
    `L ${x + width} ${bottom}`,
    'Z',
  ].join(' ');
}

function truncate(name: string): string {
  return name.length > MAX_LABEL_LENGTH
    ? `${name.slice(0, MAX_LABEL_LENGTH - 1)}…`
    : name;
}
