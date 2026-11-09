/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { rejectBankTransferProof } from "@/lib/services/admin-finance";
import { rejectBankTransferProofSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_finance");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }

  const proofId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = rejectBankTransferProofSchema.parse(body);

    const result = await rejectBankTransferProof({
      proofId,
      reason: validated.reason,
      adminId: auth.user.id,
      adminRole: auth.profile.role,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Bank transfer payment proof rejected and stock reservation released.",
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to reject bank transfer proof" },
      { status: 400 }
    );
  }
}

