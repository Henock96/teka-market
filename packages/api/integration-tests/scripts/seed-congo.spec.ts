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
        expect(data).toHaveLength(1)
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
