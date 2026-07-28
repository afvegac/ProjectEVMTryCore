import { Project } from '../project.entity';

/**
 * Representación de un proyecto en la API. Se define aparte de la entidad para que el contrato
 * público no quede acoplado al esquema de la base de datos y para poder cambiar uno sin romper el otro.
 */
export class ProjectResponse {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
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
