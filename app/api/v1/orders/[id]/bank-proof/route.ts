/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { submitBankTransferProof } from "@/lib/services/payments";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

const bodySchema = z.object({
  filePath: z.string().trim().min(3, "File path is required").max(1000),
  guestEmail: z.string().trim().email("Invalid guest email address").optional().or(z.literal("")),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid order UUID parameter" }, { status: 400 });
  }

  const orderId = parsedId.data;

  try {
    const body = await request.json();
    const validated = bodySchema.parse(body);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const ipAddress = getClientIp(request.headers);

    const result = await submitBankTransferProof({
      orderId,
      filePath: validated.filePath,
      profileId: user?.id ?? null,
      guestEmail: validated.guestEmail || null,
      ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: "Bank transfer payment proof submitted successfully and queued for verification.",
      proofId: result.proofId,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to submit bank transfer proof" },
      { status: 400 }
    );
  }
}

