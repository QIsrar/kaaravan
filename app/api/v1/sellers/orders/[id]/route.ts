/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { getSellerOrderDetails } from "@/lib/services/seller-orders";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const result = await getSellerOrderDetails(profile.id, id);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 });
  }
}
