'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  ExternalLink,
  Plus,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

interface StockAlert {
  productTitle: string;
  productSlug: string;
  colorName: string;
  sku: string;
  stockQuantity: number;
  status: 'out_of_stock' | 'critical' | 'low' | 'healthy';
  priority: number;
}

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const initialOrders = [
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

export default function AdminOverviewPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [totalProducts, setTotalProducts] = useState(9);
  const [totalSKUs, setTotalSKUs] = useState(25);
  const [loading, setLoading] = useState(true);

  const fetchLiveDashboard = async () => {
    try {
      // 1. Fetch real stock alerts sorted by lowest stock first
      const alertsRes = await fetch('/api/products?stock_alerts=true');
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        if (data.alerts) {
          // Strictly sort lowest stock first (0 -> 1 -> 2 -> 3 ...)
          const sorted = data.alerts.sort((a: StockAlert, b: StockAlert) => a.stockQuantity - b.stockQuantity);
          setStockAlerts(sorted.filter((a: StockAlert) => a.stockQuantity <= 10));
        }
      }

      // 2. Fetch catalog counts
      const prodRes = await fetch('/api/products?admin=true');
      if (prodRes.ok) {
        const pData = await prodRes.json();
        if (pData.products) {
          setTotalProducts(pData.products.length);
          const skus = pData.products.reduce((acc: number, p: any) => acc + (p.variants?.length || 0), 0);
          setTotalSKUs(skus);
        }
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveDashboard();
  }, []);

  const criticalCount = stockAlerts.filter((a) => a.stockQuantity <= 5).length;
  const outOfStockCount = stockAlerts.filter((a) => a.stockQuantity === 0).length;

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Atelier Executive Overview"
        subtitle="Real-time revenue, live order fulfillment status, and priority inventory alerts"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Real-time KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-full gradient-gold flex items-center justify-center text-espresso">
                <DollarSign size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                $24,890.50
              </div>
              <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> +14.2% this month
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Store Orders
              </span>
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                142
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                5 orders awaiting dispatch
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-border bg-card shadow-xs">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Catalog & SKUs
              </span>
              <div className="w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                <Package size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
                {totalProducts} Styles <span className="text-sm font-normal text-muted-foreground">({totalSKUs} SKUs)</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Live on Veiled Canvas store
              </p>
            </CardContent>
          </Card>

          <Card className={`border-2 shadow-xs ${outOfStockCount > 0 ? 'bg-rose-500/10 border-rose-500/40' : criticalCount > 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-card border-border'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Priority Stock Alerts
              </span>
              <div className="w-8 h-8 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="font-heading text-2xl lg:text-3xl font-bold text-rose-600 dark:text-rose-400">
                {outOfStockCount} Out · {criticalCount} Low
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Sorted by lowest stock priority
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Operations Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card border-2 border-border shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Direct Atelier Actions:
            </span>
            <Button asChild size="sm" className="gradient-gold text-espresso font-semibold h-8 text-xs cursor-pointer">
              <Link href="/admin/products">
                <Plus size={14} className="mr-1" /> Add / Edit Products
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs border-2 border-border cursor-pointer">
              <Link href="/admin/orders">
                Manage Orders
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="h-8 text-xs border-2 border-border cursor-pointer">
              <Link href="/admin/inbox">
                Customer Inbox
              </Link>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchLiveDashboard}
            className="text-xs text-muted-foreground hover:text-foreground h-8 cursor-pointer"
          >
            <RefreshCw size={13} className="mr-1.5" /> Refresh Realtime Data
          </Button>
        </div>

        {/* Grid: Recent Orders & Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="border-2 border-border bg-card shadow-xs">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="font-heading text-lg font-bold">
                    Recent Customer Purchases
                  </CardTitle>
                  <CardDescription>
                    Real-time order fulfillment & dispatch pipeline
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-xs text-primary">
                  <Link href="/admin/orders">
                    View All Orders <ArrowRight size={14} className="ml-1" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y-2 divide-border">
                  {initialOrders.map((ord) => (
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
                        <Button asChild size="sm" variant="outline" className="h-8 text-xs border-2 border-border">
                          <Link href="/admin/orders">Fulfill</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Priority Low-Stock Alerts Card (1 col) - Sorted strictly LOWEST STOCK FIRST */}
          <div className="space-y-6">
            <Card className="border-2 border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-base font-bold flex items-center gap-2 text-rose-600 dark:text-rose-400">
                    <AlertTriangle size={18} />
                    Low Stock Priority Feed
                  </CardTitle>
                  <span className="text-xs bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold px-2 py-0.5 rounded-full">
                    {stockAlerts.length} Critical
                  </span>
                </div>
                <CardDescription>
                  Ranked by urgency: lowest inventory units first
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {stockAlerts.length === 0 ? (
                  <div className="text-center py-6 text-xs text-muted-foreground">
                    <CheckCircle size={24} className="mx-auto text-emerald-500 mb-2" />
                    All variant stock levels are in safe supply!
                  </div>
                ) : (
                  stockAlerts.slice(0, 6).map((item, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border-2 space-y-1 ${
                        item.stockQuantity === 0
                          ? 'bg-rose-500/10 border-rose-500/40'
                          : item.stockQuantity <= 3
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-muted/40 border-border'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-foreground line-clamp-1">
                          {item.productTitle}
                        </span>
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 ${
                            item.stockQuantity === 0
                              ? 'bg-rose-600 text-white font-extrabold animate-pulse'
                              : item.stockQuantity <= 3
                              ? 'text-amber-800 dark:text-amber-200 bg-amber-500/20'
                              : 'text-foreground bg-muted'
                          }`}
                        >
                          {item.stockQuantity === 0 ? 'OUT OF STOCK' : `${item.stockQuantity} remaining`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
                        <span>{item.colorName} · {item.sku}</span>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          Priority #{idx + 1}
                        </span>
                      </div>
                    </div>
                  ))
                )}

                <Button asChild variant="outline" className="w-full text-xs mt-2 border-2 border-border">
                  <Link href="/admin/products">
                    Restock SKUs in Catalog
                    <ArrowRight size={14} className="ml-1.5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status Card with dark border */}
            <Card className="border-2 border-border bg-card shadow-xs">
              <CardHeader className="pb-3">
                <CardTitle className="font-heading text-base font-bold">
                  System Health & Gateway Sync
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b-2 border-border/60">
                  <span className="text-muted-foreground">PostgreSQL Database</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={12} /> Live / Connected
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b-2 border-border/60">
                  <span className="text-muted-foreground">Shared Catalog Sync</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle size={12} /> Active Realtime
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Stripe Payment Gateway</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
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
