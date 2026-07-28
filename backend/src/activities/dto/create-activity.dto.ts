import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MONETARY_SCALE, NAME_MAX_LENGTH } from '../../common/column.constants';
import {
  MAX_PROGRESS_PERCENT,
  MIN_ACTUAL_COST,
  MIN_BUDGET_AT_COMPLETION,
  MIN_PROGRESS_PERCENT,
} from '../../common/validation.constants';

/**
 * Los cinco campos de entrada del modelo EVM. Las reglas replican las restricciones CHECK del
 * esquema, de modo que un dato inválido se rechaza con un 400 explicativo antes de llegar a la base
 * en lugar de provocar un error de integridad.
 */
export class CreateActivityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  /** BAC — presupuesto total planificado. */
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_BUDGET_AT_COMPLETION)
  budgetAtCompletion: number;

  /** Porcentaje de avance planificado a la fecha de corte. */
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_PROGRESS_PERCENT)
  @Max(MAX_PROGRESS_PERCENT)
  plannedProgressPercent: number;

  /** Porcentaje de avance real completado. */
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_PROGRESS_PERCENT)
  @Max(MAX_PROGRESS_PERCENT)
  actualProgressPercent: number;

  /** AC — costo real incurrido hasta la fecha. */
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_ACTUAL_COST)
  actualCost: number;
}
