-- Teléfono/WhatsApp asociado al vehículo (residente o visitante por placa)
ALTER TABLE vehiculos
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT;
