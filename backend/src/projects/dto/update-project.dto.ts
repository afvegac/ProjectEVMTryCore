import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

/**
 * Todos los campos son opcionales porque la edición es un PATCH: solo se modifica lo que se envía.
 * Se deriva de CreateProjectDto para que las reglas de validación no se dupliquen ni se desincronicen.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
