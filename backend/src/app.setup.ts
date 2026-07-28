import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

/** Prefijo común de todos los recursos de la API. */
export const API_PREFIX = 'api';

/**
 * Aplica la configuración transversal de la aplicación.
 *
 * Vive en su propia función, y no dentro de `main.ts`, para que las pruebas de integración levanten
 * exactamente la misma aplicación que se ejecuta en producción. Si la validación o el filtro de
 * errores se configuraran solo en el arranque, las pruebas verificarían un contrato distinto del que
 * ve el cliente real, que es una forma habitual de que los errores de validación pasen inadvertidos.
 */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix(API_PREFIX);

  app.useGlobalPipes(
    new ValidationPipe({
      // Descarta propiedades no declaradas en el DTO y rechaza la petición si las incluye, en lugar
      // de ignorarlas en silencio: un campo mal escrito debe fallar, no perderse.
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors();

  return app;
}
