import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';
import { setupSwagger } from './config/swagger.config';

const DEFAULT_PORT = 3000;

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  configureApp(app);
  setupSwagger(app);

  await app.listen(process.env.PORT ?? DEFAULT_PORT);
}

void bootstrap();
