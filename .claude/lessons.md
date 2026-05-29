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
