import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { listAdminReturns, type ReturnStatus } from "@/lib/services/returns";

export async function GET(request: Request) {
  try {
    const { user } = await getApiAuthUser();
    if (!user || (user.role !== "superadmin" && user.role !== "admin_staff")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const statusParam = searchParams.get("status");
    const status = (statusParam || "all") as ReturnStatus | "all";

    const result = await listAdminReturns({ page, limit, status });
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal error" },
      { status: 400 }
    );
  }
}
