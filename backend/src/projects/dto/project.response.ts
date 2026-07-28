import { ApiProperty } from '@nestjs/swagger';
import { Project } from '../project.entity';

/**
 * Representación de un proyecto en la API. Se define aparte de la entidad para que el contrato
 * público no quede acoplado al esquema de la base de datos y para poder cambiar uno sin romper el otro.
 */
export class ProjectResponse {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  id: string;

  @ApiProperty({ example: 'Plataforma de Gestión Documental' })
  name: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Proyecto con desviación en costo y en cronograma.',
  })
  description: string | null;

  @ApiProperty({ format: 'date-time', example: '2026-07-28T04:11:20.357Z' })
  createdAt: string;

  @ApiProperty({ format: 'date-time', example: '2026-07-28T04:11:20.357Z' })
  updatedAt: string;

  static fromEntity(project: Project): ProjectResponse {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }
}
