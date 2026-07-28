import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { EvmIndicators } from '../../core/evm.models';
import { StatusBadge } from '../status-badge/status-badge';

/**
 * Indicadores consolidados del proyecto.
 *
 * Los dos índices se muestran como tarjetas destacadas porque son la lectura de un vistazo; el resto
 * de magnitudes acompaña en una rejilla secundaria. Un valor indeterminado se escribe «N/D», nunca
 * como cero.
 */
@Component({
  selector: 'app-summary-cards',
  imports: [DecimalPipe, StatusBadge],
  templateUrl: './summary-cards.html',
  styleUrl: './summary-cards.scss',
})
export class SummaryCards {
  readonly summary = input.required<EvmIndicators>();
}
