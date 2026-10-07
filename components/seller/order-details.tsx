/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { formatMinorUnit } from "@/lib/utils";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { changeSellerOrderStatusAction } from "@/lib/actions/seller-orders";
import { useRouter } from "next/navigation";
import { SubOrderStatus } from "@/lib/services/order-status";
import { Printer } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

export function OrderDetailsView({ order }: { order: any }) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: SubOrderStatus, reason?: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await changeSellerOrderStatusAction(order.id, newStatus, reason);
      router.refresh();
    } catch (err: any) {
      if (err.message.includes("Order changed, please refresh")) {
        setError("Order changed, please refresh");
      } else {
        setError(err.message);
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Non-printable header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold font-heading">Order {order.orderNumber}</h1>
          <p className="text-muted-foreground">{new Date(order.date).toLocaleString()}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Packing Slip
          </Button>
          
          {order.status === "pending" && (
            <Button onClick={() => handleStatusChange("confirmed")} disabled={isUpdating}>
              Confirm Order
            </Button>
          )}
          {order.status === "confirmed" && (
            <Button onClick={() => handleStatusChange("packed")} disabled={isUpdating}>
              Mark Packed
            </Button>
          )}
          {order.status === "packed" && (
            <Button onClick={() => handleStatusChange("ready_to_ship")} disabled={isUpdating}>
              Ready to Ship
            </Button>
          )}
          {["pending", "confirmed", "packed", "ready_to_ship"].includes(order.status) && (
            <AlertDialog>
              <AlertDialogTrigger 
                className={buttonVariants({ variant: "destructive" })}
                disabled={isUpdating}
              >
                Cancel
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel Order</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to cancel this order? This action cannot be undone.
                    {/* TODO (Phase 8): Stock release and customer notification */}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <Textarea 
                  placeholder="Reason for cancellation (required)" 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
                <AlertDialogFooter>
                  <AlertDialogCancel>Go Back</AlertDialogCancel>
                  <AlertDialogAction 
                    disabled={cancelReason.length < 5 || isUpdating}
                    onClick={(e) => {
                      e.preventDefault();
                      handleStatusChange("cancelled", cancelReason);
                    }}
                  >
                    Confirm Cancellation
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl font-bold print:hidden">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">Items</h2>
            <div className="space-y-4">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold">{item.product_title}</p>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries(item.variant_attributes).map(([k, v]) => (
                        <span key={k} className="mr-2">{k}: {v as string}</span>
                      ))}
                    </div>
                    <p className="text-sm mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right print:hidden">
                    <p className="font-bold">{formatMinorUnit(item.line_total_minor, "PKR")}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-6 print:hidden">
            <h2 className="text-xl font-bold mb-4 font-heading">Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatMinorUnit(order.subtotalMinor, "PKR")}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatMinorUnit(order.shippingMinor, "PKR")}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
                <span>Total</span>
                <span>{formatMinorUnit(order.totalMinor, "PKR")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">Status</h2>
            <Badge className="capitalize mb-4 text-sm px-3 py-1">
              {order.status.replace(/_/g, " ")}
            </Badge>
            <p className="text-sm text-muted-foreground">
              Payment: <span className="uppercase font-bold">{order.paymentMethod}</span>
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">Shipping Address</h2>
            <div className="text-sm space-y-1">
              <p className="font-bold">{order.shippingAddress.fullName}</p>
              
              {order.shippingAddress.phone ? (
                <>
                  <p>{order.shippingAddress.phone}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>{order.shippingAddress.area}</p>
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                  {order.shippingAddress.postalCode && <p>{order.shippingAddress.postalCode}</p>}
                </>
              ) : (
                <div className="p-3 bg-secondary/50 rounded-lg mt-2 text-muted-foreground">
                  <p>Full address hidden until order is confirmed.</p>
                  <p className="mt-2 font-medium text-foreground">{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* CSS for print mode (Packing Slip only) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          .space-y-6, .space-y-6 * {
            visibility: visible;
          }
          .space-y-6 {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-card {
            border: none;
            box-shadow: none;
          }
        }
      `}} />
    </div>
  );
}
