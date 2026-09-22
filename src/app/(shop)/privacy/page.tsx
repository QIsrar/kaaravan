import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck, EyeOff, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Privacy Policy & Data Security | Veiled Canvas',
  description:
    'Veiled Canvas privacy policy: how we safeguard customer data, encrypt transactions, and respect your privacy rights.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="text-xs uppercase font-semibold tracking-widest text-primary font-mono block mb-2">
            Data Trust &amp; Integrity
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Effective Date: September 2026. At Veiled Canvas, we respect and safeguard your personal data. We will never sell, rent, or trade your private information with third-party advertisers.
          </p>
        </div>

        {/* Highlights */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Card className="p-4 border-border/60 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Lock size={16} /> 256-Bit SSL Encrypted
              </div>
              <p className="text-xs text-muted-foreground">
                All transactions are tokenized and processed via Stripe Level 1 PCI-DSS architecture.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/60 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <EyeOff size={16} /> Zero Data Selling
              </div>
              <p className="text-xs text-muted-foreground">
                Your personal details are used solely to fulfill your orders and enhance your shopping journey.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/60 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <ShieldCheck size={16} /> GDPR &amp; CCPA Compliant
              </div>
              <p className="text-xs text-muted-foreground">
                Full transparency, with immediate rights to data export or permanent deletion upon request.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              1. Information We Collect
            </h2>
            <p className="mb-2">
              We collect information that you directly provide when creating an account, curating a wishlist, or completing a purchase:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong>Contact &amp; Delivery Information:</strong> Full name, delivery address, phone number, and email.</li>
              <li><strong>Order History:</strong> Garment selections, sizing specifications, and historical transaction IDs.</li>
              <li><strong>Technical Logs:</strong> Browser user-agent and IP addresses for fraud prevention and security telemetry.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              2. How We Protect Payment Information
            </h2>
            <p>
              Veiled Canvas does not collect, record, or store full credit card numbers or CVV codes on our servers. When you enter payment details, they are securely transmitted directly to Stripe via end-to-end tokenized SSL sessions.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              3. Cookies &amp; Local Preferences
            </h2>
            <p>
              We utilize essential cookies and browser storage solely to preserve your active shopping bag, saved wishlist items, and authenticated session state. You can clear cookies anytime via your browser settings.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              4. Your Rights (Access, Correction, &amp; Erasure)
            </h2>
            <p>
              You have the right to request a complete copy of your stored personal data, request corrections, or request complete account erasure. To exercise your privacy rights, please reach out to our privacy officer at <a href="mailto:privacy@veiledcanvas.com" className="text-primary hover:underline">privacy@veiledcanvas.com</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
