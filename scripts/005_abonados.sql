-- Tipo abonado y vigencia de mensualidad
ALTER TABLE vehiculos
  DROP CONSTRAINT IF EXISTS vehiculos_tipo_check;

ALTER TABLE vehiculos
  ADD CONSTRAINT vehiculos_tipo_check
  CHECK (tipo IN ('visitante', 'residente', 'abonado'));

ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS vigencia_abono_hasta DATE;

COMMENT ON COLUMN vehiculos.vigencia_abono_hasta IS 'Para tipo abonado: último día con mensualidad vigente (inclusive).';
