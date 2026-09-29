import { Package } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default function SellerProductsPage() {
  return (
    <SellerComingSoon
      icon={Package}
      title="Catalog & Stock"
      description="This section is coming soon. You'll be able to add products and manage stock levels here."
    />
  );
}
