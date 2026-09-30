import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lookupGuestOrder } from "@/lib/services/customer_orders";

export async function POST(req: Request) {
  try {
    const { orderNumber, email } = await req.json();
    if (!orderNumber || !email) {
      return NextResponse.json({ success: false, error: "Missing orderNumber or email" }, { status: 400 });
    }

    const adminClient = createAdminClient();
    const data = await lookupGuestOrder(adminClient, orderNumber, email);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
