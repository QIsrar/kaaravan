/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { getApiAuthUser } from "@/lib/auth/api-auth";
import { getSellerSettings, updateSellerSettings } from "@/lib/services/seller-settings";

export async function GET(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const result = await getSellerSettings(profile.id);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { user: profile } = await getApiAuthUser();
    if (!profile) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const ipAddress = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const body = await request.json();

    const result = await updateSellerSettings(profile.id, ipAddress, body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
