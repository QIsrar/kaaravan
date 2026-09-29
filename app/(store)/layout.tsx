import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { getOptionalUserRole, getSellerPortalHref } from "@/lib/auth/roles";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userRole = await getOptionalUserRole();
  const sellerPortalHref = getSellerPortalHref(userRole);

  return (
    <div className="flex flex-col min-h-screen">
      <StoreHeader sellerPortalHref={sellerPortalHref} />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
