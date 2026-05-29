import { LoginForm } from "@/components/molecules/LoginForm/LoginForm"
import { UserNavigation } from "@/components/molecules/UserNavigation/UserNavigation"
import { retrieveCustomer } from "@/lib/data/customer"

export default async function MessagesPage() {
  const user = await retrieveCustomer()

  if (!user) return <LoginForm />

  return (
    <main className="container">
      <div className="grid grid-cols-1 md:grid-cols-4 mt-6 gap-5 md:gap-8">
        <UserNavigation />
        <div className="md:col-span-3 space-y-8">
          <h1 className="heading-md uppercase">Messages</h1>
          <p className="text-secondary">La messagerie sera disponible prochainement.</p>
        </div>
      </div>
    </main>
  )
}
