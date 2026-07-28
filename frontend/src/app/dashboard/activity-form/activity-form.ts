import { Component, effect, inject, input, output } from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  MAX_PROGRESS_PERCENT,
  MIN_ACTUAL_COST,
  MIN_BUDGET_AT_COMPLETION,
  MIN_PROGRESS_PERCENT,
  NAME_MAX_LENGTH,
} from '../../core/validation.constants';
import { Activity, ActivityInput } from '../../core/evm.models';

const EMPTY_ACTIVITY: ActivityInput = {
  name: '',
  budgetAtCompletion: 0,
  plannedProgressPercent: 0,
  actualProgressPercent: 0,
  actualCost: 0,
};

/** Alta y edición de una actividad, con los cinco campos de entrada del modelo. */
@Component({
  selector: 'app-activity-form',
  imports: [ReactiveFormsModule],
  templateUrl: './activity-form.html',
  styleUrl: './activity-form.scss',
})
export class ActivityForm {
  readonly activity = input<Activity | null>(null);
  readonly saving = input(false);

  readonly save = output<ActivityInput>();
  readonly cancelEdit = output<void>();

  protected readonly maxProgressPercent = MAX_PROGRESS_PERCENT;
  protected readonly minProgressPercent = MIN_PROGRESS_PERCENT;

  private readonly formBuilder = inject(NonNullableFormBuilder);

  protected readonly form = this.formBuilder.group({
    name: [
      EMPTY_ACTIVITY.name,
      [Validators.required, Validators.maxLength(NAME_MAX_LENGTH)],
    ],
    budgetAtCompletion: [
      EMPTY_ACTIVITY.budgetAtCompletion,
      [Validators.required, Validators.min(MIN_BUDGET_AT_COMPLETION)],
    ],
    plannedProgressPercent: [
      EMPTY_ACTIVITY.plannedProgressPercent,
      [
        Validators.required,
        Validators.min(MIN_PROGRESS_PERCENT),
        Validators.max(MAX_PROGRESS_PERCENT),
      ],
    ],
    actualProgressPercent: [
      EMPTY_ACTIVITY.actualProgressPercent,
      [
        Validators.required,
        Validators.min(MIN_PROGRESS_PERCENT),
        Validators.max(MAX_PROGRESS_PERCENT),
      ],
    ],
    actualCost: [
      EMPTY_ACTIVITY.actualCost,
      [Validators.required, Validators.min(MIN_ACTUAL_COST)],
    ],
  });

  constructor() {
    // Al elegir otra actividad para editar, el formulario debe reflejarla sin arrastrar lo anterior.
    effect(() => {
      const activity = this.activity();

      this.form.reset(
        activity === null
          ? EMPTY_ACTIVITY
          : {
              name: activity.name,
              budgetAtCompletion: activity.budgetAtCompletion,
              plannedProgressPercent: activity.plannedProgressPercent,
              actualProgressPercent: activity.actualProgressPercent,
              actualCost: activity.actualCost,
            },
      );
    });
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      return;
    }

    this.save.emit(this.form.getRawValue());
  }
}
