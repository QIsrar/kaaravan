export function formatVariantLabel(
  attributes: Record<string, string | number> | null | undefined,
  sku: string
): string {
  if (attributes && Object.keys(attributes).length > 0) {
    return Object.values(attributes).join(" · ");
  }
  return sku;
}
