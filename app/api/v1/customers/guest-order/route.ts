import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupGuestOrder } from "@/lib/services/customer_orders";

export async function POST(req: Request) {
  try {
    const { orderNumber, email } = await req.json();
    if (!orderNumber || !email) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const data = await lookupGuestOrder(adminClient, orderNumber, email);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
  }
}
