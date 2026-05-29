import { writeFileSync, existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

import { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  createUserAccountWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"
import { createSellerAccountWorkflow } from "@mercurjs/core/workflows"

/**
 * Teka-Market — Seed Congo + Test data
 *
 * Crée de façon idempotente :
 *
 *   Infrastructure locale :
 *   - Store "Teka-Market" (rename si nécessaire)
 *   - Currency XAF (ISO 4217, 0 décimale)
 *   - Region "Congo" avec country cg, automatic_taxes
 *   - Tax Region cg + Tax Rate TVA 18.9%
 *   - Sales Channel "Teka-Market Store"
 *   - Stock Location "Brazzaville HQ"
 *   - Default fulfillment provider link
 *   - Shipping profile + Shipping option Standard (1500 XAF Brazzaville)
 *   - Link sales channel → stock location
 *   - Default sales channel + stock location sur le Store
 *
 *   Publishable API key :
 *   - Key "Teka-Market Web" linkée au sales channel
 *   - Écriture du token dans apps/teka-market-web/.env.local
 *
 *   Comptes test (dev only, mots de passe documentés) :
 *   - Admin :  admin@teka-market.cg  /  TekaAdmin2026!
 *   - Vendor : vendor@teka-market.cg / TekaVendor2026!
 *
 * Lancer via : bun run medusa exec ./src/scripts/seed-congo.ts
 *
 * Idempotent : ré-exécutable sans erreur ni doublon.
 */

const STORE_NAME = "Teka-Market"
const REGION_NAME = "Congo"
const SALES_CHANNEL_NAME = "Teka-Market Store"
const STOCK_LOCATION_NAME = "Brazzaville HQ"
const SHIPPING_PROFILE_NAME = "Default"
const PUBLISHABLE_KEY_TITLE = "Teka-Market Web"

const ADMIN_EMAIL = "admin@teka-market.cg"
const ADMIN_PASSWORD = "TekaAdmin2026!"
const VENDOR_EMAIL = "vendor@teka-market.cg"
const VENDOR_PASSWORD = "TekaVendor2026!"

const STOREFRONT_ENV_PATH = resolve(
  __dirname,
  "../../../../apps/teka-market-web/.env.local"
)

export default async function seedCongo({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)

  logger.info("🇨🇬 Seeding Teka-Market — Congo locale + test data...")

  // ============================================================
  // 1. Store + Currency XAF
  // ============================================================
  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: [
      "id",
      "name",
      "supported_currencies.currency_code",
      "supported_currencies.is_default",
    ],
  })
  let store = existingStores[0] as
    | {
        id: string
        name: string
        supported_currencies: { currency_code: string; is_default: boolean }[]
      }
    | undefined

  if (!store) {
    const { result: createdStores } = await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: STORE_NAME,
            supported_currencies: [{ currency_code: "xaf", is_default: true }],
          },
        ],
      },
    })
    store = createdStores[0] as unknown as typeof store
    logger.info(`  ✓ Store ${STORE_NAME} created with xaf as default`)
  } else {
    // Renommer si nécessaire
    if (store.name !== STORE_NAME) {
      await updateStoresWorkflow(container).run({
        input: { selector: { id: store.id }, update: { name: STORE_NAME } },
      })
      logger.info(`  ✓ Store renamed "${store.name}" → "${STORE_NAME}"`)
      store.name = STORE_NAME
    } else {
      logger.info(`  ✓ Store "${STORE_NAME}" already exists, skipped`)
    }

    const existingCurrencyCodes =
      store.supported_currencies?.map((c) => c.currency_code) ?? []
    if (!existingCurrencyCodes.includes("xaf")) {
      const updatedCurrencies = [
        ...store.supported_currencies.map((c) => ({
          currency_code: c.currency_code,
          is_default: c.is_default,
        })),
        { currency_code: "xaf", is_default: existingCurrencyCodes.length === 0 },
      ]
      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store!.id },
          update: { supported_currencies: updatedCurrencies },
        },
      })
      logger.info("  ✓ Currency xaf added to store supported_currencies")
    } else {
      logger.info("  ✓ Currency xaf already on store, skipped")
    }
  }

  if (!store) throw new Error("Store creation failed")

  // ============================================================
  // 2. Region Congo
  // ============================================================
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name"],
    filters: { name: REGION_NAME },
  })

  let region = existingRegions[0] as { id: string; name: string } | undefined

  if (!region) {
    const { result } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: REGION_NAME,
            currency_code: "xaf",
            countries: ["cg"],
            automatic_taxes: true,
          },
        ],
      },
    })
    region = result[0] as unknown as typeof region
    logger.info(`  ✓ Region ${REGION_NAME} created`)
  } else {
    logger.info(`  ✓ Region ${REGION_NAME} already exists, skipped`)
  }

  if (!region) throw new Error("Region creation failed")

  // ============================================================
  // 3. Tax Region cg + TVA 18.9%
  // ============================================================
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
          default_tax_rate: { rate: 18.9, code: "tva-cg", name: "TVA Congo" },
        },
      ],
    })
    logger.info("  ✓ Tax Region cg + TVA 18.9% created")
  } else {
    logger.info("  ✓ Tax Region cg already exists, skipped")
  }

  // ============================================================
  // 4. Sales Channel Teka-Market Store
  // ============================================================
  const { data: existingChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
    filters: { name: SALES_CHANNEL_NAME },
  })

  let salesChannel = existingChannels[0] as
    | { id: string; name: string }
    | undefined

  if (!salesChannel) {
    const { result } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: SALES_CHANNEL_NAME,
            description: "Storefront principal Teka-Market (Next.js)",
          },
        ],
      },
    })
    salesChannel = result[0] as unknown as typeof salesChannel
    logger.info(`  ✓ Sales Channel "${SALES_CHANNEL_NAME}" created`)
  } else {
    logger.info(`  ✓ Sales Channel "${SALES_CHANNEL_NAME}" already exists, skipped`)
  }

  if (!salesChannel) throw new Error("Sales channel creation failed")

  // ============================================================
  // 5. Stock Location Brazzaville HQ
  // ============================================================
  const { data: existingLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: STOCK_LOCATION_NAME },
  })

  let stockLocation = existingLocations[0] as
    | { id: string; name: string }
    | undefined

  if (!stockLocation) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: {
        locations: [
          {
            name: STOCK_LOCATION_NAME,
            address: {
              address_1: "Avenue Cardinal Emile Biayenda",
              city: "Brazzaville",
              country_code: "cg",
              postal_code: "BZV",
            },
          },
        ],
      },
    })
    stockLocation = result[0] as unknown as typeof stockLocation
    logger.info(`  ✓ Stock Location "${STOCK_LOCATION_NAME}" created`)
  } else {
    logger.info(`  ✓ Stock Location "${STOCK_LOCATION_NAME}" already exists, skipped`)
  }

  if (!stockLocation) throw new Error("Stock location creation failed")

  // ============================================================
  // 6. Default sales channel + stock location on Store
  // ============================================================
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        default_sales_channel_id: salesChannel.id,
        default_location_id: stockLocation.id,
      },
    },
  })
  logger.info("  ✓ Default sales channel + stock location set on store")

  // ============================================================
  // 7. Link stock location → manual fulfillment provider
  // ============================================================
  try {
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    })
    logger.info("  ✓ Stock location linked to manual fulfillment provider")
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("already exists") ||
        error.message.includes("duplicate"))
    ) {
      logger.info("  ✓ Stock location ↔ fulfillment already linked, skipped")
    } else {
      throw error
    }
  }

  // ============================================================
  // 8. Link sales channel → stock location
  // ============================================================
  try {
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    })
    logger.info("  ✓ Sales channel linked to stock location")
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already")) {
      logger.info("  ✓ Sales channel ↔ stock location already linked, skipped")
    } else {
      throw error
    }
  }

  // ============================================================
  // 9. Default shipping profile
  // ============================================================
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const existingProfiles = await fulfillmentModule.listShippingProfiles({
    type: "default",
  })
  let shippingProfile = existingProfiles[0]

  if (!shippingProfile) {
    const { result } = await createShippingProfilesWorkflow(container).run({
      input: {
        data: [{ name: SHIPPING_PROFILE_NAME, type: "default" }],
      },
    })
    shippingProfile = result[0]
    logger.info(`  ✓ Shipping profile "${SHIPPING_PROFILE_NAME}" created`)
  } else {
    logger.info("  ✓ Default shipping profile already exists, skipped")
  }

  // ============================================================
  // 10. Fulfillment set + shipping option (Standard Brazzaville)
  // ============================================================
  const existingFulfillmentSets = await fulfillmentModule.listFulfillmentSets({
    name: "Teka-Market delivery",
  })

  if (!existingFulfillmentSets.length) {
    const fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
      name: "Teka-Market delivery",
      type: "shipping",
      service_zones: [
        {
          name: "Congo",
          geo_zones: [{ country_code: "cg", type: "country" }],
        },
      ],
    })

    try {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
        [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
      })
    } catch (error: unknown) {
      if (
        !(
          error instanceof Error &&
          (error.message.includes("already") || error.message.includes("duplicate"))
        )
      ) {
        throw error
      }
    }

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Livraison Standard Brazzaville",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Standard",
            description: "Livraison 24-48h dans Brazzaville",
            code: "standard",
          },
          prices: [
            { currency_code: "xaf", amount: 1500 },
            { region_id: region.id, amount: 1500 },
          ],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    logger.info("  ✓ Fulfillment set + Standard Brazzaville shipping (1500 XAF)")
  } else {
    logger.info("  ✓ Fulfillment set already exists, skipped")
  }

  // ============================================================
  // 11. Publishable API key + link sales channel
  // ============================================================
  const { data: existingKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "title", "token", "type"],
    filters: { type: "publishable" },
  })

  let publishableKey = existingKeys.find(
    (k: { title: string }) => k.title === PUBLISHABLE_KEY_TITLE
  ) as { id: string; title: string; token: string } | undefined

  if (!publishableKey) {
    const { result } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: PUBLISHABLE_KEY_TITLE,
            type: "publishable",
            created_by: "seed-congo",
          },
        ],
      },
    })
    publishableKey = result[0] as unknown as typeof publishableKey
    logger.info(`  ✓ Publishable key "${PUBLISHABLE_KEY_TITLE}" created`)
  } else {
    logger.info(`  ✓ Publishable key "${PUBLISHABLE_KEY_TITLE}" already exists`)
  }

  if (!publishableKey) throw new Error("Publishable key creation failed")

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: publishableKey.id, add: [salesChannel.id] },
    })
    logger.info("  ✓ Publishable key linked to sales channel")
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("already")) {
      logger.info("  ✓ Publishable key ↔ sales channel already linked, skipped")
    } else {
      throw error
    }
  }

  // ============================================================
  // 12. Write publishable token to storefront .env.local
  // ============================================================
  try {
    let envContent = ""
    if (existsSync(STOREFRONT_ENV_PATH)) {
      envContent = readFileSync(STOREFRONT_ENV_PATH, "utf8")
    }

    const lines = envContent.split("\n")
    const keyLine = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey.token}`
    const idx = lines.findIndex((l) =>
      l.startsWith("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=")
    )
    if (idx >= 0) {
      lines[idx] = keyLine
    } else {
      lines.push(keyLine)
    }
    writeFileSync(STOREFRONT_ENV_PATH, lines.filter(Boolean).join("\n") + "\n")
    logger.info(`  ✓ Publishable key written to ${STOREFRONT_ENV_PATH}`)
  } catch (error: unknown) {
    logger.warn(
      `  ! Could not write storefront .env.local: ${(error as Error).message}`
    )
    logger.warn(`    Copy manually: NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${publishableKey.token}`)
  }

  // ============================================================
  // 13. Admin user + Super Admin role assignment
  // ============================================================
  const { data: existingAdminUsers } = await query.graph({
    entity: "user",
    fields: ["id", "email"],
    filters: { email: ADMIN_EMAIL },
  })

  let adminUserId: string | undefined = existingAdminUsers[0]?.id as
    | string
    | undefined

  if (!adminUserId) {
    const authModule = container.resolve(Modules.AUTH)
    const { authIdentity } = await authModule.register("emailpass", {
      body: { email: ADMIN_EMAIL, password: ADMIN_PASSWORD },
    } as never)

    if (!authIdentity || !("id" in (authIdentity as object))) {
      throw new Error("Failed to register admin auth identity")
    }

    const { result: createdUsers } = await createUserAccountWorkflow(container).run({
      input: {
        authIdentityId: (authIdentity as { id: string }).id,
        userData: {
          email: ADMIN_EMAIL,
          first_name: "Teka",
          last_name: "Admin",
        },
      },
    })
    const createdAdmin = createdUsers as unknown as
      | { id: string }
      | { id: string }[]
    adminUserId = Array.isArray(createdAdmin)
      ? createdAdmin[0]?.id
      : createdAdmin.id
    logger.info(`  ✓ Admin user "${ADMIN_EMAIL}" created`)
  } else {
    logger.info(`  ✓ Admin user "${ADMIN_EMAIL}" already exists, skipped`)
  }

  // 13.b — Assigner le rôle Super Admin (sinon toutes les routes /admin/* renvoient 403
  // car RBAC est activé via featureFlags.rbac=true dans medusa-config.ts).
  // Pattern copié de la migration officielle Medusa create-super-admin-role.js.
  if (adminUserId) {
    try {
      await link.create({
        [Modules.USER]: { user_id: adminUserId },
        [Modules.RBAC]: { rbac_role_id: "role_super_admin" },
      })
      logger.info("  ✓ Super Admin role assigned to admin user")
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("already") || error.message.includes("duplicate"))
      ) {
        logger.info("  ✓ Super Admin role already assigned, skipped")
      } else {
        throw error
      }
    }
  }

  // ============================================================
  // 14. Test vendor (seller)
  // ============================================================
  const { data: existingSellers } = await query.graph({
    entity: "seller",
    fields: ["id", "name"],
    filters: { name: "Teka Vendor Test" },
  })

  if (!existingSellers.length) {
    const authModule = container.resolve(Modules.AUTH)
    const { authIdentity: vendorAuth } = await authModule.register("emailpass", {
      body: { email: VENDOR_EMAIL, password: VENDOR_PASSWORD },
    } as never)

    if (!vendorAuth || !("id" in (vendorAuth as object))) {
      throw new Error("Failed to register vendor auth identity")
    }

    await createSellerAccountWorkflow(container).run({
      input: {
        auth_identity_id: (vendorAuth as { id: string }).id,
        member_email: VENDOR_EMAIL,
        first_name: "Teka",
        last_name: "Vendor",
        seller: {
          name: "Teka Vendor Test",
          email: VENDOR_EMAIL,
          description: "Vendeur de test pour Teka-Market",
          currency_code: "xaf",
        },
      } as never,
    })
    logger.info(`  ✓ Test vendor "${VENDOR_EMAIL}" created`)
  } else {
    logger.info(`  ✓ Test vendor already exists, skipped`)
  }

  // ============================================================
  // Récap final
  // ============================================================
  logger.info("")
  logger.info("✅ Seed Congo complete.")
  logger.info("")
  logger.info("=== Credentials ===")
  logger.info(`  Admin  → ${ADMIN_EMAIL}  /  ${ADMIN_PASSWORD}`)
  logger.info(`  Vendor → ${VENDOR_EMAIL} /  ${VENDOR_PASSWORD}`)
  logger.info(`  Publishable key → ${publishableKey.token}`)
  logger.info("")
  logger.info("Admin dashboard : http://localhost:9000/dashboard")
  logger.info("Vendor portal   : http://localhost:9000/seller")
  logger.info("Storefront      : http://localhost:3000")
}
