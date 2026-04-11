-- Días de prueba freemium por cuenta (por defecto 5; el superadmin puede ampliarlos).
ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS dias_prueba_freemium INTEGER NOT NULL DEFAULT 5
  CHECK (dias_prueba_freemium >= 1 AND dias_prueba_freemium <= 3650);

COMMENT ON COLUMN cuentas.dias_prueba_freemium IS 'Duración de la prueba freemium en días calendario desde fecha_creacion; editable solo por superadmin.';
