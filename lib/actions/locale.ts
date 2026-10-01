/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLocaleAction(locale: string) {
  const validLocale: "en" | "ur" = locale === "ur" ? "ur" : "en";
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", validLocale, {
    path: "/",
    maxAge: 31536000,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}
