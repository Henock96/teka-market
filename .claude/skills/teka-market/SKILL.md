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
