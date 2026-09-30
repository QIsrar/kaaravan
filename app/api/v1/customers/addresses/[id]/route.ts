import { NextResponse } from "next/server";
import { updateAddress, deleteAddress } from "@/lib/services/customer_accounts";
import { updateAddressSchema } from "@/lib/validators/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const body = await req.json();
    const validated = updateAddressSchema.parse(body);
    const { id } = await params;
    const data = await updateAddress(supabase, user.id, id, validated);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const { id } = await params;
    await deleteAddress(supabase, user.id, id);
    return NextResponse.json({ success: true, message: "Address deleted" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
