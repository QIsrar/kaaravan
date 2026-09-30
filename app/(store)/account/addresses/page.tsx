import React from "react";
import { requireAuth } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { getAddresses } from "@/lib/services/customer_accounts";
import { AddressesManager } from "@/components/store/addresses-manager";

export default async function CustomerAddressesPage() {
  const profile = await requireAuth(["customer", "seller", "superadmin"]);
  const supabase = await createClient();
  const addresses = await getAddresses(supabase, profile.id);

  return <AddressesManager initialAddresses={addresses || []} />;
}
