-- Abonados ficticios para pruebas de alertas
-- UNO por vencer en 4 días y OTRO ya vencido

-- Ajusta las placas si ya existen en tu base
INSERT INTO vehiculos (placa, tipo, nombre_propietario, apellido_propietario, telefono_contacto, vigencia_abono_hasta)
VALUES
  (
    'ABO-DEM1',
    'abonado',
    'Carlos',
    'Prueba',
    '999111222',
    (CURRENT_DATE + INTERVAL '4 days')::date
  ),
  (
    'ABO-DEM2',
    'abonado',
    'Lucía',
    'Vencida',
    '999333444',
    (CURRENT_DATE - INTERVAL '2 days')::date
  );

