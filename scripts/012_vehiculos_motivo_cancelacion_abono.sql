-- Motivo de cancelación de la suscripción (se pide al cancelar y se muestra en tarjeta y reportes)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS motivo_cancelacion_abono TEXT;

COMMENT ON COLUMN vehiculos.motivo_cancelacion_abono IS 'Motivo por el que se canceló la suscripción del abonado (ej. no desea más, desea pagar por horas). Se muestra en la tarjeta del servicio y en reportes.';
