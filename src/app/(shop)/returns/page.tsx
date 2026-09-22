import type { Metadata } from 'next';
import Link from 'next/link';
import { RotateCcw, ShieldCheck, CheckCircle2, ArrowRight, HelpCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Returns & Exchanges Policy | Veiled Canvas',
  description:
    'Veiled Canvas offers 30-day complimentary returns and effortless size exchanges on all unworn modest fashion collections.',
};

export default function ReturnsPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold block mb-2">
            30-Day Peace of Mind
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Returns &amp; Exchanges
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            We want you to feel entirely at ease with your Veiled Canvas pieces. If a cut, drape, or shade is not perfect, we make returns and exchanges effortless.
          </p>
        </div>

        {/* 3 Step Process Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <Card className="border-border/60 bg-card/60 backdrop-blur p-6 relative hover-lift">
            <span className="font-mono text-2xl font-bold text-primary/30 mb-2 block">01</span>
            <h3 className="font-heading font-bold text-base mb-2">Request Label</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Visit our online concierge or email our team within 30 days of receiving your package to generate a prepaid return shipping slip.
            </p>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur p-6 relative hover-lift">
            <span className="font-mono text-2xl font-bold text-primary/30 mb-2 block">02</span>
            <h3 className="font-heading font-bold text-base mb-2">Pack Securely</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Place the garments in their original protective garment bags with tags attached, affix the prepaid label, and hand to the carrier.
            </p>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur p-6 relative hover-lift">
            <span className="font-mono text-2xl font-bold text-primary/30 mb-2 block">03</span>
            <h3 className="font-heading font-bold text-base mb-2">Prompt Refund</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Once received at our atelier, inspections are finalized within 48 hours and your refund or exchange is issued immediately.
            </p>
          </Card>
        </div>

        {/* Detailed Guidelines */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground mb-12">
          <section className="p-6 rounded-2xl bg-muted/30 border border-border/60">
            <h2 className="font-heading text-lg font-bold text-foreground mb-3 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" /> Return Eligibility Conditions
            </h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Items must be unworn, unwashed, unaltered, and free of makeup, perfume, or deodorant marks.</li>
              <li>Original couture tags and textile composition labels must remain intact and securely attached.</li>
              <li>For modest swimwear and activewear, the protective hygienic adhesive liner must not be removed.</li>
              <li>Handcrafted made-to-measure bespoke pieces and personalized monograms are final sale.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Complimentary Exchanges
            </h2>
            <p>
              Need a different length, bust size, or colorway? Exchanges within the United States, UK, and Canada are completely complimentary. We cover outbound shipping on your replacement piece so you can find your ideal silhouette risk-free.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Refund Method &amp; Timelines
            </h2>
            <p>
              Refunds will be credited to the original payment method (Credit Card, Debit Card, or Apple Pay) processed via our secure Stripe gateway. Financial institutions typically post the funds to your statement within 3 to 5 business days after processing.
            </p>
          </section>
        </div>

        {/* CTA Banner */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-base text-foreground mb-1">
              Ready to start an exchange or return?
            </h3>
            <p className="text-xs text-muted-foreground">
              Contact our concierge desk with your order number for an immediate prepaid label.
            </p>
          </div>
          <Button asChild className="gradient-gold text-espresso font-semibold shrink-0">
            <Link href="/contact">
              Start Return <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
