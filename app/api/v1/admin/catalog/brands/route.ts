import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { createAdminBrand } from "@/lib/services/admin-catalog";
import { getClientIp } from "@/lib/utils";

const createBrandSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100),
  logo: z.string().trim().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = createBrandSchema.parse(body);

    const result = await createAdminBrand(validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create brand" },
      { status: 400 }
    );
  }
}
