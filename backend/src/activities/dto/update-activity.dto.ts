import { PartialType } from '@nestjs/swagger';
import { CreateActivityDto } from './create-activity.dto';

/**
 * Edición parcial: registrar avance suele significar enviar únicamente el porcentaje real y el costo
 * incurrido, sin repetir el presupuesto ni el nombre.
 */
export class UpdateActivityDto extends PartialType(CreateActivityDto) {}
