-- Evita que la suspensión automática por prueba vencida anule una reactivación del superadmin.
-- acceso_pagado = true: el tenant puede operar aunque hayan pasado los 5 días de prueba (pago / alta manual).

ALTER TABLE cuentas
  ADD COLUMN IF NOT EXISTS acceso_pagado BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN cuentas.acceso_pagado IS 'Si es true, no aplica suspensión automática por vencimiento de prueba freemium (p. ej. reactivado por superadmin tras pago).';

-- Cuentas ya activas cuya prueba de 5 días ya superó: no seguir auto-suspendiéndolas (legacy / sin flag previo).
UPDATE cuentas
SET acceso_pagado = true
WHERE estado = 'activo'
  AND fecha_creacion < (NOW() AT TIME ZONE 'utc') - INTERVAL '5 days';
