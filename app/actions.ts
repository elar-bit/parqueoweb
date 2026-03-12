'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { calculateBilling } from '@/lib/billing'
import type { Configuracion, ServicioConVehiculo, Vehiculo } from '@/lib/types'

export async function getConfiguracion(): Promise<Configuracion[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('configuracion')
      .select('*')
    
    if (error) {
      console.error('[v0] getConfiguracion error:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('[v0] getConfiguracion exception:', e)
    return []
  }
}

export async function getServiciosActivos(): Promise<ServicioConVehiculo[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('servicios')
      .select(`
        *,
        vehiculo:vehiculos(*)
      `)
      .eq('estado', 'activo')
      .order('entrada_real', { ascending: false })
    
    if (error) {
      console.error('[v0] getServiciosActivos error:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('[v0] getServiciosActivos exception:', e)
    return []
  }
}

export async function registrarEntrada(tipo: 'visitante' | 'residente'): Promise<{
  vehiculo: Vehiculo
  servicio: { id: string }
}> {
  const supabase = await createClient()
  
  // Create vehicle record (plate can be null initially)
  const { data: vehiculo, error: vehiculoError } = await supabase
    .from('vehiculos')
    .insert({ tipo })
    .select()
    .single()
  
  if (vehiculoError) throw vehiculoError
  
  // Create service record
  const { data: servicio, error: servicioError } = await supabase
    .from('servicios')
    .insert({ 
      vehiculo_id: vehiculo.id,
      entrada_real: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (servicioError) throw servicioError
  
  revalidatePath('/conserje')
  return { vehiculo, servicio }
}

export async function actualizarVehiculo(
  vehiculoId: string,
  data: { placa?: string; tipo?: 'visitante' | 'residente'; nombre_propietario?: string }
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('vehiculos')
    .update(data)
    .eq('id', vehiculoId)
  
  if (error) throw error
  revalidatePath('/conserje')
}

export async function registrarSalida(
  servicioId: string,
  _totalPagarCliente: number,
  tarifaAplicada: number,
  refPagoYape?: string
): Promise<void> {
  const supabase = await createClient()

  // Obtener el servicio para tener entrada_real y recalcular con gracia de 5 min en el servidor
  const { data: servicio, error: fetchError } = await supabase
    .from('servicios')
    .select('entrada_real')
    .eq('id', servicioId)
    .eq('estado', 'activo')
    .single()

  if (fetchError || !servicio) {
    throw fetchError || new Error('Servicio no encontrado o ya finalizado')
  }

  const salida = new Date()
  const entradaReal = new Date(servicio.entrada_real)
  // Aplicar gracia de 5 minutos: el total se calcula en servidor para consistencia
  const { total: totalPagar } = calculateBilling(entradaReal, salida, tarifaAplicada)

  const { error } = await supabase
    .from('servicios')
    .update({
      salida: salida.toISOString(),
      estado: 'pagado',
      total_pagar: totalPagar,
      tarifa_aplicada: tarifaAplicada,
      ref_pago_yape: refPagoYape || null
    })
    .eq('id', servicioId)

  if (error) throw error
  revalidatePath('/conserje')
  revalidatePath('/admin')
}

export async function getServiciosPagadosHoy(): Promise<ServicioConVehiculo[]> {
  try {
    const supabase = await createClient()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('servicios')
      .select(`
        *,
        vehiculo:vehiculos(*)
      `)
      .eq('estado', 'pagado')
      .gte('salida', today.toISOString())
      .order('salida', { ascending: false })
    
    if (error) {
      console.error('[v0] getServiciosPagadosHoy error:', error)
      return []
    }
    return data || []
  } catch (e) {
    console.error('[v0] getServiciosPagadosHoy exception:', e)
    return []
  }
}

export async function getIngresosDiarios(dias: number = 7): Promise<{
  fecha: string
  total: number
}[]> {
  try {
    const supabase = await createClient()
    
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dias)
    startDate.setHours(0, 0, 0, 0)
    
    const { data, error } = await supabase
      .from('servicios')
      .select('salida, total_pagar')
      .eq('estado', 'pagado')
      .gte('salida', startDate.toISOString())
      .not('total_pagar', 'is', null)
    
    if (error) {
      console.error('[v0] getIngresosDiarios error:', error)
      return []
    }
    
    // Group by date
    const grouped: Record<string, number> = {}
    
    for (let i = 0; i <= dias; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]
      grouped[dateKey] = 0
    }
    
    data?.forEach(servicio => {
      if (servicio.salida && servicio.total_pagar) {
        const dateKey = new Date(servicio.salida).toISOString().split('T')[0]
        if (grouped[dateKey] !== undefined) {
          grouped[dateKey] += Number(servicio.total_pagar)
        }
      }
    })
    
    return Object.entries(grouped)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  } catch (e) {
    console.error('[v0] getIngresosDiarios exception:', e)
    return []
  }
}
