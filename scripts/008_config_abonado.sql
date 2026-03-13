-- Precio mensual para abonados (se guarda en configuracion como tipo_usuario = 'abonado', precio_hora = precio por mes)
ALTER TABLE configuracion
  DROP CONSTRAINT IF EXISTS configuracion_tipo_usuario_check;

ALTER TABLE configuracion
  ADD CONSTRAINT configuracion_tipo_usuario_check
  CHECK (tipo_usuario IN ('visitante', 'residente', 'abonado'));

INSERT INTO configuracion (tipo_usuario, precio_hora)
  VALUES ('abonado', 100.00)
  ON CONFLICT (tipo_usuario) DO NOTHING;
