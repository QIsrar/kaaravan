import { NextResponse } from "next/server";
import { getCustomerOrders } from "@/lib/services/customer_orders";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function GET() {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const data = await getCustomerOrders(supabase, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
