import { NextRequest, NextResponse } from "next/server";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { listAdminBanners, createBanner, uploadBannerImage } from "@/lib/services/admin-content";
import { bannerSchema } from "@/lib/validators/admin";
import { getClientIp } from "@/lib/utils";

export async function GET() {
  const auth = await requireApiAdminPermission("manage_content");
  if (!auth.success) return auth.response;

  try {
    const data = await listAdminBanners(auth.user.id, auth.profile.role);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to load banners" },
      { status: 400 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAdminPermission("manage_content");
  if (!auth.success) return auth.response;

  const ipAddress = getClientIp(request.headers);
  const contentType = request.headers.get("content-type") || "";

  try {
    // If multipart/form-data, handle image upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
      }
      const { imagePath } = await uploadBannerImage(file, auth.user.id, auth.profile.role);
      return NextResponse.json({ success: true, imagePath });
    }

    // JSON body creates the banner
    const body = await request.json();
    const validated = bannerSchema.parse(body);

    const { bannerId } = await createBanner(validated, auth.user.id, auth.profile.role, ipAddress);
    return NextResponse.json({ success: true, bannerId }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to process banner request" },
      { status: 400 }
    );
  }
}

