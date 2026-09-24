import Link from "next/link";
import { BRAND_CONFIG } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { PatternDivider } from "@/components/store/pattern-divider";

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[70vh]">
      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl mx-auto mb-3 shadow-sm">
            K
          </div>
          <CardTitle className="font-heading text-2xl font-bold text-foreground">
            Sign In to {BRAND_CONFIG.name}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter your credentials to join your caravan
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Email Address
            </label>
            <Input
              type="email"
              placeholder="trader@kaaravan.pk"
              className="rounded-xl border-border"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              className="rounded-xl border-border"
            />
          </div>

          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl mt-2 font-medium">
            Sign In
          </Button>

          <PatternDivider variant="caravan-route" className="py-2" />

          <div className="text-xs text-center text-muted-foreground">
            Looking for seller access?{" "}
            <Link href="/seller" className="text-primary font-semibold hover:underline">
              Enter Seller Portal
            </Link>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/60 pt-4 text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-accent font-semibold ml-1 hover:underline">
            Create an Account
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
