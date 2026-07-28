import { applyDecorators } from '@nestjs/common';
import { ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ErrorResponse } from '../dto/error.response';

/**
 * Las mismas respuestas de error se repiten en casi todos los endpoints. Declararlas aquí evita
 * copiar el mismo bloque de decoradores una docena de veces y garantiza que la documentación no se
 * desincronice entre operaciones.
 */

const VALIDATION_DESCRIPTION =
  'El cuerpo no supera la validación: falta un campo obligatorio, un valor está fuera de rango o se envió una propiedad no declarada.';

const IDENTIFIER_DESCRIPTION =
  'El identificador de la ruta no es un UUID válido, o el cuerpo no supera la validación.';

/** Para operaciones que solo reciben cuerpo, sin identificador en la ruta. */
export function ApiValidationErrors(): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse({
      description: VALIDATION_DESCRIPTION,
      type: ErrorResponse,
    }),
  );
}

/** Para operaciones que localizan un recurso por identificador. */
export function ApiIdentifiedResourceErrors(
  notFoundDescription: string,
): MethodDecorator {
  return applyDecorators(
    ApiBadRequestResponse({
      description: IDENTIFIER_DESCRIPTION,
      type: ErrorResponse,
    }),
    ApiNotFoundResponse({
      description: notFoundDescription,
      type: ErrorResponse,
    }),
  );
}
