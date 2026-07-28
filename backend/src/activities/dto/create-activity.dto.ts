import { ApiProperty } from '@nestjs/swagger';
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
  @ApiProperty({
    maxLength: NAME_MAX_LENGTH,
    example: 'Desarrollo del backend',
    description: 'Nombre de la actividad.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(NAME_MAX_LENGTH)
  name: string;

  @ApiProperty({
    minimum: MIN_BUDGET_AT_COMPLETION,
    example: 20000,
    description:
      'BAC — presupuesto total planificado. Es el valor con el que se valoriza el avance, nunca el costo real.',
  })
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_BUDGET_AT_COMPLETION)
  budgetAtCompletion: number;

  @ApiProperty({
    minimum: MIN_PROGRESS_PERCENT,
    maximum: MAX_PROGRESS_PERCENT,
    example: 75,
    description: 'Porcentaje de avance planificado a la fecha de corte.',
  })
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_PROGRESS_PERCENT)
  @Max(MAX_PROGRESS_PERCENT)
  plannedProgressPercent: number;

  @ApiProperty({
    minimum: MIN_PROGRESS_PERCENT,
    maximum: MAX_PROGRESS_PERCENT,
    example: 50,
    description: 'Porcentaje de avance real completado.',
  })
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_PROGRESS_PERCENT)
  @Max(MAX_PROGRESS_PERCENT)
  actualProgressPercent: number;

  @ApiProperty({
    minimum: MIN_ACTUAL_COST,
    example: 12000,
    description:
      'AC — costo real incurrido hasta la fecha. Puede ser cero si la actividad no ha consumido presupuesto.',
  })
  @IsNumber({ maxDecimalPlaces: MONETARY_SCALE })
  @Min(MIN_ACTUAL_COST)
  actualCost: number;
}
