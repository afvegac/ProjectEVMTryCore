import { booleanAttribute, Component, computed, input } from '@angular/core';
import {
  COST_STATUS_PRESENTATION,
  SCHEDULE_STATUS_PRESENTATION,
  StatusPresentation,
  UNAVAILABLE_REASON_LABEL,
} from '../../core/evm-status.presentation';
import { CostStatus, ScheduleStatus, UnavailableReason } from '../../core/evm.models';

/**
 * Semáforo de un indicador.
 *
 * Muestra siempre símbolo y texto además del color: un estado que se comunica solo por color es
 * ilegible para quien no distingue rojo de verde, y además se pierde al imprimir.
 */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  host: { '[class.is-compact]': 'compact()' },
})
export class StatusBadge {
  readonly kind = input.required<'cost' | 'schedule'>();
  readonly status = input.required<CostStatus | ScheduleStatus>();
  readonly reason = input<UnavailableReason | null>(null);

  /**
   * En modo compacto el motivo no se imprime bajo la insignia y queda solo como tooltip. Dentro de
   * una celda de tabla, ese texto convertiría cada fila en un bloque de varias líneas.
   */
  readonly compact = input(false, { transform: booleanAttribute });

  protected readonly presentation = computed<StatusPresentation>(() =>
    this.kind() === 'cost'
      ? COST_STATUS_PRESENTATION[this.status() as CostStatus]
      : SCHEDULE_STATUS_PRESENTATION[this.status() as ScheduleStatus],
  );

  protected readonly reasonLabel = computed<string | null>(() => {
    const reason = this.reason();

    return reason === null ? null : UNAVAILABLE_REASON_LABEL[reason];
  });

  protected readonly inlineReason = computed<string | null>(() =>
    this.compact() ? null : this.reasonLabel(),
  );
}
