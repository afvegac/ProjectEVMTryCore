import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { Activity } from './../src/activities/activity.entity';
import { AppModule } from './../src/app.module';

/** Suma de los BAC del proyecto de referencia que siembra db/init/02-seed.sql. */
const SEEDED_TOTAL_BUDGET = 50_000;

/**
 * Requiere la base de datos en marcha: `docker compose up -d` desde la raíz del repositorio.
 */
describe('AppModule (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app?.close();
  });

  it('resuelve el grafo de dependencias y establece la conexión con PostgreSQL', () => {
    expect(dataSource.isInitialized).toBe(true);
  });

  /**
   * El driver `pg` devuelve las columnas NUMERIC como cadena. Si `numericTransformer` dejara de
   * aplicarse, este `+` concatenaría en lugar de sumar y el total sería la cadena
   * "010000.0020000.0020000.00" en vez de 50000, sin que se lanzara ningún error. Por eso la
   * comprobación se hace sobre una suma y no sobre el tipo de un campo suelto.
   */
  it('suma los presupuestos como números en lugar de concatenar cadenas', async () => {
    const activities = await dataSource.getRepository(Activity).find();

    const totalBudget = activities.reduce(
      (total, activity) => total + activity.budgetAtCompletion,
      0,
    );

    expect(totalBudget).toBe(SEEDED_TOTAL_BUDGET);
  });
});
