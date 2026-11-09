/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { listBankTransferProofs } from "@/lib/services/admin-finance";

const querySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export async function GET(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_finance");
  if (!auth.success) return auth.response;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.parse({
      status: searchParams.get("status") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      offset: searchParams.get("offset") ?? undefined,
    });

    const proofs = await listBankTransferProofs(auth.user.id, auth.profile.role, {
      status: parsed.status,
      limit: parsed.limit,
      offset: parsed.offset,
    });

    return NextResponse.json({
      success: true,
      data: proofs,
      count: proofs.length,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to list bank transfer proofs" },
      { status: 400 }
    );
  }
}

