# Teka-Market — Vague 1 : Fondations Congo

**Date :** 2026-05-29
**Auteur :** Henok M. (CTO) + Claude Code (architecte)
**Statut :** Design — en revue
**Cible :** Sprint 0 (Linear project P0)
**Branche :** `feature/vague-1-spec`

---

## 1. Contexte et objectif

Teka-Market est une marketplace nationale pour le Congo-Brazzaville, construite sur Mercur (open-source multi-vendor marketplace) lui-même bâti sur MedusaJS v2.

Le projet est initialisé depuis le starter `basic` de Mercur (`2.1.5` + Medusa `2.13.4`). Cette Vague 1 — **Sprint 0** — pose les fondations indispensables :

1. **Localiser** la plateforme pour le Congo (devise XAF, locale fr-FR, timezone Africa/Brazzaville, région Congo).
2. **Documenter** le contexte projet pour les futurs travaux d'agents IA via un skill dédié `.claude/skills/teka-market/`.
3. **Piloter** le travail via un workspace Linear structuré (team `TEKA`, labels, projects, issues Sprint 0).
4. **Intégrer** le storefront B2C (Next.js) qui a été cloné dans `apps/teka-market-web/`.

Aucune logique métier (sellers, commission, paiements MoMo) n'est implémentée en Vague 1 — ce sont les Vagues 2 et 3.

### 1.1 Contraintes locales (non-négociables)

| Contrainte | Implication |
|---|---|
| Devise XAF (Franc CFA) | Stockage ISO 4217 : entier, 0 décimale. PAS `montant × 100`. |
| Locale par défaut fr-FR | UI admin, vendor, storefront en français. |
| Timezone Africa/Brazzaville | Horloge serveur, logs, dates affichées. |
| Faible bande passante | Pages mobile-first, payloads compressés, deps externes évitées. |
| Paiement Mobile Money first | MTN MoMo + Airtel Money en Vague 3 (pas Sprint 0). |

### 1.2 Hors-scope explicite Vague 1

- Sellers, commission, payout (Vague 2)
- Provider Mobile Money (Vague 3)
- Pages storefront métier (Vague 3)
- Optimisation perf avancée, observabilité, CI/CD (Vague 4+)

---

## 2. Architecture globale

```
┌─────────────────────────────────────────────────────────────────┐
│                    VAGUE 1 — FONDATIONS                          │
│                                                                  │
│  ┌──────────────┐    ┌──────────────────┐   ┌────────────────┐  │
│  │  A. Locale   │    │  B. Skill IA     │   │  F. Linear     │  │
│  │   Congo      │    │  teka-market     │   │  Workspace     │  │
│  │              │    │                  │   │                │  │
│  │ medusa-      │    │ .claude/skills/  │   │ Team TEKA      │  │
│  │ config.ts    │    │  teka-market/    │   │ + 9 labels     │  │
│  │ seed-congo   │    │   SKILL.md       │   │ + Sprint 0     │  │
│  │ .env.template│    │                  │   │   project      │  │
│  └──────┬───────┘    └─────────┬────────┘   └────────┬───────┘  │
│         │                      │                     │           │
│         │  CODE                │  CONTEXTE IA        │  PILOTAGE │
│         │  (runtime)           │  (sessions Claude)  │  (humains)│
│         └──────────────────────┴─────────────────────┘           │
│                                                                  │
│                Aucune dépendance croisée bloquante.              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.1 Pré-requis transversal (étape 0)

✅ **Déjà accompli.** Le repo git a été initialisé manuellement par l'utilisateur :
- Branche `dev` (avec remote `origin/dev`)
- Commit initial : `chore: initial commit (mercur basic starter 2.1.5 + medusa 2.13.4)`
- Working tree propre au démarrage de la Vague 1

### 2.2 Principes directeurs

1. **Indépendance des sous-projets.** A, B, F livrables séparément, testables séparément, rollback indépendant.
2. **Additif uniquement.** Toute modification à `medusa-config.ts`, `package.json`, etc. ajoute sans supprimer.
3. **Respect des contrats du starter Mercur.** Ne pas toucher : `blocks.json`, structure `packages/api/src/*`, `apps/admin/src/*`, `apps/vendor/src/*`.
4. **Zéro nouvelle dépendance npm en Vague 1.** On utilise Medusa core et Mercur core natifs.

---

## 3. Sous-projet A — Localisation Congo

### A.1 Patch `packages/api/medusa-config.ts`

**Modification additive minimale.** Medusa v2 ne configure pas la devise/région dans ce fichier — ces données vivent en base. Le patch concerne uniquement les commentaires de convention et la confirmation que les modules existants restent intacts.

```ts
// Fichier resté quasi-identique. La localisation se joue dans A.2 (seed).
// Ajout d'un commentaire d'en-tête documentant la convention Congo.
```

### A.2 Script seed `packages/api/src/scripts/seed-congo.ts`

Crée les entités locales de manière **idempotente** (ré-exécutable sans casser) via les workflows officiels Medusa.

| Entité | Valeur | Pattern |
|---|---|---|
| Currency `xaf` | `code: "xaf"`, `symbol: "FCFA"`, `name: "Franc CFA"`, `decimal_digits: 0` | `createCurrenciesWorkflow` |
| Region `Congo` | `currency_code: "xaf"`, `countries: ["cg"]`, `name: "Congo"`, `automatic_taxes: true` | `createRegionsWorkflow` |
| Country `cg` | `iso_2: "cg"`, `iso_3: "cog"`, `name: "Congo, Republic of"` | Medusa core (déjà seedé) |
| Tax Region `cg` | `country_code: "cg"`, `provider_id: "tp_system"` | `createTaxRegionsWorkflow` |
| Tax Rate TVA Congo | `rate: 18.9`, `code: "tva-cg"`, `name: "TVA Congo"`, lié au Tax Region `cg`, `is_default: true` | `createTaxRatesWorkflow` |
| Sales Channel `teka-store` | `name: "Teka-Market Store"`, `description: "Storefront principal"` | `createSalesChannelsWorkflow` |
| Stock Location `brazzaville-hq` | `name: "Brazzaville HQ"`, `address: ...` | `createStockLocationsWorkflow` |

> **Note Medusa v2 :** la TVA n'est PAS un champ direct de `region`. Elle vit dans le Tax Module via `tax_region` + `tax_rate`. Le seed doit créer ces entités séparément et les rattacher au pays (`cg`), pas à la région Medusa.

**Pattern d'idempotence** :
```ts
const existing = await query.graph({ entity: "currency", filters: { code: "xaf" } })
if (!existing.data.length) {
  await runWorkflow(createCurrenciesWorkflow, { input: { currencies: [...] } })
}
```

**Exécution** : `cd packages/api && bun run medusa exec ./src/scripts/seed-congo.ts`

### A.3 `.env.template` racine

Fichier check-in en racine (le `.env` reste gitignored).

```bash
# Base
NODE_ENV=development
TZ=Africa/Brazzaville
DATABASE_URL=postgres://user:pass@localhost:5432/teka_market
REDIS_URL=redis://localhost:6379

# Mercur CORS
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7000
VENDOR_CORS=http://localhost:7001
AUTH_CORS=http://localhost:3000,http://localhost:7000,http://localhost:7001

# Secrets (à régénérer en prod)
JWT_SECRET=__changeme__
COOKIE_SECRET=__changeme__

# Locale (consommé côté front-end, pas Medusa)
DEFAULT_LOCALE=fr-FR
DEFAULT_CURRENCY=xaf
DEFAULT_COUNTRY=cg

# Mobile Money (Vague 3 — placeholders)
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
AIRTEL_MONEY_CLIENT_ID=
AIRTEL_MONEY_CLIENT_SECRET=
```

### A.4 Intégration storefront `apps/teka-market-web/`

Le storefront a été cloné depuis `github.com/mercurjs/b2c-marketplace-storefront`. 8 sous-tâches d'intégration :

| ID | Action | Commande / Détail |
|---|---|---|
| A.4.1 | Supprimer nested `.git` | `rm -rf apps/teka-market-web/.git` |
| A.4.2 | Supprimer `yarn.lock` enfant | `rm apps/teka-market-web/yarn.lock` |
| A.4.3 | Renommer package | `package.json` → `"name": "@teka/web"` |
| A.4.4 | Localiser `.env.template` | `NEXT_PUBLIC_DEFAULT_REGION=cg`, `NEXT_PUBLIC_SITE_NAME="Teka-Market"`, `NEXT_PUBLIC_SITE_DESCRIPTION="Marketplace nationale Congo-Brazzaville"` |
| A.4.5 | Scripts bun racine | Ajout `"dev:web": "turbo run dev --filter=@teka/web"` |
| A.4.6 | Réconcilier deps | `bun install` depuis racine (génère un seul `bun.lock`) |
| A.4.7 | Retirer Talkjs | Désinstaller `@talkjs/react`, `talkjs` ; supprimer composants & imports ; vérifier `grep -ri talkjs apps/teka-market-web/src` vide |
| A.4.8 | Algolia fallback gracieux | Si `NEXT_PUBLIC_ALGOLIA_ID` vide → fallback API Medusa native, pas de crash |

### A.5 Vérification A

- [ ] `bun run dev` depuis la racine démarre les 4 services sans erreur
- [ ] Seed Congo exécuté avec succès, idempotent (2e exécution clean)
- [ ] `SELECT code, decimal_digits FROM currency WHERE code='xaf'` → `xaf | 0`
- [ ] `SELECT name FROM region WHERE name='Congo'` retourne 1 ligne
- [ ] Tax Region `cg` créée avec Tax Rate `tva-cg` à `0.189` (ou `18.9` selon convention du module)
- [ ] Storefront atteint `http://localhost:3000`, affiche "Teka-Market" dans le `<title>`
- [ ] Aucun nested `.git` sous `apps/teka-market-web/`
- [ ] Aucune occurrence "talkjs" dans `apps/teka-market-web/`

### A.6 Décisions techniques explicites

1. **XAF stocké en entier** (0 décimale), conforme ISO 4217. Pas de multiplication × 100.
2. **TVA 18.9%** définie au niveau région (taux standard congolais). Modulable par catégorie produit plus tard via tax provider.
3. **Une seule région** `Congo` pour tout le pays. Pas de découpage par ville.
4. **Sales Channel unique** `teka-store` au démarrage.

---

## 4. Sous-projet B — Skill IA `.claude/skills/teka-market/`

### B.1 Localisation et structure

Fichier unique `.claude/skills/teka-market/SKILL.md`. Pas de `references/` séparés en Vague 1 — on éclatera si une section dépasse 150 lignes individuelles.

### B.2 Frontmatter (contrat de triggering)

```yaml
---
name: teka-market
description: Connaissance complète du projet Teka-Market — marketplace nationale Congo-Brazzaville built on Mercur/Medusa. Utilise ce skill dès que le travail concerne Teka-Market, qu'il s'agisse du backend (packages/api), de l'admin, du vendor portal, du storefront teka-market-web, des paiements Mobile Money, de la devise XAF, de la région Congo, des sellers, des commissions, ou de toute convention spécifique au projet. Déclenche aussi pour toute question sur l'archi marketplace multi-vendeur en Afrique centrale, MTN MoMo, Airtel Money, ou contraintes locales (faible bande passante, mobile-first).
---
```

### B.3 Sections du contenu

```
SKILL.md (cible : 250-320 lignes)
├── (frontmatter)
├── # Teka-Market — Skill projet
├── ## 1. Contexte produit
│   - Marketplace nationale Congo-Brazzaville
│   - Multi-vendeur (sellers indépendants)
│   - Mobile-first / faible bande passante
│   - Paiement Mobile Money first
├── ## 2. Architecture métier
│   - Customer ↔ Seller, Order, Payment, Payout
│   - Tables Medusa réutilisées
│   - Modules Mercur attendus
├── ## 3. Règles business
│   - Commission marketplace : NON décidée en Vague 1. À cadrer en Vague 2 (Sprint 1) lors du provisionnement du module commission Mercur. Le skill mentionnera ce champ vide et redirigera vers Sprint 1.
│   - Validation seller : KYC manuel admin
│   - Devise UNIQUE : XAF (entiers, 0 décimale)
│   - TVA 18.9% incluse au niveau région
├── ## 4. Patterns techniques
│   - Registry first : `bunx @mercurjs/cli search` AVANT de coder
│   - Extensions via modules isolés
│   - API-first, event-driven (subscribers/jobs)
│   - Workflows Medusa, jamais raw SQL
│   - Codegen route après chaque changement
├── ## 5. Guidelines IA (lecture obligatoire pour Claude)
│   - Contexte Afrique : bande passante, batterie, data coûteuse
│   - Payloads optimisés (pagination, projection)
│   - UX mobile-first, simplicité
│   - YAGNI strict, anti sur-engineering
│   - Toujours lire CLAUDE.md + ce skill avant gros changement
│   - Cross-refs : [[mercur-blocks]], [[mercur-cli]], [[medusa-ui-conformance]]
├── ## Vérification rapide pour Claude (checklist smell test)
└── ## Cross-references
```

### B.4 Vérification B

- [ ] Le fichier existe et parse en YAML valide pour le frontmatter
- [ ] Test trigger : nouvelle session Claude Code → prompt "Comment configurer XAF dans Teka-Market ?" → le skill doit apparaître dans la liste chargée
- [ ] Aucun placeholder TODO/TBD dans le contenu livré
- [ ] Tous les `[[...]]` référencent des skills existants (`mercur-blocks`, `mercur-cli`, `medusa-ui-conformance`, `dashboard-page-ui`, `dashboard-form-ui`, `dashboard-tab-ui`)

---

## 5. Sous-projet F — Linear bootstrap

### F.1 Team `Teka-Market`

| Champ | Valeur |
|---|---|
| Name | Teka-Market |
| Key | TEKA |
| Icon | Store / 🛒 |
| Color | `#1B5E20` |
| Workspace | `lilia-food` (workspace existant de l'utilisateur) |

### F.2 Labels (9 au total)

**Areas (5)** — chaque issue en a exactement 1 :
```
area:backend       → Mercur/Medusa, modules, workflows, API
area:frontend      → Storefront Next.js, design system
area:payments      → MTN MoMo, Airtel Money, payouts
area:marketplace   → Sellers, commission, multi-vendeur
area:devops        → CI/CD, infra, env, monitoring
```

**Types (4)** — chaque issue en a exactement 1 :
```
type:feature   → Nouvelle capacité produit
type:bug       → Régression / dysfonctionnement
type:chore     → Maintenance, refactor, deps
type:spike     → Recherche / prototype
```

### F.3 Projects

| Code | Project | Statut Vague 1 | Date indicative |
|---|---|---|---|
| **P0** | **Sprint 0 — Fondations Congo** | 🟢 Active | 2026-05-29 → 2026-06-12 |
| P1 | Sprint 1 — Marketplace Core | Backlog | T+2sem |
| P2 | Sprint 2 — Sellers system | Backlog | T+4sem |
| P3 | Sprint 3 — Payments Mobile Money | Backlog | T+6sem |
| P4 | Sprint 4 — Frontend Storefront | Backlog | T+8sem |
| P5 | Sprint 5 — Admin custom + optimisation | Backlog | T+10sem |
| P6 | Tech Debt & Observability | Backlog (continu) | continu |

### F.4 Issues Sprint 0 (8 issues)

| # | Title | Area | Type | Priority |
|---|---|---|---|---|
| 1 | Patch `medusa-config.ts` — header convention Congo | backend | chore | High |
| 2 | Implémenter seed `seed-congo.ts` (XAF, region Congo, sales channel) | backend | feature | Urgent |
| 3 | Créer `.env.template` racine complet | devops | chore | High |
| 4 | Nettoyage storefront : retirer nested `.git`, normaliser yarn→bun | devops | chore | Urgent |
| 5 | Rebranding storefront (region cg, site name, package `@teka/web`) | frontend | chore | High |
| 6 | Retirer Talkjs du storefront (deps + composants) | frontend | chore | Medium |
| 7 | Algolia fallback gracieux (no-op si pas de clé) | frontend | feature | Medium |
| 8 | Créer skill IA `.claude/skills/teka-market/SKILL.md` | devops | feature | High |

Chaque issue contient : Description, Acceptance Criteria, Definition of Done, lien vers ce spec.

### F.5 Cycles (sprints Linear)

**Non activés en Vague 1.** Justification : avec un solo dev sur Sprint 0 ponctuel, les Cycles ajoutent de la cérémonie sans gain. À activer à partir du Sprint 1 si la cadence se régularise.

### F.6 Vérification F

- [ ] Team `TEKA` créée et visible
- [ ] Les 9 labels existent
- [ ] 7 projects créés (1 active, 6 backlog)
- [ ] 8 issues Sprint 0 créées, taggées, assignées à `hmipoka@gmail.com`
- [ ] Le project P0 a une description liant ce spec

---

## 6. Séquence d'exécution

### 6.1 Ordre recommandé

```
Étape 0  : branche feature/vague-1-fondations (à créer pour l'exécution)
Étape 1  : F. Linear bootstrap (5-10 min)
Étape 2  : B. Skill IA (20-30 min)
Étape 3  : A. Localisation Congo + A.4 Storefront (45-60 min)
Étape 4  : Vérification globale (10 min)
Étape 5  : PR feature/vague-1-fondations → dev
```

**Pourquoi F en premier ?** Une fois les 8 issues créées, chaque commit peut référencer `TEKA-X` pour tracking automatique.

**Pourquoi B avant A ?** Si Claude charge le skill pendant l'implémentation de A, il applique les conventions XAF / fr-FR / Congo automatiquement.

### 6.2 Convention de commits

```
<type>(<scope>): <subject> [TEKA-X]

<body explaining why, not what>

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
```

Types : `feat`, `chore`, `docs`, `refactor`, `fix`.

Exemple : `feat(api): add seed-congo script with XAF currency [TEKA-2]`

### 6.3 Branche et PR

- Branche d'exécution : `feature/vague-1-fondations-congo` (distincte de `feature/vague-1-spec` qui ne contient que ce document)
- Cible PR : `dev`
- Titre PR : `Vague 1 — Fondations Congo (XAF, locale, storefront, skill, Linear)`

---

## 7. Vérification globale (gate de complétude)

Cette checklist DOIT passer avant ouverture de la PR d'exécution.

### Backend (A.1, A.2, A.3)
- [ ] `cd packages/api && bun run build` passe
- [ ] Seed Congo exécuté avec succès, idempotent
- [ ] `SELECT code, decimal_digits FROM currency WHERE code='xaf'` → `xaf | 0`
- [ ] `SELECT name, currency_code FROM region WHERE name='Congo'` → `Congo | xaf`
- [ ] Tax Rate `tva-cg` à 18.9% existe et est marquée `is_default` pour le pays `cg`
- [ ] Sales channel `teka-store` existe

### Storefront (A.4)
- [ ] `apps/teka-market-web/.git` absent
- [ ] `apps/teka-market-web/yarn.lock` absent
- [ ] `apps/teka-market-web/package.json` → `"name": "@teka/web"`
- [ ] `apps/teka-market-web/.env.template` → `NEXT_PUBLIC_DEFAULT_REGION=cg`, `NEXT_PUBLIC_SITE_NAME="Teka-Market"`
- [ ] `grep -ri "talkjs" apps/teka-market-web/` vide
- [ ] `bun run dev` lance le storefront sur 3000
- [ ] Storefront ne crashe pas si `NEXT_PUBLIC_ALGOLIA_*` vide

### Skill (B)
- [ ] `.claude/skills/teka-market/SKILL.md` existe et parse en YAML
- [ ] Test trigger réussit (skill chargé sur prompt Teka-Market)

### Linear (F)
- [ ] Team `TEKA` visible
- [ ] 8 issues Sprint 0 toutes en `Todo` ou `In Progress`
- [ ] Chaque commit `feature/vague-1-fondations` référence un `TEKA-X` valide

### Non-régression
- [ ] `blocks.json` inchangé (diff vide)
- [ ] Aucune nouvelle dep npm dans `packages/api/package.json`
- [ ] `apps/admin` et `apps/vendor` démarrent toujours

---

## 8. Plan de rollback

Chaque sous-projet a un rollback indépendant :

| Sous-projet | Action de rollback |
|---|---|
| A (config + seed) | `git revert <commit>` + `DROP` des entités créées en DB |
| A.4 (storefront) | `git clone https://github.com/mercurjs/b2c-marketplace-storefront.git apps/teka-market-web` après suppression |
| B (skill) | `rm .claude/skills/teka-market/SKILL.md` |
| F (Linear) | Archive de la team Linear (pas de delete — preserve l'audit trail) |

---

## 9. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Seed Congo crashe (workflow signature changée) | Faible | Élevé | Snapshot DB avant ; tester en isolation |
| Storefront ne build pas après suppression Talkjs (imports résiduels) | Moyenne | Moyen | `grep -ri "talkjs" apps/teka-market-web/src/` après suppression |
| Conflit lockfile bun ↔ yarn pendant `bun install` | Moyenne | Moyen | Supprimer tous `yarn.lock` enfants avant install |
| Skill IA mal trigger (description trop générique) | Faible | Faible | Tester avec 3 prompts cibles avant fermeture |
| Linear API rate limit pendant création en masse | Faible | Faible | Créations séquentielles |

---

## 10. Métriques de succès

| Métrique | Cible |
|---|---|
| Temps total implémentation | ≤ 3h |
| Issues TEKA Sprint 0 fermées | 8/8 |
| Build vert sur tous workspaces | Oui |
| Régression Mercur starter | Zéro |
| Compréhension du spec par nouveau dev | < 15 min |

---

## 11. Prochaines étapes

1. **Maintenant** : utilisateur relit ce spec. Modifications éventuelles intégrées avant de continuer.
2. **Après approbation** : invocation du skill `superpowers:writing-plans` pour produire le plan d'implémentation détaillé étape par étape.
3. **Ensuite** : exécution du plan (manuelle ou via `superpowers:executing-plans` / `superpowers:subagent-driven-development`).
4. **Vagues futures** :
   - Vague 2 : Marketplace Core (sellers, commission via blocks Mercur)
   - Vague 3 : Mobile Money + Frontend storefront pages
   - Chaque vague : son propre cycle brainstorm → spec → plan → exécution

---

## Annexe A — Glossaire

| Terme | Définition |
|---|---|
| XAF | Franc CFA d'Afrique centrale. ISO 4217. 0 décimale. |
| Mercur | Open-source multi-vendor marketplace, built on Medusa. |
| Medusa | Headless commerce framework v2.x. |
| Mobile Money | Système de paiement par téléphone (MTN MoMo, Airtel Money). |
| Sales Channel | Concept Medusa : un canal de vente (storefront, app, magasin physique). |
| Region | Concept Medusa : groupement géographique avec devise + tax + pays. |
| Sprint 0 | Le sprint de fondations, équivalent de cette Vague 1. |

## Annexe B — Références

- `CLAUDE.md` (racine) — guide projet
- `packages/api/CLAUDE.md` — guide backend
- `blocks.json` — registry Mercur
- `https://docs.mercurjs.com` — docs Mercur
- `https://docs.medusajs.com` — docs Medusa
- Workspace Linear `lilia-food` (réutilisé pour Teka-Market)
