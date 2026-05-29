# Teka-Market — Vague 2.1 : Frontend Cleanup + Identité

**Date :** 2026-05-29
**Auteur :** Henok M. (CTO) + Claude Code (architecte)
**Statut :** Design — en revue
**Cible :** Vague 2.1 (sous-vague de "Marketplace Core")
**Branche d'exécution :** `feature/vague-2-1-cleanup-identite` (à créer)
**Spec parent :** [Vague 1 — Fondations Congo](./2026-05-29-teka-market-vague-1-design.md)

---

## 1. Contexte et objectif

La Vague 1 a posé les fondations du projet (XAF, fr-FR, region Congo, storefront cloné et rebrandé minimalement, skill IA, Linear). La Vague 2 — "Marketplace Core" — porte sur l'expérience marketplace multi-vendeur.

Cette **Vague 2.1** est une sous-vague qui se concentre sur le **storefront `apps/teka-market-web/`** avant que les fonctionnalités marketplace (badge "Vendu par X", profil seller, discover, cart groupé) ne soient implémentées en V2.2. Elle livre :

1. **Cleanup opérationnel** du storefront cloné depuis Mercur (deps mortes, composants orphelins, assets template, strings hardcodées, formatage devise hardcodé).
2. **Identité visuelle Teka-Market** : palette validée (encre / solaire / terracotta / crème), wordmark `TEKA·MARKET`, hero refondu, trust strip MoMo/Airtel/Livraison, refonte de la home + listings + fiche produit + cart.
3. **Pages template** (auth, account, errors) en fr-FR avec ton Teka.

### 1.1 Contraintes (héritées Vague 1)

| Contrainte | Implication |
|---|---|
| Devise XAF (Franc CFA), entier 0 décimale | Helper `formatXaf` central, format `"15 000 FCFA"` (espace fine + suffix). PAS de `× 100`. |
| Locale unique fr-FR | `next-intl` configuré strict ; suppression des locales template (en, etc.) ; tous les messages dans `messages/fr.json`. |
| Mobile-first / faible bande passante | DevTools mobile 375px = référence ; Lighthouse perf vérifié à chaque PR ; assets template lourds (Open Graph, placeholder) supprimés. |
| Contrats starter Mercur | `blocks.json`, `packages/api/src/*`, `apps/admin/*`, `apps/vendor/*` non touchés. |

### 1.2 Hors-scope explicite Vague 2.1

Reporté à V2.2 (Marketplace UX) :
- Badge "Vendu par X" sur product cards et fiche produit
- Page profil seller avec contenu réel (header, grille produits, note)
- Section "Découvrir les vendeurs" sur la home + page index `/sellers/`
- Cart groupé par seller, filtre seller sur les listings

Reporté à V3 ou plus tard :
- Provider Mobile Money (MTN MoMo, Airtel Money)
- Contenu réel des mentions légales / CGU / CGV (stubs uniquement en V2.1)
- Icône logo dessinée (wordmark texte uniquement en V2.1)
- Locales additionnelles (lingala, en)
- Observabilité (Sentry, logs structurés)

### 1.3 Direction visuelle validée (Brainstorm 2026-05-29)

**Fusion B+C** — base "énergie urbaine" avec accent terracotta éditorial. Palette :

| Token | Hex | Usage |
|---|---|---|
| Crème | `#FAFAF7` | background pages |
| Encre | `#0D1B2A` | texte, surfaces sombres, CTA dark |
| Solaire | `#F2B701` | CTA primaire, accent sur wordmark |
| Terracotta | `#B86B3A` | liens, kicker, accent éditorial, futurs badges seller |
| Rouge | `#E63946` | soldes, erreurs, alertes |
| Sable | `#E5E2DA` | bordures, fonds secondaires |

Typographie : `Funnel Display` (déjà importée dans `layout.tsx`) — 800 uppercase pour titres, 400 pour body, fallback serif système pour citations italiques (`"Acheter local, autrement."`).

---

## 2. Architecture globale

```
┌────────────────────────────────────────────────────────────────────┐
│                  VAGUE 2.1 — STOREFRONT CLEANUP + IDENTITÉ          │
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │ C1 Cleanup  │  │ C2 i18n     │  │ C3 XAF      │  │ C4 Identité│ │
│  │             │  │ fr-FR strict│  │ formatXaf   │  │ visuelle   │ │
│  │ knip audit  │  │ next-intl   │  │ Intl.NF +   │  │ colors.css │ │
│  │ deps mortes │  │ messages/   │  │ override    │  │ tailwind   │ │
│  │ assets      │  │  fr.json    │  │ "XAF"→FCFA  │  │ Hero/Nav/  │ │
│  │ orphelins   │  │             │  │ + tests     │  │ Footer/    │ │
│  │             │  │             │  │             │  │ Card       │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └─────┬──────┘ │
│         │                │                │                │        │
│         └────────────────┴────────────────┘                │        │
│                          │                                 │        │
│              PR1 : Foundations invisibles      PR2+3 : Identité    │
│                                                visible             │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ C5 Pages template fr-FR Teka                                  │  │
│  │ Auth (signin/signup/reset) · Account · 404 · 500 · stubs CGV  │  │
│  │ + Open Graph image                                  PR4       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│             Aucune modification packages/api / admin / vendor.     │
└────────────────────────────────────────────────────────────────────┘
```

### 2.1 Localisation des modifs

```
apps/teka-market-web/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/                ← C5 (signin/signup/reset)
│   │   │   ├── (main)/                ← C4 (home, listings, fiche, cart)
│   │   │   │   └── user/              ← C5 (account dashboard)
│   │   │   ├── (checkout)/            ← C4 (récap, paiement)
│   │   │   └── (reset-password)/      ← C5
│   │   ├── globals.css                ← inchangé (reset/fonts)
│   │   ├── colors.css                 ← C4 ★ override palette Teka
│   │   ├── layout.tsx                 ← C4 (lang fr, metadata, fonte)
│   │   ├── not-found.tsx              ← C5
│   │   └── global-error.tsx           ← C5
│   ├── components/
│   │   ├── atoms/                     ← C4 (Button, Badge, Price)
│   │   ├── molecules/                 ← C4 (NavBar, Footer, ProductCard)
│   │   ├── organisms/                 ← C4 (au besoin)
│   │   └── sections/
│   │       ├── Hero/                  ← C4 ★ refonte complète
│   │       ├── HomeProductSection/    ← C4 (palette + i18n)
│   │       └── ProductDetailsPage/    ← C4
│   ├── lib/
│   │   ├── format/
│   │   │   ├── xaf.ts                 ← C3 ★ formatXaf, parseXaf
│   │   │   └── xaf.test.ts            ← C3 (tests unitaires)
│   │   └── i18n/                      ← C2 (config next-intl fr-FR)
│   ├── messages/
│   │   └── fr.json                    ← C2 ★ source de vérité traductions
│   └── middleware.ts                  ← C2 (ajusté si suppression [locale])
├── public/
│   ├── og-teka.png                    ← C5 (1200×630)
│   └── (suppression assets template)   ← C1
├── tailwind.config.ts                 ← C4 (extension teka.*, fontFamily)
└── package.json                       ← C1 (deps mortes retirées, knip ajouté)

knip.json                              ← C1 (config racine)
```

### 2.2 Principes directeurs

1. **Aucune nouvelle dépendance runtime.** `next-intl` déjà présente. Seuls ajouts : `knip` en `devDependencies`.
2. **CSS variables intactes structurellement.** On override les *valeurs* dans `colors.css`, pas les *noms*. Zero composant Mercur à patcher pour le changement de couleur.
3. **Helper XAF en module pur isolé.** Pas de couplage React, testable en Node.
4. **i18n centralisé.** Un seul `messages/fr.json` source de vérité. Pas de strings éparpillées dans les composants.
5. **PRs indépendantes mergeables en cascade.** Chaque PR (1 → 2 → 3 → 4) est reviewable et rollbackable seule.
6. **Contrats starter Mercur respectés.** `blocks.json`, `packages/api`, `apps/admin`, `apps/vendor` non touchés.

---

## 3. Sous-projet C1 — Cleanup deps & assets

### 3.1 Outillage : `knip`

```bash
cd apps/teka-market-web && bun add -D knip
```

**Config `knip.json` à la racine du workspace :**

```json
{
  "$schema": "https://unpkg.com/knip/schema.json",
  "workspaces": {
    "apps/teka-market-web": {
      "entry": [
        "src/app/**/{page,layout,route,loading,error,not-found,global-error}.tsx",
        "src/middleware.ts"
      ],
      "project": ["src/**/*.{ts,tsx}"],
      "ignoreDependencies": ["@chromatic-com/storybook"]
    }
  }
}
```

**Script `package.json` racine :**

```json
{
  "scripts": {
    "audit:knip": "knip --workspace apps/teka-market-web"
  }
}
```

### 3.2 Cibles de suppression (à confirmer par le rapport `knip`)

- **Composants morts post-Talkjs :** chat seller, modal contact vendeur, hooks `useTalkjs*` résiduels (audit `grep -ri talkjs apps/teka-market-web/`).
- **Storybook stories orphelines :** stories `*.stories.tsx` pour composants supprimés.
- **Assets template :**
  - `public/B2C_Storefront_Open_Graph.png`
  - `public/algolia-import.png`
  - `public/talkjs-placeholder.jpg`
  - `public/Logo.png`, `public/Logo.svg` (logo Mercur — remplacés par wordmark texte)
  - `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` (icônes template Next.js par défaut, jamais utilisées en prod)
- **Deps mortes :** identifiées par `knip` ; candidats probables si présents : `@talkjs/*`, deps doubles.

### 3.3 Validation

- [ ] `bun run audit:knip` exécutable et reporte ≤ 5 false-positives consciemment ignorés (documentés en commentaire dans `knip.json`)
- [ ] `bun why @talkjs/react` retourne rien
- [ ] `grep -ri talkjs apps/teka-market-web/src` retourne rien
- [ ] `apps/teka-market-web/public/` ne contient plus que les assets effectivement utilisés (Open Graph Teka à venir en C5)
- [ ] `bun run build` storefront passe sans nouveau warning

---

## 4. Sous-projet C2 — i18n fr-FR strict

### 4.1 Stratégie

1. **Audit des locales actuelles** : lister `messages/*.json` ou équivalent ; garder uniquement `fr.json` (compléter / créer) ; supprimer les autres fichiers de locale.
2. **Configuration `next-intl`** (`src/lib/i18n/` ou config racine selon convention template) :
   - `locales: ['fr']`
   - `defaultLocale: 'fr'`
   - **Décision tranchée en exécution PR1 :** garder le segment dynamique `[locale]` (en figeant `fr`) OU le supprimer. Choix safe par défaut = garder `[locale]` pour minimiser le risque sur le routing et les liens existants ; suppression possible si elle simplifie sans casser. Documenter le choix dans la PR.
3. **Audit strings hardcodées** :
   ```bash
   grep -RE "['\"][A-Z][a-z]+(\\s[a-z]+){1,}['\"]" apps/teka-market-web/src/components apps/teka-market-web/src/app
   ```
   → remplacer par `useTranslations()` (client) ou `getTranslations()` (server).
4. **Structure `messages/fr.json`** (hiérarchique, namespaces clairs) :

   ```json
   {
     "common": {
       "cta": {
         "addToCart": "Ajouter au panier",
         "viewSeller": "Voir le vendeur",
         "discover": "Découvrir",
         "continueShopping": "Continuer mes achats"
       },
       "currency": { "free": "Gratuit", "unavailable": "—" }
     },
     "navbar": {
       "search": "Rechercher",
       "account": "Mon compte",
       "cart": "Panier",
       "menu": "Menu"
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
     "cart": { "empty": { "title": "Votre panier est vide.", "cta": "Voir les produits" } },
     "auth": {
       "signin": {
         "kicker": "— Bienvenue",
         "title": "Se connecter",
         "submit": "Se connecter",
         "noAccount": "Pas encore de compte ?",
         "createAccount": "Créer un compte"
       },
       "signup": { "title": "Créer un compte Teka-Market" },
       "reset": { "title": "Mot de passe oublié ?" }
     },
     "account": {
       "title": "Mon compte",
       "orders": "Mes commandes",
       "addresses": "Mes adresses",
       "payments": "Mes paiements MoMo / Airtel"
     },
     "errors": {
       "notFound": {
         "title": "Cette page n'existe pas.",
         "cta": "Retour à l'accueil"
       },
       "generic": {
         "title": "Une erreur s'est produite.",
         "cta": "Recharger"
       }
     },
     "footer": {
       "copyright": "© {year} Teka-Market — Marketplace nationale Congo-Brazzaville",
       "legal": {
         "cgu": "Conditions d'utilisation",
         "cgv": "Conditions de vente",
         "mentions": "Mentions légales"
       }
     }
   }
   ```

   *(Cette structure est indicative — la version finale émerge pendant l'exécution au fur et à mesure de l'audit des strings.)*

### 4.2 Validation

- [ ] `apps/teka-market-web/messages/` contient uniquement `fr.json`
- [ ] `grep -RE "['\"][A-Z][a-z]+ [a-z]+['\"]" apps/teka-market-web/src/components` ne remonte pas de string anglaise évidente non i18n
- [ ] Toutes les pages clés (home, listing, fiche, cart, signin) affichent du français Teka, aucune string anglaise visible
- [ ] La config `next-intl` ne référence que `fr`

---

## 5. Sous-projet C3 — Helper `formatXaf`

### 5.1 Module `src/lib/format/xaf.ts`

```ts
const XAF_FORMATTER = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XAF',
  currencyDisplay: 'code',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
})

/**
 * Formate un montant XAF (entier, 0 décimale ISO 4217).
 *
 * @example formatXaf(15000)    → "15 000 FCFA"
 * @example formatXaf(0)        → "0 FCFA"
 * @example formatXaf(null)     → "—"
 * @example formatXaf(NaN)      → "—"
 */
export function formatXaf(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return '—'
  // Intl renvoie "15 000 XAF" → on substitue "XAF" par "FCFA"
  return XAF_FORMATTER.format(amount).replace('XAF', 'FCFA')
}

/**
 * Parse une string XAF en entier. Tolérant aux espaces fines (U+202F),
 * espaces normaux, et suffix FCFA/XAF.
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

### 5.2 Tests unitaires (`src/lib/format/xaf.test.ts`)

7 cas minimum :

```ts
import { describe, it, expect } from 'vitest' // ou Jest selon ce que le template utilise
import { formatXaf, parseXaf } from './xaf'

describe('formatXaf', () => {
  it('formate 0 en "0 FCFA"', () => expect(formatXaf(0)).toBe('0 FCFA'))
  it('formate 15000 avec espace fine', () => expect(formatXaf(15000)).toMatch(/15.000.FCFA/))
  it('formate un grand nombre', () => expect(formatXaf(1234567)).toMatch(/1.234.567.FCFA/))
  it('retourne — pour null', () => expect(formatXaf(null)).toBe('—'))
  it('retourne — pour undefined', () => expect(formatXaf(undefined)).toBe('—'))
  it('retourne — pour NaN', () => expect(formatXaf(NaN)).toBe('—'))
})

describe('parseXaf', () => {
  it('parse "15 000 FCFA"', () => expect(parseXaf('15 000 FCFA')).toBe(15000))
  it('parse "FCFA 1 234"', () => expect(parseXaf('FCFA 1 234')).toBe(1234))
  it('retourne null pour string sans chiffres', () => expect(parseXaf('invalid')).toBeNull())
})
```

*(Le framework de test exact — Vitest, Jest — sera identifié pendant l'exécution selon ce que le template embarque déjà. Si aucun framework n'est setup, ajout minimal de Vitest en devDep, conforme à Next.js 15.)*

### 5.3 Audit + remplacement des sites de formatage prix

```bash
grep -RE "(toLocaleString|Intl\\.NumberFormat|\\$\\{.*price|price.*\\$\\{)" apps/teka-market-web/src
```

→ liste de fichiers à patcher. Remplacer chaque occurrence par `formatXaf(amount)` après inspection.

### 5.4 Hypothèse à valider en exécution

Medusa renvoie les montants déjà en unité de devise (entier, conforme Vague 1 §A.6). Le helper consomme directement. Si le SDK Medusa retourne en réalité des centièmes ou unités minimales, **adapter en exécution** (ajout d'un helper `formatXafFromAmount(amount, currency)` qui divise selon `decimal_digits`).

### 5.5 Validation

- [ ] `bun test src/lib/format/xaf` (ou équivalent) passe (≥ 9 cas)
- [ ] Aucun `Intl.NumberFormat` ou `toLocaleString` résiduel sur un prix (audit `grep` post-PR1)
- [ ] Le helper rend bien `"15 000 FCFA"` (avec espace fine ou normale selon environnement Node ; le test tolère les deux)

---

## 6. Sous-projet C4 — Identité visuelle Teka

### 6.1 Override `colors.css`

Le template Mercur définit les CSS variables dans `apps/teka-market-web/src/app/colors.css`. On override les **valeurs**, pas les noms.

```css
/* colors.css — Teka-Market palette V2.1 */
:root {
  /* Backgrounds */
  --bg-primary: 250, 250, 247;          /* #FAFAF7 crème */
  --bg-secondary: 229, 226, 218;        /* #E5E2DA sable */
  --bg-tertiary: 13, 27, 42;            /* #0D1B2A encre */
  --bg-component-primary: 255, 255, 255;
  --bg-component-secondary: 245, 242, 234;

  /* Actions */
  --bg-action-primary: 242, 183, 1;          /* #F2B701 solaire */
  --bg-action-primary-hover: 224, 168, 0;
  --bg-action-primary-pressed: 200, 150, 0;
  --bg-action-secondary: #FAFAF7;
  --bg-action-tertiary: #B86B3A;             /* terracotta */

  /* Content (texte) */
  --content-primary: 13, 27, 42;             /* encre */
  --content-secondary: 60, 70, 85;
  --content-tertiary: 130, 140, 155;
  --content-action-primary: 184, 107, 58;    /* terracotta = liens */
  --content-action-on-primary: 13, 27, 42;   /* texte sur bouton solaire = encre */

  /* États sémantiques */
  --bg-negative-primary: 230, 57, 70;        /* #E63946 rouge solde/erreur */
  --bg-positive-primary: 27, 94, 32;
  --bg-warning-primary: 242, 183, 1;

  /* Borders */
  --border-primary: 229, 226, 218;           /* sable */
  --border-secondary: 217, 213, 200;
  --border-action: 184, 107, 58;
}
```

**Mode sombre :** non en scope V2.1. Le `darkMode: "class"` reste activé dans `tailwind.config.ts` (intact) mais aucune variable `.dark` n'est définie. Si un utilisateur force `class="dark"`, le rendu retombe sur les valeurs `:root`.

### 6.2 Extension `tailwind.config.ts`

```ts
extend: {
  colors: {
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
}
```

### 6.3 Composants refondus

| Composant / fichier | Action |
|---|---|
| `app/layout.tsx` | `lang="fr"`, `<title>` template `"%s | Teka-Market"`, `description` Congo, fonte Funnel Display verrouillée |
| `components/sections/Hero/Hero.tsx` | Refonte : kicker terracotta uppercase, titre 28-32px Funnel 800 uppercase, halo solaire absolu, paragraphe 14px, CTA encre/solaire `→`, trust strip MoMo/Airtel/Livraison en bas |
| `components/molecules/NavBar` (ou équivalent) | Wordmark `TEKA·MARKET` (encre Funnel 800 + `·` solaire), icônes 🔍 👤 🛒 alignées droite, bordure sable bottom |
| `components/molecules/Footer` | Refonte : Teka-Market mentions Congo-Brazzaville, paiements MoMo/Airtel, liens fr-FR vers CGU/CGV/mentions (stubs C5), copyright année dynamique |
| `components/molecules/ProductCard` | Fond blanc, image 1:1 ou 4:3, badge solde rouge top-left si applicable, ❤️ wishlist top-right, prix XAF via `formatXaf`, bordure sable, hover subtil |
| `components/atoms/Button` | Vérification : `primary` = solaire+encre, `secondary` = bordure terracotta+terracotta, `tertiary` = lien terracotta souligné |
| `components/sections/HomeProductSection/` | Palette + i18n + `formatXaf` |
| `components/sections/ProductDetailsPage/` | Palette + i18n + `formatXaf` (PR3) |
| Cart layout (`(main)/cart/`) | Palette + i18n + `formatXaf` totaux (PR3) |
| Checkout récap (`(checkout)/`) | Palette + i18n + `formatXaf` (PR3) |

### 6.4 Logo & assets

- **Wordmark texte uniquement** en V2.1. `TEKA·MARKET` rendu en pur HTML/CSS via Funnel Display, pas de fichier image.
- **Open Graph image** `public/og-teka.png` (1200×630) : hero "Le Congo qui vend" sur fond solaire avec wordmark encre. Tâche dédiée dans PR4 (production via outil graphique externe ou Figma).
- **Favicon** : conserver pour V2.1 ; refonte en V2.2/V3 si besoin.

### 6.5 Validation

- [ ] `apps/teka-market-web` lance sur `localhost:3000`, home affiche hero Teka avec palette validée
- [ ] Wordmark `TEKA·MARKET` rendu correctement (point solaire, lettres encre)
- [ ] Trust strip MoMo/Airtel/Livraison visible et lisible mobile 375px
- [ ] DevTools mobile 375px : hero ne déborde pas, CTA cliquable, aucun scroll horizontal
- [ ] Lighthouse mobile (perf) : pas de régression vs baseline mesurée avant PR2
- [ ] Footer affiche mentions Congo et liens fr-FR cliquables
- [ ] Cards, fiche produit, cart utilisent la palette Teka et `formatXaf`

---

## 7. Sous-projet C5 — Pages template fr-FR Teka

### 7.1 Inventaire

| Page | Chemin probable | Action |
|---|---|---|
| Signin | `app/[locale]/(auth)/signin/page.tsx` | Copy fr-FR Teka, kicker terracotta "— Bienvenue", titre "Se connecter", CTA solaire, lien "Pas encore de compte ?" |
| Signup | `app/[locale]/(auth)/signup/page.tsx` | "Créer un compte Teka-Market" |
| Reset password | `app/[locale]/(reset-password)/...` | "Mot de passe oublié ?" + flow |
| Account dashboard | `app/[locale]/(main)/user/...` | "Mon compte", sections "Mes commandes", "Mes adresses", "Mes paiements MoMo / Airtel" *(stub paiement V3)* |
| 404 | `app/not-found.tsx` | "Cette page n'existe pas." + CTA retour |
| Global error | `app/global-error.tsx` | "Une erreur s'est produite. Recharger" + log Sentry stub |
| Stubs légaux | `app/[locale]/(main)/legal/{cgu,cgv,mentions-legales}/page.tsx` | Page minimale "À compléter Vague 3" pour éviter 404 si liens footer |
| Open Graph | `public/og-teka.png` + `metadata.openGraph` dans `layout.tsx` | Image 1200×630 + metadata |

### 7.2 Approche unifiée

Chaque page reçoit :
- (a) **Clés i18n** dans `fr.json` (namespace dédié : `auth.*`, `account.*`, `errors.*`, `footer.legal.*`)
- (b) **Tonalité directe Teka** : pas "Veuillez nous excuser…" mais "Cette page n'existe pas."
- (c) **Palette via CSS vars** : aucun hex en dur

### 7.3 Validation

- [ ] Signin / signup / reset en fr-FR Teka, formulaires fonctionnels (auth Mercur intacte)
- [ ] Account dashboard en fr-FR
- [ ] `/page-inexistante` → 404 Teka customisé
- [ ] Erreur runtime déclenche `global-error.tsx` Teka
- [ ] `og-teka.png` visible via preview Open Graph (OpenGraph.xyz ou Twitter validator)
- [ ] Liens footer vers `/cgu`, `/cgv`, `/mentions-legales` ne 404 pas (stub rendu)

---

## 8. Séquence d'exécution

### 8.1 Ordre des PRs

| # | PR | Branche | Contenu | Durée |
|---|---|---|---|---|
| PR1 | Foundations invisibles | `feature/v2-1/foundations` | C1 + C2 + C3 | 4-6h |
| PR2 | Identité — palette + home | `feature/v2-1/identity-home` | C4 (palette + layout + Navbar + Hero + Footer) | 4-6h |
| PR3 | Identité — listings + fiche + cart | `feature/v2-1/identity-shop` | C4 (ProductCard + fiche + listing + cart + checkout layout) | 4-6h |
| PR4 | Pages template + Open Graph | `feature/v2-1/template-pages` | C5 entier + `og-teka.png` | 3-4h |

Toutes les PRs ciblent `dev`. Merge en cascade ; chaque PR rebase sur la précédente si nécessaire. Chaque PR peut être reviewée et mergée indépendamment.

**Total estimé : ~15-20h dev (≈ 1 semaine solo dev avec pauses et vérifications).**

### 8.2 Linear

**Issues à créer en début d'exécution** (project `P1 — Sprint 1 Marketplace Core` ou nouveau sous-project `P1.1 — Vague 2.1 Frontend` à confirmer en démarrage) :

| # | Title | Area | Type | PR |
|---|---|---|---|---|
| 1 | Setup knip + audit deps storefront | frontend | chore | PR1 |
| 2 | Supprimer deps & composants morts (post-Talkjs, template) | frontend | chore | PR1 |
| 3 | Configurer next-intl fr-FR strict, supprimer locales template | frontend | chore | PR1 |
| 4 | Implémenter `lib/format/xaf.ts` + tests | frontend | feature | PR1 |
| 5 | Auditer + remplacer tous les sites de formatage prix par `formatXaf` | frontend | chore | PR1 |
| 6 | Override `colors.css` palette Teka | frontend | feature | PR2 |
| 7 | Étendre `tailwind.config.ts` (`teka.*`, fontFamily) | frontend | feature | PR2 |
| 8 | Refondre Navbar + wordmark TEKA·MARKET | frontend | feature | PR2 |
| 9 | Refondre Hero homepage + trust strip MoMo/Airtel/Livraison | frontend | feature | PR2 |
| 10 | Refondre Footer Teka-Market | frontend | feature | PR2 |
| 11 | Refondre ProductCard (palette + `formatXaf`) | frontend | feature | PR3 |
| 12 | Refondre page fiche produit | frontend | feature | PR3 |
| 13 | Refondre page listing produits | frontend | feature | PR3 |
| 14 | Refondre layout cart + checkout récap | frontend | feature | PR3 |
| 15 | fr-FR Teka — pages auth (signin/signup/reset) | frontend | chore | PR4 |
| 16 | fr-FR Teka — pages account customer | frontend | chore | PR4 |
| 17 | fr-FR Teka — not-found + global-error | frontend | chore | PR4 |
| 18 | Stubs CGU/CGV/mentions légales | frontend | chore | PR4 |
| 19 | Open Graph image `og-teka.png` + metadata | frontend | feature | PR4 |

### 8.3 Convention de commits

```
<type>(<scope>): <subject> [TEKA-X]

<body explaining why, not what>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Types : `feat`, `chore`, `docs`, `refactor`, `fix`.
Scope typique : `web`, `web/i18n`, `web/identity`, `web/cleanup`.

Exemple : `feat(web/identity): override colors.css with Teka palette [TEKA-25]`

---

## 9. Vérification globale (gate de complétude)

### PR1 — Foundations invisibles
- [ ] `bun run audit:knip` exécutable et reporte ≤ 5 false-positives consciemment ignorés (documentés dans `knip.json`)
- [ ] `bun why @talkjs/react` retourne rien
- [ ] `grep -ri talkjs apps/teka-market-web/src` retourne rien
- [ ] `apps/teka-market-web/messages/` contient uniquement `fr.json`
- [ ] `grep -RE "['\"][A-Z][a-z]+ [a-z]+['\"]" apps/teka-market-web/src/components` ne remonte pas de string anglaise évidente non i18n
- [ ] Tests `lib/format/xaf` passent (≥ 9 cas)
- [ ] Aucun `Intl.NumberFormat` ou `toLocaleString` résiduel sur un prix
- [ ] `bun run build` storefront passe sans nouveau warning

### PR2 — Identité home
- [ ] Home affiche hero Teka avec palette validée
- [ ] Wordmark `TEKA·MARKET` rendu correctement (point solaire)
- [ ] Trust strip MoMo/Airtel/Livraison visible
- [ ] DevTools mobile 375px : pas de scroll horizontal, CTA cliquable
- [ ] Lighthouse mobile perf : pas de régression vs baseline mesurée pré-PR2
- [ ] Footer affiche mentions Congo et liens fr-FR

### PR3 — Shop pages
- [ ] Listing produits avec palette Teka, prix `formatXaf`
- [ ] Fiche produit avec prix XAF, CTA solaire "Ajouter au panier"
- [ ] Cart avec prix XAF, total via `formatXaf`
- [ ] Checkout récap avec totaux XAF corrects
- [ ] Aucune string anglaise visible dans le parcours

### PR4 — Pages template
- [ ] Signin / signup / reset en fr-FR Teka, formulaires fonctionnels
- [ ] Account dashboard en fr-FR
- [ ] `/page-inexistante` → 404 Teka customisé
- [ ] Erreur runtime déclenche `global-error.tsx` Teka
- [ ] `og-teka.png` visible via preview Open Graph
- [ ] Liens footer `/cgu`, `/cgv`, `/mentions-legales` ne 404 pas (stub présent)

### Non-régression globale
- [ ] `bun run build` racine OK (turbo build tous workspaces)
- [ ] `apps/admin` et `apps/vendor` démarrent toujours (`bun run dev:admin`, `bun run dev:vendor`)
- [ ] `blocks.json` inchangé
- [ ] `packages/api` build inchangé
- [ ] Aucune route backend modifiée

---

## 10. Plan de rollback

Chaque PR est isolée et rollbackable indépendamment :

| PR | Action de rollback |
|---|---|
| PR1 | `git revert <merge-sha>` + `bun install` (restaure `package.json` et lockfile) |
| PR2 | `git revert <merge-sha>` ; `colors.css` revient au défaut Mercur ; composants Hero/Navbar/Footer aux versions pré-V2.1 |
| PR3 | `git revert <merge-sha>` ; ProductCard et pages shop reviennent à la version PR2 |
| PR4 | `git revert <merge-sha>` ; pages auth/account/errors reviennent à EN ; `og-teka.png` supprimé |

---

## 11. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| `knip` reporte des faux positifs sur des composants chargés dynamiquement (Next.js routing, dynamic imports) | Moyenne | Moyen | Configurer `entry:` exhaustivement ; valider manuellement chaque suppression avant commit |
| Suppression du segment `[locale]` casse middleware / routing existant ou SEO | Moyenne | Élevé | Décision tranchée en exécution PR1 ; option safe par défaut = garder `[locale]` figé sur `fr` |
| Override `colors.css` provoque des contrastes accessibilité dégradés (terracotta sur crème en hover, encre sur sable en muted) | Moyenne | Moyen | Audit a11y via DevTools Lighthouse contraste pendant PR2 ; ajuster les variantes `*-secondary` au besoin |
| Helper `formatXaf` reçoit un montant en centièmes depuis Medusa au lieu d'unités | Faible | Élevé | Test avec un produit XAF seedé en Vague 1 dès PR1 ; si centièmes, ajouter `formatXafFromAmount(amount, currency)` qui divise selon `decimal_digits` |
| Pages template (auth/account) couplées à des hooks/contextes spécifiques difficiles à dériver | Moyenne | Moyen | Audit en début PR4, isoler les zones risquées (formulaires Stripe résiduels) |
| Lighthouse perf régresse à cause d'animations CSS nouvelles (halo solaire absolu) | Faible | Faible | Mesurer baseline avant PR2, comparer après ; halo CSS pur sans JS |
| Dépendance non détectée par `knip` mais utilisée par un composant Storybook | Faible | Faible | `ignoreDependencies` ajusté au coup par coup |
| Framework de test (Vitest / Jest) absent du template, nécessite ajout devDep | Moyenne | Faible | Ajout minimal de Vitest en PR1, conforme à Next.js 15 ; tests `formatXaf` portables |
| Open Graph `og-teka.png` à produire hors environnement code (Figma) | Faible | Faible | Tâche PR4 dédiée ; placeholder PNG simple acceptable pour MVP |

---

## 12. Métriques de succès

| Métrique | Cible |
|---|---|
| Temps total implémentation | ≤ 25h dev |
| Issues Linear V2.1 fermées | 19/19 |
| PRs mergées dans `dev` | 4/4 |
| Régression `apps/admin` ou `apps/vendor` | Zéro |
| Strings anglaises visibles dans le parcours mobile checkout | Zéro |
| Sites `Intl.NumberFormat` / `toLocaleString` résiduels sur prix | Zéro |
| Tests `lib/format/xaf` passants | 100% |
| Contraste a11y Lighthouse home | ≥ AA |
| Compréhension du spec par nouveau dev | < 20 min |

---

## 13. Prochaines étapes

1. **Maintenant** : utilisateur relit ce spec. Modifications éventuelles intégrées avant de continuer.
2. **Après approbation** : invocation du skill `superpowers:writing-plans` pour produire le plan d'implémentation détaillé étape par étape (correspondance avec les 19 issues Linear).
3. **Ensuite** : exécution du plan (manuelle ou via `superpowers:executing-plans` / `superpowers:subagent-driven-development`).
4. **Vague 2.2 (suivante)** : Marketplace UX — badge "Vendu par X", page profil seller avec contenu réel, section "Découvrir les vendeurs", cart groupé par seller, filtre seller sur listings. Cycle brainstorm → spec → plan → exécution dédié.

---

## Annexe A — Glossaire

| Terme | Définition |
|---|---|
| Vague 2.1 | Sous-vague de Marketplace Core, focalisée frontend cleanup + identité |
| Vague 2.2 | Sous-vague de Marketplace Core, focalisée marketplace UX (sellers visibles) |
| Wordmark | Logo en lettres pures, sans icône (cf. `TEKA·MARKET`) |
| Trust strip | Bande horizontale sous le hero affichant des signaux de confiance (paiement, livraison) |
| Slice (vertical) | Tranche d'exécution couvrant plusieurs préoccupations sur une page (palette + i18n + XAF) |
| `formatXaf` | Helper central de formatage de montants XAF (entiers, suffix FCFA) |
| `knip` | Outil d'audit JS/TS pour détecter deps, fichiers et exports inutilisés |

## Annexe B — Références

- [Vague 1 — Fondations Congo](./2026-05-29-teka-market-vague-1-design.md)
- `apps/teka-market-web/src/app/colors.css` — variables CSS template Mercur
- `apps/teka-market-web/tailwind.config.ts` — config Tailwind storefront
- `apps/teka-market-web/src/components/sections/Hero/Hero.tsx` — Hero actuel
- [Documentation `next-intl`](https://next-intl.dev)
- [Documentation `knip`](https://knip.dev)
- [ISO 4217 XAF](https://en.wikipedia.org/wiki/ISO_4217)
- `.claude/skills/teka-market/SKILL.md` — skill projet
- Brainstorm visuel : `.superpowers/brainstorm/86451-1780058806/` (palette validée, direction B+C)
