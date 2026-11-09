/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/

import { createAdminClient } from "@/lib/supabase/admin";

export interface DashboardStats {
  gmvPkr: number;
  gmvMinor: number;
  orderCount: number;
  commissionPkr: number;
  commissionMinor: number;
  activeSellersCount: number;
  pendingApprovals: {
    sellers: number;
    products: number;
    bankChanges: number;
  };
  codPending: {
    count: number;
    amountPkr: number;
    amountMinor: number;
  };
  chartData: {
    date: string;
    gmvPkr: number;
    gmvMinor: number;
    orderCount: number;
  }[];
}

export async function getAdminDashboardStats(
  adminId: string,
  adminRole: string,
  days: number = 30
): Promise<DashboardStats> {
  // Allow superadmin or any admin_staff
  if (adminRole !== "superadmin" && adminRole !== "admin_staff") {
    throw new Error("Access denied");
  }

  const adminClient = createAdminClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateIso = startDate.toISOString();

  // 1. Fetch sub-orders in the date range
  const { data: subOrders, error: subOrdersErr } = await adminClient
    .from("sub_orders")
    .select("total_pkr, subtotal_pkr, created_at, status")
    .gte("created_at", startDateIso);

  if (subOrdersErr) {
    console.error("Failed to fetch sub-orders for dashboard:", subOrdersErr.message);
  }

  const validOrders = (subOrders || []).filter(
    (o) => o.status !== "cancelled" && o.status !== "returned"
  );

  const gmvPkr = validOrders.reduce((acc, curr) => acc + (curr.total_pkr || 0), 0);
  const orderCount = validOrders.length;

  // 2. Fetch commissions in the date range
  const { data: commissions, error: commErr } = await adminClient
    .from("commissions")
    .select("commission_pkr")
    .gte("created_at", startDateIso);

  if (commErr) {
    console.error("Failed to fetch commissions for dashboard:", commErr.message);
  }

  const commissionPkr = (commissions || []).reduce(
    (acc, curr) => acc + (curr.commission_pkr || 0),
    0
  );

  // 3. Count active sellers
  const { count: activeSellersCount, error: sellersErr } = await adminClient
    .from("sellers")
    .select("id", { count: "exact", head: true })
    .eq("status", "approved");

  if (sellersErr) {
    console.error("Failed to count active sellers:", sellersErr.message);
  }

  // 4. Pending approvals
  const [
    { count: pendingSellers },
    { count: pendingProducts },
    { count: pendingBankChanges },
  ] = await Promise.all([
    adminClient
      .from("sellers")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    adminClient
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
    adminClient
      .from("seller_bank_change_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // 5. COD pending remittances (unreconciled remittances)
  const { data: pendingCod, error: codErr } = await adminClient
    .from("cod_remittances")
    .select("amount_pkr")
    .is("reconciled_by", null);

  if (codErr) {
    console.error("Failed to fetch pending COD remittances:", codErr.message);
  }

  const codPendingCount = (pendingCod || []).length;
  const codPendingAmountPkr = (pendingCod || []).reduce(
    (acc, curr) => acc + (curr.amount_pkr || 0),
    0
  );

  // 6. Build daily chart series over the date window
  const dailyMap: Record<string, { gmvPkr: number; gmvMinor: number; orderCount: number }> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    dailyMap[dateStr] = { gmvPkr: 0, gmvMinor: 0, orderCount: 0 };
  }

  for (const o of validOrders) {
    const d = o.created_at.split("T")[0];
    if (dailyMap[d]) {
      dailyMap[d].gmvPkr += o.total_pkr || 0;
      dailyMap[d].gmvMinor += o.total_pkr || 0;
      dailyMap[d].orderCount += 1;
    }
  }

  const chartData = Object.entries(dailyMap).map(([date, val]) => ({
    date,
    gmvPkr: val.gmvPkr,
    gmvMinor: val.gmvMinor,
    orderCount: val.orderCount,
  }));

  return {
    gmvPkr,
    gmvMinor: gmvPkr,
    orderCount,
    commissionPkr,
    commissionMinor: commissionPkr,
    activeSellersCount: activeSellersCount ?? 0,
    pendingApprovals: {
      sellers: pendingSellers ?? 0,
      products: pendingProducts ?? 0,
      bankChanges: pendingBankChanges ?? 0,
    },
    codPending: {
      count: codPendingCount,
      amountPkr: codPendingAmountPkr,
      amountMinor: codPendingAmountPkr,
    },
    chartData,
  };
}
