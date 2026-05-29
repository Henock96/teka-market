import { formatXaf } from "@/lib/format/xaf"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

/**
 * Legacy helper conservé pour compatibilité avec les composants existants.
 *
 * Teka-Market est XAF-only : les paramètres `currency_code`, `locale`,
 * `minimumFractionDigits` et `maximumFractionDigits` sont ignorés, et le
 * formatage délègue à `formatXaf` (entier, 0 décimale, suffix FCFA).
 *
 * Pour le nouveau code, importer directement `formatXaf` depuis
 * `@/lib/format/xaf` plutôt que ce wrapper.
 */
export const convertToLocale = ({ amount }: ConvertToLocaleParams) => {
  return formatXaf(amount)
}
