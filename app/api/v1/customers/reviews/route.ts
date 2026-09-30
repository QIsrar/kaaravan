import { NextResponse } from "next/server";
import { createReview } from "@/lib/services/customer_accounts";
import { getApiAuthUser } from "@/lib/auth/api-auth";

export async function POST(req: Request) {
  try {
    const { user, supabase, error: authError } = await getApiAuthUser();
    if (!user || !supabase) return NextResponse.json({ success: false, error: authError }, { status: 401 });
    const body = await req.json();
    const data = await createReview(supabase, user.id, body);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
