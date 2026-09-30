import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupGuestOrder } from "@/lib/services/customer_orders";
import { guestOrderLookupSchema } from "@/lib/validators/order";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = guestOrderLookupSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const data = await lookupGuestOrder(adminClient, parsed.data.orderNumber, parsed.data.email);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
}
