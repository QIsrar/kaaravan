import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdminPermission } from "@/lib/auth/admin";
import { getSellerKycDocumentSignedUrl } from "@/lib/services/admin-sellers";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidSchema = z.string().uuid();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiAdminPermission("manage_sellers");
  if (!auth.success) return auth.response;

  const { id: rawSellerId } = await context.params;
  const parsedSellerId = uuidSchema.safeParse(rawSellerId);
  if (!parsedSellerId.success) {
    return NextResponse.json(
      { success: false, error: "Invalid UUID seller parameter" },
      { status: 400 }
    );
  }
  const sellerId = parsedSellerId.data;

  const url = new URL(request.url);
  const filePath = url.searchParams.get("filePath") || url.searchParams.get("path");

  if (!filePath) {
    return NextResponse.json(
      { success: false, error: "Missing required query parameter: filePath" },
      { status: 400 }
    );
  }

  // Security check: Verify document is owned by this seller
  const adminClient = createAdminClient();
  const cleanPath = filePath.replace(/^seller-documents\//, "");
  const { data: docRecord, error: docErr } = await adminClient
    .from("seller_documents")
    .select("id")
    .eq("seller_id", sellerId)
    .or(`file_path.eq.${filePath},file_path.eq.${cleanPath}`)
    .maybeSingle();

  if (docErr || !docRecord) {
    return NextResponse.json(
      { success: false, error: "Document not found or does not belong to specified seller" },
      { status: 403 }
    );
  }

  try {
    const { signedUrl } = await getSellerKycDocumentSignedUrl(
      cleanPath,
      auth.user.id,
      auth.profile.role
    );

    const acceptHeader = request.headers.get("accept") || "";
    const redirectParam = url.searchParams.get("redirect");

    // If client requested JSON via Accept header or explicit redirect=false
    if (acceptHeader.includes("application/json") || redirectParam === "false") {
      return NextResponse.json({ success: true, signedUrl, expiresInSeconds: 300 });
    }

    // Direct browser link click: redirect to temporary signed URL
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Failed to generate secure URL" },
      { status: 400 }
    );
  }
}
