export interface Vehiculo {
  id: string
  placa: string | null
  tipo: 'visitante' | 'residente' | 'abonado'
  nombre_propietario: string | null
  apellido_propietario?: string | null
  numero_oficina_dep?: string | null
  telefono_contacto?: string | null
  vigencia_abono_hasta?: string | null
  ref_pago_abono?: string | null
  captura_pago_abono?: string | null
  /** Monto del último pago de mensualidad (para mostrar en tabla de servicios). */
  monto_ultimo_pago_abono?: number | null
  /** Cantidad de meses del último pago (1-6) para mostrar "Abonado (N meses)". */
  ultimo_numero_meses_abono?: number | null
  /** True si el abonado canceló la suscripción; no aparece en alertas pero el registro se conserva. */
  abono_cancelado?: boolean | null
  /** Motivo de cancelación (ej. no desea más, desea pagar por horas). */
  motivo_cancelacion_abono?: string | null
  created_at: string
}

export interface Servicio {
  id: string
  vehiculo_id: string
  entrada_real: string
  salida: string | null
  estado: 'activo' | 'pagado'
  tarifa_aplicada: number | null
  total_pagar: number | null
  ref_pago_yape: string | null
  created_at: string
  vehiculo?: Vehiculo
}

export interface Configuracion {
  id: string
  tipo_usuario: 'visitante' | 'residente' | 'abonado'
  /** Para visitante/residente: precio por hora. Para abonado: precio por mes. */
  precio_hora: number
}

export interface ServicioConVehiculo extends Servicio {
  vehiculo: Vehiculo
}
