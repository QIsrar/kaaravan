import { requireAuth } from "@/lib/auth/roles";
import { submitSellerOnboarding } from "@/lib/services/seller-onboarding";
import { sellerOnboardingSchema } from "@/lib/validators/seller-onboarding";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // We can rely on the same auth check as the web side since middleware sets the session,
    // OR we would decode the Bearer token directly here for mobile. For Next.js App Router,
    // requireAuth handles picking up the session from the cookies which were set by middleware
    // checking the Bearer token.
    const profile = await requireAuth(["customer", "guest"]);
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = sellerOnboardingSchema.parse(body);
    
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    
    const result = await submitSellerOnboarding(validatedData, profile.id, ip);
    
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process onboarding" },
      { status: 400 }
    );
  }
}
