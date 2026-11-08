import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { createAdminCategory } from "@/lib/services/admin-catalog";
import { getClientIp } from "@/lib/utils";

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().min(2).max(100),
  parentId: z.string().uuid().nullable().optional(),
  commissionRateBps: z.number().int().min(0).max(10000).nullable().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    const result = await createAdminCategory(validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to create category" },
      { status: 400 }
    );
  }
}
