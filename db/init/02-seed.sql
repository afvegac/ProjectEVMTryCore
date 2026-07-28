-- =============================================================================
-- Datos de ejemplo: el caso de referencia del proyecto.
--
-- Estas tres actividades son las mismas que se calcularon a mano antes de
-- implementar el motor y las que usan las pruebas unitarias como valores
-- esperados. Sirven para la demostración del sistema y permiten contrastar la
-- salida del API contra números verificados de antemano.
--
--   Actividad                 BAC      %plan  %real   AC        Escenario
--   Diseño de arquitectura    10.000     100    100    9.000    terminada, bajo presupuesto
--   Desarrollo del backend    20.000      75     50   12.000    atrasada y con sobrecosto
--   Pruebas de integración    20.000      50      0        0    sin iniciar (CPI indeterminado)
--
--   Consolidado esperado del proyecto:
--     PV = 35.000   EV = 20.000   AC = 21.000   BAC = 50.000
--     CV = −1.000   SV = −15.000
--     CPI = 0,9524  SPI = 0,5714
--     EAC = 52.500  VAC = −2.500
-- =============================================================================

-- Identificador fijo para que la documentación y la demostración puedan
-- referenciar el proyecto sin consultarlo primero.
INSERT INTO projects (id, name, description)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Plataforma de Gestión Documental',
    'Proyecto de ejemplo con desviación en costo y en cronograma, usado para verificar los indicadores.'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO activities (
    project_id,
    name,
    budget_at_completion,
    planned_progress_percent,
    actual_progress_percent,
    actual_cost
)
VALUES
    ('11111111-1111-4111-8111-111111111111', 'Diseño de arquitectura', 10000.00, 100.00, 100.00,  9000.00),
    ('11111111-1111-4111-8111-111111111111', 'Desarrollo del backend', 20000.00,  75.00,  50.00, 12000.00),
    ('11111111-1111-4111-8111-111111111111', 'Pruebas de integración', 20000.00,  50.00,   0.00,     0.00);
