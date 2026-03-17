-- Multi-tenancy: agregar cuenta_id a todas las tablas clave
-- Ejecutar después de 015_cuentas.sql

-- 1. Crear cuenta por defecto para datos existentes (si no hay cuentas)
INSERT INTO cuentas (id, nombre_cuenta, slug, estado)
SELECT gen_random_uuid(), 'Cuenta por defecto', 'default', 'activo'
WHERE NOT EXISTS (SELECT 1 FROM cuentas LIMIT 1);

-- 2. Usuarios: agregar cuenta_id (unique por cuenta + usuario)
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS cuenta_id UUID REFERENCES cuentas(id) ON DELETE CASCADE;
UPDATE usuarios SET cuenta_id = (SELECT id FROM cuentas WHERE slug = 'default' LIMIT 1) WHERE cuenta_id IS NULL;
ALTER TABLE usuarios ALTER COLUMN cuenta_id SET NOT NULL;
DROP INDEX IF EXISTS idx_usuarios_usuario;
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cuenta_usuario ON usuarios(cuenta_id, usuario);
CREATE INDEX IF NOT EXISTS idx_usuarios_cuenta_id ON usuarios(cuenta_id);

-- 3. Vehículos: agregar cuenta_id
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS cuenta_id UUID REFERENCES cuentas(id) ON DELETE CASCADE;
UPDATE vehiculos SET cuenta_id = (SELECT id FROM cuentas WHERE slug = 'default' LIMIT 1) WHERE cuenta_id IS NULL;
ALTER TABLE vehiculos ALTER COLUMN cuenta_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehiculos_cuenta_id ON vehiculos(cuenta_id);

-- 4. Servicios: cuenta_id vía vehiculo; opcionalmente denormalizado para consultas
-- Servicios dependen de vehiculos; vehiculos ya tienen cuenta_id. Para filtrar por cuenta en reportes:
ALTER TABLE servicios ADD COLUMN IF NOT EXISTS cuenta_id UUID REFERENCES cuentas(id) ON DELETE CASCADE;
UPDATE servicios s SET cuenta_id = (SELECT v.cuenta_id FROM vehiculos v WHERE v.id = s.vehiculo_id LIMIT 1) WHERE s.cuenta_id IS NULL;
ALTER TABLE servicios ALTER COLUMN cuenta_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS idx_servicios_cuenta_id ON servicios(cuenta_id);

-- 5. Configuración: una por cuenta y tipo_usuario (unique por cuenta + tipo)
ALTER TABLE configuracion ADD COLUMN IF NOT EXISTS cuenta_id UUID REFERENCES cuentas(id) ON DELETE CASCADE;
UPDATE configuracion SET cuenta_id = (SELECT id FROM cuentas WHERE slug = 'default' LIMIT 1) WHERE cuenta_id IS NULL;
ALTER TABLE configuracion ALTER COLUMN cuenta_id SET NOT NULL;
ALTER TABLE configuracion DROP CONSTRAINT IF EXISTS configuracion_tipo_usuario_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_configuracion_cuenta_tipo ON configuracion(cuenta_id, tipo_usuario);
CREATE INDEX IF NOT EXISTS idx_configuracion_cuenta_id ON configuracion(cuenta_id);
