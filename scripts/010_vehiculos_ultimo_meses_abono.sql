-- Número de meses del último pago de abono (para mostrar "Abonado (N meses)" en la tabla)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS ultimo_numero_meses_abono SMALLINT;

COMMENT ON COLUMN vehiculos.ultimo_numero_meses_abono IS 'Cantidad de meses del último pago de mensualidad (1-6). Se muestra en la tabla de servicios.';
