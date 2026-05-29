import { SellerInfo } from "@/components/molecules"
import { SellerProps } from "@/types/seller"
import { HttpTypes } from "@medusajs/types"

export const SellerHeading = ({
  seller,
  user,
  header,
}: {
  header: boolean
  seller: SellerProps
  user: HttpTypes.StoreCustomer | null
}) => {
  return (
    <div className="border-b">
      <div className="flex flex-col md:flex-row justify-between">
        <div>
          <SellerInfo header={header} seller={seller} />
        </div>
      </div>
      <div className="px-5 pb-5">
        <p
          dangerouslySetInnerHTML={{
            __html: seller.description,
          }}
          className="label-md"
        />
      </div>
    </div>
  )
}
