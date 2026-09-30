import { NextResponse } from "next/server";
import { getAddresses, createAddress } from "@/lib/services/customer_accounts";
import { createAddressSchema } from "@/lib/validators/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function GET() {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const data = await getAddresses(supabase, user.id);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const body = await req.json();
    const validated = createAddressSchema.parse(body);
    const data = await createAddress(supabase, user.id, validated);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
