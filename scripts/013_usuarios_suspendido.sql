-- Estado suspendido: el usuario no puede iniciar sesión hasta que un admin lo reactive
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS suspendido BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN usuarios.suspendido IS 'Si true, el usuario no puede iniciar sesión. Un administrador puede reactivarlo desde la vista de gestión.';
