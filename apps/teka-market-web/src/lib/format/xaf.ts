const XAF_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XAF',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/**
 * Formate un montant XAF (entier, 0 décimale ISO 4217) en chaîne lisible.
 *
 * @example formatXaf(15000)    → "15 000 FCFA"
 * @example formatXaf(0)        → "0 FCFA"
 * @example formatXaf(null)     → "—"
 *
 * Hypothèse Vague 1 : Medusa renvoie les montants XAF en entier (pas × 100).
 * Si Medusa renvoie des centièmes, ajouter `formatXafFromAmount(amount, currency)`
 * qui divise selon `decimal_digits`.
 */
export function formatXaf(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  // Intl renvoie "15 000 XAF" → on substitue "XAF" par "FCFA"
  // (suffix attendu côté Congo : FCFA, pas XAF).
  return XAF_FORMATTER.format(amount).replace('XAF', 'FCFA')
}

/**
 * Parse une string XAF en entier. Tolérant aux espaces fines (U+202F),
 * espaces normaux, et suffix FCFA/XAF n'importe où dans la chaîne.
 *
 * @example parseXaf("15 000 FCFA") → 15000
 * @example parseXaf("FCFA 1 234")  → 1234
 * @example parseXaf("invalid")     → null
 */
export function parseXaf(input: string): number | null {
  const cleaned = input.replace(/[^\d]/g, '')
  if (!cleaned) return null
  const n = parseInt(cleaned, 10)
  return Number.isFinite(n) ? n : null
}
