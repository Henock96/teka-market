/**
 * Algolia search client — fallback gracieux
 *
 * Si les variables NEXT_PUBLIC_ALGOLIA_ID / NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
 * ne sont pas définies, on expose un mock no-op qui ne crashe pas.
 * Les composants doivent vérifier `isSearchEnabled` avant de rendre
 * tout composant lié à la recherche Algolia.
 */

const APP_ID = process.env.NEXT_PUBLIC_ALGOLIA_ID
const SEARCH_KEY = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY

/**
 * `true` si les deux clés Algolia sont définies et non vides.
 * Utiliser ce flag pour conditionner le rendu des composants de recherche.
 */
export const isSearchEnabled = !!(APP_ID && SEARCH_KEY)
