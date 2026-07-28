import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './../src/app.module';
import { configureApp } from './../src/app.setup';

/**
 * Levanta la aplicación completa aplicando la misma configuración transversal que `main.ts`
 * (prefijo, validación y filtro de errores), de modo que las pruebas verifiquen el contrato real
 * y no una versión sin pipes.
 *
 * Requiere la base de datos en marcha: `docker compose up -d` desde la raíz del repositorio.
 */
export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = configureApp(moduleFixture.createNestApplication());
  await app.init();

  return app;
}
