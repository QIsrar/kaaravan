import { NextRequest, NextResponse } from "next/server";
import { uploadSellerDocument } from "@/lib/services/seller-documents";
import { getClientIp } from "@/lib/utils";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const supabase = createAdminClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!docType || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ip = getClientIp(req.headers);

    const result = await uploadSellerDocument(docType, file, user.id, ip);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 400 });
  }
}
