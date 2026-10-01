import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function UnauthorizedPage() {
  const tAuth = await getTranslations("auth");
  const tCommon = await getTranslations("common");

  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
        {tAuth("accessDenied")}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        {tAuth("unauthorizedDesc")}
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/">
          <Button variant="outline">{tCommon("returnHome")}</Button>
        </Link>
        <Link href="/login">
          <Button className="bg-primary text-primary-foreground">{tAuth("signInDifferent")}</Button>
        </Link>
      </div>
    </div>
  );
}
