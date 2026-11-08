import { requireAdminPermission } from "@/lib/auth/admin";
import { listModerationQueue } from "@/lib/services/admin-catalog";
import { ProductsClient } from "@/components/admin/products-client";
import { getTranslations } from "next-intl/server";

interface PageProps {
  searchParams: Promise<{ status?: string }>;
}

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const user = await requireAdminPermission("manage_catalog");
  const t = await getTranslations("admin");
  const params = await searchParams;
  const status = (params.status || "pending_review") as
    | "pending_review"
    | "active"
    | "rejected"
    | "archived";

  const products = await listModerationQueue(user.id, user.role, status);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          {t("products")}
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review product catalog submissions, inspect media assets, verify inventory variants, and manage listings.
        </p>
      </div>

      <ProductsClient initialProducts={products} currentStatus={status} />
    </div>
  );
}

