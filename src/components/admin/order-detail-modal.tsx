'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/lib/utils';
import { MapPin, Mail, Package, Printer, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export interface AdminOrder {
  id: string;
  customerName: string;
  email: string;
  phone?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  date: string;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };
  items: Array<{
    title: string;
    variant: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onStatusChange,
}: {
  order: AdminOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: AdminOrder['status']) => void;
}) {
  if (!order) return null;

  const [currentStatus, setCurrentStatus] = useState<AdminOrder['status']>(order.status);
  const [updating, setUpdating] = useState(false);

  const handleUpdateStatus = (val: AdminOrder['status']) => {
    setCurrentStatus(val);
    setUpdating(true);
    setTimeout(() => {
      onStatusChange(order.id, val);
      setUpdating(false);
      toast.success(`Order ${order.id} status updated to ${val.toUpperCase()}`);
    }, 400);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2">
                Order <span className="font-mono text-primary font-medium">{order.id}</span>
              </DialogTitle>
              <DialogDescription className="text-xs flex items-center gap-1.5 mt-1">
                <Clock size={12} /> Placed on {order.date}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Status:</span>
              <Select
                value={currentStatus}
                onValueChange={(v) => handleUpdateStatus(v as AdminOrder['status'])}
                disabled={updating}
              >
                <SelectTrigger className="w-36 h-8 text-xs font-semibold capitalize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Customer & Shipping Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-muted/40 space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground block">
              Customer Info
            </span>
            <p className="font-semibold text-sm text-foreground">{order.customerName}</p>
            <p className="text-muted-foreground flex items-center gap-1.5">
              <Mail size={12} /> {order.email}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-muted-foreground block">
              Shipping Destination
            </span>
            <p className="font-medium text-foreground flex items-start gap-1.5">
              <MapPin size={13} className="shrink-0 mt-0.5 text-primary" />
              <span>
                {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                {order.shippingAddress.state} {order.shippingAddress.postalCode},{' '}
                {order.shippingAddress.country}
              </span>
            </p>
          </div>
        </div>

        {/* Order Line Items */}
        <div className="space-y-3">
          <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
            Order Items ({order.items.reduce((acc, i) => acc + i.quantity, 0)} Units)
          </h4>
          <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <p className="font-medium text-foreground line-clamp-1">{item.title}</p>
                  <p className="text-muted-foreground text-[11px]">
                    {item.variant} · <span className="font-mono">{item.sku}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-foreground">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Shipping</span>
            <span className="text-emerald-600 font-medium">Free (Standard)</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-sm text-foreground">
            <span>Total Collected</span>
            <span className="text-primary font-heading font-bold">{formatPrice(order.total)}</span>
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-between sm:justify-between items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="text-xs">
            <Printer size={14} className="mr-1.5" />
            Print Packing Slip
          </Button>
          <Button onClick={onClose} size="sm" className="text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
