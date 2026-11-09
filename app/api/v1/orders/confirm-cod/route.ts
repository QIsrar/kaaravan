/**
 * Copyright (c) 2026 One Tech and AI. All rights reserved.
 * Licensed under the Apache License, Version 2.0.
 * 
 * COD Confirmation Endpoint (Phase 8 - HIGH-04)
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAndConfirmCodOrder } from "@/lib/services/cod-confirmation";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Confirmation token is required." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "system";
    const result = await verifyAndConfirmCodOrder(token, ip);

    return NextResponse.json({
      success: true,
      message: "Order successfully confirmed! Your seller will begin dispatch preparations.",
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Confirmation failed";
    const status = message.includes("expired") || message.includes("already been used") ? 410 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json(
      { success: false, error: "Confirmation token is required." },
      { status: 400 }
    );
  }

  try {
    const ip = request.headers.get("x-forwarded-for") || "system";
    const result = await verifyAndConfirmCodOrder(token, ip);

    return NextResponse.json({
      success: true,
      message: "Order confirmed successfully!",
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Confirmation failed";
    const status = message.includes("expired") || message.includes("already been used") ? 410 : 400;
    return NextResponse.json(
      { success: false, error: message },
      { status }
    );
  }
}

