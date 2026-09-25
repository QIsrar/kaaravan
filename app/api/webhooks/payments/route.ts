import { NextResponse, type NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  // TODO: Phase 8 - implement webhook HMAC signature verification + idempotency and logic.
  return NextResponse.json(
    { error: "Not Implemented" },
    { status: 501 }
  );
}
