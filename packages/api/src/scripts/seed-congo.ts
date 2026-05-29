import {
  ExecArgs,
} from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * Teka-Market — Seed Congo
 *
 * Crée de façon idempotente :
 *   - Currency XAF ajoutée aux supported_currencies du Store (ISO 4217, 0 décimale)
 *   - Region "Congo" avec country cg + currency xaf
 *   - Tax Region cg + Tax Rate TVA 18.9%
 *   - Sales Channel "Teka-Market Store"
 *   - Stock Location "Brazzaville HQ"
 *
 * Lancer via : bun run medusa exec ./src/scripts/seed-congo.ts
 *
 * Idempotent : ré-exécutable sans erreur ni doublon.
 *
 * --- Divergences par rapport au plan initial (Task 5.4) ---
 * DIVERGENCE 1 : createCurrenciesWorkflow n'existe pas dans @medusajs/core-flows@2.13.4.
 *   En Medusa v2, les devises sont gérées via le Store Module. On utilise
 *   updateStoresWorkflow({ selector, update: { supported_currencies } })
 *   pour enregistrer XAF comme devise supportée sur le store par défaut.
 *   Source : packages/api/src/scripts/seed.ts (seed officiel Mercur).
 *
 * DIVERGENCE 2 : automatic_taxes est un champ valide sur CreateRegionDTO
 *   (confirmé dans @medusajs/types/dist/region/mutations.d.ts).
 *   Conservé tel quel.
 *
 * DIVERGENCE 3 : createTaxRegionsWorkflow attend un tableau directement
 *   (CreateTaxRegionDTO[]) et non un objet wrapper { input: [...] }.
 *   Source : @medusajs/core-flows/dist/tax/workflows/create-tax-regions.d.ts.
 */
export default async function seedCongo({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Seeding Teka-Market — Congo locale...")

  // 1. Currency XAF — ajoutée via updateStoresWorkflow (pas de createCurrenciesWorkflow en v2)
  const storeModule = container.resolve(Modules.STORE)
  const [store] = await storeModule.listStores()

  if (!store) {
    logger.warn("  ! No store found, skipping currency seed")
  } else {
    const existingCurrencyCodes =
      store.supported_currencies?.map((c: { currency_code: string }) => c.currency_code) ?? []

    if (!existingCurrencyCodes.includes("xaf")) {
      const updatedCurrencies = [
        ...existingCurrencyCodes.map((code: string) => ({ currency_code: code })),
        { currency_code: "xaf", is_default: existingCurrencyCodes.length === 0 },
      ]

      await updateStoresWorkflow(container).run({
        input: {
          selector: { id: store.id },
          update: {
            supported_currencies: updatedCurrencies,
          },
        },
      })
      logger.info("  Currency xaf created")
    } else {
      logger.info("  Currency xaf already exists, skipped")
    }
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
    logger.info("  Region Congo created")
  } else {
    logger.info("  Region Congo already exists, skipped")
  }

  // 3. Tax Region cg + Tax Rate TVA 18.9%
  // createTaxRegionsWorkflow attend un tableau directement (pas un objet wrapper)
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
    logger.info("  Tax Region cg + TVA 18.9% created")
  } else {
    logger.info("  Tax Region cg already exists, skipped")
  }

  // 4. Sales Channel Teka-Market Store
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
    logger.info("  Sales Channel teka-store created")
  } else {
    logger.info("  Sales Channel teka-store already exists, skipped")
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
              address_1: "Avenue Cardinal Emile Biayenda",
              city: "Brazzaville",
              country_code: "cg",
              postal_code: "BZV",
            },
          },
        ],
      },
    })
    logger.info("  Stock Location Brazzaville HQ created")
  } else {
    logger.info("  Stock Location Brazzaville HQ already exists, skipped")
  }

  logger.info("Seed Congo complete.")
}
