import { describe, it, expect } from 'vitest'
import { formatXaf, parseXaf } from './xaf'

describe('formatXaf', () => {
  it('formate 0 avec le suffix FCFA (espace tolérante)', () => {
    // Intl fr-FR retourne U+00A0 ou U+202F entre le nombre et le suffix.
    expect(formatXaf(0)).toMatch(/^0\sFCFA$/u)
  })

  it('formate 15000 avec un séparateur de milliers et le suffix FCFA', () => {
    // L'Intl peut renvoyer espace normal (U+0020) ou espace fine (U+202F)
    // selon la version Node. Le test tolère les deux.
    expect(formatXaf(15000)).toMatch(/^15.000\sFCFA$/u)
  })

  it('formate un grand nombre', () => {
    expect(formatXaf(1234567)).toMatch(/^1.234.567\sFCFA$/u)
  })

  it('retourne — pour null', () => {
    expect(formatXaf(null)).toBe('—')
  })

  it('retourne — pour undefined', () => {
    expect(formatXaf(undefined)).toBe('—')
  })

  it('retourne — pour NaN', () => {
    expect(formatXaf(NaN)).toBe('—')
  })

  it('ne contient jamais le code "XAF" brut', () => {
    expect(formatXaf(100)).not.toContain('XAF')
  })
})

describe('parseXaf', () => {
  it('parse "15 000 FCFA" en 15000', () => {
    expect(parseXaf('15 000 FCFA')).toBe(15000)
  })

  it('parse "FCFA 1 234" en 1234', () => {
    expect(parseXaf('FCFA 1 234')).toBe(1234)
  })

  it('parse "0" en 0', () => {
    expect(parseXaf('0')).toBe(0)
  })

  it('retourne null pour string sans chiffres', () => {
    expect(parseXaf('invalid')).toBeNull()
  })

  it('retourne null pour string vide', () => {
    expect(parseXaf('')).toBeNull()
  })
})
