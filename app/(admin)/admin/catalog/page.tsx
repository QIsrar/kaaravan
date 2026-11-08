import { requireAdminPermission } from "@/lib/auth/admin";
import {
  listAdminCategories,
  listAdminBrands,
  listAdminSynonyms,
} from "@/lib/services/admin-catalog";
import { CatalogClient } from "@/components/admin/catalog-client";
import { getTranslations } from "next-intl/server";

export default async function AdminCatalogPage() {
  const user = await requireAdminPermission("manage_catalog");
  const t = await getTranslations("admin");

  const [categories, brands, synonyms] = await Promise.all([
    listAdminCategories(user.id, user.role),
    listAdminBrands(user.id, user.role),
    listAdminSynonyms(user.id, user.role),
  ]);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("catalog")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage marketplace category taxonomy, commission rate overrides, verified brands, and search term synonyms.
        </p>
      </div>

      <CatalogClient
        initialCategories={categories}
        initialBrands={brands}
        initialSynonyms={synonyms}
      />
    </div>
  );
}

