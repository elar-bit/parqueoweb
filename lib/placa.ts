/** Quita guiones y caracteres no alfanuméricos; mayúsculas. Ej.: "AbC-12d" → "ABC12D" */
export function normalizarPlacaClave(placa: string): string {
  return placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

export const MENSAJE_PLACA_DUPLICADA =
  'Ya existe un registro para esa misma placa.'

export const MENSAJE_PLACA_LONGITUD =
  'La placa debe tener exactamente 6 caracteres alfanuméricos (puede incluir un guion entre letras y números).'
