-- Campos adicionales para residentes: apellido y número de oficina/departamento
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS apellido_propietario TEXT,
  ADD COLUMN IF NOT EXISTS numero_oficina_dep TEXT;
