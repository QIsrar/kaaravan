// Zero-dependency constants shared by both client components (header
// autocomplete) and server code (lib/validators/search.ts, lib/services/search.ts).
// Kept dependency-free on purpose so importing these client-side never pulls
// zod into the shared browser bundle.

export const MIN_SEARCH_QUERY_LENGTH = 2;
export const MAX_SEARCH_QUERY_LENGTH = 100;

/** Client-side mirror of searchQuerySchema's trim+cap, without the zod dependency. */
export function capSearchQuery(raw: string): string {
  return (raw ?? "").trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
}
