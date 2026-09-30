import { NextResponse } from "next/server";
import { requestAccountDeletion } from "@/lib/services/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function POST(req: Request) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const { reason } = await req.json();
    await requestAccountDeletion(supabase, user.id, reason);
    return NextResponse.json({ success: true, message: "Account deletion requested successfully" });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
