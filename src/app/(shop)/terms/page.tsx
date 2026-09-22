import Link from 'next/link';
import { ArrowLeft, Shield, CheckCircle, Clock, Truck, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata = {
  title: 'Terms of Service & Privacy Policy | Veiled Canvas',
  description: 'Our customer care terms, shipping and return policies, and privacy commitments.',
};

export default function TermsPage() {
  return (
    <div className="pt-20 lg:pt-24 min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="mb-10">
          <span className="text-xs uppercase font-semibold tracking-widest text-primary font-mono block mb-2">
            Transparency &amp; Customer Care
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
            Terms of Service &amp; Privacy Policy
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Last updated: September 2026. At Veiled Canvas, we are committed to transparent, ethical commerce, customer data privacy, and the highest standards of modest fashion craftsmanship.
          </p>
        </div>

        {/* Highlight Cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12">
          <Card className="p-4 border-border/70 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Truck size={16} /> 5-7 Day Shipping
              </div>
              <p className="text-xs text-muted-foreground">
                Tracked, carbon-neutral delivery across domestic and international destinations.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/70 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <RotateCcw size={16} /> 30-Day Returns
              </div>
              <p className="text-xs text-muted-foreground">
                Hassle-free returns for unworn items in original packaging with tags intact.
              </p>
            </CardContent>
          </Card>

          <Card className="p-4 border-border/70 bg-card/60">
            <CardContent className="p-0 space-y-1">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Shield size={16} /> 100% Data Privacy
              </div>
              <p className="text-xs text-muted-foreground">
                We never sell, lease, or monetize your personal shopping information.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              1. Orders, Payment &amp; Pricing
            </h2>
            <p>
              All prices displayed on Veiled Canvas are quoted in USD cents and processed through encrypted 256-bit SSL gateways. Once your order is placed, you will receive an immediate confirmation email with your order number and estimated dispatch schedule.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              2. Shipping &amp; Delivery Commitments
            </h2>
            <p>
              We inspect every item on traditional tailor forms prior to packaging. Standard domestic orders typically arrive within 5 to 7 business days, while express and international orders arrive within 10 to 14 business days. Real-time tracking is provided via email.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              3. Returns, Exchanges &amp; Refunds
            </h2>
            <p>
              We want you to feel confident in every silhouette. You may initiate a return or exchange within 30 days of receiving your package. To maintain hygiene standards, items must be unworn, unwashed, and returned in their original packaging.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              4. Privacy Policy &amp; Security
            </h2>
            <p>
              Your privacy is sacred. We only collect the minimal information necessary to process orders, fulfill shipments, and communicate essential order status updates. We do not store full credit card numbers on our servers.
            </p>
          </section>

          <Separator />

          <section className="space-y-3">
            <h2 className="font-heading text-xl font-bold text-foreground">
              5. Contact Customer Support
            </h2>
            <p>
              For questions regarding our terms, returns, or fabric care, please reach out directly through our{' '}
              <Link href="/contact" className="text-primary hover:underline font-medium">
                Contact Page
              </Link>{' '}
              or email us at{' '}
              <span className="text-foreground font-mono">hello@veiledcanvas.com</span>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
