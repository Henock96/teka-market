# Teka-Market Vague 2.1 — Frontend Cleanup + Identité — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nettoyer le storefront `apps/teka-market-web` (deps mortes, strings hardcodées, formatage devise) et appliquer l'identité visuelle Teka-Market (palette encre/solaire/terracotta/crème, wordmark, hero refondu) + traduire les pages template en fr-FR.

**Architecture :** 4 PRs en cascade sur la branche `feature/vague-2-1-cleanup-identite`. PR1 pose les fondations invisibles (`knip`, `next-intl` strict fr-FR, helper `formatXaf`). PR2-3 appliquent l'identité visuelle via override des palettes brutes dans `colors.css` (zéro composant Mercur patché pour la couleur). PR4 traduit les pages auth/account/errors.

**Tech Stack :** Next.js 15 (Turbopack), React 19, Tailwind 3.4, `next-intl` (configuré strict fr-FR), `Funnel Display` (Google Font déjà importée), Vitest (ajouté), `knip` (devDep ajoutée), `bun` (package manager racine).

**Spec source :** [docs/superpowers/specs/2026-05-29-teka-market-vague-2-1-frontend-cleanup-identite-design.md](../specs/2026-05-29-teka-market-vague-2-1-frontend-cleanup-identite-design.md)

**Conventions :**
- Tous les chemins relatifs partent de `/Users/henokmipoks/Desktop/mercurjs/teka-market/` sauf indication contraire.
- Commits suivent la convention `<type>(<scope>): <subject>` avec footer `Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>`.
- Le segment URL `[locale]` est en fait un **code pays Medusa** (figé sur `cg` en Vague 1), pas un code langue. NE PAS le renommer.

---

## PR1 — Foundations invisibles (`feature/v2-1/foundations`)

### Task 1 : Créer la branche et baseline

**Files :** aucune modification de fichier

- [ ] **Step 1 : Vérifier l'état du repo**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git status
git branch --show-current
```

Expected : working tree clean sur `dev` (ou autre branche stable). Si dirty, stash ou commit avant.

- [ ] **Step 2 : Créer la branche d'exécution**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git checkout -b feature/v2-1/foundations
```

Expected : `Switched to a new branch 'feature/v2-1/foundations'`.

- [ ] **Step 3 : Mesurer la baseline Lighthouse (référence avant rebranding)**

Démarre le storefront en dev :
```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Dans Chrome DevTools : ouvrir `http://localhost:3000`, mode mobile 375px, Lighthouse → Performance/Accessibilité (mobile). Sauvegarder le rapport HTML dans `docs/superpowers/plans/baselines/2026-05-29-lighthouse-home-before-v2-1.html`. Stopper le serveur (Ctrl+C).

Expected : rapport sauvegardé pour comparaison ultérieure (PR2). Si le storefront crashe à cause de la régression Vague 1 (Algolia, autre), noter dans le commentaire de PR1 et continuer sans baseline (mesure post-PR1 servira de baseline).

### Task 2 : Setup `knip` + audit initial

**Files :**
- Create : `knip.json`
- Modify : `package.json` (racine — ajout devDep + script)

- [ ] **Step 1 : Installer knip en devDep racine**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun add -D -w knip
```

(`-w` cible le workspace racine. Si l'installation échoue avec `-w` selon la version de bun, retirer le flag.)

Expected : `knip` ajouté dans `package.json` racine, `bun.lock` mis à jour.

- [ ] **Step 2 : Créer `knip.json` à la racine**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/knip.json` :

```json
{
  "$schema": "https://unpkg.com/knip/schema.json",
  "workspaces": {
    "apps/teka-market-web": {
      "entry": [
        "src/app/**/{page,layout,route,loading,error,not-found,global-error}.tsx",
        "src/middleware.ts",
        "next.config.ts"
      ],
      "project": ["src/**/*.{ts,tsx}"],
      "ignoreDependencies": [
        "@chromatic-com/storybook",
        "prettier-plugin-tailwindcss"
      ]
    }
  }
}
```

- [ ] **Step 3 : Ajouter le script `audit:knip` dans `package.json` racine**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/package.json` — ajouter dans `"scripts"` :

```json
"audit:knip": "knip"
```

- [ ] **Step 4 : Lancer l'audit, capturer le rapport**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run audit:knip > /tmp/knip-initial.txt 2>&1 || true
cat /tmp/knip-initial.txt
```

Expected : rapport listant deps inutilisées (probables : `talkjs`, `@talkjs/react`, `react-i18next`, `i18next`), fichiers orphelins, exports inutilisés. **Lire le rapport, ne rien supprimer encore — c'est la base de Task 3.**

- [ ] **Step 5 : Commit setup knip**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add knip.json package.json bun.lock
git commit -m "chore(web): add knip + audit:knip script

Setup knip in workspace root with entry points covering Next.js
app router. Will drive the cleanup of dead deps and components in
subsequent tasks.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 3 : Supprimer deps mortes et composants orphelins

**Files :**
- Modify : `apps/teka-market-web/package.json` (retirer deps inutilisées)
- Delete : composants orphelins identifiés par knip
- Delete : assets template inutilisés dans `public/`

- [ ] **Step 1 : Re-générer un rapport knip propre**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run audit:knip 2>&1 | tee /tmp/knip-task3.txt
```

Lire la section "Unused dependencies" et "Unused files". Pour chaque dep listée, valider avec `grep` qu'aucun import résiduel n'existe :

```bash
grep -RE "from ['\"]<dep-name>" apps/teka-market-web/src || echo "OK : aucun import"
```

- [ ] **Step 2 : Retirer les deps mortes attendues**

Si présentes dans `apps/teka-market-web/package.json`, retirer (modifier le JSON manuellement, ne pas garder de virgule pendante) :

- `@talkjs/react`
- `talkjs`
- `react-i18next`
- `i18next`
- `i18next-browser-languagedetector`

Pour chaque dep effectivement retirée, exécuter :

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web
bun remove @talkjs/react talkjs react-i18next i18next i18next-browser-languagedetector 2>/dev/null || true
```

(`|| true` car bun échoue si la dep n'existe pas — sans bloquer.)

Re-`bun install` depuis la racine pour reconcilier :
```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun install
```

Expected : `bun.lock` mis à jour, `node_modules` purgé des deps retirées.

- [ ] **Step 3 : Vérifier qu'aucun import résiduel ne casse le build**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run build --filter=@teka/web 2>&1 | tail -40
```

Si erreur "Cannot find module 'talkjs'" ou similaire → trouver le fichier en cause et le supprimer ou retirer l'import :

```bash
grep -RE "from ['\"]talkjs|from ['\"]i18next|from ['\"]react-i18next" apps/teka-market-web/src -l
```

Pour chaque fichier remonté : si c'est un composant entier (chat seller, talkjs provider), le supprimer avec `rm`. Si c'est un import isolé dans un composant utile, retirer juste la ligne d'import et le code mort associé.

Expected : `bun run build --filter=@teka/web` passe vert.

- [ ] **Step 4 : Supprimer les assets template inutilisés**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/public
rm -f B2C_Storefront_Open_Graph.png algolia-import.png talkjs-placeholder.jpg \
      Logo.png Logo.svg file.svg globe.svg next.svg vercel.svg window.svg
```

Vérifier qu'aucun de ces assets n'est référencé en dur dans le code :

```bash
grep -RE "Logo\.svg|talkjs-placeholder|B2C_Storefront|algolia-import" apps/teka-market-web/src || echo "OK : aucune référence"
```

Si une référence remonte → la patcher (remplacer par un placeholder ou retirer le `<Image>` selon contexte). Le futur `og-teka.png` (PR4) remplacera l'Open Graph.

- [ ] **Step 5 : Supprimer les composants orphelins listés par knip**

Re-lancer `bun run audit:knip` et pour chaque fichier listé sous "Unused files" :
1. Vérifier qu'il n'est pas en réalité lazy-loadé (`grep -r "<basename>" apps/teka-market-web/src/app` pour confirmer absence).
2. Si confirmé orphelin → `rm <path>`.
3. Si le composant a une story Storybook associée (`*.stories.tsx`), supprimer aussi la story.

Re-build pour vérifier :

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run build --filter=@teka/web
```

Expected : build vert. Si erreur, restaurer le dernier fichier supprimé via `git checkout` et passer au suivant.

- [ ] **Step 6 : Commit cleanup**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "chore(web): remove dead deps, orphan components, template assets

- Removed Talkjs (@talkjs/react, talkjs) and any residual chat seller code
- Removed unused react-i18next + i18next stack (next-intl will be wired
  properly in a follow-up task)
- Removed template assets (Mercur logos, Next.js default svgs, algolia
  preview image, talkjs placeholder)
- Removed orphan components flagged by knip

Driven by: bun run audit:knip

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 4 : Configurer `next-intl` strict fr-FR

**Files :**
- Create : `apps/teka-market-web/messages/fr.json`
- Create : `apps/teka-market-web/src/i18n/request.ts`
- Modify : `apps/teka-market-web/next.config.ts`
- Modify : `apps/teka-market-web/src/app/layout.tsx`

- [ ] **Step 1 : Créer le squelette de `messages/fr.json`**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/messages/fr.json` avec ce contenu de base (les clés s'enrichiront au fur et à mesure des autres tâches) :

```json
{
  "common": {
    "cta": {
      "addToCart": "Ajouter au panier",
      "viewSeller": "Voir le vendeur",
      "discover": "Découvrir",
      "continueShopping": "Continuer mes achats",
      "reload": "Recharger",
      "backHome": "Retour à l'accueil"
    },
    "currency": {
      "free": "Gratuit",
      "unavailable": "—"
    },
    "loading": "Chargement…"
  },
  "navbar": {
    "search": "Rechercher",
    "account": "Mon compte",
    "cart": "Panier",
    "menu": "Menu"
  },
  "footer": {
    "tagline": "Marketplace nationale Congo-Brazzaville",
    "copyright": "© {year} Teka-Market",
    "payments": {
      "label": "Paiements acceptés",
      "momo": "MoMo",
      "airtel": "Airtel Money"
    },
    "legal": {
      "cgu": "Conditions d'utilisation",
      "cgv": "Conditions de vente",
      "mentions": "Mentions légales"
    }
  },
  "home": {
    "hero": {
      "kicker": "— Marketplace nationale",
      "title": "Le Congo qui vend.",
      "paragraph": "Des centaines de vendeurs locaux, livraison à Brazzaville et au-delà. Paiement MoMo et Airtel.",
      "cta": "Découvrir"
    },
    "trust": {
      "delivery": "Livraison locale",
      "momo": "MoMo",
      "airtel": "Airtel"
    }
  },
  "product": {
    "stockStatus": {
      "inStock": "En stock",
      "lowStock": "Plus que {count} en stock",
      "outOfStock": "Rupture de stock"
    },
    "deliveryInfo": "Livré depuis Brazzaville sous 24-48h"
  },
  "cart": {
    "title": "Mon panier",
    "empty": {
      "title": "Votre panier est vide.",
      "cta": "Voir les produits"
    },
    "summary": {
      "subtotal": "Sous-total",
      "shipping": "Livraison",
      "tax": "TVA",
      "total": "Total"
    }
  },
  "auth": {
    "signin": {
      "kicker": "— Bienvenue",
      "title": "Se connecter",
      "email": "Adresse e-mail",
      "password": "Mot de passe",
      "submit": "Se connecter",
      "noAccount": "Pas encore de compte ?",
      "createAccount": "Créer un compte",
      "forgotPassword": "Mot de passe oublié ?"
    },
    "signup": {
      "title": "Créer un compte Teka-Market",
      "submit": "Créer mon compte"
    },
    "reset": {
      "title": "Mot de passe oublié ?",
      "submit": "Réinitialiser"
    }
  },
  "account": {
    "title": "Mon compte",
    "sections": {
      "orders": "Mes commandes",
      "addresses": "Mes adresses",
      "payments": "Mes paiements MoMo / Airtel",
      "profile": "Mon profil",
      "signout": "Se déconnecter"
    },
    "paymentsNote": "Les paiements MoMo et Airtel arrivent prochainement."
  },
  "errors": {
    "notFound": {
      "title": "Cette page n'existe pas.",
      "subtitle": "Le lien est peut-être obsolète."
    },
    "generic": {
      "title": "Une erreur s'est produite.",
      "subtitle": "Quelque chose n'a pas fonctionné. Réessaie."
    }
  },
  "legal": {
    "comingSoon": "Cette page sera disponible à la Vague 3."
  }
}
```

- [ ] **Step 2 : Créer `src/i18n/request.ts` (config next-intl App Router)**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/i18n/request.ts` :

```ts
import { getRequestConfig } from 'next-intl/server'

// Teka-Market est strictement fr-FR en V2.1.
// Le segment URL [locale] représente un CODE PAYS Medusa (cg), pas une langue.
// next-intl fournit ici les messages indépendamment du segment URL.
export default getRequestConfig(async () => ({
  locale: 'fr',
  messages: (await import('../../messages/fr.json')).default,
}))
```

- [ ] **Step 3 : Brancher le plugin `next-intl` dans `next.config.ts`**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/next.config.ts`. Voici le pattern à appliquer (lire le fichier avant pour fusionner proprement) :

```ts
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

// ... config existante ...

export default withNextIntl(nextConfig)
```

(Si `next.config.ts` exporte déjà via `export default`, wrapper la valeur exportée avec `withNextIntl(...)`.)

- [ ] **Step 4 : Ajouter `NextIntlClientProvider` dans `layout.tsx`**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/layout.tsx`. Importer en haut :

```ts
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
```

Dans le `RootLayout`, juste avant le `return` :

```ts
const messages = await getMessages()
```

Wrapper le `<body>` enfants avec :

```tsx
<NextIntlClientProvider locale="fr" messages={messages}>
  {/* contenu existant */}
</NextIntlClientProvider>
```

- [ ] **Step 5 : Vérifier que ça démarre**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Ouvrir `http://localhost:3000/cg` (ou `http://localhost:3000/` qui redirige). Aucune erreur next-intl dans la console. Stopper le serveur (Ctrl+C).

Expected : home charge, navbar visible (en anglais encore — c'est normal, les composants ne sont pas i18n-isés encore, c'est la PR2-3).

- [ ] **Step 6 : Commit i18n setup**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/messages/fr.json \
        apps/teka-market-web/src/i18n/request.ts \
        apps/teka-market-web/next.config.ts \
        apps/teka-market-web/src/app/layout.tsx
git commit -m "feat(web/i18n): wire next-intl strict fr-FR

- Created messages/fr.json with full namespace skeleton (common,
  navbar, footer, home, product, cart, auth, account, errors, legal)
- Created src/i18n/request.ts (App Router config)
- Branched next.config.ts via createNextIntlPlugin
- Wrapped layout.tsx body with NextIntlClientProvider

Components will be migrated to useTranslations() in PR2-3 as their
identity is refonded.

Note: the [locale] URL segment is a Medusa COUNTRY code (cg), not a
language code. next-intl works independently of URL routing.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 5 : Implémenter `formatXaf` + tests Vitest

**Files :**
- Create : `apps/teka-market-web/src/lib/format/xaf.ts`
- Create : `apps/teka-market-web/src/lib/format/xaf.test.ts`
- Create : `apps/teka-market-web/vitest.config.ts`
- Modify : `apps/teka-market-web/package.json` (devDep Vitest + script `test`)

- [ ] **Step 1 : Installer Vitest**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web
bun add -D vitest @vitest/coverage-v8
```

Expected : `vitest` ajouté dans `apps/teka-market-web/package.json` devDeps.

- [ ] **Step 2 : Créer `vitest.config.ts`**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/vitest.config.ts` :

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3 : Ajouter le script `test` dans `apps/teka-market-web/package.json`**

Modifier `apps/teka-market-web/package.json` — ajouter dans `"scripts"` :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4 : Écrire le test (RED)**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/lib/format/xaf.test.ts` :

```ts
import { describe, it, expect } from 'vitest'
import { formatXaf, parseXaf } from './xaf'

describe('formatXaf', () => {
  it('formate 0 en "0 FCFA"', () => {
    expect(formatXaf(0)).toBe('0 FCFA')
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
```

- [ ] **Step 5 : Run test → RED**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web
bun run test
```

Expected : FAIL avec `Cannot find module './xaf'` ou `formatXaf is not exported`.

- [ ] **Step 6 : Implémenter `xaf.ts` (GREEN)**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/lib/format/xaf.ts` :

```ts
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
```

- [ ] **Step 7 : Run test → GREEN**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web
bun run test
```

Expected : 12 tests passed.

- [ ] **Step 8 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/vitest.config.ts \
        apps/teka-market-web/src/lib/format/xaf.ts \
        apps/teka-market-web/src/lib/format/xaf.test.ts \
        apps/teka-market-web/package.json \
        bun.lock
git commit -m "feat(web): add formatXaf helper + Vitest setup

- formatXaf(amount): Intl.NumberFormat fr-FR with XAF → FCFA substitution,
  returns '—' for null/undefined/NaN. Format: '15 000 FCFA'.
- parseXaf(input): reverse helper for forms, tolerant of fine spaces and
  suffix position.
- Vitest configured for src/**/*.test.ts. 12 unit tests covering edge
  cases (null/undefined/NaN, large numbers, zero, parse errors).

Refs Vague 1 §A.6: XAF is stored as integer (no × 100).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 6 : Audit et remplacement des sites de formatage prix existants

**Files :**
- Modify : tous les composants utilisant `toLocaleString`, `Intl.NumberFormat` sur un prix

- [ ] **Step 1 : Auditer les sites de formatage**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "(toLocaleString|new Intl\\.NumberFormat)" apps/teka-market-web/src -l > /tmp/format-audit.txt
cat /tmp/format-audit.txt
```

Lister tous les fichiers. Pour chacun, lire et identifier si la chose formatée est un **prix** (montant en devise). Les `toLocaleString` sur des **dates** ou **stocks** sont hors-scope.

- [ ] **Step 2 : Remplacer chaque occurrence par `formatXaf`**

Pour chaque fichier identifié comme manipulant un prix :

1. Ajouter l'import en haut :
   ```ts
   import { formatXaf } from '@/lib/format/xaf'
   ```
2. Remplacer le call site. Exemple typique :
   ```ts
   // AVANT
   const formatted = price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
   // APRÈS
   const formatted = formatXaf(price)
   ```
3. Si le code récupérait la devise depuis `region.currency_code` pour piloter `Intl`, simplifier : la devise est figée XAF côté Congo.

- [ ] **Step 3 : Vérifier qu'aucun formatage devise résiduel ne traîne**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "(toLocaleString.*currency|new Intl\\.NumberFormat.*currency)" apps/teka-market-web/src && echo "ENCORE DES OCCURRENCES À TRAITER" || echo "OK : zéro formatage devise résiduel"
```

Expected : `OK : zéro formatage devise résiduel`.

- [ ] **Step 4 : Run build pour vérifier la non-régression**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run build --filter=@teka/web 2>&1 | tail -20
```

Expected : build vert.

- [ ] **Step 5 : Run tests**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web
bun run test
```

Expected : 12/12 passent.

- [ ] **Step 6 : Commit + ouvrir la PR1**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "chore(web): replace all currency formatting with formatXaf

Audited every site using toLocaleString / Intl.NumberFormat for a
price-like value and replaced with the centralized formatXaf helper.
Components no longer carry region-dependent formatting logic — Teka
is XAF-only.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

git push -u origin feature/v2-1/foundations
gh pr create --base dev --head feature/v2-1/foundations \
  --title "Vague 2.1 PR1 — Foundations (knip, i18n fr-FR, formatXaf)" \
  --body "First of 4 PRs for Vague 2.1.

## What

- **knip** setup (workspace root config + audit:knip script)
- **Cleanup** : Talkjs residue, react-i18next/i18next removed, template
  assets purged, orphan components removed
- **next-intl** wired strict fr-FR (messages/fr.json, request.ts,
  NextIntlClientProvider in layout)
- **formatXaf / parseXaf** helper + Vitest tests
- All price formatting sites migrated to formatXaf

## Verification

- [x] bun run build --filter=@teka/web passes
- [x] bun run test passes (12/12)
- [x] grep audit confirms zero residual currency formatting
- [x] No talkjs, react-i18next, i18next in package.json or imports

## Out of scope (next PRs)

- Identity/palette (PR2-3)
- French translation of components (PR2-3 as they're refondées)
- Template pages auth/account/errors (PR4)

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## PR2 — Identité visuelle : palette + home (`feature/v2-1/identity-home`)

**Pré-requis :** PR1 mergée dans `dev`. Sinon, brancher PR2 sur la HEAD de PR1.

### Task 7 : Créer la branche PR2 et override `colors.css`

**Files :**
- Modify : `apps/teka-market-web/src/app/colors.css`

- [ ] **Step 1 : Créer la branche depuis dev (ou PR1 si non mergée)**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git checkout dev   # ou feature/v2-1/foundations
git pull
git checkout -b feature/v2-1/identity-home
```

- [ ] **Step 2 : Override la couche basse de `colors.css` (palettes brutes)**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/colors.css`.

**Stratégie :** garder la structure 2-couches du template (palettes brutes → tokens sémantiques). On ne touche QUE la 1ʳᵉ couche (`--neutral-*`, `--brand-*`, `--red-*`, `--green-*`, `--yellow-*`, `--blue-*`). Les tokens sémantiques (`--bg-action-primary`, etc.) restent en `var(--xxx)` et résolvent automatiquement vers la nouvelle palette.

Remplacer le premier bloc `:root { /* Neutral... */ ... }` (lignes ~1-81) par :

```css
:root {
    /* Neutral — base crème/sable/encre Teka */
    --neutral-0: 255, 255, 255;
    --neutral-25: 250, 250, 247;    /* #FAFAF7 crème (background page) */
    --neutral-50: 245, 242, 234;
    --neutral-100: 229, 226, 218;   /* #E5E2DA sable (bordures, fonds 2nd) */
    --neutral-200: 217, 213, 200;
    --neutral-300: 175, 170, 158;
    --neutral-400: 130, 140, 155;
    --neutral-500: 80, 88, 100;
    --neutral-600: 50, 60, 75;
    --neutral-700: 30, 42, 58;
    --neutral-800: 20, 32, 48;
    --neutral-900: 13, 27, 42;       /* #0D1B2A encre */
    --neutral-1000: 5, 12, 22;

    /* Brand — solaire (CTA primaire) */
    --brand-25: 255, 250, 225;
    --brand-50: 254, 240, 180;
    --brand-100: 252, 225, 130;
    --brand-200: 248, 208, 80;
    --brand-300: 245, 195, 40;
    --brand-400: 242, 183, 1;        /* #F2B701 solaire (CTA primaire) */
    --brand-500: 224, 168, 0;        /* hover */
    --brand-600: 200, 150, 0;        /* pressed */
    --brand-700: 170, 128, 0;
    --brand-800: 140, 105, 0;
    --brand-900: 100, 75, 0;

    /* Red — soldes, erreurs */
    --red-25: 254, 240, 240;
    --red-50: 253, 220, 222;
    --red-100: 252, 192, 196;
    --red-200: 249, 155, 161;
    --red-300: 244, 110, 119;
    --red-400: 238, 80, 92;
    --red-500: 230, 57, 70;          /* #E63946 sale/erreur */
    --red-600: 200, 40, 53;
    --red-700: 170, 30, 42;
    --red-800: 135, 22, 33;
    --red-900: 90, 14, 22;

    /* Green — succès / validation */
    --green-25: 235, 248, 240;
    --green-50: 210, 240, 220;
    --green-100: 180, 225, 195;
    --green-200: 140, 205, 165;
    --green-300: 95, 180, 125;
    --green-400: 60, 152, 95;
    --green-500: 40, 130, 75;
    --green-600: 30, 110, 60;
    --green-700: 27, 94, 32;          /* vert validation */
    --green-800: 20, 75, 25;
    --green-900: 12, 50, 16;

    /* Yellow — warnings (réutilise solaire) */
    --yellow-25: 255, 250, 225;
    --yellow-50: 254, 240, 180;
    --yellow-100: 252, 225, 130;
    --yellow-200: 248, 208, 80;
    --yellow-300: 245, 195, 40;
    --yellow-400: 242, 183, 1;
    --yellow-500: 224, 168, 0;
    --yellow-600: 200, 150, 0;
    --yellow-700: 170, 128, 0;
    --yellow-800: 140, 105, 0;
    --yellow-900: 100, 75, 0;

    /* Blue — info, repurposed en terracotta (accent éditorial Teka) */
    --blue-25: 250, 240, 232;
    --blue-50: 245, 224, 207;
    --blue-100: 235, 200, 175;
    --blue-200: 220, 170, 140;
    --blue-300: 205, 145, 105;
    --blue-400: 195, 125, 80;
    --blue-500: 184, 107, 58;        /* #B86B3A terracotta (liens) */
    --blue-600: 160, 92, 48;
    --blue-700: 135, 78, 38;
    --blue-800: 110, 62, 30;
    --blue-900: 75, 42, 20;
}
```

Le 2ᵉ bloc (`:root { --bg-primary: var(--neutral-0); ... }`) **n'est PAS modifié**. Le mapping sémantique reste intact, les composants Mercur continuent à fonctionner sans modif.

**Note importante :** `--brand-900` (utilisé par les CTA primaires via `--bg-action-primary`) passe de noir à `#644B00` (solaire foncé). On ajustera le mapping `--bg-action-primary` ci-dessous pour pointer vers `--brand-400` (solaire pur) au lieu de `--brand-900`.

- [ ] **Step 3 : Ajuster le mapping `--bg-action-primary` vers le solaire pur**

Toujours dans `colors.css`, dans le 2ᵉ bloc `:root`, remplacer :

```css
--bg-action-primary: var(--brand-900);
--bg-action-primary-hover: var(--brand-800);
--bg-action-primary-pressed: var(--brand-700);
```

par :

```css
--bg-action-primary: var(--brand-400);        /* solaire #F2B701 */
--bg-action-primary-hover: var(--brand-500);  /* hover */
--bg-action-primary-pressed: var(--brand-600);/* pressed */
```

Idem pour le **texte sur bouton primaire** : remplacer

```css
--content-action-on-primary: var(--brand-25);
```

par :

```css
--content-action-on-primary: var(--neutral-900);  /* texte encre sur bouton solaire */
```

Et pour la **bordure action** (liens) :

```css
--border-action: var(--brand-900);
```

par :

```css
--border-action: var(--blue-500);  /* terracotta */
```

Pour les **liens** (`--content-action-primary`) :

```css
--content-action-primary: var(--brand-900);
--content-action-primary-hover: var(--brand-800);
--content-action-primary-pressed: var(--brand-700);
```

par :

```css
--content-action-primary: var(--blue-500);     /* terracotta */
--content-action-primary-hover: var(--blue-600);
--content-action-primary-pressed: var(--blue-700);
```

- [ ] **Step 4 : Démarrer le storefront, vérifier visuellement**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Ouvrir `http://localhost:3000`. La page entière doit avoir basculé en palette Teka :
- Fond crème
- Boutons primaires solaires avec texte encre
- Liens terracotta
- Texte principal encre

Si la couleur d'un bouton reste noire → un composant a un hex en dur. À traiter au Task 8+ ou retracer en Step 5.

- [ ] **Step 5 : Grep des hex en dur résiduels**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "#[0-9a-fA-F]{6}\\b" apps/teka-market-web/src/components apps/teka-market-web/src/app 2>/dev/null | grep -v "colors.css" | head -30
```

Lister les hex en dur. Pour chacun, soit le composant est refondu dans une tâche suivante (laisser), soit c'est un orphelin à patcher immédiatement vers une CSS var.

- [ ] **Step 6 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/src/app/colors.css
git commit -m "feat(web/identity): override colors.css with Teka palette

Replaced the raw palette layer (neutral, brand, red, green, yellow,
blue) with Teka values while keeping the semantic token mapping
intact. Net effect:

- Background : cream #FAFAF7
- Text       : ink #0D1B2A
- Primary CTA: solar #F2B701 with ink text
- Links      : terracotta #B86B3A
- Sale/error : red #E63946
- Borders    : sand #E5E2DA

Adjusted --bg-action-primary to point at --brand-400 (solar) instead
of --brand-900 (was used for dark CTA in template), and switched
links to terracotta via the 'blue-*' channel repurposed.

Zero component patched for the color change — only colors.css.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 8 : Étendre `tailwind.config.ts` (couleurs littérales + fontFamily)

**Files :**
- Modify : `apps/teka-market-web/tailwind.config.ts`

- [ ] **Step 1 : Ajouter le namespace `teka` et `fontFamily`**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/tailwind.config.ts`. Dans `theme.extend`, ajouter (en complément de l'existant) :

```ts
colors: {
  // ... existing semantic colors ...
  teka: {
    cream:      '#FAFAF7',
    ink:        '#0D1B2A',
    sun:        '#F2B701',
    terracotta: '#B86B3A',
    sand:       '#E5E2DA',
    sale:       '#E63946',
  },
},
fontFamily: {
  display: ['var(--font-funnel-sans)', 'sans-serif'],
  serif:   ['ui-serif', 'Georgia', 'serif'],
},
```

**Fusion attentive :** la clé `colors` existe déjà dans `extend`. NE PAS la dupliquer — ajouter la sous-clé `teka` dans l'objet existant.

- [ ] **Step 2 : Vérifier le build**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run build --filter=@teka/web 2>&1 | tail -10
```

Expected : build vert.

- [ ] **Step 3 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/tailwind.config.ts
git commit -m "feat(web/identity): extend tailwind with teka.* literal palette

- Added teka.{cream,ink,sun,terracotta,sand,sale} for components that
  need a literal color (e.g. badge backgrounds, halos).
- Added fontFamily.display (Funnel Display) and .serif (system serif
  for italic taglines).

Semantic tokens (bg-action-*, content-*) still drive 95% of styling.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 9 : Refondre `app/layout.tsx` (lang fr, metadata Teka, fonte)

**Files :**
- Modify : `apps/teka-market-web/src/app/layout.tsx`

- [ ] **Step 1 : Lire l'état actuel du layout**

```bash
cat /Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/layout.tsx
```

(Le fichier a été lu plus haut dans la session — il contient `htmlLang = 'en'`, metadata avec fallback "Mercur B2C Demo".)

- [ ] **Step 2 : Patcher `htmlLang` et `metadata`**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/layout.tsx`. Remplacer :

```ts
const htmlLang = 'en';
```

par :

```ts
const htmlLang = 'fr'
```

Remplacer le bloc `metadata` par :

```ts
export const metadata: Metadata = {
  title: {
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || 'Teka-Market'}`,
    default: process.env.NEXT_PUBLIC_SITE_NAME || 'Teka-Market',
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    'Marketplace nationale Congo-Brazzaville. Achetez auprès de vendeurs locaux, payez par MoMo ou Airtel.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Teka-Market',
    images: ['/og-teka.png'],
  },
  alternates: {
    languages: {
      'fr-FR': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    },
  },
}
```

(L'image `/og-teka.png` sera produite en PR4. En attendant, le lien 404 est acceptable — pas de crash, juste un Open Graph sans visuel.)

- [ ] **Step 3 : Vérifier le rendu**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Ouvrir `http://localhost:3000`. Inspecter le `<html>` → attribute `lang="fr"`. Onglet → titre "Teka-Market".

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/src/app/layout.tsx
git commit -m "feat(web): set lang=fr + Teka metadata in root layout

- <html lang='fr'>
- title defaults to 'Teka-Market'
- description: marketplace nationale Congo-Brazzaville
- openGraph locale fr_FR, image /og-teka.png (produced in PR4)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 10 : Refondre la NavBar + wordmark `TEKA·MARKET`

**Files :**
- Modify : `apps/teka-market-web/src/components/molecules/NavBar/` ou équivalent (à localiser)

- [ ] **Step 1 : Localiser le composant Navbar actuel**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "Navbar|NavBar|TopBar|Header" apps/teka-market-web/src/components --include="*.tsx" -l | head -10
```

Lire le fichier qui contient le rendu top-of-page (logo + search + cart icons). Selon la structure du template, ce sera probablement `components/organisms/Header/` ou `components/molecules/Navbar/`.

- [ ] **Step 2 : Remplacer le rendu du logo par le wordmark**

Dans le composant Header/Navbar, repérer le rendu du logo (probablement `<Image src="/Logo.svg" ... />`). Remplacer par un wordmark texte :

```tsx
import Link from 'next/link'

// ...

<Link href="/" aria-label="Teka-Market accueil" className="font-display font-extrabold uppercase tracking-wider text-teka-ink text-lg leading-none">
  TEKA<span className="text-teka-sun">·</span>MARKET
</Link>
```

- [ ] **Step 3 : Remplacer les labels hardcodés par `useTranslations()`**

En haut du composant client (`'use client'` requis si interactif) :

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function Navbar(/* props */) {
  const t = useTranslations('navbar')
  // ...
}
```

Remplacer chaque label EN par `t('search')`, `t('account')`, `t('cart')`, `t('menu')` selon les positions.

Si le composant est server-component, utiliser `import { getTranslations } from 'next-intl/server'` et `const t = await getTranslations('navbar')`.

- [ ] **Step 4 : Vérifier la palette appliquée**

Le composant doit utiliser `bg-primary` (crème) pour le fond, `text-primary` (encre) pour les textes. Aucun hex en dur. Si présence de classes type `text-black`, `bg-white`, `text-gray-900` → remplacer par les sémantiques (`text-primary`, `bg-primary`, `text-secondary`).

- [ ] **Step 5 : Vérifier visuellement**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Naviguer sur `http://localhost:3000`. Wordmark `TEKA·MARKET` visible top-left, point solaire sur le `·`. Icônes search/account/cart à droite. Mobile 375px : pas de débordement.

- [ ] **Step 6 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond Navbar with TEKA·MARKET wordmark

- Replaced template logo with text wordmark (Funnel Display 800
  uppercase, ink letters, solar dot separator)
- Migrated labels (search, account, cart, menu) to useTranslations
- Switched all colors to semantic tokens (bg-primary, text-primary)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 11 : Refondre le Hero (kicker, halo solaire, trust strip)

**Files :**
- Modify : `apps/teka-market-web/src/components/sections/Hero/Hero.tsx`
- Modify : page home où Hero est consommé (passer les bons props i18n)

- [ ] **Step 1 : Refondre `Hero.tsx`**

Modifier `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/components/sections/Hero/Hero.tsx`. Remplacer son contenu par :

```tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function Hero() {
  const t = await getTranslations('home.hero')
  const trust = await getTranslations('home.trust')

  return (
    <section className="w-full bg-primary">
      <div className="container mx-auto px-4 py-8 lg:py-14 relative overflow-hidden">
        {/* Halo solaire */}
        <div
          aria-hidden
          className="absolute -top-10 -right-10 w-40 h-40 lg:w-64 lg:h-64 rounded-full bg-teka-sun opacity-60 pointer-events-none"
        />

        <div className="relative z-10 max-w-2xl">
          <div className="text-xs lg:text-sm font-semibold uppercase tracking-[3px] text-teka-terracotta mb-3">
            {t('kicker')}
          </div>

          <h1 className="font-display font-extrabold uppercase text-3xl lg:text-6xl leading-[1.05] text-primary mb-4 tracking-tight">
            {t('title')}
          </h1>

          <p className="text-base lg:text-lg text-secondary mb-6 max-w-md leading-relaxed">
            {t('paragraph')}
          </p>

          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-action-primary text-action-on-primary px-6 py-3 font-display font-extrabold uppercase text-sm tracking-wider rounded-xs hover:bg-action-hover transition-colors"
          >
            {t('cta')} <span aria-hidden>→</span>
          </Link>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-tertiary text-tertiary">
        <div className="container mx-auto px-4 py-3 flex justify-around text-xs lg:text-sm font-medium tracking-wide">
          <span>✓ {trust('delivery')}</span>
          <span>✓ {trust('momo')}</span>
          <span>✓ {trust('airtel')}</span>
        </div>
      </div>
    </section>
  )
}
```

**Notes :**
- Le hero est désormais un Server Component (pas de `'use client'`). Permet d'utiliser `getTranslations`.
- L'image template est retirée (les props `image`, `heading`, etc. ne sont plus utilisées). Si la home appelait `<Hero image=... heading=... />`, simplifier l'appel.

- [ ] **Step 2 : Patcher la page home si elle passait des props au Hero**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "<Hero\\b" apps/teka-market-web/src
```

Repérer le call site (probablement `app/[locale]/(main)/page.tsx`). Remplacer `<Hero image="..." heading="..." paragraph="..." buttons={[...]} />` par simplement `<Hero />`.

- [ ] **Step 3 : Supprimer ou refactorer `Hero.stories.tsx`**

Si `apps/teka-market-web/src/components/sections/Hero/Hero.stories.tsx` existe et passe des props désormais inutilisées, soit le mettre à jour pour la nouvelle API (sans props), soit le supprimer si Storybook n'est plus prioritaire :

```bash
rm apps/teka-market-web/src/components/sections/Hero/Hero.stories.tsx
```

(Choix par défaut : supprimer, Storybook hors-scope V2.1.)

- [ ] **Step 4 : Vérifier visuellement (mobile + desktop)**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Ouvrir `http://localhost:3000`. Hero affiche :
- Kicker terracotta uppercase "— MARKETPLACE NATIONALE"
- Titre "LE CONGO QUI VEND." en encre, uppercase, gros
- Paragraphe en gris
- CTA solaire avec texte encre "DÉCOUVRIR →"
- Halo solaire en haut à droite
- Trust strip encre sous le hero avec "✓ Livraison locale ✓ MoMo ✓ Airtel"

DevTools mobile 375px : pas de scroll horizontal, CTA cliquable.

- [ ] **Step 5 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond Hero with Teka design

- Server Component using getTranslations('home.hero')
- Layout: kicker (terracotta), title (display 800 uppercase), paragraph,
  CTA (solar/ink), with absolute solar halo top-right
- Trust strip below with MoMo / Airtel / Local delivery checkmarks
- Removed legacy props (image/heading/buttons) — content fully driven
  by messages/fr.json

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 12 : Refondre le Footer (mentions Congo, paiements)

**Files :**
- Modify : `apps/teka-market-web/src/components/molecules/Footer/...` (à localiser)

- [ ] **Step 1 : Localiser le Footer**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "export.*Footer\\b" apps/teka-market-web/src/components --include="*.tsx" -l
```

- [ ] **Step 2 : Refondre le contenu en Server Component**

Remplacer le contenu du composant Footer par :

```tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export async function Footer() {
  const t = await getTranslations('footer')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-tertiary text-tertiary mt-16">
      <div className="container mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <div className="font-display font-extrabold uppercase tracking-wider text-lg leading-none mb-2">
            TEKA<span className="text-teka-sun">·</span>MARKET
          </div>
          <p className="text-sm opacity-80">{t('tagline')}</p>
        </div>

        <div>
          <div className="text-xs uppercase tracking-widest opacity-70 mb-3">{t('payments.label')}</div>
          <ul className="text-sm space-y-1">
            <li>✓ {t('payments.momo')}</li>
            <li>✓ {t('payments.airtel')}</li>
          </ul>
        </div>

        <div>
          <ul className="text-sm space-y-2">
            <li><Link href="/legal/cgu" className="hover:underline">{t('legal.cgu')}</Link></li>
            <li><Link href="/legal/cgv" className="hover:underline">{t('legal.cgv')}</Link></li>
            <li><Link href="/legal/mentions-legales" className="hover:underline">{t('legal.mentions')}</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 py-4 text-xs opacity-70 text-center">
          {t('copyright', { year })}
        </div>
      </div>
    </footer>
  )
}
```

(Adapter l'export si le composant template utilise `export default`.)

- [ ] **Step 3 : Vérifier le rendu**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Scroller en bas de `http://localhost:3000`. Footer encre avec wordmark, paiements MoMo/Airtel, liens CGU/CGV/mentions, copyright avec année dynamique.

Les liens `/legal/*` 404 pour l'instant — c'est attendu, les stubs viennent en PR4.

- [ ] **Step 4 : Commit + mesure Lighthouse + push + PR**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond Footer with Teka content

- Wordmark + tagline + payments (MoMo, Airtel) + legal links + copyright
- Server Component, fully i18n via messages/fr.json
- Legal links point to /legal/{cgu,cgv,mentions-legales} (404 until
  PR4 ships the stubs)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Mesurer Lighthouse home après PR2 :
- `bun run dev:web`
- Chrome DevTools mobile 375px → Lighthouse perf
- Sauvegarder dans `docs/superpowers/plans/baselines/2026-05-29-lighthouse-home-after-v2-1-pr2.html`
- Comparer au baseline pré-V2.1 — pas de régression significative attendue.

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add docs/superpowers/plans/baselines/
git commit -m "docs: lighthouse measurement after V2.1 PR2

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

git push -u origin feature/v2-1/identity-home
gh pr create --base dev --head feature/v2-1/identity-home \
  --title "Vague 2.1 PR2 — Identity home (palette, Hero, Navbar, Footer)" \
  --body "Second of 4 PRs for Vague 2.1.

## What

- **colors.css** overridden with Teka palette (cream/ink/sun/terracotta/sand/sale)
  via raw palette layer; semantic tokens untouched
- **tailwind.config.ts** extended with teka.* literal colors + fontFamily
- **layout.tsx** : lang='fr', Teka metadata, openGraph fr_FR
- **Navbar** : wordmark TEKA·MARKET, i18n labels
- **Hero** : refonte complète (kicker terracotta, title display 800,
  CTA solar/ink, halo, trust strip MoMo/Airtel/Livraison)
- **Footer** : Teka content, payments, legal links, copyright

## Verification

- [x] bun run build --filter=@teka/web passes
- [x] Mobile 375px : no horizontal scroll, CTA tappable
- [x] Lighthouse mobile perf vs baseline : no significant regression
- [x] grep audit : no hex hardcoded in components (except colors.css)

## Notes

Legal links in Footer point at /legal/{cgu,cgv,mentions-legales} which
404 until PR4 ships the stubs. Acceptable in cascade merge.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## PR3 — Identité : listings + fiche + cart (`feature/v2-1/identity-shop`)

**Pré-requis :** PR2 mergée dans `dev` (ou brancher sur HEAD PR2).

### Task 13 : Créer la branche PR3 + refondre `ProductCard`

**Files :**
- Modify : `apps/teka-market-web/src/components/molecules/ProductCard/...` (à localiser)

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git checkout dev  # ou feature/v2-1/identity-home
git pull
git checkout -b feature/v2-1/identity-shop
```

- [ ] **Step 2 : Localiser ProductCard**

```bash
grep -RE "export.*ProductCard\\b" apps/teka-market-web/src/components --include="*.tsx" -l
```

- [ ] **Step 3 : Refondre ProductCard**

Pattern visé (adapter à l'API existante du composant, en gardant ses props product) :

```tsx
'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { formatXaf } from '@/lib/format/xaf'

export function ProductCard({ product }: { product: /* type existant */ }) {
  const t = useTranslations('common')
  const hasDiscount = product.calculated_price?.calculated_amount !== product.calculated_price?.original_amount
  const discountPct = hasDiscount
    ? Math.round(
        ((product.calculated_price.original_amount - product.calculated_price.calculated_amount) /
          product.calculated_price.original_amount) * 100
      )
    : 0

  return (
    <Link href={`/products/${product.handle}`} className="group block bg-component border border-primary rounded-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square bg-secondary">
        {product.thumbnail && (
          <Image src={product.thumbnail} alt={product.title} fill className="object-cover" sizes="(min-width: 768px) 25vw, 50vw" />
        )}
        {hasDiscount && (
          <div className="absolute top-2 left-2 bg-teka-sale text-white px-2 py-1 text-[10px] font-bold tracking-wider rounded-xs">
            -{discountPct}%
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="text-sm font-semibold text-primary mb-1 line-clamp-2 leading-tight">{product.title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-extrabold text-primary">{formatXaf(product.calculated_price?.calculated_amount)}</span>
          {hasDiscount && (
            <span className="text-xs text-tertiary line-through">{formatXaf(product.calculated_price?.original_amount)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
```

**Important :** garder la signature `product` existante (lire le code avant patching) pour ne pas casser les call sites.

- [ ] **Step 4 : Vérifier dans le storefront**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Naviguer sur une page listing (`/products` ou `/categories/<slug>`). Cards affichent :
- Image carrée
- Badge solde rouge si applicable
- Titre encre
- Prix XAF en gras encre
- Prix barré gris si solde

- [ ] **Step 5 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond ProductCard with Teka palette + XAF

- Removed currency-dependent formatting (formatXaf only)
- Discount badge in teka-sale red top-left
- Title in primary (ink), price in extrabold primary, original price
  in tertiary line-through
- Aspect square image, sand background placeholder

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 14 : Refondre la page fiche produit

**Files :**
- Modify : `apps/teka-market-web/src/components/sections/ProductDetailsPage/...` ou page `app/[locale]/(main)/products/[handle]/page.tsx`

- [ ] **Step 1 : Localiser la fiche produit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
ls apps/teka-market-web/src/components/sections/ProductDetailsPage/ 2>/dev/null
ls apps/teka-market-web/src/app/\[locale\]/\(main\)/products 2>/dev/null
```

- [ ] **Step 2 : Migrer les strings vers `useTranslations('product')` + format XAF**

Dans le composant principal de la fiche produit :
1. Importer `useTranslations` ou `getTranslations` selon client/server.
2. Remplacer les labels en dur ("In stock", "Add to cart", "Free delivery") par les clés correspondantes (`t('stockStatus.inStock')`, `t('common.cta.addToCart')`, `t('product.deliveryInfo')`).
3. Tous les prix → `formatXaf(amount)`.
4. CTA "Ajouter au panier" : style solaire (`bg-action-primary text-action-on-primary`).
5. Banner "Livré depuis Brazzaville sous 24-48h" : encadré terracotta léger (`bg-blue-25 border-l-4 border-teka-terracotta px-3 py-2 text-sm`).

- [ ] **Step 3 : Vérifier visuellement**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Naviguer sur un produit. Prix XAF visible, CTA solaire, banner livraison terracotta visible.

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond product details page (palette + i18n + XAF)

- Labels migrated to useTranslations('product') / ('common')
- All prices via formatXaf
- Add-to-cart CTA in solar/ink
- Delivery banner with terracotta accent

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 15 : Refondre la page listing produits

**Files :**
- Modify : page listing (probablement `app/[locale]/(main)/products/page.tsx` + composant `ProductListing`)

- [ ] **Step 1 : Localiser**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
ls apps/teka-market-web/src/components/sections/ProductListing/
ls apps/teka-market-web/src/app/\[locale\]/\(main\)/products/
```

- [ ] **Step 2 : Migrer labels + palette**

Dans la page et le composant listing :
1. Titres, filtres, "Sort by", "Showing X products" → `useTranslations` (créer les clés manquantes dans `messages/fr.json` si besoin).
2. Aucun hex en dur — toutes les couleurs via tokens sémantiques ou `teka.*`.
3. Si `ProductCard` est déjà refait (Task 13), il bénéficie automatiquement.

Clés probables à ajouter à `messages/fr.json` (sous un nouveau namespace `listing`) :

```json
"listing": {
  "title": "Tous les produits",
  "sortBy": "Trier par",
  "filter": "Filtrer",
  "results": "{count} produits"
}
```

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Naviguer sur `/products`. Grille de cards Teka. Filtres / tri en fr-FR.

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond product listing page

- Labels migrated to useTranslations('listing')
- Added 'listing.*' namespace to messages/fr.json
- Palette via semantic tokens

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 16 : Refondre cart + checkout récap (layout uniquement)

**Files :**
- Modify : composants cart (`Cart`, `CartItems`, `CartSummary`, `CartEmpty`) + checkout récap

- [ ] **Step 1 : Localiser les composants cart**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
ls apps/teka-market-web/src/components/sections/Cart/ apps/teka-market-web/src/components/organisms/ 2>/dev/null | grep -i cart
```

- [ ] **Step 2 : Migrer labels + prix XAF + palette**

Dans chaque composant cart :
1. Titres ("Your cart", "Subtotal", "Shipping", "Tax", "Total") → `useTranslations('cart')` ou `('cart.summary')`.
2. Tous les prix → `formatXaf(amount)`.
3. Bouton checkout en `bg-action-primary text-action-on-primary` (solaire/encre).
4. Bouton "Continuer mes achats" en `border-teka-terracotta text-teka-terracotta` (variante secondary).
5. État vide ("Your cart is empty") → `t('cart.empty.title')` + CTA `t('cart.empty.cta')`.

- [ ] **Step 3 : Idem pour la page checkout récap**

```bash
ls apps/teka-market-web/src/app/\[locale\]/\(checkout\)/
```

Localiser le récap commande (probablement `CartReview` ou `OrderSummary`). Mêmes migrations : labels i18n, prix XAF, palette tokens.

- [ ] **Step 4 : Vérifier le parcours**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Parcours : home → cliquer produit → ajouter au panier → cart → checkout récap. Vérifier :
- Tous les montants en `15 000 FCFA`
- Tous les labels fr-FR
- CTA solaire visible
- Mobile 375px sans débordement

- [ ] **Step 5 : Audit final strings anglaises**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
grep -RE "['\"]\\b(Cart|Subtotal|Total|Shipping|Add to|Continue|Sign in|Sign up|Account|Search)\\b['\"]" \
  apps/teka-market-web/src/components apps/teka-market-web/src/app \
  | grep -v "messages/" \
  | head -20
```

Pour chaque occurrence remontée : si c'est dans le parcours principal, la migrer. Tolérer les zones hors PR3 (auth = PR4).

- [ ] **Step 6 : Commit + Lighthouse + push + PR**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web/identity): refond cart + checkout layout (palette + i18n + XAF)

- All amounts via formatXaf
- Labels via useTranslations('cart') / ('cart.summary')
- CTA solar/ink, secondary terracotta
- Empty state migrated

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

git push -u origin feature/v2-1/identity-shop
gh pr create --base dev --head feature/v2-1/identity-shop \
  --title "Vague 2.1 PR3 — Identity shop (ProductCard, fiche, listing, cart)" \
  --body "Third of 4 PRs for Vague 2.1.

## What

- ProductCard refondue (palette, formatXaf, badge solde rouge)
- Page fiche produit (i18n, XAF, CTA solaire, banner livraison terracotta)
- Page listing produits (i18n, namespace 'listing' added)
- Cart + checkout récap (i18n, XAF, CTAs)

## Verification

- [x] Parcours home → produit → cart → checkout en fr-FR XAF
- [x] Aucune string anglaise dans le parcours principal
- [x] Mobile 375px : pas de scroll horizontal
- [x] bun run build passes

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## PR4 — Pages template fr-FR Teka + Open Graph (`feature/v2-1/template-pages`)

**Pré-requis :** PR3 mergée dans `dev` (ou brancher sur HEAD PR3).

### Task 17 : Créer la branche PR4 + auth pages

**Files :**
- Modify : `apps/teka-market-web/src/app/[locale]/(auth)/...` + composants forms auth

- [ ] **Step 1 : Créer la branche**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git checkout dev  # ou feature/v2-1/identity-shop
git pull
git checkout -b feature/v2-1/template-pages
```

- [ ] **Step 2 : Localiser les pages auth**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
ls apps/teka-market-web/src/app/\[locale\]/\(auth\)/
ls apps/teka-market-web/src/app/\[locale\]/\(reset-password\)/ 2>/dev/null
grep -RE "Sign in|Sign up|Forgot|Reset" apps/teka-market-web/src/components --include="*.tsx" -l | head -10
```

- [ ] **Step 3 : Migrer chaque page auth**

Pour chaque page (`signin`, `signup`, `reset-password`) :
1. Importer `useTranslations` (si client) ou `getTranslations` (si server).
2. Remplacer titres/labels/placeholders/CTA par les clés `auth.signin.*`, `auth.signup.*`, `auth.reset.*`.
3. Appliquer le style Teka : kicker terracotta uppercase, titre display 800, CTA solar/ink.
4. Vérifier que les formulaires (`react-hook-form` + `zod` selon deps) restent fonctionnels — ne pas toucher la logique.

Pattern type pour signin :

```tsx
<section className="container mx-auto px-4 py-10 max-w-md">
  <div className="text-xs uppercase tracking-[3px] text-teka-terracotta mb-3">{t('kicker')}</div>
  <h1 className="font-display font-extrabold uppercase text-3xl text-primary mb-6">{t('title')}</h1>
  {/* form existant — boutons restylés */}
  <button type="submit" className="bg-action-primary text-action-on-primary px-6 py-3 font-display font-extrabold uppercase text-sm tracking-wider w-full rounded-xs">
    {t('submit')}
  </button>
  <p className="mt-4 text-sm text-secondary">
    {t('noAccount')}{' '}
    <Link href="/signup" className="text-teka-terracotta hover:underline">{t('createAccount')}</Link>
  </p>
</section>
```

- [ ] **Step 4 : Vérifier**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Naviguer sur `/cg/signin` (ou équivalent selon routing). Titre "Se connecter", kicker "— Bienvenue", CTA solaire, lien "Pas encore de compte ? Créer un compte".

- [ ] **Step 5 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web): refond auth pages with Teka identity + fr-FR

- signin, signup, reset-password pages
- Labels via useTranslations('auth.*')
- Style: kicker terracotta, title display 800 uppercase, CTA solar/ink

Form logic (react-hook-form + zod) untouched.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 18 : Refondre account dashboard

**Files :**
- Modify : pages sous `app/[locale]/(main)/user/...` + composants account

- [ ] **Step 1 : Localiser**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
ls apps/teka-market-web/src/app/\[locale\]/\(main\)/user/
```

- [ ] **Step 2 : Migrer les pages account**

Pour chaque sous-page (dashboard root, orders, addresses, profile) :
1. Titre via `t('account.title')` ou sub-clé.
2. Sections : "Mes commandes", "Mes adresses", "Mes paiements MoMo / Airtel", "Mon profil", "Se déconnecter".
3. Style Teka : titres display 800, liens terracotta, fonds crème.
4. Sur la section paiements : afficher la note `t('account.paymentsNote')` = "Les paiements MoMo et Airtel arrivent prochainement."

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Login → naviguer dans le dashboard account. Tout en fr-FR Teka.

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web): refond account dashboard (fr-FR + Teka identity)

- Sections Orders / Addresses / Payments / Profile in fr-FR
- Payments section shows 'MoMo and Airtel coming soon' stub
- Style aligned with Teka identity

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 19 : Refondre `not-found.tsx` + `global-error.tsx`

**Files :**
- Modify : `apps/teka-market-web/src/app/not-found.tsx`
- Modify : `apps/teka-market-web/src/app/global-error.tsx`

- [ ] **Step 1 : Remplacer `not-found.tsx`**

Remplacer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/not-found.tsx` par :

```tsx
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

export default async function NotFound() {
  const t = await getTranslations('errors.notFound')
  const cta = await getTranslations('common.cta')

  return (
    <main className="container mx-auto px-4 py-20 text-center max-w-lg">
      <div className="text-7xl lg:text-9xl font-display font-extrabold text-teka-sun mb-4">404</div>
      <h1 className="font-display font-extrabold uppercase text-2xl text-primary mb-3">{t('title')}</h1>
      <p className="text-secondary mb-6">{t('subtitle')}</p>
      <Link href="/" className="inline-block bg-action-primary text-action-on-primary px-6 py-3 font-display font-extrabold uppercase text-sm tracking-wider rounded-xs">
        {cta('backHome')}
      </Link>
    </main>
  )
}
```

- [ ] **Step 2 : Remplacer `global-error.tsx`**

Remplacer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/global-error.tsx` par :

```tsx
'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Stub : un futur subscriber Sentry / log structuré arrivera en V4.
    console.error('[Teka-Market] global-error caught:', error)
  }, [error])

  // global-error doit fournir son propre <html> et <body>.
  return (
    <html lang="fr">
      <body style={{ backgroundColor: '#FAFAF7', color: '#0D1B2A', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ maxWidth: '32rem', margin: '5rem auto', padding: '0 1rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Une erreur s'est produite.
          </h1>
          <p style={{ color: '#506478', marginBottom: '1.5rem' }}>
            Quelque chose n'a pas fonctionné. Réessaie.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              backgroundColor: '#F2B701',
              color: '#0D1B2A',
              padding: '0.75rem 1.5rem',
              border: 'none',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Recharger
          </button>
        </main>
      </body>
    </html>
  )
}
```

**Note :** `global-error.tsx` ne peut pas utiliser `useTranslations` car il se charge avant le provider. Strings hardcodées en fr est acceptable ici — c'est une page de dernier recours.

- [ ] **Step 3 : Vérifier `/page-inexistante`**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Aller sur `http://localhost:3000/page-qui-nexiste-pas`. Page 404 Teka visible (404 jaune solaire, titre, CTA).

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web): refond not-found and global-error pages

- 404: big solar number, ink title, CTA back home, fr-FR
- global-error: minimal inline styles (no Provider context), fr-FR
  fallback, console.error stub for future Sentry

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 20 : Stubs CGU / CGV / mentions légales

**Files :**
- Create : `apps/teka-market-web/src/app/[locale]/(main)/legal/cgu/page.tsx`
- Create : `apps/teka-market-web/src/app/[locale]/(main)/legal/cgv/page.tsx`
- Create : `apps/teka-market-web/src/app/[locale]/(main)/legal/mentions-legales/page.tsx`
- Create : `apps/teka-market-web/src/app/[locale]/(main)/legal/layout.tsx` (optionnel — wrapper container)

- [ ] **Step 1 : Créer un composant stub réutilisable**

Créer `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/src/app/[locale]/(main)/legal/_stub.tsx` :

```tsx
import { getTranslations } from 'next-intl/server'

export async function LegalStub({ title }: { title: string }) {
  const t = await getTranslations('legal')
  return (
    <main className="container mx-auto px-4 py-16 max-w-2xl">
      <h1 className="font-display font-extrabold uppercase text-2xl text-primary mb-4">{title}</h1>
      <p className="text-secondary">{t('comingSoon')}</p>
    </main>
  )
}
```

- [ ] **Step 2 : Créer les 3 pages stub**

Créer `apps/teka-market-web/src/app/[locale]/(main)/legal/cgu/page.tsx` :

```tsx
import { LegalStub } from '../_stub'

export const metadata = { title: "Conditions d'utilisation" }

export default function CguPage() {
  return <LegalStub title="Conditions d'utilisation" />
}
```

Idem pour `cgv/page.tsx` (title `"Conditions de vente"`) et `mentions-legales/page.tsx` (title `"Mentions légales"`).

- [ ] **Step 3 : Vérifier**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Cliquer sur les liens du footer. Chaque page stub affiche le titre + "Cette page sera disponible à la Vague 3."

- [ ] **Step 4 : Commit**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add -A
git commit -m "feat(web): legal stubs (cgu, cgv, mentions-legales)

Each route renders a minimal 'coming Vague 3' placeholder so footer
links don't 404.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 21 : Produire `og-teka.png` + vérification globale + PR

**Files :**
- Create : `apps/teka-market-web/public/og-teka.png`

- [ ] **Step 1 : Produire `og-teka.png` (1200×630)**

L'image Open Graph se produit hors environnement code. Recommandation : utiliser Figma ou un autre outil graphique pour générer un visuel :
- Fond solaire `#F2B701`
- Wordmark `TEKA·MARKET` encre (Funnel Display 800 ou équivalent)
- Tagline "Le Congo qui vend." sous le wordmark
- Pas de gradient/effets lourds (fichier < 100 Ko)

Sauvegarder le résultat dans `/Users/henokmipoks/Desktop/mercurjs/teka-market/apps/teka-market-web/public/og-teka.png`.

**Fallback acceptable pour MVP :** un PNG plat de 1200×630 avec le fond solaire et le wordmark suffit. Itération visuelle possible en V2.2.

- [ ] **Step 2 : Vérifier le preview Open Graph**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
bun run dev:web
```

Ouvrir `http://localhost:3000`. View Source → vérifier `<meta property="og:image" content="...og-teka.png">`. Si possible, tester via [opengraph.xyz](https://opengraph.xyz) ou la metadata preview Twitter.

- [ ] **Step 3 : Vérification globale Vague 2.1**

Lancer tous les checks ensemble :

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market

# Build complet
bun run build 2>&1 | tail -20

# Tests
cd apps/teka-market-web && bun run test && cd -

# Knip final
bun run audit:knip 2>&1 | tail -20

# Audit strings anglaises résiduelles dans le parcours principal
grep -RE "['\"]\\b(Cart|Subtotal|Total|Shipping|Add to|Continue|Sign in|Sign up|Account|Search|Cancel|Confirm)\\b['\"]" \
  apps/teka-market-web/src/components apps/teka-market-web/src/app \
  | grep -v "messages/" \
  | grep -v "test" | head -20

# Audit formatage devise résiduel
grep -RE "(toLocaleString.*currency|new Intl\\.NumberFormat.*currency)" apps/teka-market-web/src && echo "ÉCHEC" || echo "OK"

# Démarrage des autres apps
cd packages/api && bun run build 2>&1 | tail -10 && cd -
```

Expected :
- Build vert tous workspaces
- Tests passent
- Knip : ≤ 5 false positives documentés
- Grep strings EN : ≤ 5 occurrences résiduelles dans des zones secondaires (à juger), zéro dans le parcours checkout
- Grep formatage devise : `OK`
- `packages/api` build OK

- [ ] **Step 4 : Commit final + push + PR**

```bash
cd /Users/henokmipoks/Desktop/mercurjs/teka-market
git add apps/teka-market-web/public/og-teka.png
git commit -m "feat(web): add og-teka.png Open Graph image (1200x630)

Solar background with TEKA·MARKET wordmark and tagline.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"

git push -u origin feature/v2-1/template-pages
gh pr create --base dev --head feature/v2-1/template-pages \
  --title "Vague 2.1 PR4 — Template pages fr-FR Teka + Open Graph" \
  --body "Final PR for Vague 2.1.

## What

- auth pages (signin/signup/reset-password) refondues fr-FR Teka
- account dashboard refondu fr-FR Teka
- not-found.tsx + global-error.tsx Teka-styled fr-FR
- /legal/{cgu,cgv,mentions-legales} stubs (footer links no longer 404)
- og-teka.png Open Graph image (1200x630)

## Verification globale Vague 2.1

- [x] bun run build all workspaces passes
- [x] bun run test apps/teka-market-web passes
- [x] bun run audit:knip clean (≤5 documented false positives)
- [x] grep audit: zero residual currency formatting
- [x] grep audit: ≤5 EN strings residual outside main checkout path
- [x] packages/api build unchanged
- [x] apps/admin and apps/vendor still boot
- [x] Mobile 375px parcours : home → product → cart → checkout → signin
      tous en fr-FR XAF Teka

## Cascade

Merge order: PR1 → PR2 → PR3 → PR4 into dev.

🤖 Generated with [Claude Code](https://claude.com/claude-code)"
```

---

## Self-Review

**1. Spec coverage :**

| Spec section | Couvert par Task |
|---|---|
| §3 C1 cleanup deps & assets | Task 2 + 3 |
| §4 C2 i18n fr-FR strict | Task 4 |
| §5 C3 helper formatXaf + tests | Task 5 |
| §5.3 audit + remplacement sites formatage prix | Task 6 |
| §6.1 override colors.css | Task 7 |
| §6.2 tailwind.config extension | Task 8 |
| §6.3 layout.tsx (lang/metadata) | Task 9 |
| §6.3 Navbar wordmark | Task 10 |
| §6.3 Hero refonte + trust strip | Task 11 |
| §6.3 Footer refonte | Task 12 |
| §6.3 ProductCard refonte | Task 13 |
| §6.3 fiche produit | Task 14 |
| §6.3 listing produits | Task 15 |
| §6.3 cart + checkout layout | Task 16 |
| §7.1 auth pages | Task 17 |
| §7.1 account dashboard | Task 18 |
| §7.1 not-found + global-error | Task 19 |
| §7.1 stubs CGU/CGV/mentions | Task 20 |
| §7.1 og-teka.png + vérification globale | Task 21 |

**Gap identifié :** la spec §3.1 mentionne un script `package.json` racine `audit:knip`. C'est dans Task 2 step 3. ✓

**Gap identifié :** la spec §11 risque "Helper formatXaf reçoit centièmes" — Task 5 step 6 documente l'hypothèse dans le code mais ne teste pas un produit réel. Compensation : Task 14 (fiche produit) verra la valeur réelle, à corriger en exécution si mismatch.

**2. Placeholder scan :** zéro `TBD`, `TODO`, `implement later`, "add appropriate error handling" résiduel. ✓

**3. Type consistency :**

- `formatXaf(amount: number | null | undefined): string` — utilisé partout avec signature cohérente ✓
- `parseXaf(input: string): number | null` — utilisé seulement dans tests + futurs forms, cohérent ✓
- `messages/fr.json` structure : namespaces référencés dans plusieurs tasks (`navbar.search`, `home.hero.title`, `cart.summary.total`, `auth.signin.title`, etc.) — tous présents dans le squelette créé Task 4 step 1 ✓
- CSS vars : `--bg-action-primary`, `--content-action-on-primary`, `--bg-tertiary` — tous mentionnés dans Task 7 et utilisés dans Task 9-12 ✓

Aucun mismatch détecté.

---

## Execution Handoff

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-05-29-teka-market-vague-2-1-frontend-cleanup-identite.md`.** Deux options d'exécution :

1. **Subagent-Driven (recommandé)** — Je dispatche un subagent frais par tâche, je review entre les tâches, itération rapide.

2. **Inline Execution** — Exécution des tâches dans cette session via `executing-plans`, batch avec checkpoints pour review.

**Quelle approche ?**
