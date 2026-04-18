-- Opciones de interfaz por tenant (superadmin: Personalizar)
ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS ui_banner_noticias BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ui_btn_visitante BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ui_btn_residente BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ui_btn_abonado BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN cuentas.ui_banner_noticias IS 'Mostrar banner de noticias en admin/conserje (y superadmin si aplica).';
COMMENT ON COLUMN cuentas.ui_btn_visitante IS 'Mostrar botón Visitante en registro rápido (conserje).';
COMMENT ON COLUMN cuentas.ui_btn_residente IS 'Mostrar botón Residente en registro rápido.';
COMMENT ON COLUMN cuentas.ui_btn_abonado IS 'Mostrar botón Abonado en registro rápido.';
