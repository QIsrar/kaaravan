"use client";

import { useQuery } from "@tanstack/react-query";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { capSearchQuery, MIN_SEARCH_QUERY_LENGTH } from "@/lib/validators/search-constants";

export interface SearchSuggestion {
  id: string;
  title: string;
  slug: string;
  image: string;
  priceMinor: number;
}

async function fetchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return [];
  const json = await res.json();
  return json?.success ? (json.data?.suggestions ?? []) : [];
}

/**
 * Live, debounced (~250ms) product suggestions for the header search
 * autocomplete. The query is trimmed/capped with the same Zod schema used
 * server-side, and never fetched for queries shorter than
 * MIN_SEARCH_QUERY_LENGTH.
 */
export function useSearchSuggestions(rawQuery: string) {
  const debounced = useDebouncedValue(rawQuery, 250);
  const query = capSearchQuery(debounced);
  const isEligible = query.length >= MIN_SEARCH_QUERY_LENGTH;

  return useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => fetchSuggestions(query),
    enabled: isEligible,
    staleTime: 30_000,
  });
}
