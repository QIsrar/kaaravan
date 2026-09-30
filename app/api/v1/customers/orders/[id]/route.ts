import { NextResponse } from "next/server";
import { getCustomerOrderDetails } from "@/lib/services/customer_orders";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { postgresUuidSchema } from "@/lib/validators/cart";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const { id } = await params;
    const validatedId = postgresUuidSchema.parse(id);
    const data = await getCustomerOrderDetails(supabase, user.id, validatedId);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
