import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Users, Store, Landmark, AlertTriangle } from "lucide-react";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-foreground">
          Platform Governance & Operations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Superadmin control center for Kaaravan multi-vendor ecosystem.
        </p>
      </div>

      {/* High-level system stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Total Merchants
            </CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">48</div>
            <p className="text-xs text-muted-foreground mt-1">5 pending verification</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Registered Customers
            </CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,240</div>
            <p className="text-xs text-muted-foreground mt-1">+12% this week</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              Gross Marketplace Volume
            </CardTitle>
            <Landmark className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">PKR 4,820,000</div>
            <p className="text-xs text-muted-foreground mt-1">Append-only ledger entries</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase text-muted-foreground">
              System Audit Status
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">Active</div>
            <p className="text-xs text-muted-foreground mt-1">Immutable log stream</p>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 rounded-xl border border-accent/30 bg-accent/5 text-sm text-foreground">
        <div className="flex items-center gap-2 font-semibold text-accent mb-1">
          <AlertTriangle className="w-4 h-4" />
          <span>Security & Governance Constraints Enforced</span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Admin mutations require mandatory audit log records with actor identity, IP, entity ID,
          before/after snapshots, and timestamp. Financial modifications are strictly append-only.
        </p>
      </div>
    </div>
  );
}
