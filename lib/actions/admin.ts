/*
Copyright © 2026 One Tech and AI.
Confidential and Proprietary. All Rights Reserved.
Unauthorised copying, disclosure, modification, distribution or use is prohibited.
*/
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { z } from "zod";
import { requireAdminPermission } from "@/lib/auth/admin";
import {
  rejectSellerSchema,
  suspendSellerSchema,
  unsuspendSellerSchema,
  setSellerCommissionSchema,
  rejectProductSchema,
  takeDownProductSchema,
  adminOrderStatusChangeSchema,
  type AdminPermission,
  adminPermissionSchema,
} from "@/lib/validators/admin";
import type { SubOrderStatus } from "@/lib/services/order-status";
import type { Database } from "@/lib/types/database";
import {
  approveSeller,
  rejectSeller,
  suspendSeller,
  unsuspendSeller,
  setSellerCommission,
} from "@/lib/services/admin-sellers";
import {
  approveBankChangeRequest,
  rejectBankChangeRequest,
  approveBankTransferProof,
  rejectBankTransferProof,
} from "@/lib/services/admin-finance";
import {
  approveProduct,
  rejectProduct,
  takeDownProduct,
  createAdminCategory,
  updateAdminCategory,
  createAdminBrand,
  deleteAdminBrand,
  createAdminSynonym,
  deleteAdminSynonym,
} from "@/lib/services/admin-catalog";
import {
  adminForceSubOrderStatus,
  adminCancelFullOrder,
} from "@/lib/services/admin-orders";
import {
  approveReturnAndRefund,
  rejectReturn,
  settleRefundDue,
} from "@/lib/services/returns";
import {
  approveReturnSchema,
  rejectReturnSchema,
  settleRefundDueSchema,
  approvePayoutSchema,
  rejectPayoutSchema,
  type ApproveReturnInput,
  type RejectReturnInput,
  type SettleRefundDueInput,
  type ApprovePayoutInput,
  type RejectPayoutInput,
} from "@/lib/validators/admin";
import {
  approveAdminPayout,
  rejectAdminPayout,
} from "@/lib/services/payouts";
import {
  suspendCustomerProfile,
  unsuspendCustomerProfile,
} from "@/lib/services/admin-users";
import { updateCourierConfig } from "@/lib/services/admin-logistics";
import {
  createAdminCoupon,
  toggleCouponActive,
} from "@/lib/services/admin-marketing";
import { updateAdminSetting } from "@/lib/services/admin-settings";
import {
  updateStaffPermissions,
  promoteToAdminStaff,
} from "@/lib/services/admin-staff";

const uuidSchema = z.string().uuid("Invalid UUID format");

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

function formatError(err: unknown): never {
  if (isRedirectError(err)) {
    throw err;
  }
  if (err instanceof z.ZodError) {
    const firstIssue = err.issues[0];
    throw new Error(firstIssue?.message || "Invalid input parameters");
  }
  if (err instanceof Error) {
    throw err;
  }
  throw new Error(String(err));
}

// ----------------------------------------------------------------------
// Seller Actions
// ----------------------------------------------------------------------

export async function approveSellerAction(sellerId: string) {
  try {
    const validId = uuidSchema.parse(sellerId);
    const user = await requireAdminPermission("manage_sellers");
    const ip = await getClientIp();
    await approveSeller(validId, user.id, user.role, ip);
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function rejectSellerAction(sellerId: string, reason: string) {
  try {
    const validId = uuidSchema.parse(sellerId);
    const { reason: validReason } = rejectSellerSchema.parse({ reason });
    const user = await requireAdminPermission("manage_sellers");
    const ip = await getClientIp();
    await rejectSeller(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function suspendSellerAction(sellerId: string, reason: string) {
  try {
    const validId = uuidSchema.parse(sellerId);
    const { reason: validReason } = suspendSellerSchema.parse({ reason });
    const user = await requireAdminPermission("manage_sellers");
    const ip = await getClientIp();
    await suspendSeller(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function unsuspendSellerAction(sellerId: string, reason?: string) {
  try {
    const validId = uuidSchema.parse(sellerId);
    const parsed = unsuspendSellerSchema.parse({ reason });
    const user = await requireAdminPermission("manage_sellers");
    const ip = await getClientIp();
    await unsuspendSeller(validId, parsed.reason, user.id, user.role, ip);
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function setSellerCommissionAction(
  sellerId: string,
  commissionRateBps: number | null
) {
  try {
    const validId = uuidSchema.parse(sellerId);
    const parsed = setSellerCommissionSchema.parse({ commissionRateBps });
    const user = await requireAdminPermission("manage_sellers");
    const ip = await getClientIp();
    await setSellerCommission(validId, parsed.commissionRateBps, user.id, user.role, ip);
    revalidatePath("/admin/sellers");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Bank Change Request Actions
// ----------------------------------------------------------------------

export async function approveBankChangeAction(
  requestId: string,
  note?: string
) {
  try {
    const validId = uuidSchema.parse(requestId);
    const validNote = note ? z.string().trim().max(500).parse(note) : undefined;
    const user = await requireAdminPermission("manage_finance");
    const ip = await getClientIp();
    await approveBankChangeRequest(validId, user.id, user.role, ip, validNote);
    revalidatePath("/admin/bank-requests");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function rejectBankChangeAction(
  requestId: string,
  reason: string
) {
  try {
    const validId = uuidSchema.parse(requestId);
    const validReason = z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500)
      .parse(reason);
    const user = await requireAdminPermission("manage_finance");
    const ip = await getClientIp();
    await rejectBankChangeRequest(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/bank-requests");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Bank Transfer Payment Proof Actions
// ----------------------------------------------------------------------

export async function approveBankTransferProofAction(
  proofId: string,
  note?: string
) {
  try {
    const validId = uuidSchema.parse(proofId);
    const validNote = note ? z.string().trim().max(500).parse(note) : undefined;
    const user = await requireAdminPermission("manage_finance");
    const ip = await getClientIp();
    const result = await approveBankTransferProof({
      proofId: validId,
      adminId: user.id,
      adminRole: user.role,
      ipAddress: ip,
      note: validNote,
    });
    revalidatePath("/admin/bank-transfers");
    revalidatePath("/admin/orders");
    return { success: true, orderId: result.orderId, orderNumber: result.orderNumber };
  } catch (err) {
    formatError(err);
  }
}

export async function rejectBankTransferProofAction(
  proofId: string,
  reason: string
) {
  try {
    const validId = uuidSchema.parse(proofId);
    const validReason = z
      .string()
      .trim()
      .min(5, "Rejection reason must be at least 5 characters")
      .max(500)
      .parse(reason);
    const user = await requireAdminPermission("manage_finance");
    const ip = await getClientIp();
    const result = await rejectBankTransferProof({
      proofId: validId,
      reason: validReason,
      adminId: user.id,
      adminRole: user.role,
      ipAddress: ip,
    });
    revalidatePath("/admin/bank-transfers");
    revalidatePath("/admin/orders");
    return { success: true, orderId: result.orderId, orderNumber: result.orderNumber };
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Product Moderation Actions
// ----------------------------------------------------------------------

export async function approveProductAction(productId: string) {
  try {
    const validId = uuidSchema.parse(productId);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    await approveProduct(validId, user.id, user.role, ip);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function rejectProductAction(productId: string, reason: string) {
  try {
    const validId = uuidSchema.parse(productId);
    const { reason: validReason } = rejectProductSchema.parse({ reason });
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    await rejectProduct(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

export async function takeDownProductAction(productId: string, reason: string) {
  try {
    const validId = uuidSchema.parse(productId);
    const { reason: validReason } = takeDownProductSchema.parse({ reason });
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    await takeDownProduct(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/products");
    revalidatePath("/");
    return { success: true };
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Catalog Actions
// ----------------------------------------------------------------------

const categoryInputSchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(100),
  slug: z.string().trim().min(2, "Category slug must be at least 2 characters").max(100),
  parentId: z
    .string()
    .uuid("Invalid parent category ID")
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  commissionRateBps: z.number().int().min(0).max(10000).nullable().optional(),
  sortOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function createCategoryAction(input: z.infer<typeof categoryInputSchema>) {
  try {
    const parsed = categoryInputSchema.parse(input);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await createAdminCategory(
      {
        name: parsed.name,
        slug: parsed.slug,
        parentId: parsed.parentId ?? null,
        commissionRateBps: parsed.commissionRateBps ?? null,
        sortOrder: parsed.sortOrder ?? 0,
        isActive: parsed.isActive ?? true,
      },
      user.id,
      user.role,
      ip
    );
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function updateCategoryAction(
  categoryId: string,
  input: Partial<z.infer<typeof categoryInputSchema>>
) {
  try {
    const validId = uuidSchema.parse(categoryId);
    const parsed = categoryInputSchema.partial().parse(input);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await updateAdminCategory(validId, parsed, user.id, user.role, ip);
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

const brandInputSchema = z.object({
  name: z.string().trim().min(2, "Brand name must be at least 2 characters").max(100),
  slug: z.string().trim().min(2, "Brand slug must be at least 2 characters").max(100),
  logo: z
    .string()
    .trim()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
});

export async function createBrandAction(input: z.infer<typeof brandInputSchema>) {
  try {
    const parsed = brandInputSchema.parse(input);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await createAdminBrand(
      {
        name: parsed.name,
        slug: parsed.slug,
        logo: parsed.logo ?? null,
      },
      user.id,
      user.role,
      ip
    );
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function deleteBrandAction(brandId: string) {
  try {
    const validId = uuidSchema.parse(brandId);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await deleteAdminBrand(validId, user.id, user.role, ip);
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

const synonymInputSchema = z.object({
  term: z.string().trim().min(2, "Search term must be at least 2 characters").max(100),
  mapsTo: z.string().trim().min(2, "Target term must be at least 2 characters").max(100),
});

export async function createSynonymAction(input: z.infer<typeof synonymInputSchema>) {
  try {
    const parsed = synonymInputSchema.parse(input);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await createAdminSynonym(parsed, user.id, user.role, ip);
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function deleteSynonymAction(synonymId: string) {
  try {
    const validId = uuidSchema.parse(synonymId);
    const user = await requireAdminPermission("manage_catalog");
    const ip = await getClientIp();
    const res = await deleteAdminSynonym(validId, user.id, user.role, ip);
    revalidatePath("/admin/catalog");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Order Actions
// ----------------------------------------------------------------------

export async function forceSubOrderStatusAction(
  subOrderId: string,
  newStatus: SubOrderStatus,
  note: string
) {
  try {
    const validId = uuidSchema.parse(subOrderId);
    const parsed = adminOrderStatusChangeSchema.parse({ newStatus, note });
    const user = await requireAdminPermission("manage_orders");
    const ip = await getClientIp();
    const res = await adminForceSubOrderStatus(
      validId,
      parsed.newStatus,
      parsed.note,
      user.id,
      user.role,
      ip
    );
    revalidatePath("/admin/orders");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function adminCancelFullOrderAction(
  orderId: string,
  reason: string
) {
  try {
    const validId = uuidSchema.parse(orderId);
    const validReason = z.string().trim().min(5, "A reason of at least 5 characters is required").max(500).parse(reason);
    const user = await requireAdminPermission("manage_orders");
    const ip = await getClientIp();
    const res = await adminCancelFullOrder(
      validId,
      validReason,
      user.id,
      user.role,
      ip
    );
    revalidatePath("/admin/orders");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Customer Actions
// ----------------------------------------------------------------------

export async function suspendCustomerAction(customerId: string, reason: string) {
  try {
    const validId = uuidSchema.parse(customerId);
    const validReason = z
      .string()
      .trim()
      .min(5, "Suspension reason must be at least 5 characters")
      .max(500)
      .parse(reason);
    const user = await requireAdminPermission("manage_users");
    const ip = await getClientIp();
    const res = await suspendCustomerProfile(validId, validReason, user.id, user.role, ip);
    revalidatePath("/admin/customers");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function unsuspendCustomerAction(customerId: string) {
  try {
    const validId = uuidSchema.parse(customerId);
    const user = await requireAdminPermission("manage_users");
    const ip = await getClientIp();
    const res = await unsuspendCustomerProfile(validId, user.id, user.role, ip);
    revalidatePath("/admin/customers");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Courier Actions
// ----------------------------------------------------------------------

const courierConfigSchema = z.object({
  isActive: z.boolean().optional(),
  supportsCod: z.boolean().optional(),
  rateCard: z
    .object({
      baseRateMinor: z.number().int().min(0).optional(),
      perKgMinor: z.number().int().min(0).optional(),
      expressRateMinor: z.number().int().min(0).optional(),
      fuelSurchargePercent: z.number().min(0).max(100).optional(),
    })
    .optional(),
});

export async function updateCourierConfigAction(
  courierCode: string,
  input: z.infer<typeof courierConfigSchema>
) {
  try {
    const validCode = z.string().trim().min(2, "Invalid courier code").max(50).parse(courierCode);
    const parsed = courierConfigSchema.parse(input);
    const user = await requireAdminPermission("manage_logistics");
    const ip = await getClientIp();
    const res = await updateCourierConfig(validCode, parsed, user.id, user.role, ip);
    revalidatePath("/admin/couriers");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Marketing Actions
// ----------------------------------------------------------------------

const couponInputSchema = z.object({
  code: z.string().trim().min(3, "Coupon code must be at least 3 characters").max(30),
  discountType: z.enum(["percent", "fixed"]),
  discountValue: z.number().int().min(1, "Discount value must be at least 1"),
  minOrderAmountMinor: z.number().int().min(0).optional(),
  maxDiscountMinor: z.number().int().min(0).nullable().optional(),
  startDate: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  endDate: z
    .string()
    .nullable()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? null : v))
    .optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
});

export async function createCouponAction(input: {
  code: string;
  discountType: Database["public"]["Enums"]["coupon_discount_type"];
  discountValue: number;
  minOrderAmountMinor?: number;
  maxDiscountMinor?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  usageLimit?: number | null;
  isActive?: boolean;
}) {
  try {
    const parsed = couponInputSchema.parse(input);
    const user = await requireAdminPermission("manage_promotions");
    const ip = await getClientIp();
    const res = await createAdminCoupon(
      {
        ...parsed,
        discountType: parsed.discountType as Database["public"]["Enums"]["coupon_discount_type"],
      },
      user.id,
      user.role,
      ip
    );
    revalidatePath("/admin/marketing");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function toggleCouponActiveAction(couponId: string, isActive: boolean) {
  try {
    const validId = uuidSchema.parse(couponId);
    const validActive = z.boolean().parse(isActive);
    const user = await requireAdminPermission("manage_promotions");
    const ip = await getClientIp();
    const res = await toggleCouponActive(validId, validActive, user.id, user.role, ip);
    revalidatePath("/admin/marketing");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Setting Actions
// ----------------------------------------------------------------------

export async function updateSettingAction(
  key: string,
  input: {
    value?: unknown;
    isPublic?: boolean;
  }
) {
  try {
    const validKey = z.string().trim().min(1, "Setting key is required").max(100).parse(key);
    const user = await requireAdminPermission("manage_settings");
    const ip = await getClientIp();
    const res = await updateAdminSetting(validKey, input, user.id, user.role, ip);
    revalidatePath("/admin/settings");
    return res;
  } catch (err) {
    formatError(err);
  }
}

// ----------------------------------------------------------------------
// Staff Actions (Strictly Superadmin Only)
// ----------------------------------------------------------------------

export async function updateStaffPermissionsAction(
  targetProfileId: string,
  permissions: AdminPermission[]
) {
  try {
    const validId = uuidSchema.parse(targetProfileId);
    const validPerms = z.array(adminPermissionSchema).parse(permissions);
    const user = await requireAdminPermission("manage_users");
    if (user.role !== "superadmin") {
      throw new Error("Forbidden: Only superadmin can modify staff permissions");
    }
    const ip = await getClientIp();
    const res = await updateStaffPermissions(validId, validPerms, user.id, user.role, ip);
    revalidatePath("/admin/staff");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function promoteStaffAction(targetEmail: string) {
  try {
    const validEmail = z.string().email("Valid email required").parse(targetEmail);
    const user = await requireAdminPermission("manage_users");
    if (user.role !== "superadmin") {
      throw new Error("Forbidden: Only superadmin can promote staff");
    }
    const ip = await getClientIp();
    const res = await promoteToAdminStaff(validEmail, user.id, user.role, ip);
    revalidatePath("/admin/staff");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function approveReturnAction(
  returnId: string,
  input?: ApproveReturnInput
) {
  try {
    const validId = uuidSchema.parse(returnId);
    const validData = approveReturnSchema.parse(input ?? {});
    const user = await requireAdminPermission("manage_orders");
    if (user.role !== "superadmin" && user.role !== "admin_staff") {
      throw new Error("Unauthorized");
    }
    const ip = await getClientIp();
    const res = await approveReturnAndRefund({
      returnId: validId,
      actorId: user.id,
      actorRole: user.role,
      ipAddress: ip,
      note: validData.note,
      customerPayoutDetails: validData.customerPayoutDetails,
    });
    revalidatePath("/admin/orders");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function rejectReturnAction(
  returnId: string,
  input: RejectReturnInput
) {
  try {
    const validId = uuidSchema.parse(returnId);
    const validData = rejectReturnSchema.parse(input);
    const user = await requireAdminPermission("manage_orders");
    if (user.role !== "superadmin" && user.role !== "admin_staff") {
      throw new Error("Unauthorized");
    }
    const ip = await getClientIp();
    const res = await rejectReturn({
      returnId: validId,
      actorId: user.id,
      actorRole: user.role,
      ipAddress: ip,
      reason: validData.reason,
    });
    revalidatePath("/admin/orders");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function settleRefundDueAction(input: SettleRefundDueInput) {
  try {
    const validData = settleRefundDueSchema.parse(input);
    const user = await requireAdminPermission("manage_finance");
    if (user.role !== "superadmin" && user.role !== "admin_staff") {
      throw new Error("Unauthorized");
    }
    const ip = await getClientIp();
    const res = await settleRefundDue({
      paymentId: validData.paymentId,
      bankReference: validData.bankReference,
      actorId: user.id,
      actorRole: user.role,
      ipAddress: ip,
      note: validData.note,
    });
    revalidatePath("/admin/orders");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function approvePayoutAction(
  payoutId: string,
  input?: ApprovePayoutInput
) {
  try {
    const validId = uuidSchema.parse(payoutId);
    const validData = approvePayoutSchema.parse(input ?? {});
    const user = await requireAdminPermission("manage_finance");
    if (user.role !== "superadmin" && user.role !== "admin_staff") {
      throw new Error("Unauthorized");
    }
    const ip = await getClientIp();
    const res = await approveAdminPayout({
      payoutId: validId,
      adminId: user.id,
      adminRole: user.role,
      bankReference: validData.bankReference,
      ipAddress: ip,
    });
    revalidatePath("/admin/bank-requests");
    return res;
  } catch (err) {
    formatError(err);
  }
}

export async function rejectPayoutAction(
  payoutId: string,
  input: RejectPayoutInput
) {
  try {
    const validId = uuidSchema.parse(payoutId);
    const validData = rejectPayoutSchema.parse(input);
    const user = await requireAdminPermission("manage_finance");
    if (user.role !== "superadmin" && user.role !== "admin_staff") {
      throw new Error("Unauthorized");
    }
    const ip = await getClientIp();
    const res = await rejectAdminPayout({
      payoutId: validId,
      adminId: user.id,
      adminRole: user.role,
      reason: validData.reason,
      ipAddress: ip,
    });
    revalidatePath("/admin/bank-requests");
    return res;
  } catch (err) {
    formatError(err);
  }
}
