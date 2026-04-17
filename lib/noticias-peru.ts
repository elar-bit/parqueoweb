/** Parser ligero de RSS 2.0 (sin dependencias). */

export type TitularNoticia = { title: string; link: string }

const FEEDS = [
  {
    url: 'https://rpp.pe/rss',
    nombre: 'RPP Noticias',
    sitio: 'https://rpp.pe',
  },
] as const

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, '')
}

function normalizarLinkNoticia(link: string): string {
  const t = link.trim()
  if (!t) return 'https://rpp.pe'
  if (t.startsWith('http://') || t.startsWith('https://')) return t
  if (t.startsWith('//')) return `https:${t}`
  return `https://rpp.pe${t.startsWith('/') ? t : `/${t}`}`
}

function extractXmlField(block: string, tag: string): string {
  const cdata = new RegExp(
    `<${tag}\\b[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`,
    'i'
  ).exec(block)
  if (cdata) return cdata[1].trim()
  const plain = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i').exec(block)
  if (plain) return stripTags(plain[1]).trim()
  return ''
}

export function parseTitularesDesdeRss(xml: string, maxItems: number): TitularNoticia[] {
  const out: TitularNoticia[] = []
  const seen = new Set<string>()
  const re = /<item\b[^>]*>([\s\S]*?)<\/item>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null && out.length < maxItems) {
    const block = m[1]
    const rawTitle = extractXmlField(block, 'title')
    const link = extractXmlField(block, 'link') || extractXmlField(block, 'guid')
    const title = decodeHtmlEntities(stripTags(rawTitle))
      .replace(/\s+/g, ' ')
      .trim()
    if (title.length < 16) continue
    if (/^(RPP|RSS|Podcast|Video|Audio)\b/i.test(title)) continue
    const key = title.toLowerCase().slice(0, 80)
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      title,
      link: normalizarLinkNoticia(link),
    })
  }
  return out
}

export async function obtenerTitularesPeru(maxItems = 40): Promise<{
  items: TitularNoticia[]
  fuenteNombre: string
  fuenteUrl: string
}> {
  const items: TitularNoticia[] = []
  const seen = new Set<string>()
  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url, {
        headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
        next: { revalidate: 300 },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const parsed = parseTitularesDesdeRss(xml, maxItems)
      for (const it of parsed) {
        const k = it.title.toLowerCase().slice(0, 80)
        if (seen.has(k)) continue
        seen.add(k)
        items.push(it)
        if (items.length >= maxItems) break
      }
    } catch {
      // siguiente feed
    }
    if (items.length >= maxItems) break
  }
  return {
    items,
    fuenteNombre: FEEDS[0].nombre,
    fuenteUrl: FEEDS[0].sitio,
  }
}
