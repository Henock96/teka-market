# Lessons Learned — Teka-Market

### createCurrenciesWorkflow does not exist in Medusa v2.13.4
In Medusa v2, currencies are not standalone entities with a creation workflow.
They are managed as `supported_currencies` on the Store entity.
Use `updateStoresWorkflow({ selector: { id: store.id }, update: { supported_currencies: [...] } })` from `@medusajs/medusa/core-flows`.
Source: `packages/api/src/scripts/seed.ts` (official Mercur seed) and `@medusajs/core-flows` dist inspection.

### @medusajs/utils is not symlinked in packages/api/node_modules
Bun hoists most packages but `@medusajs/utils` was missing from `packages/api/node_modules/@medusajs/`.
Jest/Node CJS resolver cannot find bun virtual packages.
Fix: add a manual symlink:
```
ln -sf "../../../../node_modules/.bun/@medusajs+utils@<version>/node_modules/@medusajs/utils" \
  packages/api/node_modules/@medusajs/utils
```
Check `node_modules/.bun/@medusajs+utils@*` for the exact version hash.

### Integration tests require a live PostgreSQL database
`medusaIntegrationTestRunner` from `@medusajs/test-utils` spins up the full Medusa stack and creates a real test DB. If `DATABASE_URL` is not configured in `packages/api/.env.test`, the beforeAll hook times out after 60s. Tests will compile and be found, but all fail with "Exceeded timeout of 60000 ms for a hook." This is a CI/environment concern, not a code issue.

### jest.config.js testMatch for integration:modules only covers src/modules/
The default testMatch for `TEST_TYPE=integration:modules` is `**/src/modules/*/__tests__/**/*.[jt]s`.
Script-level integration tests placed in `integration-tests/scripts/` require extending testMatch:
```js
module.exports.testMatch = [
  "**/src/modules/*/__tests__/**/*.[jt]s",
  "**/integration-tests/scripts/**/*.spec.[jt]s",
];
```
This was added to `packages/api/jest.config.js` in commit ec0b3c8.

### createTaxRegionsWorkflow input is a direct array
The workflow signature is `createTaxRegionsWorkflow(container).run({ input: CreateTaxRegionDTO[] })`.
Pass the array directly — there is no wrapper object. `provider_id` and `default_tax_rate` are valid fields on `CreateTaxRegionDTO`.

### RBAC: new admin users have NO permissions by default
With `featureFlags.rbac: true` in `medusa-config.ts`, every `/admin/*` route requires the user to be linked to a role. The `create-super-admin-role` migration only assigns the role to users that already existed at migration time — new users created afterwards stay unauthorized.
Fix in the seed: after `createUserAccountWorkflow`, manually link the user to `role_super_admin`:
```ts
await link.create({
  [Modules.USER]: { user_id: userId },
  [Modules.RBAC]: { rbac_role_id: "role_super_admin" }
})
```
Symptom: login HTTP 200, but every `/admin/*` returns 403 Forbidden. Fixed in commit ab6c8ae.

### JWT sessions default to 1 day (annoying in dev)
Medusa default: `http.jwtExpiresIn = "1d"` — re-login required every 24h. In `medusa-config.ts`, read from env:
```ts
jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d"
```
`.env.template` defaults to `JWT_EXPIRES_IN=30d` for dev. In prod, drop to "1d" + implement a refresh-token flow.

### Mercur seller `currency_code` is required
`createSellerAccountWorkflow` from `@mercurjs/core/workflows` requires `seller.currency_code` (e.g. `"xaf"`). Without it, you get `ValidationError: Value for Seller.currency_code is required, 'undefined' found`. Import path is `@mercurjs/core/workflows` (no types entry but resolves at runtime; build works fine).

### Medusa creates the default Store at first `medusa exec` (not during migrations)
After `db:migrate` there are still 0 stores. The default "Medusa Store" is auto-created by the framework boot inside `medusa exec` / `medusa develop`. Our seed renames it to "Teka-Market" if needed, and creates one from scratch via `createStoresWorkflow` as a safety fallback.
