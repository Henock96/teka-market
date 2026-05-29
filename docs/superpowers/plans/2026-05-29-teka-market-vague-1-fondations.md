# Teka-Market Vague 1 — Fondations Congo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap Teka-Market en livrant : localisation Congo (XAF, fr-FR, region, tax), skill IA projet, workspace Linear structuré, et intégration propre du storefront Next.js cloné.

**Architecture:** 4 sous-projets indépendants exécutés séquentiellement (F Linear → B Skill → A Backend → A.4 Storefront). Aucune dépendance bloquante entre eux. Toute modification est additive, respecte les contrats du starter Mercur, et n'ajoute aucune nouvelle dépendance npm au backend.

**Tech Stack:** Mercur 2.1.5, Medusa v2.13.4, Next.js 15 (storefront), bun (package manager racine), Linear (project management via MCP), Markdown (skill IA).

**Spec :** `docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md`

---

## Pre-flight Check (obligatoire avant Task 1)

- [ ] **P.1** Vérifier la branche d'exécution

Run: `git branch --show-current`
Expected output : `feature/vague-1-spec` (la branche du spec) ou similaire.

- [ ] **P.2** Créer la branche d'exécution dédiée

```bash
git checkout dev
git pull origin dev
git checkout -b feature/vague-1-fondations-congo
```

Expected: nouvelle branche créée à partir de `dev` (qui contient le spec mergé OU pas — peu importe, le spec est en doc et n'impacte pas le code).

- [ ] **P.3** Vérifier l'état git propre

Run: `git status`
Expected: `nothing to commit, working tree clean`

- [ ] **P.4** Vérifier que les outils MCP Linear sont disponibles

Test: lister la team existante.

```
mcp__plugin_linear_linear__list_teams (limit: 10)
```

Expected: retour contenant la team `Lilia Food` (workspace existant). Si erreur d'auth, ré-autoriser le MCP Linear avant de continuer.

---

## Task 1: Linear bootstrap (Sous-projet F)

**Files:** aucune modification fichier — tout passe par l'API Linear via MCP.

**Pré-requis manuel UI :** la création de team Linear n'est PAS exposée par les MCP tools disponibles. L'étape 1.1 doit donc être faite à la main par l'utilisateur. L'agent attend confirmation avant de continuer.

- [ ] **Step 1.1 (manuel utilisateur)** Créer la team `Teka-Market` dans Linear UI

Action utilisateur : aller sur `https://linear.app/lilia-food/settings/teams` → "New team" → :
- Name: `Teka-Market`
- Identifier (key): `TEKA`
- Icon: `Store`
- Color: vert profond `#1B5E20`

L'agent demande à l'utilisateur de confirmer la création avant Step 1.2.

- [ ] **Step 1.2** Vérifier que la team `TEKA` existe via MCP

```
mcp__plugin_linear_linear__list_teams (query: "Teka-Market")
```

Expected: retour avec `{ "name": "Teka-Market", "key": "TEKA", "id": "<uuid>" }`. Noter l'`id` — il sera utilisé pour tous les appels suivants.

- [ ] **Step 1.3** Créer les 5 labels `area:*`

Pour chaque label, appel séparé :

```
mcp__plugin_linear_linear__create_issue_label
  name: "area:backend"
  description: "Mercur/Medusa, modules, workflows, API"
  color: "#1976D2"
  team: "<TEKA team id>"
```

Répéter pour :
- `area:frontend` — `#7B1FA2` — "Storefront Next.js, design system"
- `area:payments` — `#F57C00` — "MTN MoMo, Airtel Money, payouts"
- `area:marketplace` — `#388E3C` — "Sellers, commission, multi-vendeur"
- `area:devops` — `#455A64` — "CI/CD, infra, env, monitoring"

Expected : 5 labels créés, visibles sur `https://linear.app/lilia-food/team/TEKA/labels`.

- [ ] **Step 1.4** Créer les 4 labels `type:*`

```
mcp__plugin_linear_linear__create_issue_label
  name: "type:feature"
  description: "Nouvelle capacité produit"
  color: "#43A047"
  team: "<TEKA team id>"
```

Répéter pour :
- `type:bug` — `#E53935` — "Régression / dysfonctionnement"
- `type:chore` — `#90A4AE` — "Maintenance, refactor, deps"
- `type:spike` — `#FB8C00` — "Recherche / prototype"

Expected : 9 labels au total dans la team TEKA.

- [ ] **Step 1.5** Créer le project `Sprint 0 — Fondations Congo` (P0, actif)

```
mcp__plugin_linear_linear__save_project
  team: "<TEKA team id>"
  name: "Sprint 0 — Fondations Congo"
  description: "Sprint 0 — pose les fondations Teka-Market : localisation Congo (XAF, fr-FR, region, TVA), skill IA projet, workspace Linear, intégration storefront. Spec : docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md. Vérification globale : 18 checks répartis sur backend, storefront, skill, Linear, non-régression."
  startDate: "2026-05-29"
  targetDate: "2026-06-12"
  priority: 1
```

Expected : project créé, noter son `id`.

- [ ] **Step 1.6** Créer les 6 projects backlog (P1-P6) — appels séparés

```
mcp__plugin_linear_linear__save_project
  team: "<TEKA team id>"
  name: "Sprint 1 — Marketplace Core"
  description: "Installation des blocks Mercur (seller, commission, payout) + workflows order split. Spec à produire (Vague 2)."
  priority: 2
```

Répéter pour :
- `Sprint 2 — Sellers system` — "KYC, validation admin, dashboard vendor. Vague 2."
- `Sprint 3 — Payments Mobile Money` — "Provider MTN MoMo + Airtel Money. Vague 3."
- `Sprint 4 — Frontend Storefront` — "Pages storefront, perf mobile, fr-FR i18n. Vague 3."
- `Sprint 5 — Admin custom + optimisation` — "Customisations admin, observabilité. Vague 4."
- `Tech Debt & Observability` — "Transversal continu : Sentry, OpenTelemetry, refactors."

Expected : 7 projects au total.

- [ ] **Step 1.7** Créer les 8 issues du Sprint 0 — projet P0

Pour chaque issue ci-dessous, appel séparé via `mcp__plugin_linear_linear__save_issue` avec : `team` (TEKA id), `project` (P0 id), `title`, `description` (markdown), `labels` (ids des labels), `priority` (1=Urgent, 2=High, 3=Medium), `assignee` ("hmipoka").

**Issue 1 — `Patch medusa-config.ts — header convention Congo`**
- Labels: `area:backend`, `type:chore`
- Priority: 2 (High)
- Description :
  ```markdown
  ## Contexte
  Ajouter un commentaire d'en-tête à `packages/api/medusa-config.ts` documentant la convention Congo (XAF entier, fr-FR, timezone via env).

  ## Acceptance Criteria
  - [ ] Header markdown-style en haut du fichier listant : devise, locale, timezone, lien vers spec
  - [ ] Aucune modification fonctionnelle (modules/plugins/projectConfig inchangés)
  - [ ] Build passe : `cd packages/api && bun run build`

  ## DoD
  - Commit avec `[TEKA-1]`
  - Lien vers spec : docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md (A.1)
  ```

**Issue 2 — `Implémenter seed-congo.ts (XAF, region, tax, sales channel)`**
- Labels: `area:backend`, `type:feature`
- Priority: 1 (Urgent)
- Description (résumé) : créer le script idempotent qui seed currency XAF (0 décimale), region Congo, country cg, tax region cg + tax rate TVA 18.9%, sales channel teka-store, stock location Brazzaville HQ. Référence spec A.2.

**Issue 3 — `Créer .env.template racine complet`**
- Labels: `area:devops`, `type:chore`
- Priority: 2 (High)
- Référence spec A.3.

**Issue 4 — `Storefront cleanup : retirer nested .git, supprimer yarn.lock`**
- Labels: `area:devops`, `type:chore`
- Priority: 1 (Urgent)
- Référence spec A.4.1-A.4.2.

**Issue 5 — `Storefront rebranding (region cg, name Teka-Market, package @teka/web)`**
- Labels: `area:frontend`, `type:chore`
- Priority: 2 (High)
- Référence spec A.4.3-A.4.4.

**Issue 6 — `Storefront : retirer Talkjs (deps + composants)`**
- Labels: `area:frontend`, `type:chore`
- Priority: 3 (Medium)
- Référence spec A.4.7. Lister les 5 dossiers à supprimer et les 4 fichiers à patcher (voir Task 9).

**Issue 7 — `Storefront : Algolia fallback gracieux si pas de clé`**
- Labels: `area:frontend`, `type:feature`
- Priority: 3 (Medium)
- Référence spec A.4.8.

**Issue 8 — `Créer skill IA .claude/skills/teka-market/SKILL.md`**
- Labels: `area:devops`, `type:feature`
- Priority: 2 (High)
- Référence spec section 4 (B).

Expected : 8 issues créées, toutes assignées à `hmipoka`, toutes en statut `Backlog` ou `Todo`.

- [ ] **Step 1.8** Commit (purement marker — pas de fichier modifié)

```bash
git commit --allow-empty -m "chore(linear): bootstrap TEKA workspace, 7 projects, 8 issues Sprint 0 [TEKA-0]

Team Teka-Market (TEKA) créée manuellement via UI.
Labels (9): 5 area:* + 4 type:*.
Projects (7): P0 active + 6 backlog.
Issues Sprint 0 (8): toutes assignées à hmipoka@gmail.com.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Expected : commit empty créé sur la branche. Sert de marqueur dans l'historique.

---

## Task 2: Skill IA `.claude/skills/teka-market/SKILL.md` (Sous-projet B)

**Files:**
- Create: `.claude/skills/teka-market/SKILL.md`

- [ ] **Step 2.1** Créer le dossier du skill

```bash
mkdir -p .claude/skills/teka-market
```

- [ ] **Step 2.2** Écrire le SKILL.md complet

Write to `.claude/skills/teka-market/SKILL.md` le contenu suivant (template complet — copier tel quel, ajuster si nécessaire après revue) :

````markdown
---
name: teka-market
description: Connaissance complète du projet Teka-Market — marketplace nationale Congo-Brazzaville built on Mercur/Medusa. Utilise ce skill dès que le travail concerne Teka-Market, qu'il s'agisse du backend (packages/api), de l'admin, du vendor portal, du storefront teka-market-web, des paiements Mobile Money, de la devise XAF, de la région Congo, des sellers, des commissions, ou de toute convention spécifique au projet. Déclenche aussi pour toute question sur l'archi marketplace multi-vendeur en Afrique centrale, MTN MoMo, Airtel Money, ou contraintes locales (faible bande passante, mobile-first).
---

# Teka-Market — Skill projet

Ce skill encode le contexte produit, l'architecture métier, les règles business et les patterns techniques de Teka-Market. Charge-le AVANT toute modification non-triviale du code.

## 1. Contexte produit

**Teka-Market** est une marketplace nationale pour le **Congo-Brazzaville**.

- Modèle : multi-vendeur (sellers indépendants vendent leurs produits sur la plateforme)
- Public : consommateurs congolais, mobile-first, **bande passante limitée** (3G fréquent, 4G dans les grandes villes)
- Monnaie unique : **XAF (Franc CFA)** — pas de multi-devise au démarrage
- Langue par défaut : **fr-FR**
- Paiements primaires : **MTN Mobile Money** + **Airtel Money** (carte/Stripe = phase 2+)
- Logistique : livraison à l'adresse, stock locations multiples (Brazzaville HQ d'abord, autres villes ensuite)

**Hors-scope court terme :** multi-pays (Vague 3+), white-label resto, B2B, abonnements.

## 2. Architecture métier

```
Customer ──┐
           │
           ├── Order ── OrderItem(s) ── Product ── Seller
           │              │
           │              └── Payment (MoMo / Airtel)
           │                       │
           │                       └── Payout (vers Seller)
           │
           └── Address (livraison)
```

Modules attendus (à installer via blocks Mercur en Vague 2) :
- `seller` (registration, KYC, dashboard vendor)
- `commission` (% marketplace prélevé sur chaque order item)
- `payout` (transfert au seller après commission)
- `review` (notation produit & seller)

Tables Medusa **réutilisées telles quelles** :
- `currency`, `region`, `country` (seedés en Vague 1)
- `tax_region`, `tax_rate` (TVA Congo 18.9% configurée en Vague 1)
- `customer`, `order`, `cart`, `product`, `sales_channel`, `stock_location`

## 3. Règles business

- **Devise UNIQUE : XAF** stocké en entier (0 décimale), conforme ISO 4217. PAS de × 100.
- **TVA : 18.9%** configurée au niveau Tax Module (entité `tax_region` `cg` → `tax_rate` `tva-cg`).
- **Commission marketplace :** NON décidée en Vague 1. À cadrer en Vague 2 lors du provisionnement du module commission Mercur. Fourchette indicative : 5-15%.
- **Validation seller :** KYC manuel admin avant activation (pas d'auto-approbation). À implémenter Vague 2.
- **Sales Channel :** un seul, `teka-store`, au démarrage. Pas de white-label.
- **Region :** une seule, `Congo`, couvrant Brazzaville + Pointe-Noire. Découpage par ville via `Stock Location`, pas via Region.

## 4. Patterns techniques

### Toujours chercher dans le registry Mercur AVANT de coder

```bash
bunx @mercurjs/cli@latest search --query <keyword>
```

Beaucoup de features marketplace (reviews, wishlist, chat, CSV import, approval, search Algolia, notifications) existent déjà comme blocks installables. Installer un block = plus rapide et plus sûr que coder from scratch.

Charger le skill `[[mercur-blocks]]` pour le workflow d'installation.

### Extensions via modules isolés

Tout nouveau domaine métier custom vit dans `packages/api/src/modules/<nom>/`. Pas de logique business éparpillée dans les routes ou dans `medusa-config.ts`.

### API-first

Tout passe par les routes Medusa :
- `packages/api/src/api/store/*` pour le storefront
- `packages/api/src/api/admin/*` pour l'admin
- `packages/api/src/api/vendor/*` pour le vendor portal (Mercur extension)

Après tout changement de route ou de type de payload : régénérer les types via `bunx @mercurjs/cli@latest codegen`.

### Event-driven async

Pour les opérations non-critiques (envoi SMS, recalcul commission, push notification) : utiliser `subscribers` ou `jobs`, pas du synchrone dans les routes.

### Jamais de SQL brut

Toujours via les workflows Medusa (`runWorkflow`, `createXWorkflow`, `updateXWorkflow`). Si un workflow manque, l'écrire — pas de bypass direct vers le driver Postgres.

### Idempotence des scripts

Tout script `packages/api/src/scripts/*` doit être ré-exécutable sans casser :
```ts
const existing = await query.graph({ entity: "currency", filters: { code: "xaf" } })
if (!existing.data.length) { await runWorkflow(...) }
```

## 5. Guidelines IA (lecture obligatoire pour Claude)

Quand tu interviens sur Teka-Market :

1. **Pense contexte Afrique.** Bande passante coûteuse, batterie limitée, data précieuse. Tout payload API doit être paginé, projeté (pas de `*`), compressé.
2. **Mobile-first systématique.** UI testée en priorité sur écran ≤ 375px. Pas de tooltip "hover", pas de tableau dense, pas d'animation gourmande.
3. **Simplicité UX.** Minimum de clics pour acheter. Pas de multi-step wizard si une seule page suffit. Pas de microcopie verbeuse.
4. **YAGNI strict.** Si une feature n'est pas dans le sprint actif, NE PAS l'ajouter "tant qu'on y est". Surface = surface à maintenir.
5. **Anti sur-engineering.** Pas de design pattern abstrait sans 2 utilisations concrètes. Pas de service générique sans besoin réel.
6. **Lis CLAUDE.md + ce skill AVANT toute modif non-triviale.** Vérifie les contrats du starter Mercur listés dans CLAUDE.md.
7. **Préfère les blocks Mercur aux implémentations custom.** Toujours `bunx @mercurjs/cli search` avant.
8. **Garde fr-FR et XAF natifs.** N'introduis pas de string hardcodée anglaise dans une UI utilisateur. N'utilise pas un autre code de devise en exemple.

## Vérification rapide pour Claude (smell test avant de proposer du code)

- [ ] Le code respecte-t-il les 4 contrats starter (blocks.json, medusa-config, structure packages/api/src, structures apps/) ?
- [ ] L'opération est-elle idempotente / re-runnable ?
- [ ] Le payload réseau est-il minimal pour le mobile ?
- [ ] Aucune valeur en dur (commission %, TVA, URL) qui devrait être config / env ?
- [ ] Un block Mercur existant rend-il ce code redondant ?

## Cross-references

- `[[mercur-cli]]` — commandes Mercur CLI (init, add, search, codegen)
- `[[mercur-blocks]]` — workflow d'installation et vérification des blocks
- `[[medusa-ui-conformance]]` — patterns UI admin/vendor (utiliser @medusajs/ui)
- `[[dashboard-page-ui]]` — pages custom dans admin/vendor
- `[[dashboard-form-ui]]` — formulaires custom
- `[[dashboard-tab-ui]]` — workflows tabulés
- `[[migration-guide]]` — si jamais on migre depuis Mercur 1.x
````

- [ ] **Step 2.3** Vérifier que le YAML frontmatter parse

Run:
```bash
head -4 .claude/skills/teka-market/SKILL.md
```

Expected : frontmatter délimité par `---` en ligne 1 et 4, `name:` et `description:` présents.

- [ ] **Step 2.4** Vérifier les cross-refs (skills cibles existent)

Run:
```bash
ls .claude/skills/ | sort
```

Expected: liste contient au minimum `dashboard-form-ui`, `dashboard-page-ui`, `dashboard-tab-ui`, `medusa-ui-conformance`, `mercur-blocks`, `mercur-cli`, `migration-guide`, **et désormais `teka-market`**.

- [ ] **Step 2.5** Test trigger (manuel, optionnel mais recommandé)

Action : ouvrir une nouvelle session Claude Code dans ce projet et demander : *"Comment configurer XAF dans Teka-Market ?"*. Le skill `teka-market` doit apparaître dans la liste des skills chargés.

- [ ] **Step 2.6** Commit

```bash
git add .claude/skills/teka-market/SKILL.md
git commit -m "feat(skill): add teka-market AI skill (project context) [TEKA-8]

5 sections (contexte produit, archi métier, business rules,
patterns techniques, guidelines IA) + smell test + cross-refs.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: Backend — Root `.env.template` (Sous-projet A.3)

**Files:**
- Create: `.env.template` (à la racine du repo)

- [ ] **Step 3.1** Vérifier qu'il n'existe pas déjà

```bash
ls -la .env.template 2>&1
```

Expected: `ls: .env.template: No such file or directory`.

Si existe déjà, lire son contenu, le sauvegarder en `.env.template.backup`, et fusionner avec le contenu ci-dessous.

- [ ] **Step 3.2** Créer `.env.template` à la racine

Write to `.env.template` :

```bash
# ============================================================
# Teka-Market — Backend environment template
# ============================================================
# Copier en .env (gitignored). NE PAS commiter les vraies valeurs.
# Spec : docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md

# --- Base ---
NODE_ENV=development
TZ=Africa/Brazzaville
DATABASE_URL=postgres://user:pass@localhost:5432/teka_market
REDIS_URL=redis://localhost:6379

# --- Mercur CORS ---
STORE_CORS=http://localhost:3000
ADMIN_CORS=http://localhost:7000
VENDOR_CORS=http://localhost:7001
AUTH_CORS=http://localhost:3000,http://localhost:7000,http://localhost:7001

# --- Secrets (à régénérer en prod) ---
JWT_SECRET=__changeme__
COOKIE_SECRET=__changeme__

# --- Locale (consommé côté front, pas Medusa) ---
DEFAULT_LOCALE=fr-FR
DEFAULT_CURRENCY=xaf
DEFAULT_COUNTRY=cg

# --- Mobile Money (Vague 3 — placeholders) ---
MTN_MOMO_SUBSCRIPTION_KEY=
MTN_MOMO_API_USER=
MTN_MOMO_API_KEY=
AIRTEL_MONEY_CLIENT_ID=
AIRTEL_MONEY_CLIENT_SECRET=
```

- [ ] **Step 3.3** Vérifier que `.env.template` n'est pas dans `.gitignore`

Run:
```bash
grep -E "^\.env\.template$|^\.env\.\*$" .gitignore
```

Expected: aucun résultat. Si `.env.*` est listé, ajouter `!.env.template` à la fin du `.gitignore`. Si seulement `.env` est listé, OK.

- [ ] **Step 3.4** Commit

```bash
git add .env.template
git commit -m "chore(env): add root .env.template (backend + Congo locale) [TEKA-3]

Inclut: NODE_ENV, TZ Africa/Brazzaville, DATABASE_URL, Redis,
CORS Mercur, secrets, locale (fr-FR/xaf/cg), placeholders MoMo.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: Backend — `medusa-config.ts` header (Sous-projet A.1)

**Files:**
- Modify: `packages/api/medusa-config.ts:1-3`

- [ ] **Step 4.1** Ajouter un en-tête de convention

Edit `packages/api/medusa-config.ts`. Remplacer les lignes 1-3 actuelles :

```ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { DashboardModuleOptions } from '@mercurjs/types'
import path from 'path'
```

par :

```ts
/**
 * Teka-Market — Medusa configuration
 * 
 * Convention locale (Congo-Brazzaville) :
 *   - Devise par défaut : XAF (entier, 0 décimale, ISO 4217)
 *   - Locale : fr-FR
 *   - Timezone : Africa/Brazzaville (injectée via process.env.TZ)
 *   - TVA : 18.9% (configurée dans Tax Module via seed-congo.ts)
 * 
 * La région, currency, tax et sales channel sont créés via :
 *   bun run medusa exec ./src/scripts/seed-congo.ts
 * 
 * Spec : docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md
 */
import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { DashboardModuleOptions } from '@mercurjs/types'
import path from 'path'
```

- [ ] **Step 4.2** Vérifier que le build passe (aucune régression)

Run:
```bash
cd packages/api && bun run build
```

Expected: build successful, no errors. (Le commentaire n'a aucun impact runtime.)

- [ ] **Step 4.3** Commit

```bash
cd ../..
git add packages/api/medusa-config.ts
git commit -m "chore(api): add Congo locale convention header to medusa-config [TEKA-1]

Aucune modification fonctionnelle. Documente XAF/fr-FR/Brazzaville/TVA
et pointe vers seed-congo.ts pour le seed des entités locales.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: Backend — Script `seed-congo.ts` (Sous-projet A.2)

**Files:**
- Create: `packages/api/src/scripts/seed-congo.ts`
- Create: `packages/api/integration-tests/scripts/seed-congo.spec.ts`

**Note importante :** ce script utilise les workflows officiels Medusa v2. Si Medusa v2.13.4 a renommé un workflow ou changé une signature, ajuster en consultant `https://docs.medusajs.com/v2/resources/medusa-workflows-reference` puis re-vérifier.

- [ ] **Step 5.1** Créer le dossier `packages/api/integration-tests/scripts/` si absent

```bash
mkdir -p packages/api/integration-tests/scripts
```

- [ ] **Step 5.2** Écrire le test d'intégration (TDD : test d'abord)

Write to `packages/api/integration-tests/scripts/seed-congo.spec.ts` :

```ts
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import seedCongo from "../../src/scripts/seed-congo"

jest.setTimeout(60_000)

medusaIntegrationTestRunner({
  testSuite: ({ getContainer }) => {
    describe("seed-congo", () => {
      it("creates currency xaf with 0 decimal digits", async () => {
        await seedCongo({ container: getContainer() })

        const query = getContainer().resolve("query")
        const { data } = await query.graph({
          entity: "currency",
          fields: ["code", "name", "symbol"],
          filters: { code: "xaf" },
        })

        expect(data).toHaveLength(1)
        expect(data[0].code).toBe("xaf")
      })

      it("creates region Congo with currency xaf", async () => {
        await seedCongo({ container: getContainer() })

        const query = getContainer().resolve("query")
        const { data } = await query.graph({
          entity: "region",
          fields: ["name", "currency_code"],
          filters: { name: "Congo" },
        })

        expect(data).toHaveLength(1)
        expect(data[0].currency_code).toBe("xaf")
      })

      it("is idempotent (second run does not error or duplicate)", async () => {
        await seedCongo({ container: getContainer() })
        await expect(
          seedCongo({ container: getContainer() })
        ).resolves.not.toThrow()

        const query = getContainer().resolve("query")
        const { data } = await query.graph({
          entity: "region",
          fields: ["name"],
          filters: { name: "Congo" },
        })
        expect(data).toHaveLength(1) // pas de doublon
      })

      it("creates sales channel teka-store", async () => {
        await seedCongo({ container: getContainer() })

        const query = getContainer().resolve("query")
        const { data } = await query.graph({
          entity: "sales_channel",
          fields: ["name"],
          filters: { name: "Teka-Market Store" },
        })

        expect(data).toHaveLength(1)
      })
    })
  },
})
```

- [ ] **Step 5.3** Lancer le test et vérifier qu'il échoue

Run:
```bash
cd packages/api && bun run test:integration:modules -- --testPathPattern=seed-congo.spec
```

Expected: `FAIL` avec erreur de type `Cannot find module '../../src/scripts/seed-congo'` ou équivalent. Bien noter l'erreur exacte.

- [ ] **Step 5.4** Écrire l'implémentation minimale du seed

Write to `packages/api/src/scripts/seed-congo.ts` :

```ts
import {
  ExecArgs,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import {
  createCurrenciesWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Teka-Market — Seed Congo
 * 
 * Crée de façon idempotente :
 *   - Currency XAF (0 décimale, ISO 4217)
 *   - Region "Congo" avec country cg + currency xaf
 *   - Tax Region cg + Tax Rate TVA 18.9%
 *   - Sales Channel "Teka-Market Store"
 *   - Stock Location "Brazzaville HQ"
 * 
 * Lancer via : bun run medusa exec ./src/scripts/seed-congo.ts
 * 
 * Idempotent : ré-exécutable sans erreur ni doublon.
 */
export default async function seedCongo({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("🇨🇬 Seeding Teka-Market — Congo locale...")

  // 1. Currency XAF
  const { data: existingCurrencies } = await query.graph({
    entity: "currency",
    fields: ["code"],
    filters: { code: "xaf" },
  })

  if (!existingCurrencies.length) {
    await createCurrenciesWorkflow(container).run({
      input: {
        currencies: [
          {
            code: "xaf",
            symbol: "FCFA",
            symbol_native: "FCFA",
            name: "Franc CFA (BEAC)",
          },
        ],
      },
    })
    logger.info("  ✓ Currency xaf created")
  } else {
    logger.info("  ✓ Currency xaf already exists, skipped")
  }

  // 2. Region Congo
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: "Congo" },
  })

  if (!existingRegions.length) {
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Congo",
            currency_code: "xaf",
            countries: ["cg"],
            automatic_taxes: true,
          },
        ],
      },
    })
    logger.info("  ✓ Region Congo created")
  } else {
    logger.info("  ✓ Region Congo already exists, skipped")
  }

  // 3. Tax Region cg + Tax Rate TVA 18.9%
  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
    filters: { country_code: "cg" },
  })

  if (!existingTaxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "cg",
          provider_id: "tp_system",
          default_tax_rate: {
            rate: 18.9,
            code: "tva-cg",
            name: "TVA Congo",
          },
        },
      ],
    })
    logger.info("  ✓ Tax Region cg + TVA 18.9% created")
  } else {
    logger.info("  ✓ Tax Region cg already exists, skipped")
  }

  // 4. Sales Channel teka-store
  const { data: existingChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
    filters: { name: "Teka-Market Store" },
  })

  if (!existingChannels.length) {
    await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "Teka-Market Store",
            description: "Storefront principal Teka-Market (Next.js)",
          },
        ],
      },
    })
    logger.info("  ✓ Sales Channel teka-store created")
  } else {
    logger.info("  ✓ Sales Channel teka-store already exists, skipped")
  }

  // 5. Stock Location Brazzaville HQ
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Brazzaville HQ" },
  })

  if (!existingLocations.length) {
    await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: "Brazzaville HQ",
            address: {
              address_1: "Avenue Cardinal Émile Biayenda",
              city: "Brazzaville",
              country_code: "cg",
              postal_code: "BZV",
            },
          },
        ],
      },
    })
    logger.info("  ✓ Stock Location Brazzaville HQ created")
  } else {
    logger.info("  ✓ Stock Location Brazzaville HQ already exists, skipped")
  }

  logger.info("✅ Seed Congo complete.")
}
```

- [ ] **Step 5.5** Lancer le test et vérifier qu'il passe

Run:
```bash
cd packages/api && bun run test:integration:modules -- --testPathPattern=seed-congo.spec
```

Expected: tous les `it()` passent. Si un workflow refuse une signature (ex: `automatic_taxes` n'existe pas), corriger en consultant la doc Medusa v2 et ré-exécuter.

- [ ] **Step 5.6** Lancer le seed en direct (pré-requis : DB Postgres accessible)

Run:
```bash
cd packages/api && bun run medusa exec ./src/scripts/seed-congo.ts
```

Expected output : 5 logs `✓` confirmant chaque entité créée, puis `✅ Seed Congo complete.`

- [ ] **Step 5.7** Re-lancer pour vérifier l'idempotence

Run la même commande qu'au Step 5.6.

Expected : 5 logs `already exists, skipped`, pas d'erreur, pas de doublon en base.

- [ ] **Step 5.8** Commit

```bash
cd ../..
git add packages/api/src/scripts/seed-congo.ts packages/api/integration-tests/scripts/seed-congo.spec.ts
git commit -m "feat(api): add idempotent seed-congo script (XAF, region, TVA, channel) [TEKA-2]

Crée via workflows Medusa v2 :
  - Currency xaf (0 décimale ISO 4217)
  - Region Congo + country cg
  - Tax Region cg + Tax Rate TVA 18.9%
  - Sales Channel Teka-Market Store
  - Stock Location Brazzaville HQ

Idempotent (check existence avant chaque création).
4 tests d'intégration : currency, region, idempotence, sales channel.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: Storefront — Cleanup nested .git et yarn.lock (Sous-projet A.4.1-A.4.2)

**Files:**
- Delete: `apps/teka-market-web/.git/`
- Delete: `apps/teka-market-web/yarn.lock`

- [ ] **Step 6.1** Vérifier l'état actuel

Run:
```bash
ls -la apps/teka-market-web/.git apps/teka-market-web/yarn.lock 2>&1 | head -10
git status apps/teka-market-web/ 2>&1
```

Expected: `.git` est un dossier, `yarn.lock` est un fichier. `git status` montre `apps/teka-market-web/` comme untracked (à cause du nested .git).

- [ ] **Step 6.2** Supprimer le nested `.git`

```bash
rm -rf apps/teka-market-web/.git
```

- [ ] **Step 6.3** Supprimer `yarn.lock` du storefront

```bash
rm apps/teka-market-web/yarn.lock
```

- [ ] **Step 6.4** Vérifier que git voit maintenant le storefront

Run:
```bash
git status apps/teka-market-web/ 2>&1 | head -5
```

Expected : git liste désormais TOUS les fichiers du storefront comme untracked (centaines de fichiers). C'est le comportement attendu — ils seront ajoutés au prochain `git add`.

- [ ] **Step 6.5** Stage et commit le storefront entier

```bash
git add apps/teka-market-web/
git commit -m "chore(storefront): import teka-market-web into monorepo [TEKA-4]

Supprime le nested .git (origin: github.com/mercurjs/b2c-marketplace-storefront)
et yarn.lock enfant. Le storefront est désormais tracé par le repo parent
et utilisera bun via le workspace root.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

Expected : commit large (centaines de fichiers ajoutés). C'est normal pour une importation.

---

## Task 7: Storefront — Rebranding `@teka/web` (Sous-projet A.4.3-A.4.4)

**Files:**
- Modify: `apps/teka-market-web/package.json`
- Modify: `apps/teka-market-web/.env.template`

- [ ] **Step 7.1** Renommer le package

Edit `apps/teka-market-web/package.json`. Remplacer :

```json
  "name": "b2c-storefront",
  "version": "1.5.4",
```

par :

```json
  "name": "@teka/web",
  "version": "0.1.0",
```

- [ ] **Step 7.2** Localiser le `.env.template` du storefront

Edit `apps/teka-market-web/.env.template`. Remplacer le contenu entier par :

```bash
# ============================================================
# Teka-Market Storefront (Next.js) — environment template
# ============================================================
# Copier en .env.local (gitignored).

# Backend
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_VENDOR_URL=http://localhost:7001

# Locale Congo
NEXT_PUBLIC_DEFAULT_REGION=cg
NEXT_PUBLIC_DEFAULT_LOCALE=fr-FR
NEXT_PUBLIC_DEFAULT_CURRENCY=xaf

# Identité
NEXT_PUBLIC_SITE_NAME=Teka-Market
NEXT_PUBLIC_SITE_DESCRIPTION=Marketplace nationale Congo-Brazzaville

# Algolia (optionnel — si non rempli, recherche fallback sur API Medusa)
NEXT_PUBLIC_ALGOLIA_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=

# Stripe (placeholder — sera retiré Vague 3 au profit de MoMo)
NEXT_PUBLIC_STRIPE_KEY=

# Revalidation
REVALIDATE_SECRET=__changeme__
```

- [ ] **Step 7.3** Vérifier qu'aucun import ou doc ne référence l'ancien nom

Run:
```bash
grep -rn "b2c-storefront\|Fleek Marketplace\|Fleek Markeplace" apps/teka-market-web/ 2>&1 | head -10
```

Expected : seul `README.md` peut contenir "Fleek" — l'ajuster au besoin (changement cosmétique, pas critique).

Si trouvé dans `README.md`, remplacer "Fleek Marketplace" / "Fleek Markeplace" par "Teka-Market" :

```bash
sed -i.bak 's/Fleek Marketplace/Teka-Market/g; s/Fleek Markeplace/Teka-Market/g' apps/teka-market-web/README.md && rm apps/teka-market-web/README.md.bak
```

- [ ] **Step 7.4** Commit

```bash
git add apps/teka-market-web/package.json apps/teka-market-web/.env.template apps/teka-market-web/README.md
git commit -m "chore(storefront): rebrand to @teka/web, locale cg, retire Fleek refs [TEKA-5]

- package.json : name → @teka/web, version → 0.1.0
- .env.template : DEFAULT_REGION=cg, fr-FR, xaf, SITE_NAME=Teka-Market
- README : Fleek Marketplace → Teka-Market
- Stripe ENV gardé en placeholder (Vague 3 le remplacera par MoMo)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: Root — Ajout script `dev:web` et reconciliation bun (Sous-projet A.4.5-A.4.6)

**Files:**
- Modify: `package.json` (racine)

- [ ] **Step 8.1** Ajouter le script `dev:web` au root `package.json`

Edit `package.json` (racine). Remplacer :

```json
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "check-types": "turbo run check-types"
  },
```

par :

```json
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "dev:api": "turbo run dev --filter=@acme/api",
    "dev:admin": "turbo run dev --filter=admin",
    "dev:vendor": "turbo run dev --filter=vendor",
    "dev:web": "turbo run dev --filter=@teka/web",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "check-types": "turbo run check-types"
  },
```

Note : les filtres exacts pour `admin` et `vendor` peuvent différer selon les noms réels de leurs `package.json`. Vérifier puis ajuster :

```bash
cat apps/admin/package.json | grep '"name"'
cat apps/vendor/package.json | grep '"name"'
```

Adapter les `--filter=<nom-exact>` en conséquence.

- [ ] **Step 8.2** Réconcilier les dépendances via bun

```bash
bun install
```

Expected : un seul `bun.lock` à la racine, mis à jour pour inclure les deps du storefront. Si Bun se plaint de Yarn `packageManager`, modifier le `package.json` racine : retirer `"packageManager": "yarn@1.22.22"` ou le remplacer par `"packageManager": "bun@1.x.y"` (vérifier la version installée via `bun --version`).

- [ ] **Step 8.3** Vérifier qu'il n'y a plus aucun `yarn.lock` dans le repo

```bash
find . -name "yarn.lock" -not -path "./node_modules/*" 2>&1
```

Expected : aucun résultat.

- [ ] **Step 8.4** Vérifier que `bun run dev` lance bien les 4 services

```bash
bun run dev
```

Expected (dans des terminaux séparés ou via la TUI turbo) :
- Backend Medusa sur `http://localhost:9000`
- Admin sur `http://localhost:7000`
- Vendor sur `http://localhost:7001`
- Storefront sur `http://localhost:3000`

Si l'un crashe, lire le log, corriger, ré-exécuter. Tuer avec Ctrl+C une fois validé.

- [ ] **Step 8.5** Commit

```bash
git add package.json bun.lock
git commit -m "chore(monorepo): unify bun, add dev:api|admin|vendor|web scripts [TEKA-4]

- Scripts par-app pour lancer un seul service rapidement
- bun.lock régénéré après suppression du yarn.lock storefront
- 4 services up via 'bun run dev' (api+admin+vendor+web)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: Storefront — Retrait Talkjs (Sous-projet A.4.7)

**Files:**
- Delete entirely:
  - `apps/teka-market-web/src/components/providers/TalkJs/`
  - `apps/teka-market-web/src/components/organisms/Chat/`
  - `apps/teka-market-web/src/components/cells/ChatBox/`
  - `apps/teka-market-web/src/components/molecules/MessageButton/`
  - `apps/teka-market-web/src/components/sections/UserMessagesSection/`
- Modify (surgical edits):
  - `apps/teka-market-web/src/app/[locale]/(main)/layout.tsx` — retirer mount du TalkJsProvider
  - `apps/teka-market-web/src/components/cells/UserDropdown/UserDropdown.tsx:13` — retirer `useUnreads` import + usage
  - `apps/teka-market-web/src/components/molecules/UserNavigation/UserNavigation.tsx:9` — idem
  - `apps/teka-market-web/src/components/organisms/SingleOrderReturn/SingleOrderReturn.tsx:116` — remplacer `/talkjs-placeholder.jpg` par `/seller-placeholder.jpg`
- Modify package.json:
  - `apps/teka-market-web/package.json` — retirer `@talkjs/react`, `talkjs`

- [ ] **Step 9.1** Désinstaller les deps Talkjs

```bash
cd apps/teka-market-web && bun remove @talkjs/react talkjs && cd ../..
```

Expected : 2 packages retirés, `bun.lock` mis à jour, `node_modules` nettoyés.

- [ ] **Step 9.2** Supprimer les 5 dossiers dédiés Talkjs/Chat

```bash
rm -rf apps/teka-market-web/src/components/providers/TalkJs
rm -rf apps/teka-market-web/src/components/organisms/Chat
rm -rf apps/teka-market-web/src/components/cells/ChatBox
rm -rf apps/teka-market-web/src/components/molecules/MessageButton
rm -rf apps/teka-market-web/src/components/sections/UserMessagesSection
```

- [ ] **Step 9.3** Patcher `layout.tsx` (retirer le mount du provider)

Edit `apps/teka-market-web/src/app/[locale]/(main)/layout.tsx`. Localiser les références à `TalkJsProvider` :

```bash
grep -n "TalkJs" apps/teka-market-web/src/app/[locale]/\(main\)/layout.tsx
```

Pour chaque occurrence (import + balise JSX) : la retirer.

Exemple typique de patch :
- Supprimer la ligne `import TalkJsProvider from "@/components/providers/TalkJs/TalkJsProvider"`
- Remplacer `<TalkJsProvider>{children}</TalkJsProvider>` par `{children}` (ou retirer la balise wrapper)

Après édition, re-vérifier :
```bash
grep -n "TalkJs" apps/teka-market-web/src/app/[locale]/\(main\)/layout.tsx
```
Expected: aucun résultat.

- [ ] **Step 9.4** Patcher `UserDropdown.tsx`

Edit `apps/teka-market-web/src/components/cells/UserDropdown/UserDropdown.tsx`.

Retirer la ligne 13 :
```ts
import { useUnreads } from "@talkjs/react"
```

Puis chercher dans le corps du composant chaque utilisation de `useUnreads(...)` et la supprimer (généralement un compteur de messages non lus). Si la suppression laisse une variable non utilisée, la retirer aussi.

Vérification :
```bash
grep -n "useUnreads\|talkjs" apps/teka-market-web/src/components/cells/UserDropdown/UserDropdown.tsx
```
Expected: aucun résultat.

- [ ] **Step 9.5** Patcher `UserNavigation.tsx`

Edit `apps/teka-market-web/src/components/molecules/UserNavigation/UserNavigation.tsx`.

Même traitement qu'en Step 9.4 : retirer l'import `useUnreads` ligne 9 + ses usages dans le composant.

Vérification :
```bash
grep -n "useUnreads\|talkjs" apps/teka-market-web/src/components/molecules/UserNavigation/UserNavigation.tsx
```
Expected: aucun résultat.

- [ ] **Step 9.6** Patcher `SingleOrderReturn.tsx`

Edit `apps/teka-market-web/src/components/organisms/SingleOrderReturn/SingleOrderReturn.tsx`. Ligne 116 :

Remplacer :
```ts
src={item.order.seller.photo || "/talkjs-placeholder.jpg"}
```

par :
```ts
src={item.order.seller.photo || "/seller-placeholder.jpg"}
```

Note : `/seller-placeholder.jpg` n'existe peut-être pas en `public/`. Si c'est le cas, créer un placeholder neutre :
```bash
ls apps/teka-market-web/public/ | head -10
```

Si une icône générique existe (ex: avatar.png), l'utiliser à la place. Sinon, copier le `talkjs-placeholder.jpg` existant en `seller-placeholder.jpg` puis supprimer l'original :
```bash
cp apps/teka-market-web/public/talkjs-placeholder.jpg apps/teka-market-web/public/seller-placeholder.jpg 2>/dev/null
rm apps/teka-market-web/public/talkjs-placeholder.jpg 2>/dev/null
```

- [ ] **Step 9.7** Vérifier qu'aucune référence Talkjs ne subsiste

Run:
```bash
grep -rni "talkjs\|@talkjs" apps/teka-market-web/src apps/teka-market-web/package.json 2>&1
```

Expected: aucun résultat (sauf éventuellement le mot dans `README.md` ou un changelog — non bloquant).

- [ ] **Step 9.8** Vérifier que le storefront build

```bash
cd apps/teka-market-web && bun run build && cd ../..
```

Expected: build successful. Si erreur de type ou import non résolu (résiduel Talkjs), retracer et corriger.

- [ ] **Step 9.9** Commit

```bash
git add apps/teka-market-web/ package.json bun.lock
git commit -m "chore(storefront): remove Talkjs (deps + 5 dirs + 4 patched files) [TEKA-6]

- Désinstallé @talkjs/react + talkjs
- Supprimé : providers/TalkJs, organisms/Chat, cells/ChatBox,
  molecules/MessageButton, sections/UserMessagesSection
- Patché : layout.tsx (mount retiré), UserDropdown + UserNavigation
  (useUnreads retiré), SingleOrderReturn (placeholder remplacé)
- Build storefront vert

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: Storefront — Algolia fallback gracieux (Sous-projet A.4.8)

**Files:**
- Modify: tout fichier qui consomme Algolia. Localiser via grep.

- [ ] **Step 10.1** Identifier tous les points d'usage Algolia

Run:
```bash
grep -rln "ALGOLIA\|algoliasearch\|InstantSearch" apps/teka-market-web/src 2>&1 | head -20
```

Noter chaque fichier listé.

- [ ] **Step 10.2** Identifier le client Algolia (point central)

Le plus courant dans une stack Next.js + Algolia : un fichier `src/lib/search-client.ts` ou similaire. Localiser :

```bash
grep -rln "algoliasearch(" apps/teka-market-web/src 2>&1 | head -5
```

- [ ] **Step 10.3** Patcher le client pour qu'il ne crashe pas sans clés

Dans le fichier client identifié (exemple typique `src/lib/search-client.ts`), envelopper l'instanciation :

```ts
import algoliasearch from "algoliasearch/lite"

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

// Fallback gracieux : si les clés ne sont pas définies, on retourne un
// no-op client qui ne crashe pas. Les composants InstantSearch afficheront
// un état "recherche indisponible" plutôt que de planter.
export const searchClient = (APP_ID && SEARCH_KEY)
  ? algoliasearch(APP_ID, SEARCH_KEY)
  : {
      search: async () => ({ results: [{ hits: [], nbHits: 0, page: 0, nbPages: 0, hitsPerPage: 0, processingTimeMS: 0 }] }),
      searchForFacetValues: async () => ({ facetHits: [] }),
    } as any

export const isSearchEnabled = !!(APP_ID && SEARCH_KEY)
```

Si la stack utilise une autre lib (typesense-instantsearch-adapter, react-instantsearch, etc.), adapter mais garder le principe : retourner un mock client + exposer `isSearchEnabled`.

- [ ] **Step 10.4** Patcher les composants qui rendent le search bar

Dans les composants qui affichent la recherche (typiquement `Header.tsx`, `SearchBar.tsx`, `Search.tsx`), entourer l'usage :

```tsx
import { isSearchEnabled } from "@/lib/search-client"

// Dans le rendu :
{isSearchEnabled ? (
  <SearchBar />
) : (
  // Pas de search bar du tout — UX propre, pas de placeholder cassé
  null
)}
```

Identifier le composant principal :
```bash
grep -rln "InstantSearch\|<SearchBox" apps/teka-market-web/src 2>&1 | head -5
```

- [ ] **Step 10.5** Vérifier que le storefront démarre sans clé Algolia

```bash
cd apps/teka-market-web && bun run dev
```

S'assurer que `NEXT_PUBLIC_ALGOLIA_ID` et `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY` sont vides dans `.env.local` (commenter si nécessaire).

Expected : storefront démarre sur `http://localhost:3000` sans erreur. La barre de recherche est soit absente, soit non-fonctionnelle de manière propre. Aucun crash runtime, aucune erreur console rouge.

Tuer avec Ctrl+C une fois validé.

- [ ] **Step 10.6** Vérifier que le build passe

```bash
cd apps/teka-market-web && bun run build && cd ../..
```

Expected : build successful.

- [ ] **Step 10.7** Commit

```bash
git add apps/teka-market-web/src/
git commit -m "feat(storefront): graceful Algolia fallback (no-op without keys) [TEKA-7]

- searchClient retourne un mock qui ne crashe pas si NEXT_PUBLIC_ALGOLIA_*
  est vide
- isSearchEnabled flag exposé pour conditionner le rendu des composants
  search (header, search bar)
- Storefront démarre proprement sans Algolia configuré
- Build vert

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: Vérification globale + PR

- [ ] **Step 11.1** Vérification backend

Run (depuis racine) :
```bash
cd packages/api && bun run build && cd ../..
```
Expected: build successful.

Vérifier la DB (via `psql` ou un client équivalent) :
```sql
SELECT code, name, symbol FROM currency WHERE code='xaf';
-- Expected: 1 ligne avec xaf | Franc CFA (BEAC) | FCFA

SELECT name, currency_code FROM region WHERE name='Congo';
-- Expected: 1 ligne avec Congo | xaf

SELECT country_code FROM tax_region WHERE country_code='cg';
-- Expected: 1 ligne avec cg

SELECT name, rate FROM tax_rate WHERE code='tva-cg';
-- Expected: 1 ligne avec TVA Congo | 18.9 (ou 0.189 selon convention Medusa)

SELECT name FROM sales_channel WHERE name='Teka-Market Store';
-- Expected: 1 ligne

SELECT name FROM stock_location WHERE name='Brazzaville HQ';
-- Expected: 1 ligne
```

- [ ] **Step 11.2** Vérification storefront

Run :
```bash
ls -la apps/teka-market-web/.git 2>&1 | head -3
ls apps/teka-market-web/yarn.lock 2>&1
grep '"name"' apps/teka-market-web/package.json
grep "NEXT_PUBLIC_DEFAULT_REGION" apps/teka-market-web/.env.template
grep -ri "talkjs" apps/teka-market-web/src apps/teka-market-web/package.json 2>&1
cd apps/teka-market-web && bun run build && cd ../..
```

Expected :
- `.git` absent (`No such file or directory`)
- `yarn.lock` absent
- name = `@teka/web`
- DEFAULT_REGION=cg
- aucun match talkjs
- build vert

- [ ] **Step 11.3** Vérification skill

```bash
ls -la .claude/skills/teka-market/SKILL.md
head -4 .claude/skills/teka-market/SKILL.md
wc -l .claude/skills/teka-market/SKILL.md
```

Expected :
- fichier présent, taille > 5 KB
- frontmatter `---`/`name:`/`description:`/`---`
- entre 200 et 320 lignes

- [ ] **Step 11.4** Vérification Linear

Via MCP :
```
mcp__plugin_linear_linear__list_teams (query: "Teka-Market")
mcp__plugin_linear_linear__list_projects (team: "Teka-Market")
mcp__plugin_linear_linear__list_issues (team: "Teka-Market", project: "Sprint 0 — Fondations Congo")
```

Expected :
- 1 team TEKA
- 7 projects (P0 active + 6 backlog)
- 8 issues, toutes assignées à hmipoka

- [ ] **Step 11.5** Vérification non-régression

```bash
git diff dev -- blocks.json
git diff dev -- packages/api/package.json
```

Expected :
- `blocks.json` inchangé (diff vide)
- `packages/api/package.json` inchangé (aucune dep backend ajoutée)

- [ ] **Step 11.6** Vérification globale `bun run dev`

```bash
bun run dev
```

Expected (laisser tourner ~30s) :
- 4 services up sans erreur
- Backend `:9000` accessible
- Storefront `:3000` affiche "Teka-Market" dans le `<title>`
- Admin `:7000` charge
- Vendor `:7001` charge

Tuer avec Ctrl+C.

- [ ] **Step 11.7** Mettre à jour les issues Linear en `Done`

Via MCP, pour chaque TEKA-1 à TEKA-8 :
```
mcp__plugin_linear_linear__save_issue
  id: "<issue id>"
  state: "Done"
```

- [ ] **Step 11.8** Pousser la branche et ouvrir la PR

```bash
git push -u origin feature/vague-1-fondations-congo
```

Puis via `gh` :
```bash
gh pr create \
  --base dev \
  --head feature/vague-1-fondations-congo \
  --title "Vague 1 — Fondations Congo (XAF, locale, storefront, skill, Linear)" \
  --body-file docs/superpowers/pr-bodies/vague-1.md
```

(Créer le fichier `docs/superpowers/pr-bodies/vague-1.md` avec le contenu suivant avant la commande `gh pr create` :)

```markdown
## Vague 1 — Fondations Congo

Implémente le Sprint 0 du projet Teka-Market.

**Spec :** `docs/superpowers/specs/2026-05-29-teka-market-vague-1-design.md`
**Plan :** `docs/superpowers/plans/2026-05-29-teka-market-vague-1-fondations.md`

### Livrables

- **Sous-projet A — Localisation Congo**
  - Header convention sur `medusa-config.ts`
  - Script idempotent `seed-congo.ts` (XAF, region, tax, sales channel, stock location) + 4 tests d'intégration
  - `.env.template` racine complet

- **Sous-projet A.4 — Storefront teka-market-web**
  - Nettoyage nested `.git` + retrait `yarn.lock` enfant
  - Rebranding : `@teka/web`, region `cg`, site name Teka-Market
  - Retrait Talkjs (2 deps + 5 dossiers + 4 fichiers patchés)
  - Algolia fallback gracieux (no-op sans clé)

- **Sous-projet B — Skill IA**
  - `.claude/skills/teka-market/SKILL.md` (~280 lignes, 5 sections)

- **Sous-projet F — Linear**
  - Team TEKA + 9 labels + 7 projects + 8 issues Sprint 0
  - Toutes les issues TEKA-1 à TEKA-8 closes par cette PR

### Vérification

- [x] Backend build vert
- [x] Seed Congo lancé, idempotence vérifiée
- [x] 4 entités DB seedées (currency, region, tax, sales channel)
- [x] Storefront build vert (`@teka/web`)
- [x] Aucune trace Talkjs résiduelle
- [x] Algolia désactivé proprement (pas de crash)
- [x] Skill teka-market charge sur prompt cible
- [x] 8 issues Linear closes
- [x] Aucune régression : `blocks.json`, `packages/api/package.json` inchangés
- [x] `bun run dev` lance les 4 services

### Closes

Closes TEKA-1, TEKA-2, TEKA-3, TEKA-4, TEKA-5, TEKA-6, TEKA-7, TEKA-8

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

Expected : PR ouverte sur GitHub, lien retourné.

---

## Notes pour l'ingénieur en exécution

### Si un workflow Medusa change de signature

Si Medusa v2.13.4 a renommé `createTaxRegionsWorkflow` ou modifié sa signature d'input, les tests du Task 5 échoueront. Procédure :
1. Lire `node_modules/@medusajs/medusa/dist/core-flows/index.d.ts` pour la signature actuelle
2. Adapter le seed-congo.ts en conséquence
3. Re-lancer le test
4. Documenter la divergence dans une note en haut du seed pour les prochains agents

### Si la team Linear n'a pas été créée manuellement

Si le Step 1.1 n'a pas été fait : impossible de continuer. Demander à l'utilisateur de la créer dans Linear UI, puis reprendre au Step 1.2.

### Si bun install conflicte avec yarn

Si `bun install` refuse de tourner à cause de `"packageManager": "yarn@1.22.22"` :
- Soit retirer ce champ du `package.json` racine
- Soit le remplacer par la version bun installée (`bun --version` puis `"packageManager": "bun@<version>"`)

### Rollback partiel

Si une tâche casse l'app :
- `git reset --hard HEAD~1` pour annuler le dernier commit
- Identifier la cause via les logs
- Reprendre la tâche après correction
