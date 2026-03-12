-- Drop existing tables if they exist (to recreate with correct schema)
DROP TABLE IF EXISTS servicios CASCADE;
DROP TABLE IF EXISTS vehiculos CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;

-- Create vehiculos table
CREATE TABLE vehiculos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT, -- allows null for temporary records
  tipo TEXT NOT NULL DEFAULT 'visitante' CHECK (tipo IN ('visitante', 'residente')),
  nombre_propietario TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create servicios table
-- Note: inicio_cobro is calculated as entrada_real + 5 minutes in app logic
CREATE TABLE servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id UUID NOT NULL REFERENCES vehiculos(id) ON DELETE CASCADE,
  entrada_real TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  salida TIMESTAMP WITH TIME ZONE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pagado')),
  tarifa_aplicada NUMERIC(10, 2),
  total_pagar NUMERIC(10, 2),
  ref_pago_yape TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create configuracion table for rates
CREATE TABLE configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_usuario TEXT NOT NULL UNIQUE CHECK (tipo_usuario IN ('visitante', 'residente')),
  precio_hora NUMERIC(10, 2) NOT NULL
);

-- Insert default configuration
INSERT INTO configuracion (tipo_usuario, precio_hora) VALUES
  ('visitante', 5.00),
  ('residente', 3.00);

-- Create indexes for better query performance
CREATE INDEX idx_servicios_estado ON servicios(estado);
CREATE INDEX idx_servicios_entrada ON servicios(entrada_real);
CREATE INDEX idx_vehiculos_placa ON vehiculos(placa);
