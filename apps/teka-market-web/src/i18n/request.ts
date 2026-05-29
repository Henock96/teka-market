import { getRequestConfig } from 'next-intl/server'

// Teka-Market est strictement fr-FR en V2.1.
// Le segment URL [locale] représente un CODE PAYS Medusa (cg), pas une langue.
// next-intl fournit ici les messages indépendamment du segment URL.
export default getRequestConfig(async () => ({
  locale: 'fr',
  messages: (await import('../../messages/fr.json')).default,
}))
