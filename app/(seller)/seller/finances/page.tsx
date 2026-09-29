import { DollarSign } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default function SellerFinancesPage() {
  return (
    <SellerComingSoon
      icon={DollarSign}
      title="Finances & Payouts"
      description="This section is coming soon. Your sales and payout history will be available once orders are live."
    />
  );
}
