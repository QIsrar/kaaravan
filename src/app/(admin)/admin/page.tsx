'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  ArrowUpRight,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';

// Mock overview data matching seed structure
const metrics = [
  {
    title: 'Total Revenue',
    value: '$24,890.50',
    change: '+14.2% from last month',
    icon: DollarSign,
    trend: 'up',
  },
  {
    title: 'Total Orders',
    value: '142',
    change: '12 orders pending fulfillment',
    icon: ShoppingBag,
    trend: 'neutral',
  },
  {
    title: 'Catalog SKUs',
    value: '38',
    change: '3 low-stock warnings',
    icon: Package,
    trend: 'warning',
  },
  {
    title: 'Newsletter Subscribers',
    value: '1,840',
    change: '+92 this week',
    icon: Users,
    trend: 'up',
  },
];

const recentOrders = [
  {
    id: 'ord_9f81a7b2',
    customer: 'Farah Siddiqui',
    email: 'farah.s@example.com',
    items: 'Silk Chiffon Hijab (Dusty Rose) x 2',
    total: 7600,
    status: 'pending',
    date: '10 minutes ago',
  },
  {
    id: 'ord_3c29e1d8',
    customer: 'Layla Al-Khatib',
    email: 'layla.k@example.com',
    items: 'Minimalist Linen Abaya (Oatmeal) x 1',
    total: 13500,
    status: 'processing',
    date: '45 minutes ago',
  },
  {
    id: 'ord_7e44b09c',
    customer: 'Amina Zahra',
    email: 'amina.z@example.com',
    items: 'Modal Silk Square Hijab x 1, Bamboo Underscarf x 2',
    total: 8200,
    status: 'shipped',
    date: '2 hours ago',
  },
  {
    id: 'ord_1a87d4ef',
    customer: 'Zaynab Noor',
    email: 'guest_zaynab@gmail.com',
    items: 'Active Modest Performance Tunic x 1',
    total: 6800,
    status: 'delivered',
    date: 'Yesterday',
  },
  {
    id: 'ord_5b32f91a',
    customer: 'Hajar Mansoor',
    email: 'hajar.m@example.com',
    items: 'Pleated Satin Evening Abaya x 1',
    total: 18900,
    status: 'processing',
    date: 'Yesterday',
  },
];

const lowStockItems = [
  {
    product: 'Premium Silk Chiffon Hijab',
    color: 'Emerald Green',
    sku: 'VC-HJB-SILK-EMR',
    stock: 2,
    reorderLevel: 10,
  },
  {
    product: 'Minimalist Linen Everyday Abaya',
    color: 'Sage Mist',
    sku: 'VC-ABY-LIN-SGE',
    stock: 3,
    reorderLevel: 8,
  },
  {
    product: 'Seamless Bamboo Underscarf',
    color: 'Mocha',
    sku: 'VC-ACC-UND-MCH',
    stock: 4,
    reorderLevel: 15,
  },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function AdminOverviewPage() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Operations Overview"
        subtitle="Real-time storefront performance, orders, and stock alerts"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <Card key={i} className="border-border/80 bg-card shadow-sm hover:shadow transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {metric.title}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-heading font-bold text-foreground">
                    {metric.value}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    {metric.trend === 'warning' ? (
                      <span className="text-amber-600 font-medium">{metric.change}</span>
                    ) : (
                      <span>{metric.change}</span>
                    )}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild className="gradient-gold text-espresso font-semibold">
            <Link href="/admin/orders">
              <ShoppingBag size={16} className="mr-2" />
              Manage Orders (12 Pending)
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/products">
              <Package size={16} className="mr-2" />
              Update Inventory
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/inbox">
              <Users size={16} className="mr-2" />
              Customer Inquiries
            </Link>
          </Button>

          <Button asChild variant="outline">
            <Link href="/admin/blog">
              New Blog Article
            </Link>
          </Button>
        </div>

        {/* Grid: Recent Orders & Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-border/80 bg-card">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="font-heading text-lg font-bold">
                    Recent Orders
                  </CardTitle>
                  <CardDescription>
                    Latest purchases placed across the storefront
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                  <Link href="/admin/orders">
                    View All Orders
                    <ArrowRight size={14} className="ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/60">
                  {recentOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {ord.id}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-[10px] capitalize px-2 py-0.5 border ${
                              statusStyles[ord.status] || 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ord.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-foreground">
                          {ord.customer} <span className="text-xs text-muted-foreground">({ord.email})</span>
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {ord.items}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4">
                        <div>
                          <div className="font-heading font-bold text-sm text-foreground">
                            {formatPrice(ord.total)}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1 sm:justify-end">
                            <Clock size={10} />
                            {ord.date}
                          </div>
                        </div>
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs">
                          <Link href="/admin/orders">Inspect</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alerts & Health (1 col) */}
          <div className="space-y-6">
            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-base font-bold flex items-center gap-2 text-amber-600">
                    <AlertTriangle size={18} />
                    Stock Attention Required
                  </CardTitle>
                  <span className="text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold px-2 py-0.5 rounded-full">
                    {lowStockItems.length} SKUs
                  </span>
                </div>
                <CardDescription>
                  Variants running below safe threshold
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lowStockItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/15 space-y-1.5"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-foreground line-clamp-1">
                        {item.product}
                      </span>
                      <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded">
                        {item.stock} left
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                      <span>{item.color} · {item.sku}</span>
                      <span>Target: {item.reorderLevel}</span>
                    </div>
                  </div>
                ))}

                <Button asChild variant="outline" className="w-full text-xs mt-2">
                  <Link href="/admin/products">
                    Adjust Inventory Stock
                    <ArrowRight size={14} className="ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick System Status Card */}
            <Card className="border-border/80 bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base font-bold">
                  System Integrations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Supabase PostgreSQL</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Connected
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Stripe Checkout API</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Webhooks Armed
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Resend Email Gateway</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Ready
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
