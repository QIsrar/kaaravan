import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seller Agreement | Kaaravan",
  description: "Terms and conditions for selling on the Kaaravan marketplace.",
};

export default function SellerAgreementPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
      <div className="space-y-2">
        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-4">
          Draft — pending legal review
        </div>
        <h1 className="font-heading text-3xl font-bold">Kaaravan Seller Agreement</h1>
        <p className="text-muted-foreground">Last updated: October 2026</p>
      </div>

      <div className="prose prose-sm sm:prose-base dark:prose-invert">
        <p>
          This Seller Agreement (&quot;Agreement&quot;) forms a binding contract between you (&quot;Seller&quot;, &quot;Merchant&quot;, &quot;You&quot;) and Kaaravan. By accepting this Agreement during the onboarding process, you agree to be bound by these terms.
        </p>

        <h2>1. Platform Role</h2>
        <p>
          Kaaravan operates a multi-vendor marketplace connecting verified sellers with customers. We facilitate transactions, process payments, and coordinate with courier partners for logistics. We do not take ownership of the goods you sell.
        </p>

        <h2>2. Seller Responsibilities</h2>
        <ul>
          <li><strong>Accuracy:</strong> You must provide accurate business, product, and pricing information.</li>
          <li><strong>Fulfillment:</strong> Orders must be marked as &quot;Ready to Ship&quot; and handed over to our courier partners within the agreed SLA (typically 24-48 hours).</li>
          <li><strong>Quality:</strong> Products must match their descriptions and be free from defects. Counterfeit goods are strictly prohibited.</li>
        </ul>

        <h2>3. Fees and Commissions</h2>
        <p>
          Kaaravan charges a commission on each successful sale. The commission rate is deducted from the product price (excluding shipping) before the payout is added to your seller ledger.
        </p>

        <h2>4. Returns and Refunds</h2>
        <p>
          You agree to accept returns within the specified return window if a product is damaged, defective, or not as described. Kaaravan holds the final authority in dispute resolution between sellers and customers.
        </p>

        <h2>5. Termination</h2>
        <p>
          Kaaravan reserves the right to suspend or terminate your seller account for repeated violations of this Agreement, high return rates, or fraudulent activity.
        </p>
      </div>
    </div>
  );
}
