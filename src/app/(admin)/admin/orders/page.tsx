'use client';

import { useState } from 'react';
import { AdminHeader } from '@/components/admin/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderDetailModal, type AdminOrder } from '@/components/admin/order-detail-modal';
import { formatPrice } from '@/lib/utils';
import { Search, Filter, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const initialOrders: AdminOrder[] = [
  {
    id: 'ord_9f81a7b2',
    customerName: 'Farah Siddiqui',
    email: 'farah.s@example.com',
    status: 'pending',
    total: 7600,
    date: '2026-09-21 15:30',
    shippingAddress: {
      street: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'United States',
    },
    items: [
      {
        title: 'Premium Silk Chiffon Hijab',
        variant: 'Dusty Rose',
        sku: 'VC-HJB-SILK-ROSE',
        quantity: 2,
        price: 3800,
      },
    ],
  },
  {
    id: 'ord_3c29e1d8',
    customerName: 'Layla Al-Khatib',
    email: 'layla.k@example.com',
    status: 'processing',
    total: 13500,
    date: '2026-09-21 14:15',
    shippingAddress: {
      street: '1200 Bay Street, Suite 400',
      city: 'Toronto',
      state: 'ON',
      postalCode: 'M5R 2A5',
      country: 'Canada',
    },
    items: [
      {
        title: 'Minimalist Linen Everyday Abaya',
        variant: 'Oatmeal Beige',
        sku: 'VC-ABY-LIN-OAT',
        quantity: 1,
        price: 13500,
      },
    ],
  },
  {
    id: 'ord_7e44b09c',
    customerName: 'Amina Zahra',
    email: 'amina.z@example.com',
    status: 'shipped',
    total: 8200,
    date: '2026-09-21 11:05',
    shippingAddress: {
      street: '45 Knightsbridge Road',
      city: 'London',
      postalCode: 'SW1X 7LY',
      country: 'United Kingdom',
    },
    items: [
      {
        title: 'Modal Silk Square Hijab',
        variant: 'Pearl Cream',
        sku: 'VC-HJB-MOD-PRL',
        quantity: 1,
        price: 4200,
      },
      {
        title: 'Seamless Bamboo Underscarf',
        variant: 'Mocha',
        sku: 'VC-ACC-UND-MCH',
        quantity: 2,
        price: 2000,
      },
    ],
  },
  {
    id: 'ord_1a87d4ef',
    customerName: 'Zaynab Noor',
    email: 'guest_zaynab@gmail.com',
    status: 'delivered',
    total: 6800,
    date: '2026-09-20 18:40',
    shippingAddress: {
      street: '88 Collins Street',
      city: 'Melbourne',
      state: 'VIC',
      postalCode: '3000',
      country: 'Australia',
    },
    items: [
      {
        title: 'Active Modest Performance Tunic',
        variant: 'Midnight Black',
        sku: 'VC-SPT-ACT-BLK',
        quantity: 1,
        price: 6800,
      },
    ],
  },
  {
    id: 'ord_5b32f91a',
    customerName: 'Hajar Mansoor',
    email: 'hajar.m@example.com',
    status: 'processing',
    total: 18900,
    date: '2026-09-20 09:20',
    shippingAddress: {
      street: 'Al Wasl Road, Villa 14',
      city: 'Dubai',
      postalCode: '00000',
      country: 'United Arab Emirates',
    },
    items: [
      {
        title: 'Pleated Satin Evening Abaya',
        variant: 'Champagne Gold',
        sku: 'VC-ABY-SAT-GLD',
        quantity: 1,
        price: 18900,
      },
    ],
  },
  {
    id: 'ord_8d90e21b',
    customerName: 'Mariam Qureshi',
    email: 'mariam.q@example.com',
    status: 'cancelled',
    total: 4500,
    date: '2026-09-19 16:10',
    shippingAddress: {
      street: '15 High Street',
      city: 'Oxford',
      postalCode: 'OX1 4AP',
      country: 'United Kingdom',
    },
    items: [
      {
        title: 'Georgette Textured Hijab',
        variant: 'Olive Grove',
        sku: 'VC-HJB-GEO-OLV',
        quantity: 1,
        price: 4500,
      },
    ],
  },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  processing: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  shipped: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  delivered: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

export default function AdminOrdersPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: AdminOrder['status']) => {
    setOrders((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleOpenDetail = (order: AdminOrder) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  return (
    <div className="flex-1 pb-12">
      <AdminHeader
        onOpenMobile={() => setMobileOpen(true)}
        title="Orders & Fulfillment"
        subtitle="Review, pack, dispatch and track customer orders"
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, customer name, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 h-10 text-xs font-semibold">
                <Filter size={14} className="mr-2" />
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses ({orders.length})</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                toast.success('Filters cleared');
              }}
              title="Reset filters"
            >
              <RefreshCw size={14} />
            </Button>
          </div>
        </div>

        {/* Orders Table */}
        <Card className="border-border/80 bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Items</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground text-sm">
                      No orders found matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-semibold text-xs text-foreground">
                        {ord.id}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-medium text-foreground text-xs sm:text-sm">
                          {ord.customerName}
                        </div>
                        <div className="text-[11px] text-muted-foreground">{ord.email}</div>
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground whitespace-nowrap">
                        {ord.date}
                      </td>
                      <td className="py-4 px-4 text-xs text-muted-foreground">
                        {ord.items.reduce((acc, i) => acc + i.quantity, 0)} pcs
                      </td>
                      <td className="py-4 px-4 font-heading font-bold text-xs sm:text-sm text-foreground">
                        {formatPrice(ord.total)}
                      </td>
                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[11px] capitalize px-2 py-0.5 border font-medium ${
                            statusStyles[ord.status] || ''
                          }`}
                        >
                          {ord.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => handleOpenDetail(ord)}
                        >
                          <Eye size={13} />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
