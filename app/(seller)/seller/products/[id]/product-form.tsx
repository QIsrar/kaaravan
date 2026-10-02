"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ProductUpsertInput } from "@/lib/validators/seller-catalog";

export function ProductForm({ product, categories, brands, sellerId }: { product?: unknown, categories: unknown[], brands: unknown[], sellerId: string }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{product ? "Edit Product" : "New Product"}</h1>
      <p>Product form placeholder. Run test_live.mjs instead of interacting with this directly.</p>
    </div>
  );
}
