import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/** Forma única de los errores que devuelve la API, para cualquier código de estado. */
export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string[];
  path: string;
  timestamp: string;
}

const UNEXPECTED_ERROR_MESSAGE = 'Error interno del servidor';

/**
 * Traduce cualquier excepción a un cuerpo de error uniforme.
 *
 * Captura todas las excepciones y no solo las de tipo HttpException: si un fallo inesperado escapara
 * del filtro, el cliente recibiría una respuesta con una forma distinta a la documentada en OpenAPI.
 * Los errores no previstos se registran completos en el log y se devuelven como 500 sin detalles
 * internos, para no exponer trazas al consumidor de la API.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const request = context.getRequest<Request>();
    const response = context.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!isHttpException) {
      this.logger.error('Excepción no controlada', exception);
    }

    const body: ErrorResponseBody = {
      statusCode,
      error: isHttpException ? exception.name : 'InternalServerErrorException',
      message: isHttpException
        ? extractMessages(exception)
        : [UNEXPECTED_ERROR_MESSAGE],
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}

/**
 * Normaliza el mensaje a un arreglo. El ValidationPipe devuelve una lista de errores y el resto de
 * excepciones una sola cadena; unificarlo evita que el cliente tenga que distinguir ambos casos.
 */
function extractMessages(exception: HttpException): string[] {
  const payload = exception.getResponse();

  if (typeof payload === 'string') {
    return [payload];
  }

  const message = (payload as { message?: string | string[] }).message;

  if (Array.isArray(message)) {
    return message;
  }

  return [message ?? exception.message];
}
