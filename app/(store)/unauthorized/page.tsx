import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="container mx-auto px-4 py-24 text-center max-w-md">
      <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
        Access Denied
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        You do not possess the required role permissions to enter this area of Kaaravan.
      </p>
      <div className="flex justify-center gap-3">
        <Link href="/">
          <Button variant="outline">Return Home</Button>
        </Link>
        <Link href="/login">
          <Button className="bg-primary text-primary-foreground">Sign In with Different Account</Button>
        </Link>
      </div>
    </div>
  );
}
