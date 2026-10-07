"use client";

import React, { useState } from "react";
import { formatPaisa } from "@/lib/format/currency";
import { formatDate } from "@/lib/format/date";
import { buttonVariants, Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { changeSellerOrderStatusAction } from "@/lib/actions/seller-orders";
import { useRouter } from "next/navigation";
import { SubOrderStatus } from "@/lib/services/order-status";
import { Printer } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslations } from "next-intl";

interface OrderDetailsShape {
  id: string;
  orderNumber: string;
  date: string;
  status: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: Record<string, string>;
  subtotalMinor: number;
  shippingMinor: number;
  totalMinor: number;
  paymentMethod: string;
  paymentStatus: string;
  sellerBusinessName: string;
  items: Array<Record<string, unknown>>;
}

export function OrderDetailsView({ order: rawOrder }: { order: Record<string, unknown> }) {
  const order = rawOrder as unknown as OrderDetailsShape;
  const t = useTranslations("seller.order_details");
  const tOrders = useTranslations("orders");
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [cancelReasonCode, setCancelReasonCode] = useState<string>("");
  const [cancelReason, setCancelReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: SubOrderStatus, reason?: string) => {
    setIsUpdating(true);
    setError(null);
    try {
      await changeSellerOrderStatusAction(order.id as string, newStatus, reason);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes("Order changed, please refresh")) {
        setError("Order changed, please refresh");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
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
          <h1 className="text-2xl font-bold font-heading">Order {order.orderNumber as string}</h1>
          <p className="text-muted-foreground">{formatDate(order.date as string)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            {t("packingSlip")}
          </Button>
          
          {(order.status as string) === "pending" && (
            <Button onClick={() => handleStatusChange("confirmed")} disabled={isUpdating}>
              {t("confirmOrder")}
            </Button>
          )}
          {(order.status as string) === "confirmed" && (
            <Button onClick={() => handleStatusChange("packed")} disabled={isUpdating}>
              {t("markPacked")}
            </Button>
          )}
          {(order.status as string) === "packed" && (
            <Button onClick={() => handleStatusChange("ready_to_ship")} disabled={isUpdating}>
              {t("readyToShip")}
            </Button>
          )}
          {["awaiting_confirmation", "pending", "confirmed"].includes((order.status as string) as string) ? (
            <AlertDialog>
              <AlertDialogTrigger 
                className={buttonVariants({ variant: "destructive" })}
                disabled={isUpdating}
              >
                {t("cancelOrder")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("cancelOrder")}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t("cancelConfirmDesc")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 my-2">
                  <Select value={cancelReasonCode} onValueChange={(v) => setCancelReasonCode(v || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("cancelSelectReason")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="out_of_stock">{t("outOfStock")}</SelectItem>
                      <SelectItem value="cannot_fulfil">{t("cannotFulfil")}</SelectItem>
                      <SelectItem value="buyer_request">{t("buyerRequested")}</SelectItem>
                      <SelectItem value="other">{t("otherReason")}</SelectItem>
                    </SelectContent>
                  </Select>
                  {cancelReasonCode === "other" && (
                    <Textarea 
                      placeholder={t("otherDetails")} 
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                    />
                  )}
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("goBack")}</AlertDialogCancel>
                  <AlertDialogAction 
                    disabled={(cancelReasonCode === "other" && cancelReason.length < 5) || !cancelReasonCode || isUpdating}
                    onClick={(e) => {
                      e.preventDefault();
                      const finalReason = cancelReasonCode === "other" ? `Other: ${cancelReason}` : cancelReasonCode;
                      handleStatusChange("cancelled", finalReason);
                    }}
                  >
                    {t("confirmCancel")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : ["packed", "ready_to_ship", "shipped"].includes((order.status as string)) ? (
            <div className="text-sm text-muted-foreground self-center">
              {t("cancelSupport")}
            </div>
          ) : null}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-xl font-bold print:hidden">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:hidden">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">{t("itemsTitle")}</h2>
            <div className="space-y-4">
              {((order.items as Record<string, unknown>[]) || []).map((item: Record<string, unknown>) => (
                <div key={(item.id as string)} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-bold">{(item.product_title as string)}</p>
                    <div className="text-sm text-muted-foreground">
                      {Object.entries((item.variant_attributes || {}) as Record<string, unknown>).map(([k, v]) => (
                        <span key={k} className="mr-2">{k}: {v as string}</span>
                      ))}
                    </div>
                    <p className="text-sm mt-1">{t("qty")}: {(item.quantity as number)}</p>
                  </div>
                  <div className="text-right print:hidden">
                    <p className="font-bold">{formatPaisa((item.line_total_minor as number))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-card border rounded-xl p-6 print:hidden">
            <h2 className="text-xl font-bold mb-4 font-heading">{t("summaryTitle")}</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>{t("subtotal")}</span>
                <span>{formatPaisa(order.subtotalMinor as number)}</span>
              </div>
              <div className="flex justify-between">
                <span>{t("shipping")}</span>
                <span>{formatPaisa(order.shippingMinor as number)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-4 border-t mt-4">
                <span>{t("total")}</span>
                <span>{formatPaisa(order.totalMinor as number)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">{t("statusTitle")}</h2>
            <Badge className="capitalize mb-4 text-sm px-3 py-1">
              {tOrders(`status.${(order.status as string)}` as Parameters<typeof tOrders>[0]) || (order.status as string).replace(/_/g, " ")}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {t("paymentLabel")}: <span className="uppercase font-bold">{(order.paymentMethod as string)} &bull; {tOrders(`payment.${(order.paymentStatus as string)}` as Parameters<typeof tOrders>[0]) || (order.paymentStatus as string)}</span>
            </p>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 font-heading">{t("shippingAddressTitle")}</h2>
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
                  <p>{t("addressHidden")}</p>
                  <p className="mt-2 font-medium text-foreground">{order.shippingAddress.city}, {order.shippingAddress.province}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Print-only Packing Slip */}
      <div className="hidden print:block p-8 font-sans w-full max-w-4xl mx-auto space-y-8 bg-white text-black">
        <div className="flex justify-between items-start border-b-2 border-black pb-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tighter uppercase font-heading">{t("packingSlip")}</h1>
            <p className="text-lg mt-1 font-mono">{t("orderNumberLabel", { number: order.orderNumber as string })}</p>
          </div>
          <div className="text-end">
            <p className="font-bold text-2xl font-heading">Kaaravan — {order.sellerBusinessName}</p>
            <p className="text-sm mt-1 text-gray-600">{t("orderDate")}: {formatDate(order.date as string)}</p>
            <p className="text-sm text-gray-600">{t("printedDate")}: {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12">
          <div>
            <h2 className="font-bold text-sm uppercase tracking-widest border-b border-black mb-3 pb-1 text-gray-500">{t("shipTo")}</h2>
            {order.shippingAddress.phone ? (
              <div className="space-y-1 text-lg">
                <p className="font-bold text-xl">{order.shippingAddress.fullName as string}</p>
                <p>{order.shippingAddress.street as string}</p>
                <p>{order.shippingAddress.area as string}</p>
                <p>{order.shippingAddress.city as string}, {order.shippingAddress.province as string} {order.shippingAddress.postalCode as string}</p>
                <p className="pt-2 font-mono">Tel: {order.shippingAddress.phone as string}</p>
              </div>
            ) : (
              <p className="italic text-gray-500">{t("addressConcealed")}</p>
            )}
          </div>
          <div className="text-end">
            <h2 className="font-bold text-sm uppercase tracking-widest border-b border-black mb-3 pb-1 text-gray-500">{t("paymentMethod")}</h2>
            <p className="text-xl uppercase font-bold">{order.paymentMethod}</p>
            {order.paymentMethod === "cod" && (
              <div className="mt-4 p-4 border-2 border-black inline-block text-start">
                <p className="text-sm font-bold uppercase">{t("amountToCollect")}</p>
                <p className="text-3xl font-extrabold mt-1">{formatPaisa(order.totalMinor)}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="font-bold text-sm uppercase tracking-widest border-b border-black mb-4 pb-1 text-gray-500">{t("itemsTitle")}</h2>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-3 text-lg text-start">{t("itemDescription")}</th>
                <th className="py-3 w-32 text-center text-lg">{t("qty")}</th>
              </tr>
            </thead>
            <tbody>
              {((order.items as Record<string, unknown>[]) || []).map((item: Record<string, unknown>) => (
                <tr key={(item.id as string)} className="border-b border-gray-300">
                  <td className="py-4">
                    <p className="font-bold text-xl">{(item.product_title as string)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {Object.entries((item.variant_attributes || {}) as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(" | ")}
                    </p>
                  </td>
                  <td className="py-4 text-center text-2xl font-bold">{(item.quantity as number)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="pt-24 mt-16 border-t-2 border-dashed border-gray-400 text-center text-gray-600">
          <p className="text-xl font-bold font-heading mb-2">Thank you for joining the Kaaravan!</p>
          <p>Please include this packing slip in the package.</p>
        </div>
      </div>
      
      {/* CSS for print mode (Packing Slip only) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: auto; margin: 0mm; }
          body * {
            visibility: hidden;
          }
          .print\\:block, .print\\:block * {
            visibility: visible;
          }
          .print\\:block {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}} />
    </div>
  );
}
