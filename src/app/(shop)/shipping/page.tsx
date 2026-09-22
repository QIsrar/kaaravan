import type { Metadata } from 'next';
import Link from 'next/link';
import { Truck, ShieldCheck, Globe, Clock, PackageCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy | Veiled Canvas',
  description:
    'Explore Veiled Canvas shipping services, delivery timelines, complimentary worldwide dispatch over $50, and order tracking information.',
};

export default function ShippingPage() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold block mb-2">
            Client Concierge &amp; Logistics
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Shipping &amp; Delivery
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Every Veiled Canvas order is hand-inspected, wrapped in archival tissue, and shipped with carbon-neutral courier partners worldwide.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid sm:grid-cols-3 gap-6 mb-12">
          <Card className="border-border/60 bg-card/60 backdrop-blur text-center p-6 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-espresso mx-auto mb-4">
              <Truck size={22} />
            </div>
            <h3 className="font-heading font-bold text-base mb-1">Complimentary Delivery</h3>
            <p className="text-xs text-muted-foreground">
              Free standard delivery automatically applied on all orders of $50 or more.
            </p>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur text-center p-6 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-espresso mx-auto mb-4">
              <Clock size={22} />
            </div>
            <h3 className="font-heading font-bold text-base mb-1">Express Dispatch</h3>
            <p className="text-xs text-muted-foreground">
              Orders placed before 2:00 PM EST ship the same business day from our atelier.
            </p>
          </Card>

          <Card className="border-border/60 bg-card/60 backdrop-blur text-center p-6 hover-lift">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-espresso mx-auto mb-4">
              <Globe size={22} />
            </div>
            <h3 className="font-heading font-bold text-base mb-1">Worldwide Coverage</h3>
            <p className="text-xs text-muted-foreground">
              Express tracked delivery to over 130 countries via DHL Express &amp; FedEx.
            </p>
          </Card>
        </div>

        {/* Detailed Timelines Table */}
        <Card className="border-border/60 shadow-sm mb-12 overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border/60">
            <CardTitle className="font-heading text-lg sm:text-xl">
              Estimated Delivery Times &amp; Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                    <th className="py-3 px-4 sm:px-6">Destination</th>
                    <th className="py-3 px-4 sm:px-6">Service</th>
                    <th className="py-3 px-4 sm:px-6">Transit Time</th>
                    <th className="py-3 px-4 sm:px-6">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium">United States &amp; Canada</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">Standard Tracked</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">3 – 5 business days</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">Free over $50 ($8.00 flat)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium">United States &amp; Canada</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">Atelier Priority Express</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">1 – 2 business days</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">$18.00</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium">United Kingdom &amp; Europe</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">DHL International Express</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">3 – 6 business days</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">$15.00</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium">Middle East &amp; Gulf (GCC)</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">Aramex / DHL Priority</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">4 – 7 business days</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">$20.00</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 sm:px-6 font-medium">Australia &amp; Asia-Pacific</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">International Tracked Air</td>
                    <td className="py-3.5 px-4 sm:px-6 text-muted-foreground">5 – 9 business days</td>
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-foreground">$22.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Policy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Packaging &amp; Presentation
            </h2>
            <p>
              Modesty and craftsmanship extend to our packaging. Every order arrives in an understated, discreet recyclable luxury mailer box. Garments are wrapped in acid-free tissue paper with artisanal ribbon and a signed inspection certificate from our atelier team.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Customs, Duties &amp; Taxes
            </h2>
            <p>
              For shipments to the United States, UK, EU, and UAE, all relevant local import taxes and VAT are collected seamlessly during checkout (Delivered Duty Paid - DDP). You will not be asked for unexpected clearance fees upon delivery.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold text-foreground mb-2">
              Real-Time Tracking &amp; Notifications
            </h2>
            <p>
              As soon as your parcel is dispatched from our fulfillment center, you will receive an automatic dispatch notification via email with a live tracking link. You can also view your live order status anytime in your client account portal.
            </p>
          </section>
        </div>

        {/* Contact Banner */}
        <div className="mt-12 p-6 rounded-2xl bg-muted/40 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-heading font-bold text-base text-foreground mb-1">
              Have a special delivery request or deadline?
            </h3>
            <p className="text-xs text-muted-foreground">
              Our client concierge can arrange bespoke courier windows and expedited Saturday delivery.
            </p>
          </div>
          <Button asChild className="gradient-gold text-espresso font-semibold shrink-0">
            <Link href="/contact">
              Contact Concierge <ArrowRight size={14} className="ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
