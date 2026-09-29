import { ShoppingCart } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default function SellerOrdersPage() {
  return (
    <SellerComingSoon
      icon={ShoppingCart}
      title="Orders"
      description="This section is coming soon. Once ordering opens, you'll manage and track every order here."
    />
  );
}
