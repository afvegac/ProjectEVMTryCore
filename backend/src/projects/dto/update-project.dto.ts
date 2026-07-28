import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

/**
 * Todos los campos son opcionales porque la edición es un PATCH: solo se modifica lo que se envía.
 * Se deriva de CreateProjectDto para que las reglas de validación no se dupliquen ni se desincronicen.
 *
 * El `PartialType` proviene de `@nestjs/swagger` y no de `@nestjs/mapped-types` porque el primero
 * arrastra además los metadatos de documentación; con el segundo, el contrato publicado quedaría vacío.
 */
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
