import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Activity } from '../activities/activity.entity';
import { Project } from '../projects/project.entity';

const DEFAULT_DATABASE_HOST = 'localhost';
/** Coincide con el puerto que publica docker-compose.yml, elegido para no chocar con un PostgreSQL local. */
const DEFAULT_DATABASE_PORT = '5433';
const DEFAULT_DATABASE_USER = 'evm';
const DEFAULT_DATABASE_PASSWORD = 'evm';
const DEFAULT_DATABASE_NAME = 'evm';

/**
 * Construye la configuración de la conexión a PostgreSQL a partir del entorno.
 *
 * `synchronize` queda deliberadamente en false: el esquema lo define db/init/01-schema.sql y el ORM
 * nunca lo modifica. Dejar que TypeORM altere las tablas por su cuenta convertiría el script de
 * inicialización en documentación desactualizada y podría destruir datos en un despliegue.
 */
export function buildDatabaseOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DATABASE_HOST', DEFAULT_DATABASE_HOST),
    port: Number(config.get<string>('DATABASE_PORT', DEFAULT_DATABASE_PORT)),
    username: config.get<string>('DATABASE_USER', DEFAULT_DATABASE_USER),
    password: config.get<string>(
      'DATABASE_PASSWORD',
      DEFAULT_DATABASE_PASSWORD,
    ),
    database: config.get<string>('DATABASE_NAME', DEFAULT_DATABASE_NAME),
    entities: [Project, Activity],
    synchronize: false,
  };
}
