/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import type { Metadata } from "next";
import { getOptionalUserRole } from "@/lib/auth/roles";
import { OnboardingWizard } from "@/components/seller/onboarding-wizard";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSellerDocumentsAction } from "@/lib/actions/seller-documents";
import { DocumentStatusList } from "@/components/seller/document-status";

export const metadata: Metadata = {
  title: "Sell on Kaaravan — Partner with Pakistan's Artisan Marketplace",
  description: "Join Kaaravan as a verified merchant or artisan guild.",
};

export default async function SellPage() {
  const userRole = await getOptionalUserRole();
  const isApprovedSeller = userRole?.isApprovedSeller ?? false;
  
  // If not logged in, they can see the public pitch, but if they want to onboard, they need to log in.
  // We'll show the public pitch if they are not logged in.
  // Wait, if they are logged in and pending, we should show "Pending" status.
  
  let applicationStatus: string | null = null;
  let sellerId: string | null = null;
  let documents: any[] = [];

  if (userRole) {
    const supabase = await createClient();
    const { data: profile } = await supabase.auth.getUser();
    if (profile.user) {
      const { data: seller } = await supabase
        .from("sellers")
        .select("id, status")
        .eq("owner_profile_id", profile.user.id)
        .single();
      
      if (seller) {
        applicationStatus = seller.status;
        sellerId = seller.id;
        try {
          documents = await getSellerDocumentsAction(seller.id);
        } catch (e) {
          console.error("Failed to load documents", e);
        }
      }
    }
  }

  if (applicationStatus === "active" || isApprovedSeller) {
    redirect("/seller");
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16 space-y-16 max-w-4xl">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          Join the Kaaravan
        </h1>
        <p className="text-sm sm:text-lg text-muted-foreground leading-relaxed">
          Reach thousands of buyers across Pakistan. Fair deals, transparent payouts.
        </p>
      </div>

      {!userRole ? (
        <div className="text-center p-8 bg-card border rounded-3xl shadow-sm">
          <h2 className="text-xl font-bold mb-4">You need an account to become a seller</h2>
          <a href="/login?redirect=/sell" className="inline-flex items-center justify-center px-6 py-3 font-bold bg-primary text-primary-foreground rounded-xl">
            Log in or Sign up
          </a>
        </div>
      ) : applicationStatus === "pending" ? (
        <div className="p-8 bg-secondary/10 border-2 border-secondary/30 rounded-3xl text-center space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Application Under Review</h2>
            <p className="text-muted-foreground">
              Your seller application is currently being reviewed by our team. 
              We will notify you once it&apos;s approved. This usually takes 1-2 business days.
            </p>
          </div>
          {sellerId && <DocumentStatusList documents={documents} sellerId={sellerId} />}
        </div>
      ) : applicationStatus === "rejected" ? (
        <div className="p-8 bg-destructive/10 border-2 border-destructive/30 rounded-3xl text-center space-y-8 max-w-2xl mx-auto">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-destructive">Application Rejected</h2>
            <p className="text-muted-foreground">
              Unfortunately, your application could not be approved at this time.
              Please verify your documents and try re-uploading, or contact support for more details.
            </p>
          </div>
          {sellerId && <DocumentStatusList documents={documents} sellerId={sellerId} />}
        </div>
      ) : (
        <div className="bg-card border rounded-3xl shadow-sm p-6 sm:p-10">
          <OnboardingWizard />
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground max-w-2xl mx-auto pt-6 border-t border-border">
        © 2026 Kaaravan Platform. Operated by One Tech and AI.
      </div>
    </div>
  );
}
