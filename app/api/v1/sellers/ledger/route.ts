import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { getSellerLedgerEntries, type LedgerEntryType } from "@/lib/services/seller-finances";

export async function GET(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const entryType = (searchParams.get("entryType") || "all") as LedgerEntryType | "all";

    const result = await getSellerLedgerEntries(profile.id, { page, limit, entryType });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}

