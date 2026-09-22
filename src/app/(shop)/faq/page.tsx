'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, HelpCircle, ArrowRight, MessageSquare, Truck, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

interface FAQCategory {
  title: string;
  icon: any;
  items: Array<{ q: string; a: string }>;
}

const faqData: FAQCategory[] = [
  {
    title: 'Sizing, Drape & Fit',
    icon: Sparkles,
    items: [
      {
        q: 'How do I choose the correct abaya length?',
        a: 'We design our abayas based on your total height with footwear. For example, if you are 5\'4" to 5\'5", our standard Size 54 provides an ankle-grazing silhouette. If you prefer to wear heels, we recommend sizing up one length (e.g. Size 56). Refer to our detailed size guide on each product page.',
      },
      {
        q: 'Are your fabrics opaque and non-clingy?',
        a: 'Absolutely. As a dedicated modest fashion house, fabric opacity and structured drape are our highest priorities. All silks, crepes, and modal blends are custom-woven to ensure full opacity and elegant drape without static cling.',
      },
      {
        q: 'Do you offer bespoke or custom sizing?',
        a: 'Yes, select bespoke gowns and wedding pieces can be adjusted by our master atelier. Please contact our concierge at hello@veiledcanvas.com with your bust, shoulder, and height measurements.',
      },
    ],
  },
  {
    title: 'Shipping & Delivery',
    icon: Truck,
    items: [
      {
        q: 'How long will it take for my order to arrive?',
        a: 'Standard domestic shipments within the US and Canada take 3–5 business days. Atelier Express takes 1–2 business days. International express parcels typically arrive in 3–6 business days via DHL Express.',
      },
      {
        q: 'Do you offer free shipping?',
        a: 'Yes! Complimentary tracked standard shipping is automatically unlocked on all orders over $50. No discount code needed.',
      },
      {
        q: 'Will I have to pay import duties or customs fees?',
        a: 'For deliveries to the US, Canada, UK, EU, and UAE, all customs duties and taxes are calculated and prepaid during checkout (DDP). There will be no hidden surprise fees at your doorstep.',
      },
    ],
  },
  {
    title: 'Returns & Exchanges',
    icon: RotateCcw,
    items: [
      {
        q: 'What is your return window?',
        a: 'We offer a 30-day return window from the day your package is marked as delivered. Items must be unworn with original couture tags and packaging intact.',
      },
      {
        q: 'How do I exchange for another size or color?',
        a: 'Exchanges within the United States, UK, and Canada are completely complimentary! Reach out through our contact page or return portal, and we will dispatch your replacement piece with zero shipping charge.',
      },
      {
        q: 'How quickly are refunds processed?',
        a: 'Once our atelier inspects your returned piece (within 48 hours of receipt), refunds are processed immediately back to your original payment card, posting in 3–5 business days.',
      },
    ],
  },
  {
    title: 'Payments & Security',
    icon: ShieldCheck,
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit and debit cards (Visa, MasterCard, American Express, Discover), Apple Pay, Google Pay, and encrypted Stripe Checkout.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All financial data is processed via Stripe using bank-level 256-bit AES encryption. Veiled Canvas never stores your full card number or sensitive security codes on our servers.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredCategories = faqData
    .map((category) => {
      const filteredItems = category.items.filter(
        (item) =>
          item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.a.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...category, items: filteredItems };
    })
    .filter((category) => category.items.length > 0);

  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold block mb-2">
            Help Center &amp; Inquiries
          </span>
          <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
            Everything you need to know about sizing, our atelier fabrics, complimentary delivery, and effortless exchanges.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-lg mx-auto mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search questions (e.g. sizing, shipping, return window)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-12 rounded-full border-border/80 shadow-sm bg-card/80 backdrop-blur"
          />
        </div>

        {/* FAQ Categories & Accordions */}
        <div className="space-y-10">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No questions matched your search query "{searchQuery}".</p>
              <Button
                variant="outline"
                onClick={() => setSearchQuery('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.title} className="space-y-4">
                  <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
                    <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center text-espresso">
                      <Icon size={16} />
                    </div>
                    <h2 className="font-heading text-xl font-bold text-foreground">
                      {category.title}
                    </h2>
                  </div>

                  <Accordion type="single" collapsible className="space-y-2.5">
                    {category.items.map((item, idx) => (
                      <AccordionItem
                        key={idx}
                        value={`${category.title}-${idx}`}
                        className="border border-border/60 rounded-xl px-4 bg-card/60 backdrop-blur"
                      >
                        <AccordionTrigger className="text-left font-medium text-sm sm:text-base hover:text-primary py-4">
                          {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                          {item.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })
          )}
        </div>

        {/* Still Have Questions Banner */}
        <div className="mt-16 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-card via-muted/40 to-card border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-full gradient-gold flex items-center justify-center text-espresso shrink-0">
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 className="font-heading font-bold text-lg text-foreground mb-1">
                Still have an unanswered question?
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Our client concierge team is on hand 7 days a week to assist you with styling or orders.
              </p>
            </div>
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
