export interface Vehiculo {
  id: string
  placa: string | null
  tipo: 'visitante' | 'residente'
  nombre_propietario: string | null
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
  tipo_usuario: 'visitante' | 'residente'
  precio_hora: number
}

export interface ServicioConVehiculo extends Servicio {
  vehiculo: Vehiculo
}
