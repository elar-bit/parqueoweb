'use server'
// Server actions para ParqueoWeb

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createHmac } from 'crypto'
import { hash, compare } from 'bcryptjs'
import { calculateBilling, abonoVigente, calcularTotalAbonado, montoServicioParaMostrar } from '@/lib/billing'
import type { Configuracion, ServicioConVehiculo, Vehiculo } from '@/lib/types'

const SESSION_COOKIE_NAME = 'parqueo_session'
const DEFAULT_ADMIN_USER = 'admin'
const DEFAULT_ADMIN_PASS = 'admin'
const DEFAULT_CONSERJE_USER = 'conserje'
const DEFAULT_CONSERJE_PASS = 'conserje'

// Cambio mínimo sin impacto funcional para forzar diff en Git

function signSession(payload: { userId: string; role: string }): string {
  const secret = process.env.SESSION_SECRET || 'parqueo-secret-change-in-production'
  const data = JSON.stringify(payload)
  return createHmac('sha256', secret).update(data).digest('hex') + '.' + Buffer.from(data).toString('base64')
}

function verifySession(token: string): { userId: string; role: string } | null {
  try {
    const [sig, dataB64] = token.split('.')
    if (!sig || !dataB64) return null
    const payload = JSON.parse(Buffer.from(dataB64, 'base64').toString()) as { userId: string; role: string }
    const expected = signSession(payload)
    if (expected !== token) return null
    return payload
  } catch {
    return null
  }
}

export async function getAdminAuth(): Promise<boolean> {
  const session = await getSession()
  return session?.role === 'admin'
}

export async function getSession(): Promise<{ userId: string; role: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

async function ensureDefaultAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: existing } = await supabase.from('usuarios').select('id').eq('usuario', DEFAULT_ADMIN_USER).single()
    if (existing) return
    const password_hash = await hash(DEFAULT_ADMIN_PASS, 10)
    await supabase.from('usuarios').insert({
      nombre: 'Admin',
      apellido: 'Sistema',
      usuario: DEFAULT_ADMIN_USER,
      password_hash,
      rol: 'admin',
    })
  } catch (e) {
    console.error('ensureDefaultAdmin:', e)
  }
}

async function ensureDefaultConserje(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    const { data: existing } = await supabase.from('usuarios').select('id, password_hash').eq('usuario', DEFAULT_CONSERJE_USER).single()
    const newHash = await hash(DEFAULT_CONSERJE_PASS, 10)
    if (!existing) {
      await supabase.from('usuarios').insert({
        nombre: 'Conserje',
        apellido: 'Sistema',
        usuario: DEFAULT_CONSERJE_USER,
        password_hash: newHash,
        rol: 'conserje',
      })
      return
    }
    const wasEmpty = await compare('', existing.password_hash)
    if (wasEmpty) {
      await supabase.from('usuarios').update({ password_hash: newHash }).eq('id', existing.id)
    }
  } catch (e) {
    console.error('ensureDefaultConserje:', e)
  }
}

export async function loginUsuario(
  usuario: string,
  password: string,
  options?: { soloAdmin?: boolean }
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const usuarioNorm = (usuario || '').trim().toLowerCase()
  const passwordNorm = password || ''

  if (usuarioNorm === DEFAULT_ADMIN_USER && passwordNorm === DEFAULT_ADMIN_PASS) {
    await ensureDefaultAdmin(supabase)
  }
  if (usuarioNorm === DEFAULT_CONSERJE_USER && passwordNorm === DEFAULT_CONSERJE_PASS) {
    await ensureDefaultConserje(supabase)
  }

  const { data: user, error } = await supabase
    .from('usuarios')
    .select('id, usuario, password_hash, rol')
    .eq('usuario', usuarioNorm)
    .single()

  if (error || !user) {
    return { ok: false, error: 'Usuario o contraseña incorrectos' }
  }

  const validPassword = await compare(passwordNorm, user.password_hash)
  if (!validPassword) {
    return { ok: false, error: 'Usuario o contraseña incorrectos' }
  }

  if (options?.soloAdmin && user.rol !== 'admin') {
    return { ok: false, error: 'Solo los administradores pueden acceder al panel.' }
  }

  const token = signSession({ userId: user.id, role: user.rol })
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })
  return { ok: true }
}

export async function logoutAdmin(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export type UsuarioRow = {
  id: string
  nombre: string
  apellido: string
  usuario: string
  rol: 'admin' | 'conserje'
  created_at: string
}

export async function getUsuarios(): Promise<UsuarioRow[]> {
  const authed = await getAdminAuth()
  if (!authed) return []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('usuarios')
      .select('id, nombre, apellido, usuario, rol, created_at')
      .order('usuario')
    if (error) {
      console.error('getUsuarios error:', error)
      return []
    }
    return (data || []) as UsuarioRow[]
  } catch (e) {
    console.error('getUsuarios exception:', e)
    return []
  }
}

export async function crearUsuario(
  nombre: string,
  apellido: string,
  usuario: string,
  password: string,
  rol: 'admin' | 'conserje'
): Promise<{ ok: boolean; error?: string }> {
  const authed = await getAdminAuth()
  if (!authed) return { ok: false, error: 'No autorizado' }

  const nombreTrim = (nombre || '').trim()
  const apellidoTrim = (apellido || '').trim()
  const usuarioTrim = (usuario || '').trim().toLowerCase()
  const passwordTrim = (password || '').trim()

  if (!nombreTrim || !apellidoTrim || !usuarioTrim || !passwordTrim) {
    return { ok: false, error: 'Complete todos los campos' }
  }
  if (passwordTrim.length < 4) {
    return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' }
  }
  if (rol !== 'admin' && rol !== 'conserje') {
    return { ok: false, error: 'Rol no válido' }
  }

  try {
    const supabase = await createClient()
    const { data: existing } = await supabase.from('usuarios').select('id').eq('usuario', usuarioTrim).single()
    if (existing) return { ok: false, error: 'El usuario ya existe' }

    const password_hash = await hash(passwordTrim, 10)
    const { error } = await supabase.from('usuarios').insert({
      nombre: nombreTrim,
      apellido: apellidoTrim,
      usuario: usuarioTrim,
      password_hash,
      rol,
    })
    if (error) {
      console.error('crearUsuario error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    console.error('crearUsuario exception:', e)
    return { ok: false, error: String(e) }
  }
}

export async function actualizarUsuario(
  id: string,
  data: { nombre?: string; apellido?: string; usuario?: string; rol?: 'admin' | 'conserje' }
): Promise<{ ok: boolean; error?: string }> {
  const authed = await getAdminAuth()
  if (!authed) return { ok: false, error: 'No autorizado' }
  try {
    const supabase = await createClient()
    const updates: Record<string, unknown> = {}
    if (data.nombre != null) updates.nombre = (data.nombre || '').trim()
    if (data.apellido != null) updates.apellido = (data.apellido || '').trim()
    if (data.usuario != null) updates.usuario = (data.usuario || '').trim().toLowerCase()
    if (data.rol != null) updates.rol = data.rol
    if (Object.keys(updates).length === 0) return { ok: true }
    if (updates.usuario != null) {
      const { data: existing } = await supabase.from('usuarios').select('id').eq('usuario', updates.usuario).neq('id', id).maybeSingle()
      if (existing) return { ok: false, error: 'Ese usuario ya existe' }
    }
    const { error } = await supabase.from('usuarios').update(updates).eq('id', id)
    if (error) {
      console.error('actualizarUsuario error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    console.error('actualizarUsuario exception:', e)
    return { ok: false, error: String(e) }
  }
}

export async function eliminarUsuario(id: string): Promise<{ ok: boolean; error?: string }> {
  const authed = await getAdminAuth()
  if (!authed) return { ok: false, error: 'No autorizado' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('usuarios').delete().eq('id', id)
    if (error) {
      console.error('eliminarUsuario error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    console.error('eliminarUsuario exception:', e)
    return { ok: false, error: String(e) }
  }
}

export async function resetearPasswordUsuario(id: string, nuevaPassword: string): Promise<{ ok: boolean; error?: string }> {
  const authed = await getAdminAuth()
  if (!authed) return { ok: false, error: 'No autorizado' }
  const pass = (nuevaPassword || '').trim()
  if (pass.length < 4) return { ok: false, error: 'La contraseña debe tener al menos 4 caracteres' }
  try {
    const supabase = await createClient()
    const password_hash = await hash(pass, 10)
    const { error } = await supabase.from('usuarios').update({ password_hash }).eq('id', id)
    if (error) {
      console.error('resetearPasswordUsuario error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    return { ok: true }
  } catch (e) {
    console.error('resetearPasswordUsuario exception:', e)
    return { ok: false, error: String(e) }
  }
}

export async function eliminarServicio(id: string): Promise<{ ok: boolean; error?: string }> {
  const authed = await getAdminAuth()
  if (!authed) return { ok: false, error: 'No autorizado' }
  try {
    const supabase = await createClient()
    const { error } = await supabase.from('servicios').delete().eq('id', id)
    if (error) {
      console.error('eliminarServicio error:', error)
      return { ok: false, error: error.message }
    }
    revalidatePath('/admin')
    revalidatePath('/conserje')
    return { ok: true }
  } catch (e) {
    console.error('eliminarServicio exception:', e)
    return { ok: false, error: String(e) }
  }
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

export type ResidenteOption = {
  id: string
  placa: string
  nombre_propietario: string | null
  apellido_propietario: string | null
}

/** Misma forma que ResidenteOption; usado para abonados. */
export type AbonadoOption = ResidenteOption

export async function getPlacasAbonados(): Promise<AbonadoOption[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehiculos')
      .select('id, placa, nombre_propietario, apellido_propietario')
      .eq('tipo', 'abonado')
      .not('placa', 'is', null)
      .order('placa')
    if (error) {
      console.error('getPlacasAbonados error:', error)
      return []
    }
    return (data || []).filter(
      (v): v is AbonadoOption =>
        v.placa != null &&
        typeof v.id === 'string' &&
        typeof v.placa === 'string'
    ).map((v) => ({
      id: v.id,
      placa: v.placa,
      nombre_propietario: v.nombre_propietario ?? null,
      apellido_propietario: (v as { apellido_propietario?: string | null }).apellido_propietario ?? null,
    }))
  } catch (e) {
    console.error('getPlacasAbonados exception:', e)
    return []
  }
}

export async function getPlacasResidentes(): Promise<ResidenteOption[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehiculos')
      .select('id, placa, nombre_propietario, apellido_propietario')
      .eq('tipo', 'residente')
      .not('placa', 'is', null)
      .order('placa')
    if (error) {
      console.error('getPlacasResidentes error:', error)
      return []
    }
    return (data || []).filter(
      (v): v is ResidenteOption =>
        v.placa != null &&
        typeof v.id === 'string' &&
        typeof v.placa === 'string'
    ).map((v) => ({
      id: v.id,
      placa: v.placa,
      nombre_propietario: v.nombre_propietario ?? null,
      apellido_propietario: (v as { apellido_propietario?: string | null }).apellido_propietario ?? null,
    }))
  } catch (e) {
    console.error('getPlacasResidentes exception:', e)
    return []
  }
}

/** Indica si el vehículo ya tiene una entrada activa (evitar duplicar). */
export async function tieneEntradaActiva(vehiculoId: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('servicios')
      .select('id')
      .eq('vehiculo_id', vehiculoId)
      .eq('estado', 'activo')
      .limit(1)
    if (error) return false
    return (data?.length ?? 0) > 0
  } catch {
    return false
  }
}

export type DatosResidente = {
  nombre?: string | null
  apellido?: string | null
  numero_oficina_dep?: string | null
  telefono_contacto?: string | null
}

export type DatosAbonado = DatosResidente & {
  yaPagoMensualidad?: boolean
  /** Cantidad de meses (1 a 6) para vigencia del abono. */
  numeroMeses?: number
  /** Nº operación Yape o transferencia. */
  refPagoAbono?: string | null
  /** Captura del pago en base64 (data URL, ej. data:image/jpeg;base64,...). */
  capturaPagoAbono?: string | null
}

function addMonths(d: Date, months: number): Date {
  const out = new Date(d)
  out.setMonth(out.getMonth() + months)
  return out
}

export async function registrarEntrada(
  tipo: 'visitante' | 'residente' | 'abonado',
  placa?: string | null,
  vehiculoIdExistente?: string | null,
  datosResidente?: DatosResidente | null,
  datosAbonado?: DatosAbonado | null
): Promise<{
  vehiculo: Vehiculo
  servicio: { id: string }
}> {
  const supabase = await createClient()
  let vehiculo: Vehiculo
  const tipoReuso = tipo === 'residente' ? 'residente' : tipo === 'abonado' ? 'abonado' : null

  if (vehiculoIdExistente && tipoReuso) {
    const { data: existing, error: fetchError } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('id', vehiculoIdExistente)
      .eq('tipo', tipoReuso)
      .single()
    if (fetchError || !existing) throw new Error(tipoReuso === 'abonado' ? 'Vehículo abonado no encontrado' : 'Vehículo residente no encontrado')
    vehiculo = existing as Vehiculo
  } else {
    const insertPayload: Record<string, unknown> = {
      tipo,
      placa: placa?.trim() || null,
    }
    if (tipo === 'residente' && datosResidente) {
      if (datosResidente.nombre != null) insertPayload.nombre_propietario = datosResidente.nombre
      if (datosResidente.apellido != null) insertPayload.apellido_propietario = datosResidente.apellido
      if (datosResidente.numero_oficina_dep != null) insertPayload.numero_oficina_dep = datosResidente.numero_oficina_dep
      if (datosResidente.telefono_contacto != null) insertPayload.telefono_contacto = datosResidente.telefono_contacto
    }
    if (tipo === 'abonado' && (datosResidente || datosAbonado)) {
      const d = datosAbonado ?? datosResidente
      if (d) {
        if (d.nombre != null) insertPayload.nombre_propietario = d.nombre
        if (d.apellido != null) insertPayload.apellido_propietario = d.apellido
        if (d.numero_oficina_dep != null) insertPayload.numero_oficina_dep = d.numero_oficina_dep
        if (d.telefono_contacto != null) insertPayload.telefono_contacto = d.telefono_contacto
      }
      if (datosAbonado?.yaPagoMensualidad && datosAbonado?.numeroMeses != null) {
        const meses = Math.min(6, Math.max(1, Math.floor(datosAbonado.numeroMeses)))
        const hasta = addMonths(new Date(), meses)
        insertPayload.vigencia_abono_hasta = hasta.toISOString().split('T')[0]
        insertPayload.ultimo_numero_meses_abono = meses
        const config = await getConfiguracion()
        const precioAbonado = config.find((c) => c.tipo_usuario === 'abonado')?.precio_hora ?? 0
        const montoAbono = calcularTotalAbonado(precioAbonado, meses)
        insertPayload.monto_ultimo_pago_abono = montoAbono
      }
      if (datosAbonado?.refPagoAbono != null && String(datosAbonado.refPagoAbono).trim()) {
        insertPayload.ref_pago_abono = String(datosAbonado.refPagoAbono).trim()
      }
      if (datosAbonado?.capturaPagoAbono != null && String(datosAbonado.capturaPagoAbono).trim()) {
        insertPayload.captura_pago_abono = String(datosAbonado.capturaPagoAbono).trim()
      }
    }
    const { data: nuevo, error: vehiculoError } = await supabase
      .from('vehiculos')
      .insert(insertPayload)
      .select()
      .single()
    if (vehiculoError) throw vehiculoError
    vehiculo = nuevo as Vehiculo
  }

  const ahoraIso = new Date().toISOString()
  const baseServicio: Record<string, unknown> = {
    vehiculo_id: vehiculo.id,
    entrada_real: ahoraIso,
  }

  // Para abonados: el registro representa el pago adelantado del mes,
  // por lo que se marca como pagado inmediatamente (sin necesidad de validar salida).
  if (tipo === 'abonado') {
    baseServicio.estado = 'pagado'
    baseServicio.salida = ahoraIso
    baseServicio.tarifa_aplicada = 0
    const montoAbono = (vehiculo as Vehiculo & { monto_ultimo_pago_abono?: number })?.monto_ultimo_pago_abono ?? 0
    baseServicio.total_pagar = montoAbono
  }

  const { data: servicio, error: servicioError } = await supabase
    .from('servicios')
    .insert(baseServicio)
    .select('id')
    .single()

  if (servicioError) throw servicioError
  revalidatePath('/conserje')
  return { vehiculo, servicio }
}

export async function actualizarVehiculo(
  vehiculoId: string,
  data: {
    placa?: string
    tipo?: 'visitante' | 'residente' | 'abonado'
    nombre_propietario?: string
    apellido_propietario?: string | null
    numero_oficina_dep?: string | null
    telefono_contacto?: string | null
    vigencia_abono_hasta?: string | null
    ref_pago_abono?: string | null
    captura_pago_abono?: string | null
  }
): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('vehiculos')
    .update(data)
    .eq('id', vehiculoId)
  
  if (error) throw error
  revalidatePath('/conserje')
  revalidatePath('/admin')
}

/** Registra pago de mensualidad: extiende vigencia N meses desde fin del periodo anterior (o desde hoy si ya venció). */
export async function renovarAbono(
  vehiculoId: string,
  opts?: {
    numeroMeses?: number
    refPagoAbono?: string | null
    capturaPagoAbono?: string | null
  }
): Promise<void> {
  const supabase = await createClient()
  const { data: v, error: fetchErr } = await supabase
    .from('vehiculos')
    .select('vigencia_abono_hasta')
    .eq('id', vehiculoId)
    .eq('tipo', 'abonado')
    .single()
  if (fetchErr || !v) throw new Error('Vehículo abonado no encontrado')
  const meses = opts?.numeroMeses != null ? Math.min(6, Math.max(1, Math.floor(opts.numeroMeses))) : 1
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const vigenciaDate = v.vigencia_abono_hasta ? new Date(v.vigencia_abono_hasta) : null
  vigenciaDate?.setHours(0, 0, 0, 0)
  const base =
    vigenciaDate && vigenciaDate.getTime() >= hoy.getTime()
      ? vigenciaDate
      : hoy
  const nuevaVigencia = addMonths(base, meses).toISOString().split('T')[0]
  const config = await getConfiguracion()
  const precioAbonado = config.find((c) => c.tipo_usuario === 'abonado')?.precio_hora ?? 0
  const montoAbono = calcularTotalAbonado(precioAbonado, meses)
  const updatePayload: Record<string, unknown> = {
    vigencia_abono_hasta: nuevaVigencia,
    monto_ultimo_pago_abono: montoAbono,
    ultimo_numero_meses_abono: meses,
  }
  if (opts?.refPagoAbono != null && String(opts.refPagoAbono).trim()) {
    updatePayload.ref_pago_abono = String(opts.refPagoAbono).trim()
  }
  if (opts?.capturaPagoAbono != null && String(opts.capturaPagoAbono).trim()) {
    updatePayload.captura_pago_abono = String(opts.capturaPagoAbono).trim()
  }
  const { error } = await supabase
    .from('vehiculos')
    .update(updatePayload)
    .eq('id', vehiculoId)
  if (error) throw error
  revalidatePath('/conserje')
  revalidatePath('/admin')
}

/** Lista abonados con mensualidad vencida o sin pagar (para alertas). */
export async function getAbonadosVencidos(): Promise<Vehiculo[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('tipo', 'abonado')
    if (error) return []
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    return (data || []).filter((v) => {
      const vig = (v as Vehiculo).vigencia_abono_hasta
      return !vig || new Date(vig).setHours(0, 0, 0, 0) < hoy.getTime()
    }) as Vehiculo[]
  } catch (e) {
    console.error('getAbonadosVencidos exception:', e)
    return []
  }
}

/** Lista abonados cuyo abono vence en los próximos `dias` días (por defecto 7). */
export async function getAbonadosPorVencer(dias: number = 7): Promise<Vehiculo[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('vehiculos')
      .select('*')
      .eq('tipo', 'abonado')
    if (error) return []
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const limite = new Date(hoy)
    limite.setDate(limite.getDate() + dias)
    limite.setHours(0, 0, 0, 0)
    return (data || []).filter((v) => {
      const vig = (v as Vehiculo).vigencia_abono_hasta
      if (!vig) return false
      const d = new Date(vig)
      d.setHours(0, 0, 0, 0)
      return d >= hoy && d <= limite
    }) as Vehiculo[]
  } catch (e) {
    console.error('getAbonadosPorVencer exception:', e)
    return []
  }
}

export async function registrarSalida(
  servicioId: string,
  _totalPagarCliente: number,
  tarifaAplicada: number,
  refPagoYape?: string
): Promise<void> {
  const supabase = await createClient()

  const { data: servicio, error: fetchError } = await supabase
    .from('servicios')
    .select('entrada_real, vehiculo:vehiculos(tipo, vigencia_abono_hasta, monto_ultimo_pago_abono)')
    .eq('id', servicioId)
    .eq('estado', 'activo')
    .single()

  if (fetchError || !servicio) {
    throw fetchError || new Error('Servicio no encontrado o ya finalizado')
  }

  const vehiculo = servicio.vehiculo as { tipo?: string; vigencia_abono_hasta?: string | null; monto_ultimo_pago_abono?: number | null } | null
  const esAbonadoVigente = vehiculo?.tipo === 'abonado' && abonoVigente(vehiculo?.vigencia_abono_hasta)

  const salida = new Date()
  const entradaReal = new Date(servicio.entrada_real)
  let totalPagar: number
  let tarifaFinal: number
  if (esAbonadoVigente) {
    totalPagar = vehiculo?.monto_ultimo_pago_abono ?? 0
    tarifaFinal = 0
  } else {
    const billing = calculateBilling(entradaReal, salida, tarifaAplicada)
    totalPagar = billing.total
    tarifaFinal = tarifaAplicada
  }

  const { error } = await supabase
    .from('servicios')
    .update({
      salida: salida.toISOString(),
      estado: 'pagado',
      total_pagar: totalPagar,
      tarifa_aplicada: tarifaFinal,
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
  tipo?: 'visitante' | 'residente' | 'abonado' | null
}

/** Devuelve los meses (YYYY-MM) que tienen al menos un servicio pagado, ordenados descendente (más reciente primero). */
export async function getMesesConServicios(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('servicios')
      .select('salida')
      .eq('estado', 'pagado')
      .not('salida', 'is', null)
    if (error) {
      console.error('getMesesConServicios error:', error)
      return []
    }
    const meses = new Set<string>()
    ;(data || []).forEach((r: { salida: string }) => {
      if (r.salida) {
        const d = new Date(r.salida)
        const y = d.getFullYear()
        const m = String(d.getMonth() + 1).padStart(2, '0')
        meses.add(`${y}-${m}`)
      }
    })
    return Array.from(meses).sort((a, b) => b.localeCompare(a))
  } catch (e) {
    console.error('getMesesConServicios exception:', e)
    return []
  }
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
      if (s.salida) {
        const dateKey = new Date(s.salida).toISOString().split('T')[0]
        const monto = montoServicioParaMostrar(s)
        grouped[dateKey] = (grouped[dateKey] || 0) + monto
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

/** Ingresos por fecha con desglose visitantes / residentes (para gráfica con dos series). */
export async function getIngresosFiltradosConTipo(
  filtros: Omit<FiltrosAdmin, 'tipo'> & { tipo: null }
): Promise<{ fecha: string; visitantes: number; residentes: number }[]> {
  try {
    const servicios = await getServiciosPagadosFiltrados({ ...filtros, tipo: null })
    const grouped: Record<string, { visitantes: number; residentes: number }> = {}
    servicios.forEach((s) => {
      if (s.salida && s.total_pagar != null) {
        const t = s.vehiculo?.tipo
        if (t === 'abonado') return
        const dateKey = new Date(s.salida).toISOString().split('T')[0]
        if (!grouped[dateKey]) grouped[dateKey] = { visitantes: 0, residentes: 0 }
        const monto = montoServicioParaMostrar(s)
        const tipo = t === 'residente' ? 'residentes' : 'visitantes'
        grouped[dateKey][tipo] += monto
      }
    })
    return Object.entries(grouped)
      .map(([fecha, v]) => ({ fecha, visitantes: v.visitantes, residentes: v.residentes }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  } catch (e) {
    console.error('getIngresosFiltradosConTipo exception:', e)
    return []
  }
}

export async function updateConfiguracion(
  tipoUsuario: 'visitante' | 'residente' | 'abonado',
  precioHora: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    if (tipoUsuario === 'abonado') {
      const { data: existing } = await supabase
        .from('configuracion')
        .select('id')
        .eq('tipo_usuario', 'abonado')
        .maybeSingle()
      if (existing) {
        const { error } = await supabase
          .from('configuracion')
          .update({ precio_hora: precioHora })
          .eq('tipo_usuario', 'abonado')
        if (error) {
          console.error('updateConfiguracion error:', error)
          return { ok: false, error: error.message }
        }
      } else {
        const { error } = await supabase
          .from('configuracion')
          .insert({ tipo_usuario: 'abonado', precio_hora: precioHora })
        if (error) {
          console.error('updateConfiguracion insert abonado error:', error)
          return { ok: false, error: error.message }
        }
      }
    } else {
      const { error } = await supabase
        .from('configuracion')
        .update({ precio_hora: precioHora })
        .eq('tipo_usuario', tipoUsuario)
      if (error) {
        console.error('updateConfiguracion error:', error)
        return { ok: false, error: error.message }
      }
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
