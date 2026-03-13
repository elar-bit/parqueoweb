-- Monto del último pago de abono (para mostrar en tabla de servicios)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS monto_ultimo_pago_abono NUMERIC(10, 2);

COMMENT ON COLUMN vehiculos.monto_ultimo_pago_abono IS 'Monto pagado en el último pago de mensualidad (abonado). Se usa para mostrar en la tabla de servicios.';
