import { ApiProperty } from '@nestjs/swagger';
import {
  roundMonetary,
  roundOptionalIndex,
  roundOptionalMonetary,
} from '../../common/rounding';
import { EvmIndicators } from '../domain/evm-indicators.model';
import {
  CostStatus,
  ScheduleStatus,
  UnavailableReason,
} from '../domain/evm-status.enum';

const NULLABLE_INDEX = {
  type: Number,
  nullable: true,
  description:
    'Nulo cuando el indicador es indeterminado; el motivo se informa aparte. Nunca se devuelve cero en su lugar.',
};

/**
 * Indicadores de Valor Ganado tal y como los publica la API.
 *
 * Aquí es donde ocurre el único redondeo del sistema: el dominio calcula con precisión completa y
 * esta capa presenta importes con dos decimales e índices con cuatro.
 */
export class EvmIndicatorsResponse {
  @ApiProperty({
    example: 50000,
    description: 'BAC — presupuesto total planificado.',
  })
  budgetAtCompletion: number;

  @ApiProperty({
    example: 35000,
    description:
      'PV — valor planificado a la fecha de corte: % planificado × BAC.',
  })
  plannedValue: number;

  @ApiProperty({
    example: 20000,
    description:
      'EV — valor ganado: % real × BAC. Se valoriza con el presupuesto, nunca con el costo.',
  })
  earnedValue: number;

  @ApiProperty({ example: 21000, description: 'AC — costo real incurrido.' })
  actualCost: number;

  @ApiProperty({
    example: -1000,
    description: 'CV = EV − AC. Negativo indica sobrecosto.',
  })
  costVariance: number;

  @ApiProperty({
    example: -15000,
    description: 'SV = EV − PV. Negativo indica atraso.',
  })
  scheduleVariance: number;

  @ApiProperty({
    ...NULLABLE_INDEX,
    example: 0.9524,
    description: 'CPI = EV / AC.',
  })
  costPerformanceIndex: number | null;

  @ApiProperty({
    ...NULLABLE_INDEX,
    example: 0.5714,
    description: 'SPI = EV / PV.',
  })
  schedulePerformanceIndex: number | null;

  @ApiProperty({
    ...NULLABLE_INDEX,
    example: 52500,
    description: 'EAC = BAC / CPI. Se deriva del CPI sin redondear.',
  })
  estimateAtCompletion: number | null;

  @ApiProperty({
    ...NULLABLE_INDEX,
    example: -2500,
    description: 'VAC = BAC − EAC.',
  })
  varianceAtCompletion: number | null;

  @ApiProperty({
    enum: CostStatus,
    description:
      'Interpretación del CPI: mayor que 1 es eficiencia en costo, menor que 1 es sobrecosto.',
  })
  costStatus: CostStatus;

  @ApiProperty({
    enum: UnavailableReason,
    nullable: true,
    description: 'Motivo por el que el CPI no se pudo calcular.',
  })
  costStatusReason: UnavailableReason | null;

  @ApiProperty({
    enum: ScheduleStatus,
    description:
      'Interpretación del SPI, con la misma lógica sobre el cronograma.',
  })
  scheduleStatus: ScheduleStatus;

  @ApiProperty({
    enum: UnavailableReason,
    nullable: true,
    description: 'Motivo por el que el SPI no se pudo calcular.',
  })
  scheduleStatusReason: UnavailableReason | null;

  @ApiProperty({
    enum: UnavailableReason,
    nullable: true,
    description:
      'Motivo por el que no hay pronóstico. Aplica tanto al EAC como al VAC.',
  })
  forecastReason: UnavailableReason | null;

  static fromIndicators(indicators: EvmIndicators): EvmIndicatorsResponse {
    return {
      budgetAtCompletion: roundMonetary(indicators.budgetAtCompletion),
      plannedValue: roundMonetary(indicators.plannedValue),
      earnedValue: roundMonetary(indicators.earnedValue),
      actualCost: roundMonetary(indicators.actualCost),
      costVariance: roundMonetary(indicators.costVariance),
      scheduleVariance: roundMonetary(indicators.scheduleVariance),
      costPerformanceIndex: roundOptionalIndex(indicators.costPerformanceIndex),
      schedulePerformanceIndex: roundOptionalIndex(
        indicators.schedulePerformanceIndex,
      ),
      estimateAtCompletion: roundOptionalMonetary(
        indicators.estimateAtCompletion,
      ),
      varianceAtCompletion: roundOptionalMonetary(
        indicators.varianceAtCompletion,
      ),
      costStatus: indicators.costStatus,
      costStatusReason: indicators.costStatusReason,
      scheduleStatus: indicators.scheduleStatus,
      scheduleStatusReason: indicators.scheduleStatusReason,
      forecastReason: indicators.forecastReason,
    };
  }
}
