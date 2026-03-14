-- Usuario ficticio para pruebas: abonado cuya suscripción vence en 2 días
-- Ejecutar una vez para probar alertas "Por vencer" y flujo de cancelación + WhatsApp

INSERT INTO vehiculos (
  placa,
  tipo,
  nombre_propietario,
  apellido_propietario,
  telefono_contacto,
  vigencia_abono_hasta,
  ultimo_numero_meses_abono,
  monto_ultimo_pago_abono,
  abono_cancelado
)
SELECT
  'ABO-TEST-2D',
  'abonado',
  'Usuario',
  'Prueba 2 días',
  '987654321',
  (CURRENT_DATE + INTERVAL '2 days')::date,
  3,
  280.00,
  false
WHERE NOT EXISTS (SELECT 1 FROM vehiculos WHERE placa = 'ABO-TEST-2D' AND tipo = 'abonado');
