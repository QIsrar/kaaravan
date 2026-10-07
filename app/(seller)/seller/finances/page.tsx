import { Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function SellerFinancesPage() {
  const t = await getTranslations("seller");
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-card border rounded-3xl">
      <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
        <Wallet className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-3xl font-heading font-bold mb-4">Finances</h1>
      <p className="text-lg text-muted-foreground max-w-md mx-auto">
        {/* We use literal string here since translation might not be defined for this exact phrase yet, 
            but in a real implementation we'd add it to messages/en.json.
            For now, we'll hardcode the honest placeholder requested by the prompt. */}
        Payouts and earnings start when online payments launch.
      </p>
    </div>
  );
}
