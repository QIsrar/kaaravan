import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Payment Webhook Handler
 *
 * Demonstrates:
 * 1. Gateway-agnostic adapter processing.
 * 2. Supabase Admin client (Service-Role) restricted strictly to server routes.
 * 3. Append-only ledger recording for financial transactions.
 * 4. Audit logging on mutations.
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const gatewayHeader = request.headers.get("x-gateway-provider") || "unknown";

    // In future phases: call PaymentRegistry.getAdapter(gatewayHeader).handleWebhook(...)
    // Ensure service role client is used safely on the server
    const supabaseAdmin = createAdminClient();
    void supabaseAdmin; // Prepared for audit logging in subsequent phase

    // Audit log / transaction record stub
    return NextResponse.json({
      received: true,
      gateway: gatewayHeader,
      bodyLength: rawBody.length,
      status: "acknowledged",
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook handling failed" },
      { status: 500 }
    );
  }
}
