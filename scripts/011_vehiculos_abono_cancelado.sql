-- Marca de suscripción cancelada (el abonado no renovará; se quita de alertas pero se conserva el registro)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS abono_cancelado BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN vehiculos.abono_cancelado IS 'True si el abonado canceló la suscripción; no se muestra en alertas de vencidos/por vencer. Si vuelve, se puede reingresar y sus datos siguen disponibles.';
