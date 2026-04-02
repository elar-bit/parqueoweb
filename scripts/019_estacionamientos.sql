-- Plazas de estacionamiento por tenant (para asignación en registro de visitas).

CREATE TABLE IF NOT EXISTS estacionamientos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cuenta_id UUID NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE,
  etiqueta TEXT NOT NULL,
  orden INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (cuenta_id, etiqueta)
);

CREATE INDEX IF NOT EXISTS idx_estacionamientos_cuenta ON estacionamientos(cuenta_id);

ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS estacionamiento_id UUID REFERENCES estacionamientos(id) ON DELETE SET NULL;

-- Copia del número en el momento del registro (persiste en reportes si se elimina la fila de plaza).
ALTER TABLE servicios
  ADD COLUMN IF NOT EXISTS estacionamiento_etiqueta TEXT;

CREATE INDEX IF NOT EXISTS idx_servicios_estacionamiento ON servicios(estacionamiento_id);

-- Una sola entrada activa por plaza (evita doble asignación concurrente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_servicio_un_estacionamiento_activo
  ON servicios (estacionamiento_id)
  WHERE estado = 'activo' AND estacionamiento_id IS NOT NULL;

COMMENT ON TABLE estacionamientos IS 'Plazas numeradas por cuenta; el conserje asigna una libre al registrar entrada.';
COMMENT ON COLUMN servicios.estacionamiento_id IS 'Plaza (FK); null si la fila de plaza se eliminó.';
COMMENT ON COLUMN servicios.estacionamiento_etiqueta IS 'Texto mostrado en ticket/reporte (copiado al registrar).';
