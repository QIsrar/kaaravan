# API Documentation

## Introduction

This document outlines the REST API endpoints available under `/api/v1/` for mobile apps and third-party integrations.

### Authentication
- Most endpoints require authentication using a Supabase access token.
- Pass the token in the `Authorization` header: `Authorization: Bearer <supabase access token>`.

### Guest Carts
- For guest interactions (like carts before login), you must provide a guest token.
- Pass the guest token in the `X-Guest-Token` header.
- On web clients, this is automatically handled via an `httpOnly` cookie (`guest_token`).
- On mobile/API clients, if no token is sent, a new one is returned in the `X-Guest-Token` response header.

---

## Cart Endpoints (Phase 4)

### 1. Get Cart
- **Method:** `GET`
- **Path:** `/api/v1/cart`
- **Auth:** Optional (`Authorization: Bearer <token>` OR `X-Guest-Token: <uuid>`)
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "cartId": "uuid",
      "sellerGroups": [
        {
          "sellerId": "uuid",
          "sellerName": "Multan Kashikari & Crafts",
          "sellerSlug": "multan-kashikari",
          "items": [
            {
              "cartItemId": "uuid",
              "variantId": "uuid",
              "productId": "uuid",
              "productTitle": "Multani Handcrafted Blue Pottery Vase",
              "productSlug": "multani-handcrafted-blue-pottery-vase",
              "sku": "MK-VASE-10-COBALT",
              "attributes": { "color": "Cobalt Blue" },
              "priceMinor": 345000,
              "compareAtMinor": 420000,
              "image": "/placeholder-product.svg",
              "quantity": 2,
              "stockAvailable": 18,
              "isAvailable": true,
              "subtotalMinor": 690000
            }
          ],
          "subtotalMinor": 690000,
          "estimatedShippingMinor": 25000
        }
      ],
      "totalItems": 2,
      "subtotalMinor": 690000,
      "shippingMinor": 25000,
      "grandTotalMinor": 715000,
      "currency": "PKR"
    }
  }
  ```
- **Errors:** `400 Bad Request`

### 2. Add Item to Cart
- **Method:** `POST`
- **Path:** `/api/v1/cart`
- **Auth:** Optional (`Authorization: Bearer <token>` OR `X-Guest-Token: <uuid>`)
- **Request Body:**
  ```json
  {
    "variantId": "f1000000-0000-0001-0000-000000000001",
    "quantity": 1
  }
  ```
- **Response:** `200 OK` (returns updated `CartDetails`)
- **Errors:**
  - `400 Bad Request`: If variant ID is invalid or requested quantity exceeds available stock.

### 3. Update Item Quantity
- **Method:** `PATCH`
- **Path:** `/api/v1/cart`
- **Auth:** Optional (`Authorization: Bearer <token>` OR `X-Guest-Token: <uuid>`)
- **Request Body:**
  ```json
  {
    "variantId": "f1000000-0000-0001-0000-000000000001",
    "quantity": 3
  }
  ```
- **Response:** `200 OK` (returns updated `CartDetails`)
- **Errors:**
  - `400 Bad Request`: Validation failure.
  - `404 Not Found`: No active cart session.

### 4. Remove Item or Clear Cart
- **Method:** `DELETE`
- **Path:** `/api/v1/cart` (or `/api/v1/cart?variantId=<uuid>` to delete single item)
- **Auth:** Optional (`Authorization: Bearer <token>` OR `X-Guest-Token: <uuid>`)
- **Response:** `200 OK`
- **Errors:** `404 Not Found`

### 5. Merge Guest Cart into User Account
- **Method:** `POST`
- **Path:** `/api/v1/cart/merge`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "guestToken": "your-guest-token-uuid"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "mergedCount": 2,
    "skippedCount": 0,
    "data": { /* CartDetails */ }
  }
  ```
- **Errors:**
  - `401 Unauthorized`: User is not authenticated.
  - `400 Bad Request`: Invalid token.

---

## Checkout Endpoints (Phase 4)

### 1. Submit Checkout
- **Method:** `POST`
- **Path:** `/api/v1/checkout`
- **Auth:** Optional (`Authorization: Bearer <token>` OR `X-Guest-Token: <uuid>`)
- **Request Body:**
  ```json
  {
    "shippingAddress": {
      "fullName": "Asad Ullah Khan",
      "phone": "03001234567",
      "province": "Punjab",
      "city": "Lahore",
      "area": "Gulberg III",
      "street": "House 14-B, Street 9",
      "postalCode": "54000"
    },
    "billingAddressSameAsShipping": true,
    "paymentMethod": "cod",
    "orderNotes": "Leave with the guard if unavailable."
  }
  ```
  `shippingAddress.city` must belong to `shippingAddress.province` (see `CITIES_BY_PROVINCE` in `lib/validators/checkout.ts`).
- **Response:** `200 OK`
  - Phase 4: order creation is not yet active. The response is `{ "success": true, "phase8Notice": true, "message": "Phase 8: ..." }` instead of an error, so clients can show a friendly "ordering opens soon" notice rather than treating this as a failure.
  - Phase 8+: `{ "success": true, "message": "Order placed successfully!" }`.
- **Errors:**
  - `400 Bad Request`: Validation failure, or an empty cart.
  - `404 Not Found`: No active cart session (guest token or auth required).
  - `401 Unauthorized`: Invalid or expired bearer token.

---

## Search Endpoints (Phase 4)

### 1. Search Suggestions (autocomplete)
- **Method:** `GET`
- **Path:** `/api/v1/search?q=<term>`
- **Auth:** None (public catalog read, RLS-protected)
- **Query Params:**
  - `q`: search term. Trimmed and capped at 100 characters (Zod, `lib/validators/search.ts`). Terms shorter than 2 characters (after trimming) return an empty `suggestions` array **without querying the database**.
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "query": "chapal",
      "suggestions": [
        {
          "id": "uuid",
          "title": "Peshawari Chappal - Traditional Leather Kaptaan Edition",
          "slug": "peshawari-chappal-traditional-leather-kaptaan-edition",
          "image": "/demo/prod-1.svg",
          "priceMinor": 345000
        }
      ]
    }
  }
  ```
  Ranked via the `search_products()` Postgres function: full-text search (`websearch_to_tsquery`) plus `pg_trgm` word-similarity typo tolerance, active products of approved sellers only. Used by the storefront header's live autocomplete (debounced ~250ms) and the `/search` results page (via `lib/services/search.ts`, not this route, since the results page runs server-side).
- **Errors:** `400 Bad Request`

---

## Customer Accounts (Phase 5)

### 1. Addresses

#### List Customer Addresses
- **Method:** `GET`
- **Path:** `/api/v1/customers/addresses`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "profile_id": "uuid",
        "label": "Home",
        "full_name": "Tariq Mahmood",
        "phone": "03001234567",
        "province": "Punjab",
        "city": "Lahore",
        "area": "Gulberg III",
        "street": "14 Main Boulevard",
        "postal_code": "54000",
        "is_default": true,
        "created_at": "2026-09-30T10:00:00Z",
        "updated_at": "2026-09-30T10:00:00Z"
      }
    ]
  }
  ```
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Create Address
- **Method:** `POST`
- **Path:** `/api/v1/customers/addresses`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** (Validated with `createAddressSchema`, unknown keys stripped)
  ```json
  {
    "full_name": "Tariq Mahmood",
    "phone": "03001234567",
    "province": "Punjab",
    "city": "Lahore",
    "area": "Gulberg III",
    "street": "14 Main Boulevard",
    "postal_code": "54000",
    "is_default": true,
    "label": "Home"
  }
  ```
- **Response:** `201 Created` / `200 OK`
  ```json
  {
    "success": true,
    "data": { /* Created AddressRow */ }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure (e.g. invalid Pakistani phone, invalid city/province).
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Update Address
- **Method:** `PATCH`
- **Path:** `/api/v1/customers/addresses/:id`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** (Validated with `updateAddressSchema`, unknown keys stripped)
  ```json
  {
    "street": "Updated Street 15",
    "is_default": true
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": { /* Updated AddressRow */ }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure.
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `404 Not Found`: Address not found or does not belong to caller.

#### Delete Address
- **Method:** `DELETE`
- **Path:** `/api/v1/customers/addresses/:id`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Address deleted successfully"
  }
  ```
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `404 Not Found`: Address not found.

---

### 2. Orders & Order Tracking

#### List Customer Orders
- **Method:** `GET`
- **Path:** `/api/v1/customers/orders`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "order_number": "ORD-DEMO-001",
        "subtotal_minor": 690000,
        "shipping_minor": 25000,
        "total_minor": 715000,
        "currency": "PKR",
        "payment_method": "cod",
        "payment_status": "pending",
        "placed_at": "2026-09-30T10:00:00Z",
        "sub_orders": [
          {
            "id": "uuid",
            "seller_id": "uuid",
            "status": "pending",
            "subtotal_minor": 690000,
            "shipping_minor": 25000,
            "total_minor": 715000,
            "sellers": {
              "business_name": "Multan Kashikari & Crafts",
              "logo": "/demo/seller-kashikari.svg"
            },
            "order_items": [
              {
                "id": "uuid",
                "variant_id": "uuid",
                "product_title": "Chinioti Hand-Carved Sheesham Wood Serving Tray Set",
                "quantity": 1,
                "unit_price_minor": 690000,
                "line_total_minor": 690000
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Get Order Details
- **Method:** `GET`
- **Path:** `/api/v1/customers/orders/:id`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** None
- **Response:** `200 OK` (Returns full order details with sub_orders, order_status_history, returns, shipping/billing address, and seller return windows).
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `404 Not Found`: Order not found or does not belong to caller.

#### Cancel Sub-Order
- **Method:** `POST`
- **Path:** `/api/v1/customers/orders/:id/cancel`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Params:** `:id` is the sub-order UUID.
- **Request Body:**
  ```json
  {
    "reason": "Item ordered by mistake, requested immediate cancellation."
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Sub-order cancelled successfully"
  }
  ```
- **Errors:**
  - `400 Bad Request`: Sub-order is not in `awaiting_confirmation` or `pending` status, or cancellation reason is less than 10 characters.
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `404 Not Found`: Sub-order not found or not owned by user.

#### Request Item Return
- **Method:** `POST`
- **Path:** `/api/v1/customers/orders/:id/return`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Params:** `:id` is the sub-order UUID.
- **Request Body:** `multipart/form-data`
  - `orderItemId`: UUID of the order item being returned.
  - `reason`: String (10 to 500 characters).
  - `quantity`: Positive integer.
  - `evidenceFiles`: Optional files (JPG, PNG, WebP, PDF; up to 5 MB per file).
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "pending",
      "refund_minor": 690000,
      "evidence_paths": ["returns/.../evidence.webp"]
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Order is not delivered, return window expired, duplicate return request already active, or file exceeds size/type restrictions.
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Public Order Journey Lookup (Guest Tracking)
- **Method:** `POST`
- **Path:** `/api/v1/customers/guest-order`
- **Auth:** None (Public tracking endpoint)
- **Request Body:**
  ```json
  {
    "orderNumber": "ORD-DEMO-001",
    "email": "customer1@demo.kaaravan.pk"
  }
  ```
- **Response:** `200 OK` (Strict privacy-safe reduced payload; internal IDs, addresses, phones, emails, and financial totals are never returned)
  ```json
  {
    "success": true,
    "data": {
      "order_number": "ORD-DEMO-001",
      "placed_at": "2026-09-30T10:00:00Z",
      "sub_orders": [
        {
          "seller_business_name": "Multan Kashikari & Crafts",
          "status": "pending",
          "order_status_history": [
            {
              "to_status": "pending",
              "created_at": "2026-09-30T10:00:00Z"
            }
          ],
          "items": [
            {
              "product_title": "Chinioti Hand-Carved Sheesham Wood Serving Tray Set",
              "quantity": 1
            }
          ]
        }
      ]
    }
  }
  ```
- **Errors:**
  - `404 Not Found`: `{ "success": false, "error": "Order not found" }` (Generic message returned for all failure cases to prevent account enumeration).

---

### 3. Wishlist

#### Get Wishlist
- **Method:** `GET`
- **Path:** `/api/v1/customers/wishlist`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** None
- **Response:** `200 OK` Returns list of wishlisted items with product details and images.
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Add to Wishlist
- **Method:** `POST`
- **Path:** `/api/v1/customers/wishlist`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "variantId": "f1000000-0000-0001-0000-000000000001"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Errors:**
  - `400 Bad Request`: Seller attempting to wishlist own product (`"You can't buy your own products"`).
  - `401 Unauthorized`: Missing or invalid bearer token.

#### Remove from Wishlist
- **Method:** `DELETE`
- **Path:** `/api/v1/customers/wishlist/:variantId`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Response:** `200 OK`
- **Errors:**
  - `401 Unauthorized`: Missing or invalid bearer token.

---

### 4. Reviews

#### Create Product Review
- **Method:** `POST`
- **Path:** `/api/v1/customers/reviews`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** (Validated with `createReviewSchema`, unknown fields stripped)
  ```json
  {
    "product_id": "c1000000-0000-0000-0000-000000000001",
    "order_item_id": "71000000-0000-0000-0000-000000000001",
    "rating": 5,
    "title": "Magnificent craft quality",
    "body": "The blue pottery finish and ceramic glazing were authentic and stunning."
  }
  ```
  *Note:* Review status is enforced server-side as `pending` for moderation. Client submissions of `status`, `id`, `profile_id`, or `created_at` are rejected or stripped.
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid",
      "status": "pending",
      "rating": 5,
      "created_at": "2026-09-30T10:00:00Z"
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure, or seller attempting to review their own product (`"You can't review your own products"`).
  - `401 Unauthorized`: Missing or invalid bearer token.

---

### 5. Account Deletion

#### Request Account Deletion
- **Method:** `POST`
- **Path:** `/api/v1/customers/account-deletion`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "reason": "Closing my account"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Account deletion request recorded"
  }
  ```
- **Errors:**
---

## Seller Portal (Phase 6)

### 1. Seller Onboarding
- **Method:** `POST`
- **Path:** `/api/v1/sellers/onboarding`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "businessName": "Lahore Artisans",
    "businessType": "individual",
    "cnicNumber": "35202-1234567-1",
    "bankName": "Meezan Bank",
    "accountTitle": "Asad Ullah",
    "iban": "PK12MEZN0000000123456789",
    "fullName": "Asad Ullah",
    "phone": "03001234567",
    "province": "Punjab",
    "city": "Lahore",
    "area": "Gulberg",
    "street": "123 Main St",
    "agreementAccepted": true
  }
  ```
- **Response:** `201 Created`
  ```json
  {
    "data": {
      "sellerId": "uuid"
    }
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure or existing application.
  - `401 Unauthorized`: Missing or invalid bearer token.

### 2. Upload Seller Document
- **Method:** `POST`
- **Path:** `/api/v1/sellers/documents`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** `multipart/form-data`
  - `sellerId`: UUID of the seller application
  - `docType`: String identifying the document type
  - `file`: File object (jpg/png/webp/pdf, max 5MB)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "filePath": "seller-documents/<seller_id>/<doc_type>/<random-uuid>.jpg"
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure, missing fields, invalid size or type.
  - `401 Unauthorized`: Missing or invalid bearer token.

### 3. Create/Update Product
- **Method:** `POST` (create) or `PATCH` (update)
- **Path:** `/api/v1/sellers/products` or `/api/v1/sellers/products/:id`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "title": "Premium Lawn Suit",
    "description": "High quality fabric",
    "category_id": "uuid",
    "status": "draft",
    "variants": [
      {
        "sku": "LAWN-01-RED",
        "price_rupees": "4500",
        "compare_at_rupees": "5000",
        "stock_quantity": 100,
        "low_stock_threshold": 10,
        "attributes": { "Color": "Red", "Size": "M" },
        "is_active": true
      }
    ]
  }
  ```
- **Response:** `200 OK` (returns `{ success: true, data: { productId: "uuid" } }`)

### 4. Upload Product Image
- **Method:** `POST`
- **Path:** `/api/v1/sellers/products/:id/images`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:** `multipart/form-data`
  - `file`: File object (must be WebP, max 5MB)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": { "image_path": "product-images/..." }
  }
  ```

### 5. Update Variant Stock
- **Method:** `PATCH`
- **Path:** `/api/v1/sellers/variants/:id/stock`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "stock_quantity": 50
  }
  ```
- **Response:** `200 OK`

### 6. Reorder Product Images
- **Method:** `PATCH`
- **Path:** `/api/v1/sellers/products/:id/images/order`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "orderedImageIds": [
      "e1000000-0000-0000-0000-000000000002",
      "e1000000-0000-0000-0000-000000000001"
    ]
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Errors:**
  - `400 Bad Request`: Validation failure or image not belonging to product.
  - `401 Unauthorized`: Missing or invalid bearer token.
  - `403 Forbidden`: Seller not approved.

### 7. Seller Settings
- **Method:** GET or PATCH
- **Path:** `/api/v1/sellers/settings`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **GET Response:** Returns the seller profile (business details, default address) and bank settings with masked IBAN.
- **PATCH Body:** Update settings, logo, or pickup address.

### 8. Seller Orders
- **Method:** GET
- **Path:** `/api/v1/sellers/orders` or `/api/v1/sellers/orders/:id`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Description:** Retrieve sub-orders assigned to the seller.

### 9. Update Sub-Order Status
- **Method:** PATCH
- **Path:** `/api/v1/sellers/orders/:id/status`
- **Auth:** Required (`Authorization: Bearer <token>`)
- **Request Body:**
  ```json
  {
    "status": "packed",
    "reason": "Optional reason"
  }
  ```
- **Description:** Move order forward (e.g. pending -> confirmed -> packed -> ready_to_ship) or cancel before shipping.

---

## Admin Operations (Phase 7 Part 1)

All endpoints under `/api/v1/admin/*` require administrative privileges (`superadmin` or `admin_staff` holding the declared permission). Suspended user accounts are rejected with `403 Forbidden`.

### 1. Sellers Management (`manage_sellers`)

#### Approve Seller Application
- **Method:** `POST`
- **Path:** `/api/v1/admin/sellers/:id/approve`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Request Body:** None
- **Response:** `200 OK`
  ```json
  { "success": true, "message": "Seller approved successfully" }
  ```
- **Errors:** `401 Unauthorized`, `403 Forbidden`, `400 Bad Request`

#### Reject Seller Application
- **Method:** `POST`
- **Path:** `/api/v1/admin/sellers/:id/reject`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Request Body:**
  ```json
  { "reason": "CNIC document blurred, please re-upload clear photos." }
  ```
- **Response:** `200 OK`
  ```json
  { "success": true, "message": "Seller rejected successfully" }
  ```

#### Suspend Seller
- **Method:** `POST`
- **Path:** `/api/v1/admin/sellers/:id/suspend`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Request Body:**
  ```json
  { "reason": "Multiple policy violations regarding counterfeit items." }
  ```
- **Response:** `200 OK`

#### Unsuspend Seller
- **Method:** `POST`
- **Path:** `/api/v1/admin/sellers/:id/unsuspend`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Request Body:** Optional `{ "reason": "Reinstated after review" }`
- **Response:** `200 OK`

#### Update Seller Commission Rate
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/sellers/:id/commission`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Request Body:**
  ```json
  { "commissionRateBps": 850 }
  ```
- **Response:** `200 OK`

#### View KYC Document (Signed URL)
- **Method:** `GET`
- **Path:** `/api/v1/admin/sellers/:id/kyc-document?filePath=<path>`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_sellers` or `superadmin`)
- **Response:** `200 OK`
  ```json
  { "success": true, "signedUrl": "https://...", "expiresInSeconds": 300 }
  ```

---

### 2. Bank Details Change Requests (`manage_finance`)

#### List Bank Requests
- **Method:** `GET`
- **Path:** `/api/v1/admin/bank-requests?status=pending`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_finance` or `superadmin`)
- **Response:** `200 OK`
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "seller_id": "uuid",
        "bank_name": "Meezan Bank",
        "account_title": "Tariq Mahmood",
        "ibanMasked": "****6789",
        "status": "pending",
        "created_at": "2026-11-08T12:00:00Z",
        "sellers": { "business_name": "Lahore Crafts", "slug": "lahore-crafts" }
      }
    ]
  }
  ```

#### Approve Bank Request
- **Method:** `POST`
- **Path:** `/api/v1/admin/bank-requests/:id/approve`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_finance` or `superadmin`)
- **Request Body:** Optional `{ "note": "Verified with official cheque leaf" }`
- **Response:** `200 OK`

#### Reject Bank Request
- **Method:** `POST`
- **Path:** `/api/v1/admin/bank-requests/:id/reject`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_finance` or `superadmin`)
- **Request Body:** `{ "reason": "Title mismatch with CNIC" }`
- **Response:** `200 OK`

---

### 3. Product Catalog Moderation (`manage_catalog`)

#### Moderation Queue
- **Method:** `GET`
- **Path:** `/api/v1/admin/products?status=pending_review`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`)
- **Response:** `200 OK`

#### Approve Product
- **Method:** `POST`
- **Path:** `/api/v1/admin/products/:id/approve`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`)
- **Response:** `200 OK`

#### Reject Product
- **Method:** `POST`
- **Path:** `/api/v1/admin/products/:id/reject`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`)
- **Request Body:** `{ "reason": "Images do not meet white background guidelines." }`
- **Response:** `200 OK`

#### Take Down Product (Archive)
- **Method:** `POST`
- **Path:** `/api/v1/admin/products/:id/take-down`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`)
- **Request Body:** `{ "reason": "Copyright infringement claim received." }`
- **Response:** `200 OK`

---

### 4. Admin Orders Force Action (`manage_orders`)

#### Force Status Change & Force Cancellation
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/orders/:id/status`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_orders` or `superadmin`)
- **Request Body:**
  ```json
  {
    "newStatus": "cancelled",
    "note": "Customer requested cancellation directly via telephone emergency line after packing."
  }
  ```
- **Response:** `200 OK`

---

### 5. Banners & Content (`manage_content`)

#### List Banners
- **Method:** `GET`
- **Path:** `/api/v1/admin/banners`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_content` or `superadmin`)
- **Response:** `200 OK`

#### Upload Banner Image or Create Banner
- **Method:** `POST`
- **Path:** `/api/v1/admin/banners`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_content` or `superadmin`)
- **Multipart Upload Body:** `multipart/form-data` with `file`
  - Response: `{ "success": true, "imagePath": "banners/hero/uuid.webp" }`
- **JSON Create Body:**
  ```json
  {
    "titleEn": "Winter Shawls & Pashmina",
    "titleUr": "سردیوں کی شالیں اور پشمینہ",
    "subtitleEn": "Authentic Himalayan wool woven by northern masters",
    "subtitleUr": "شمالی کاریگروں کا بونا ہوا خالص ہمالیائی اون",
    "tagEn": "Northern Heritage",
    "tagUr": "شمالی ورثہ",
    "imageUrl": "banners/hero/uuid.webp",
    "linkUrl": "/category/shawls",
    "sortOrder": 1,
    "isActive": true
  }
  ```
- **Response:** `201 Created`

#### Update / Delete Banner
- **Method:** `PATCH` or `DELETE`
- **Path:** `/api/v1/admin/banners/:id`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_content` or `superadmin`, MFA `aal2`)

---

### 6. Catalog Management (`manage_catalog`)

#### Create Category
- **Method:** `POST`
- **Path:** `/api/v1/admin/catalog/categories`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`, MFA `aal2`)
- **Request Body:**
  ```json
  {
    "name": "Handmade Leather Goods",
    "slug": "leather-goods",
    "parentId": null,
    "commissionRateBps": 800,
    "sortOrder": 1,
    "isActive": true
  }
  ```
- **Response:** `200 OK`

#### Update Category
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/catalog/categories/:id`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`, MFA `aal2`)

#### Create / Delete Brand
- **Method:** `POST` / `DELETE`
- **Path:** `/api/v1/admin/catalog/brands` / `/api/v1/admin/catalog/brands/:id`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`, MFA `aal2`)

#### Create / Delete Search Synonym
- **Method:** `POST` / `DELETE`
- **Path:** `/api/v1/admin/catalog/synonyms` / `/api/v1/admin/catalog/synonyms/:id`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_catalog` or `superadmin`, MFA `aal2`)

---

### 7. Logistics & Couriers (`manage_logistics`)

#### Update Courier Status / Flags
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/couriers/:id/status`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_logistics` or `superadmin`, MFA `aal2`)

#### Update Courier Rate Card
- **Method:** `PUT`
- **Path:** `/api/v1/admin/couriers/:id/rates`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_logistics` or `superadmin`, MFA `aal2`)

---

### 8. Promotions & Marketing (`manage_promotions`)

#### Create Coupon
- **Method:** `POST`
- **Path:** `/api/v1/admin/coupons`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_promotions` or `superadmin`, MFA `aal2`)

#### Toggle Coupon Status
- **Method:** `PATCH`
- **Path:** `/api/v1/admin/coupons/:id/status`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_promotions` or `superadmin`, MFA `aal2`)

---

### 9. Platform Settings (`manage_settings`)

#### Update Platform Setting
- **Method:** `PUT`
- **Path:** `/api/v1/admin/settings/:key`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_settings` or `superadmin`, MFA `aal2`)

---

### 10. Staff & Customer Management (`manage_users`)

#### Promote User to Admin Staff
- **Method:** `POST`
- **Path:** `/api/v1/admin/staff/promote`
- **Auth:** Required (`Authorization: Bearer <token>`, role `superadmin` ONLY, MFA `aal2`)

#### Update Staff Permissions
- **Method:** `PUT`
- **Path:** `/api/v1/admin/staff/:id/permissions`
- **Auth:** Required (`Authorization: Bearer <token>`, role `superadmin` ONLY, MFA `aal2`)

#### Suspend / Reactivate Customer Profile
- **Method:** `POST`
- **Path:** `/api/v1/admin/customers/:id/suspend` / `/api/v1/admin/customers/:id/unsuspend`
- **Auth:** Required (`Authorization: Bearer <token>`, permission `manage_users` or `superadmin`, MFA `aal2`)


