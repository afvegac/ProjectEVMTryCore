-- =============================================================================
-- Esquema de la herramienta de gestión de proyectos con Valor Ganado (EVM).
--
-- Este script es la fuente de verdad del esquema. TypeORM se ejecuta con
-- synchronize = false y mapea contra estas tablas, en lugar de generarlas: un
-- esquema producido automáticamente por el ORM no es un artefacto legible.
--
-- Docker lo ejecuta solo, en orden alfabético, al crear el contenedor.
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(150) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE projects IS 'Proyecto sobre el que se mide el desempeño con la técnica de Valor Ganado.';

-- Las cuatro magnitudes numéricas usan NUMERIC y no punto flotante: el dinero
-- nunca debe representarse en binario. Las restricciones CHECK replican en la
-- base de datos las mismas reglas que valida la API, de modo que el dato queda
-- protegido aunque se inserte por fuera de la aplicación.
CREATE TABLE IF NOT EXISTS activities (
    id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id               UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    name                     VARCHAR(150) NOT NULL,
    budget_at_completion     NUMERIC(14, 2) NOT NULL,
    planned_progress_percent NUMERIC(5, 2)  NOT NULL,
    actual_progress_percent  NUMERIC(5, 2)  NOT NULL,
    actual_cost              NUMERIC(14, 2) NOT NULL,
    created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT activities_budget_is_positive
        CHECK (budget_at_completion > 0),
    CONSTRAINT activities_planned_progress_in_range
        CHECK (planned_progress_percent BETWEEN 0 AND 100),
    CONSTRAINT activities_actual_progress_in_range
        CHECK (actual_progress_percent BETWEEN 0 AND 100),
    CONSTRAINT activities_actual_cost_is_not_negative
        CHECK (actual_cost >= 0)
);

COMMENT ON TABLE activities IS 'Actividad de un proyecto con los cinco campos de entrada del modelo EVM.';
COMMENT ON COLUMN activities.budget_at_completion IS 'BAC — presupuesto total planificado.';
COMMENT ON COLUMN activities.planned_progress_percent IS 'Porcentaje de avance planificado a la fecha de corte, de 0 a 100.';
COMMENT ON COLUMN activities.actual_progress_percent IS 'Porcentaje de avance real completado, de 0 a 100.';
COMMENT ON COLUMN activities.actual_cost IS 'AC — costo real incurrido hasta la fecha.';

-- El dashboard consulta siempre las actividades de un proyecto concreto.
CREATE INDEX IF NOT EXISTS activities_project_id_idx ON activities (project_id);
