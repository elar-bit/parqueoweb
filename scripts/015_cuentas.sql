-- Tabla de cuentas (tenants) para SaaS multi-tenant
-- Cada cuenta tiene un slug único para la URL: /{slug}/admin, /{slug}/conserje
CREATE TABLE IF NOT EXISTS cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_cuenta TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
  nombre_admin TEXT,
  apellido_admin TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cuentas_slug ON cuentas(slug);
CREATE INDEX IF NOT EXISTS idx_cuentas_estado ON cuentas(estado);
CREATE INDEX IF NOT EXISTS idx_cuentas_fecha_creacion ON cuentas(fecha_creacion);

COMMENT ON TABLE cuentas IS 'Cuentas (tenants) del SaaS. Cada cuenta aísla usuarios, vehículos, servicios y configuración. Prueba freemium 5 días.';
