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
- **GET** `/api/v1/customers/addresses`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK` Returns array of customer addresses.
- **POST** `/api/v1/customers/addresses`
  - **Auth:** Required (`Bearer <token>`)
  - **Body:** `{ "fullName": "...", "phone": "...", ... }`
  - **Response:** `200 OK` Returns created address.
- **PATCH** `/api/v1/customers/addresses/:id`
  - **Auth:** Required (`Bearer <token>`)
  - **Body:** Partial address fields.
  - **Response:** `200 OK`
- **DELETE** `/api/v1/customers/addresses/:id`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK`

### 2. Orders
- **GET** `/api/v1/customers/orders`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK` Returns list of orders and sub-orders.
- **GET** `/api/v1/customers/orders/:id`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK` Returns order details.
- **POST** `/api/v1/customers/orders/:id/cancel`
  - **Auth:** Required (`Bearer <token>`)
  - **Params:** `:id` is the SUB-ORDER id.
  - **Body:** `{ "reason": "..." }`
  - **Response:** `200 OK`
  - **Errors:** `400 Bad Request` if invalid UUID, or order is shipped/delivered. `401 Unauthorized`.
- **POST** `/api/v1/customers/orders/:id/return`
  - **Auth:** Required (`Bearer <token>`)
  - **Params:** `:id` is the SUB-ORDER id.
  - **Body:** `multipart/form-data` with `orderItemId` (uuid), `reason` (string), `quantity` (number), and `evidenceFiles` (multiple file inputs).
  - **Response:** `200 OK`
  - **Errors:** `400 Bad Request` if invalid UUID, not delivered, past return window, or already requested. `401 Unauthorized`.
- **POST** `/api/v1/customers/guest-order`
  - **Auth:** None
  - **Body:** `{ "orderNumber": "...", "email": "..." }`
  - **Response:** `200 OK` Returns order details for guests.

### 3. Wishlist
- **GET** `/api/v1/customers/wishlist`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK` Returns wishlist items.
- **POST** `/api/v1/customers/wishlist`
  - **Auth:** Required (`Bearer <token>`)
  - **Body:** `{ "variantId": "uuid" }`
  - **Response:** `200 OK`
- **DELETE** `/api/v1/customers/wishlist/:variantId`
  - **Auth:** Required (`Bearer <token>`)
  - **Response:** `200 OK`

### 4. Reviews
- **POST** `/api/v1/customers/reviews`
  - **Auth:** Required (`Bearer <token>`)
  - **Body:** `{ "productId": "uuid", "orderItemId": "uuid", "rating": 5, "title": "...", "body": "..." }`
  - **Response:** `200 OK`

### 5. Account Deletion
- **POST** `/api/v1/customers/account-deletion`
  - **Auth:** Required (`Bearer <token>`)
  - **Body:** `{ "reason": "..." }` (Optional)
  - **Response:** `200 OK`

