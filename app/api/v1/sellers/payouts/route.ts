import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import {
  requestSellerPayout,
  getSellerPayouts,
  type PayoutStatus,
} from "@/lib/services/payouts";
import { requestPayoutSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const status = (searchParams.get("status") || "all") as PayoutStatus | "all";

    const result = await getSellerPayouts(profile.id, { page, limit, status });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const validated = requestPayoutSchema.parse(body);
    const ipAddress = getClientIp(request.headers);

    const amountPkr = validated.amountPkr ?? (validated.amountMinor ? Math.floor(validated.amountMinor / 100) : 0);
    const result = await requestSellerPayout(profile.id, amountPkr, ipAddress);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

