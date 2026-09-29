import { Settings } from "lucide-react";
import { SellerComingSoon } from "@/components/seller/seller-coming-soon";

export default function SellerSettingsPage() {
  return (
    <SellerComingSoon
      icon={Settings}
      title="Settings"
      description="This section is coming soon. You'll be able to manage your store profile and preferences here."
    />
  );
}
