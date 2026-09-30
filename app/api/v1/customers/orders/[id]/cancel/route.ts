import { NextResponse } from "next/server";
import { cancelSubOrder } from "@/lib/services/customer_orders";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { z } from "zod";
import { postgresUuidSchema } from "@/lib/validators/cart";

const cancelSchema = z.object({
  reason: z.string().min(10).max(500)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });

    const { id: subOrderId } = await params;
    const validatedId = postgresUuidSchema.parse(subOrderId);
    const body = await req.json();
    const parsed = cancelSchema.parse(body);

    await cancelSubOrder(supabase, user.id, validatedId, parsed.reason);
    return NextResponse.json({ success: true, message: "Order cancelled" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
