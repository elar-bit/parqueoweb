import { NextResponse } from 'next/server'
import { obtenerTitularesPeru } from '@/lib/noticias-peru'

export const revalidate = 300

export async function GET() {
  try {
    const { items, fuenteNombre, fuenteUrl } = await obtenerTitularesPeru(36)
    return NextResponse.json({
      ok: true as const,
      items,
      fuenteNombre,
      fuenteUrl,
    })
  } catch (e) {
    console.error('noticias-peru API:', e)
    return NextResponse.json({
      ok: false as const,
      items: [] as { title: string; link: string }[],
      fuenteNombre: 'RPP Noticias',
      fuenteUrl: 'https://rpp.pe',
      error: 'No se pudieron cargar los titulares.',
    })
  }
}
