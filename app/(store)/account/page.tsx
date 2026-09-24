import { requireAuth } from "@/lib/auth/roles";
import { JourneyTracker } from "@/components/store/journey-tracker";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User, Package } from "lucide-react";

export default async function AccountPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);

  return (
    <div className="container mx-auto px-4 py-10 max-w-4xl space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">
          My Account
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back to the caravan, {profile.email}
        </p>
      </div>

      {/* Active Order Journey Tracker */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Package className="w-5 h-5 text-primary" />
          <span>Active Journey</span>
        </h2>
        <JourneyTracker
          currentStop="on_the_way"
          orderNumber="KV-98241"
          estimatedArrival="Tomorrow by 5 PM"
        />
      </div>

      {/* Account Details Card */}
      <Card className="rounded-2xl border-border">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span>Profile & Security</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Email:</span>
            <span className="font-medium text-foreground">{profile.email}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-border/60">
            <span className="text-muted-foreground">Assigned Role:</span>
            <span className="font-medium uppercase text-primary text-xs bg-primary/10 px-2 py-0.5 rounded-full">
              {profile.role}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Default Currency:</span>
            <span className="font-medium text-foreground">PKR (Pakistani Rupee)</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
