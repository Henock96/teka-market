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
loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      // @ts-expect-error: vendorCors is not defined in medusa config module
      vendorCors: process.env.VENDOR_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    rbac: true,
    seller_registration: true
  },
  modules: [
    {
      resolve: "@medusajs/medusa/rbac",
    },
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: path.join(__dirname, '../../apps/admin'),
        path: '/dashboard',
      } as DashboardModuleOptions
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: path.join(__dirname, '../../apps/vendor'),
        path: '/seller',
      } as DashboardModuleOptions
    },
  ],
  plugins: [{
    resolve: "@mercurjs/core",
    options: {}
  }]
})
