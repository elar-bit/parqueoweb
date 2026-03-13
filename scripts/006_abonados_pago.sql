-- Referencia de pago y captura para abonados
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS ref_pago_abono TEXT,
  ADD COLUMN IF NOT EXISTS captura_pago_abono TEXT;

COMMENT ON COLUMN vehiculos.ref_pago_abono IS 'Nº operación Yape o transferencia del último pago de mensualidad (abonado).';
COMMENT ON COLUMN vehiculos.captura_pago_abono IS 'Captura del pago en base64 (data URL) para abonados.';
