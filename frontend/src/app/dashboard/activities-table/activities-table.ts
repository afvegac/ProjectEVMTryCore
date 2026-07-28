import { DecimalPipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ActivityEvm } from '../../core/evm.models';
import { StatusBadge } from '../status-badge/status-badge';

/**
 * Tabla de actividades con sus indicadores.
 *
 * Es además la vista accesible de la gráfica: todo valor dibujado aparece aquí en cifra exacta, de
 * modo que ningún dato dependa de distinguir un color.
 */
@Component({
  selector: 'app-activities-table',
  imports: [DecimalPipe, StatusBadge],
  templateUrl: './activities-table.html',
  styleUrl: './activities-table.scss',
})
export class ActivitiesTable {
  readonly activities = input.required<ActivityEvm[]>();

  readonly edit = output<string>();
  readonly remove = output<string>();
}
