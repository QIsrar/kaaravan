/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { approveBankTransferProof } from "@/lib/services/admin-finance";
import { approveBankTransferProofSchema } from "@/lib/validators/admin";
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
    let note: string | undefined;
    try {
      const body = await request.json();
      const parsedBody = approveBankTransferProofSchema.parse(body);
      note = parsedBody.note;
    } catch {
      // Body or note is optional
    }

    const result = await approveBankTransferProof({
      proofId,
      adminId: auth.user.id,
      adminRole: auth.profile.role,
      ipAddress,
      note,
    });

    return NextResponse.json({
      success: true,
      message: "Bank transfer payment proof verified and approved.",
      orderId: result.orderId,
      orderNumber: result.orderNumber,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to approve bank transfer proof" },
      { status: 400 }
    );
  }
}

