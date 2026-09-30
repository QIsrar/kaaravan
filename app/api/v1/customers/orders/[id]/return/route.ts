import { NextResponse } from "next/server";
import { requestReturn } from "@/lib/services/customer_orders";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { z } from "zod";
import { postgresUuidSchema } from "@/lib/validators/cart";

const returnSchema = z.object({
  orderItemId: postgresUuidSchema,
  reason: z.string().min(10).max(500),
  quantity: z.number().int().min(1)
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });

    const { id: subOrderId } = await params;
    const validatedId = postgresUuidSchema.parse(subOrderId);
    const formData = await req.formData();
    
    const parsed = returnSchema.parse({
      orderItemId: formData.get("orderItemId"),
      reason: formData.get("reason"),
      quantity: Number(formData.get("quantity"))
    });

    const files = formData.getAll("evidenceFiles") as File[];
    
    await requestReturn(supabase, user.id, validatedId, parsed.orderItemId, parsed.reason, parsed.quantity, files);
    
    return NextResponse.json({ success: true, message: "Return requested" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
