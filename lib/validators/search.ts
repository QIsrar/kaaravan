import { z } from "zod";
import { MAX_SEARCH_QUERY_LENGTH } from "@/lib/validators/search-constants";

export { MIN_SEARCH_QUERY_LENGTH, MAX_SEARCH_QUERY_LENGTH } from "@/lib/validators/search-constants";

// Caps (truncates) rather than rejects: an over-long search string is not an
// invalid request, it's just clamped to a sane length before it ever reaches
// search_products().
export const searchQuerySchema = z
  .string()
  .trim()
  .transform((value) => value.slice(0, MAX_SEARCH_QUERY_LENGTH));

export type SearchQuery = z.infer<typeof searchQuerySchema>;
