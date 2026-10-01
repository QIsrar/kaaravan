import { NextRequest, NextResponse } from "next/server";
import { uploadSellerDocument } from "@/lib/services/seller-documents";
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
    const sellerId = formData.get("sellerId") as string;
    const docType = formData.get("docType") as string;
    const file = formData.get("file") as File;

    if (!sellerId || !docType || !file) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await uploadSellerDocument(sellerId, docType, file, user.id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
