import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Ruta local de la documentación interactiva. */
export const SWAGGER_PATH = 'api-docs';

const DESCRIPTION = `
Herramienta de gestión de proyectos con cálculo automático de indicadores de **Valor Ganado (EVM)**.

Registra actividades con su presupuesto, su avance planificado y su avance real, y devuelve los ocho
indicadores del método tanto por actividad como consolidados por proyecto.

**Sobre los indicadores indeterminados.** Un índice que no se puede calcular se devuelve como \`null\`
acompañado de un código de razón, nunca como \`0\`. Con costo real en cero y valor ganado positivo la
eficiencia no es nula sino indeterminada, y comunicar \`0\` diría lo contrario de lo que ocurre.

**Sobre la consolidación.** Los totales del proyecto se obtienen sumando las magnitudes monetarias de sus
actividades y recalculando los índices sobre esos totales. Promediar los índices individuales produce un
número distinto e incorrecto.
`.trim();

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('API de Valor Ganado (EVM)')
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addTag('Proyectos', 'Alta, consulta, edición y baja de proyectos')
    .addTag(
      'Actividades',
      'Actividades de un proyecto y sus cinco campos de entrada',
    )
    .addTag(
      'Análisis EVM',
      'Indicadores calculados por actividad y consolidados',
    )
    .build();

  SwaggerModule.setup(SWAGGER_PATH, app, () =>
    SwaggerModule.createDocument(app, config),
  );
}
