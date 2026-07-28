import { ApiProperty } from '@nestjs/swagger';

/**
 * Forma única de los errores de la API, para cualquier código de estado. Se declara como clase, y no
 * solo como interfaz, para que quede publicada en el contrato OpenAPI: un consumidor necesita saber
 * qué recibirá cuando algo falle, no solo cuando todo va bien.
 */
export class ErrorResponse {
  @ApiProperty({ example: 400, description: 'Código de estado HTTP.' })
  statusCode: number;

  @ApiProperty({
    example: 'BadRequestException',
    description: 'Tipo de excepción que originó la respuesta.',
  })
  error: string;

  @ApiProperty({
    type: [String],
    example: ['budgetAtCompletion must not be less than 0.01'],
    description:
      'Siempre un arreglo, aunque el error sea uno solo, para que el cliente no tenga que distinguir casos.',
  })
  message: string[];

  @ApiProperty({
    example: '/api/projects',
    description: 'Ruta solicitada.',
  })
  path: string;

  @ApiProperty({
    example: '2026-07-28T04:23:05.483Z',
    description: 'Momento en que se produjo el error, en ISO 8601.',
  })
  timestamp: string;
}
