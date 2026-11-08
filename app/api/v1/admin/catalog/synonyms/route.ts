import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { createAdminSynonym } from "@/lib/services/admin-catalog";
import { getClientIp } from "@/lib/utils";

const synonymSchema = z.object({
  term: z.string().trim().min(2).max(100),
  mapsTo: z.string().trim().min(2).max(100),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = synonymSchema.parse(body);

    const result = await createAdminSynonym(validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create synonym" },
      { status: 400 }
    );
  }
}
