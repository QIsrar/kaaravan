import { NextResponse } from "next/server";
import { getCachedAuthUser } from "@/lib/auth/roles";

export async function GET() {
  try {
    const user = await getCachedAuthUser();
    return NextResponse.json({ success: true, user });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ success: false, error: err.message, stack: err.stack }, { status: 500 });
  }
}
