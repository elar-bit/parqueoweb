-- FIX multi-tenant:
-- El schema inicial creó `usuario TEXT UNIQUE`, lo cual impide que diferentes cuentas
-- tengan el mismo username (ej: "admin" en cada tenant).
-- Este script elimina ese UNIQUE global y lo reemplaza por UNIQUE(cuenta_id, usuario).

-- 1) Quitar constraint UNIQUE(usuario) si existe (nombre típico: usuarios_usuario_key)
ALTER TABLE usuarios
  DROP CONSTRAINT IF EXISTS usuarios_usuario_key;

-- 2) Quitar índice único antiguo si existiera (por nombre)
DROP INDEX IF EXISTS idx_usuarios_usuario;

-- 3) Asegurar índice único por tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_cuenta_usuario
  ON usuarios(cuenta_id, usuario);

-- 4) Índices útiles
CREATE INDEX IF NOT EXISTS idx_usuarios_cuenta_id
  ON usuarios(cuenta_id);

