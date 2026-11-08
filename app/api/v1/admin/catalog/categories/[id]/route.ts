import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { updateAdminCategory } from "@/lib/services/admin-catalog";
import { getClientIp } from "@/lib/utils";

const uuidSchema = z.string().uuid();

const updateCategorySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  slug: z.string().trim().min(2).max(100).optional(),
  parentId: z.string().uuid().nullable().optional(),
  commissionRateBps: z.number().int().min(0).max(10000).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_catalog");
  if (!auth.success) return auth.response;

  const { id: rawId } = await context.params;
  const parsedId = uuidSchema.safeParse(rawId);
  if (!parsedId.success) {
    return NextResponse.json({ success: false, error: "Invalid UUID parameter" }, { status: 400 });
  }
  const categoryId = parsedId.data;
  const ipAddress = getClientIp(request.headers);

  try {
    const body = await request.json();
    const validated = updateCategorySchema.parse(body);

    const result = await updateAdminCategory(categoryId, validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to update category" },
      { status: 400 }
    );
  }
}
