'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { calculateBilling } from '@/lib/billing'
import type { Configuracion, ServicioConVehiculo, Vehiculo } from '@/lib/types'

const ADMIN_COOKIE_NAME = 'parqueo_admin'

function getAdminToken(): string {
  const secret = process.env.ADMIN_PASSWORD || 'default-secret-change-me'
  return createHmac('sha256', secret).update('parqueo_admin_ok').digest('hex')
}

export async function getAdminAuth(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value
  return token === getAdminToken()
}

export async function loginAdmin(password: string): Promise<{ ok: boolean; error?: string }> {
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) {
    return { ok: false, error: 'Admin no configurado' }
  }
  if (password !== expected) {
    return { ok: false, error: 'Contraseña incorrecta' }
  }
  const cookieStore = await cookies()
  cookieStore.set(ADMIN_COOKIE_NAME, getAdminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  })
  return { ok: true }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_COOKIE_NAME)
}

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

export async function getPlacasResidentes(): Promise<{ id: string; placa: string; nombre_propietario: string | null }[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehiculos')
      .select('id, placa, nombre_propietario')
      .eq('tipo', 'residente')
      .not('placa', 'is', null)
      .order('placa')
    if (error) {
      console.error('getPlacasResidentes error:', error)
      return []
    }
    return (data || []).filter((v): v is { id: string; placa: string; nombre_propietario: string | null } => v.placa != null)
  } catch (e) {
    console.error('getPlacasResidentes exception:', e)
    return []
  }
}

export async function registrarEntrada(
  tipo: 'visitante' | 'residente',
  placa?: string | null,
  vehiculoIdExistente?: string | null
): Promise<{
  vehiculo: Vehiculo
  servicio: { id: string }
}> {
  const supabase = await createClient()
  let vehiculo: Vehiculo

  if (vehiculoIdExistente) {
    // Residente: reutilizar vehículo existente
    const { data: existing, error: fetchError } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('id', vehiculoIdExistente)
      .eq('tipo', 'residente')
      .single()
    if (fetchError || !existing) throw new Error('Vehículo residente no encontrado')
    vehiculo = existing as Vehiculo
  } else {
    // Crear nuevo vehículo (visitante o residente con placa nueva)
    const { data: nuevo, error: vehiculoError } = await supabase
      .from('vehiculos')
      .insert({
        tipo,
        placa: placa?.trim() || null,
      })
      .select()
      .single()
    if (vehiculoError) throw vehiculoError
    vehiculo = nuevo as Vehiculo
  }

  const { data: servicio, error: servicioError } = await supabase
    .from('servicios')
    .insert({
      vehiculo_id: vehiculo.id,
      entrada_real: new Date().toISOString(),
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

export type FiltrosAdmin = {
  fechaDesde?: string | null
  fechaHasta?: string | null
  tipo?: 'visitante' | 'residente' | null
}

export async function getServiciosPagadosFiltrados(filtros: FiltrosAdmin): Promise<ServicioConVehiculo[]> {
  try {
    const supabase = await createClient()
    let q = supabase
      .from('servicios')
      .select(`
        *,
        vehiculo:vehiculos(*)
      `)
      .eq('estado', 'pagado')
      .not('salida', 'is', null)
    if (filtros.fechaDesde) {
      const desde = new Date(filtros.fechaDesde)
      desde.setHours(0, 0, 0, 0)
      q = q.gte('salida', desde.toISOString())
    }
    if (filtros.fechaHasta) {
      const hasta = new Date(filtros.fechaHasta)
      hasta.setHours(23, 59, 59, 999)
      q = q.lte('salida', hasta.toISOString())
    }
    const { data, error } = await q.order('salida', { ascending: false })
    if (error) {
      console.error('getServiciosPagadosFiltrados error:', error)
      return []
    }
    let list = data || []
    if (filtros.tipo) {
      list = list.filter((s: ServicioConVehiculo) => s.vehiculo?.tipo === filtros.tipo)
    }
    return list
  } catch (e) {
    console.error('getServiciosPagadosFiltrados exception:', e)
    return []
  }
}

export async function getIngresosFiltrados(filtros: FiltrosAdmin): Promise<{ fecha: string; total: number }[]> {
  try {
    const servicios = await getServiciosPagadosFiltrados(filtros)
    const grouped: Record<string, number> = {}
    servicios.forEach((s) => {
      if (s.salida && s.total_pagar != null) {
        const dateKey = new Date(s.salida).toISOString().split('T')[0]
        grouped[dateKey] = (grouped[dateKey] || 0) + Number(s.total_pagar)
      }
    })
    return Object.entries(grouped)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  } catch (e) {
    console.error('getIngresosFiltrados exception:', e)
    return []
  }
}

export async function updateConfiguracion(
  tipoUsuario: 'visitante' | 'residente',
  precioHora: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('configuracion')
      .update({ precio_hora: precioHora })
      .eq('tipo_usuario', tipoUsuario)
    if (error) {
      console.error('updateConfiguracion error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    revalidatePath('/conserje')
    return { ok: true }
  } catch (e) {
    console.error('updateConfiguracion exception:', e)
    return { ok: false, error: String(e) }
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
