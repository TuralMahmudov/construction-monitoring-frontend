# CCMS Frontend — API Integration Prompt

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə (Lovable, v0, Cursor, VS Code agent və s.) verə bilərsiniz.
> Bu, backend-in **bütün** modulları üçün dəqiq, canlı test edilmiş request/response kontraktıdır — təxmin etməyə ehtiyac yoxdur, hər şey bu sənəddə var.

**Base URL (dev):** `http://localhost:8181`

## Table of contents

Aşağıda hər bölmə üçün: dəqiq HTTP method+path, permission, request/response JSON nümunələri, business qaydalar.

- **0.** Unified response envelope + shared `PageResponse<T>` shape (bütün endpoint-lər üçün ortaq)
- **1.** Auth — `/api/auth`
- **2.** Resource Categories — `/api/resource-categories`
- **3.** Resources — `/api/resources`
- **4.** Resource Attributes — `/api/resource-attributes`
- **5.** Units — `/api/units`
- **6.** Resource Prices — `/api/resource-prices`
- **7.** Regions — `/api/regions`
- **8.** Suppliers — `/api/suppliers`

---

## Task

Build the "Construction Cost Monitoring System" frontend, integrating with an existing Spring Boot backend running at `http://localhost:8181` (dev). All responses are wrapped in a unified envelope — handle that consistently everywhere.

## Unified response envelope

Every backend response (success or error) follows one of these two shapes:

**Success:**
```json
{
  "success": true,
  "message": "string",
  "data": { /* endpoint-specific payload, or omitted for void responses */ },
  "timestamp": "2026-07-17T15:06:03.178Z"
}
```

**Error:**
```json
{
  "timestamp": "2026-07-17T15:06:16.489Z",
  "status": 401,
  "error": "Unauthorized",
  "message": "Human-readable message",
  "path": "/api/auth/me",
  "validationErrors": { "password": "Password is required" }
}
```
`validationErrors` is only present on 400 validation failures (field name → message map); otherwise `null`/absent.

### Shared shape: `PageResponse<T>`

Every paginated list endpoint (search/list/history across ALL modules below) returns this exact shape as `data`:
```json
{
  "content": [ /* array of the module's response objects */ ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3,
  "last": false
}
```
Pagination/sorting query params are Spring Data defaults on every list endpoint: `page` (0-based, default 0), `size` (default 20), `sort` — **single combined param**, format `sort=fieldName,direction` (e.g. `sort=name,asc`, `sort=effectiveDate,desc`). There is no separate `sortBy`/`sortDirection` pair anywhere in this API. `sort` can be repeated for multi-field sort.

---

## 1. Auth — `/api/auth`

No permission required beyond authentication itself (no `COST_*` authority needed for any auth endpoint).

### 1.1 Login — `POST /api/auth/login`
No auth required.

Request:
```json
{ "username": "admin", "password": "Admin123!" }
```

Response `data`:
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "tokenType": "Bearer",
  "expiresIn": 900
}
```
`expiresIn` is seconds until the access token expires (900 = 15 min).

On failure: `401` with `message: "Invalid username or password"`.

### 1.2 Refresh — `POST /api/auth/refresh`
No auth header required — the refresh token itself is the credential, sent in the **body**.

Request:
```json
{ "refreshToken": "eyJ..." }
```

Response `data`: same shape as login (`accessToken`, `refreshToken`, `tokenType`, `expiresIn`).

**Important — token rotation:** every successful refresh issues a brand-new `refreshToken` and immediately invalidates the old one. The frontend must overwrite its stored refresh token with the new one on every refresh call. Reusing an old refresh token returns `401`.

### 1.3 Logout — `POST /api/auth/logout`
**Requires authentication.** Needs BOTH:
- Header: `Authorization: Bearer <accessToken>`
- Body: `{ "refreshToken": "<refreshToken>" }`

Calling this without the `Authorization` header returns `401` before the body is even processed — this is the most common integration mistake, do not skip the header.

Response: `{ "success": true, "message": "Logout successful", "timestamp": "..." }` (no `data`).

### 1.4 Current user — `GET /api/auth/me`
Requires `Authorization: Bearer <accessToken>` header.

Response `data`:
```json
{
  "id": "uuid",
  "username": "admin",
  "email": "admin@ccms.local",
  "firstName": "System",
  "lastName": "Administrator",
  "enabled": true,
  "roles": ["SUPER_ADMIN"]
}
```
`roles` is an array of role names (one of `SUPER_ADMIN`, `ADMIN`, `EXPERT`, `ANALYST`, `OPERATOR`, `VIEWER`). Use it for any client-side role-based UI gating.

### 1.5 Token transport rules

- Access token: **always** as `Authorization: Bearer <token>` header on every protected request. Never as a cookie, never as a query param, never under a custom header name.
- Refresh token: **only** in the request body of `/api/auth/refresh` and `/api/auth/logout`. Never sent as `Authorization`.
- No cookies are used anywhere in this API — it is fully stateless JWT, so token storage/refresh scheduling is entirely the frontend's responsibility (e.g. in memory + a secure storage mechanism of your choice, plus a proactive refresh timer before the 15-minute access token expiry, or a reactive 401-triggered refresh-and-retry interceptor).

### 1.6 Routing

- No backend-defined dashboard concept. After a successful login, redirect the user to `/dashboard`.
- Unauthenticated users hitting any protected client route should redirect to `/login`.
- On `401` from any API call (expired/invalid access token), attempt one silent `/api/auth/refresh` using the stored refresh token; if that also fails, clear session state and redirect to `/login`.

### 1.7 Example error responses to handle explicitly

- Wrong credentials on login → `401`, show inline form error, do not redirect.
- Expired/invalid/reused refresh token → `401` from `/api/auth/refresh` → force logout + redirect to `/login`.
- Validation error (e.g. empty password) on login → `400` with `validationErrors` → map each key to its form field.
- Calling `/api/auth/me` or `/api/auth/logout` with no/expired access token → `401`.

---

## 2. Resource Categories — `/api/resource-categories`

Hierarchical catalog (adjacency list via `parentId`) shared by materials, machinery, labor, transportation and services. All endpoints require `Authorization: Bearer <accessToken>`; mutating ones need permission `COST_WRITE`, read ones need `COST_READ`.

### `ResourceType` — the `type` field is an **integer**, not a string

This is the single most common integration mistake against this API. There is no lookup endpoint for it — these are the fixed codes, confirmed from source:

| code | meaning |
|---|---|
| 1 | MATERIAL |
| 2 | MACHINERY |
| 3 | LABOR |
| 4 | TRANSPORTATION |
| 5 | SERVICE |
| 6 | OTHER |

Sending a string like `"MATERIAL"` for `type` returns a `500` (unhandled type-coercion failure at the JSON deserialization layer, not a clean `400` — a known rough edge, see note at the end of this section). Always send the integer.

### 2.1 Create — `POST /` (`COST_WRITE`)

Request:
```json
{
  "parentId": null,
  "code": "MAT",
  "name": "Materials",
  "type": 1,
  "sortOrder": 0,
  "active": true
}
```
- `parentId`: `null` for a root category, or an existing category's `id` for a child.
- `type`: **required when `parentId` is null** (root categories define the type for their whole subtree) → `400` if missing on a root. **Ignored/overridden when `parentId` is set** — a child always inherits its parent's `type` server-side, regardless of what you send.
- `sortOrder`: optional, defaults to `0`.
- `active`: optional, defaults to `true`.

Response `data` (`ResourceCategoryResponse`):
```json
{
  "id": "uuid",
  "parentId": null,
  "code": "MAT",
  "name": "Materials",
  "type": 1,
  "level": 0,
  "sortOrder": 0,
  "leaf": true,
  "active": true,
  "createdBy": "uuid",
  "createdDate": "2026-07-21T09:19:40.595",
  "modifiedBy": "uuid",
  "modifiedDate": "2026-07-21T09:19:40.595"
}
```
`level` and `leaf` are **fully server-computed** — never send them, they are ignored on write:
- `level` = 0 for roots, parent's `level + 1` for children. Recalculated automatically for an entire subtree when a category is moved.
- `leaf` = `true` until the category gets its first child (flips to `false` automatically), and flips back to `true` if all its children are removed/moved away.

### 2.2 Update — `PUT /{id}` (`COST_WRITE`)

Request body accepts **only three fields** — this is intentional, not a bug:
```json
{ "code": "MAT", "name": "Materials", "sortOrder": 1 }
```
`parentId`, `type`, and `active` are **not accepted here** — trying to change them via this endpoint has no effect (they're simply absent from the request DTO, extra JSON fields are silently ignored). Use the dedicated endpoints below instead:
- Changing parent → `PATCH /{id}/move` (2.7)
- Enabling/disabling → `PATCH /{id}/enable` or `/disable` (2.8)
- `type` can never be changed via API at all once a category is created (by design — a subtree's resource type is fixed at creation).

Build the edit form accordingly: code/name/sortOrder are editable fields; parent/type/status are shown read-only with separate actions (a "Move" button, an enable/disable toggle) rather than being part of the same form submission.

### 2.3 Delete — `DELETE /{id}` (`COST_WRITE`)

No request body. Fails with `409` if the category has child categories (`"Cannot delete a category that has child categories..."`) or has any resources assigned to it, even soft-deleted ones (`"...has resources assigned to it (including soft-deleted resources)"`). In practice: once a category has ever had a resource attached, it can never be deleted again — treat delete as rare/administrative, favor `disable` for normal "hide this" workflows.

### 2.4 Get by id — `GET /{id}` (`COST_READ`)

Response `data`: same `ResourceCategoryResponse` shape as 2.1.

### 2.5 Tree — `GET /tree` (`COST_READ`)

Query param: `type` (optional integer, one of the codes above) — filters the tree to only that resource type's subtree(s).

Response `data`: array of recursive nodes (`ResourceCategoryTreeNode`), each identical to `ResourceCategoryResponse` plus a nested `children` array:
```json
[
  {
    "id": "uuid", "parentId": null, "code": "MAT", "name": "Materials",
    "type": 1, "level": 0, "sortOrder": 0, "leaf": false, "active": true,
    "children": [
      { "id": "uuid", "parentId": "uuid", "code": "CEM", "name": "Cement",
        "type": 1, "level": 1, "sortOrder": 0, "leaf": true, "active": true, "children": [] }
    ]
  }
]
```
No `createdBy`/`createdDate`/`modifiedBy`/`modifiedDate` in tree nodes (only in the flat `ResourceCategoryResponse`). This is a full-tree fetch in one call — do not call `/tree` per node; build the whole UI tree client-side from this single response.

### 2.6 Children — `GET /{id}/children` (`COST_READ`)

Direct children only (not recursive), sorted by `sortOrder` ascending. Response `data`: array of `ResourceCategoryResponse`. `404` if the category id doesn't exist.

### 2.7 Move — `PATCH /{id}/move` (`COST_WRITE`)

Request:
```json
{ "newParentId": null }
```
`null` moves the category to root. Business rules enforced server-side:
- **Circular reference guard**: moving a category under itself or under one of its own descendants → `409`.
- **Type mismatch guard**: moving under a parent whose `type` differs from the category's own `type` → `400`.
- Moving recalculates `level` for the category **and all of its descendants** recursively.
- Moving updates `leaf` on both the old parent (may become `leaf: true` again if it had no other children) and the new parent (becomes `leaf: false`).

Response `data`: the updated `ResourceCategoryResponse` (reflects new `parentId`/`level`).

### 2.8 Enable / Disable — `PATCH /{id}/enable` and `PATCH /{id}/disable` (`COST_WRITE`)

No request body for either. Response `data`: updated `ResourceCategoryResponse` with `active` flipped. This is the correct way to toggle status — **not** via `PUT /{id}` (which doesn't accept `active` at all, see 2.2).

### 2.9 Search — `GET /search` (`COST_READ`)

Query params (all optional): `name`, `code`, `active` (boolean — **not** `status`), `type` (integer code), plus standard `page`/`size`/`sort` (see shared `PageResponse<T>` shape, section 0). Example: `GET /search?active=true&type=1&sort=name,asc&page=0&size=10`.

Response `data`: `PageResponse<ResourceCategoryResponse>`.

> Sending a malformed value for an integer/boolean body field or query param (e.g. `type: "MATERIAL"` instead of `1`, or a non-UUID string for a `UUID` query param) returns a clean `400` with a message telling you which field/param and what type was expected — it does **not** crash into a `500`. Still, always send correctly-typed values (real integers/booleans, not their string names) rather than relying on this for validation.

---

## 3. Resources — `/api/resources`

> ⚠️ **Outdated as of 2026-07-30 — read `FRONTEND_AI_PROMPT_PRODUCTS.md` first.** `resources` was split into `products` (the catalog identity — category, attributes, spec, manufacturer/brand/model, unit, its own `code`) and `resources` (now just an organization's listing: `productId`+`organizationId`+`status`). The request/response bodies below (§3.1-3.x), and the later `code`-auto-generation/autocomplete notes in `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md`, no longer match the API. See `FRONTEND_AI_PROMPT_PRODUCTS.md` for the current contract; this section is kept only as historical background on categories/units being referenced by id.

Concrete resource records (e.g. "Portland Cement", a specific machine model), each belonging to exactly one Resource Category. Same auth/permission pattern as section 2. **[Superseded — see banner above]**

### 3.1 Create — `POST /` (`COST_WRITE`)

Request:
```json
{
  "categoryId": "uuid",
  "code": "CEM-001",
  "name": "Portland Cement",
  "description": "General purpose cement",
  "unitId": "uuid",
  "specification": "Type I",
  "manufacturer": "AzCem",
  "brand": "SuperMix",
  "model": "M400",
  "active": true
}
```
Only `categoryId`, `code`, `name` are required. `unitId` is optional but, if provided, **must reference an existing unit** (`404` otherwise) — see section 5. `categoryId` must reference an existing category (`404` otherwise).

Response `data` (`ResourceResponse`):
```json
{
  "id": "uuid", "categoryId": "uuid", "code": "CEM-001", "name": "Portland Cement",
  "description": "General purpose cement", "unitId": "uuid", "specification": "Type I",
  "manufacturer": "AzCem", "brand": "SuperMix", "model": "M400", "active": true,
  "createdBy": "uuid", "createdDate": "2026-07-21T09:19:40.142",
  "modifiedBy": "uuid", "modifiedDate": "2026-07-21T09:19:40.142"
}
```
`code` is **globally unique** (not scoped to category) — duplicate anywhere → `409`.

### 3.2 Update — `PUT /{id}` (`COST_WRITE`)

Unlike categories, this accepts **all** fields (full replace): same shape as create's request, `categoryId` included — a resource can be reassigned to a different category via this same endpoint (no separate "move" for resources). `active` toggling also happens here directly (no separate enable/disable endpoints for resources, only categories have those).

### 3.3 Delete — `DELETE /{id}` (`COST_WRITE`)

**Soft delete** — the row stays in the database with `deleted=true`; it just disappears from all reads (`GET`/`search`) and stops blocking anything that only checks active rows. No request body. After deletion, `GET /{id}` on it returns `404`.

### 3.4 Get by id — `GET /{id}` (`COST_READ`)

`404` for both a nonexistent id and a soft-deleted one — indistinguishable from the client's point of view.

### 3.5 List/search — `GET /` (`COST_READ`)

Query params (all optional): `name`, `code`, `category` (UUID — **not** `categoryId`), `manufacturer`, `brand`, `unit` (UUID — **not** `unitId`), `status` (boolean, maps to `active` — **not** `active`), `attributeName` + `attributeValue` (see section 4), plus `page`/`size`/`sort`.

⚠️ Note the param name mismatches vs. the response field names: response has `categoryId`/`unitId`/`active`, but the query params are `category`/`unit`/`status`. This is deliberate on the backend (shorter query-string ergonomics) but easy to get wrong — copy these exact names.

`attributeName`+`attributeValue` together filter to resources having a matching **searchable** attribute (see 4.4) — both must be provided together to have any effect; providing only one is ignored.

Response `data`: `PageResponse<ResourceResponse>`.

### 3.6 Get a resource's attributes — `GET /{resourceId}/attributes` (`COST_READ`)

Lives under `/api/resources/...`, not `/api/resource-attributes/...` — see section 4. Returns a plain array (not paginated), sorted by `sortOrder` ascending. `404` if the resource doesn't exist.

---

## 4. Resource Attributes — `/api/resource-attributes`

EAV-style dynamic key/value attributes on a resource (voltage, color, weight, ...) — avoids a fixed column per possible characteristic. Same auth pattern.

### 4.1 Create — `POST /` (`COST_WRITE`)

Request:
```json
{
  "resourceId": "uuid",
  "attributeName": "voltage",
  "attributeValue": "220",
  "unit": "V",
  "sortOrder": 1,
  "searchable": true,
  "required": false,
  "active": true
}
```
Only `resourceId`, `attributeName`, `attributeValue` required. `attributeName` is unique **per resource** (case-insensitive) — duplicate → `409`. `resourceId` must exist → `404` otherwise.

Response `data` (`ResourceAttributeResponse`):
```json
{
  "id": "uuid", "resourceId": "uuid", "attributeName": "voltage", "attributeValue": "220",
  "unit": "V", "sortOrder": 1, "searchable": true, "required": false, "active": true
}
```
No audit fields (`createdBy` etc.) on this one — none exist on this entity.

### 4.2 Update — `PUT /{id}` (`COST_WRITE`)

Full replace, same shape as create minus `resourceId` (a attribute can't be reassigned to a different resource — delete and recreate instead). All of `attributeName`, `attributeValue`, `unit`, `sortOrder`, `searchable`, `required`, `active` in one call.

### 4.3 Delete — `DELETE /{id}` (`COST_WRITE`)

**Hard delete** (no soft-delete on this entity, unlike Resources). No request body.

### 4.4 The `searchable` flag — how attribute-based resource search actually works

There is no `GET` endpoint in this controller at all (no list/search here) — to read a resource's attributes, call `GET /api/resources/{resourceId}/attributes` (section 3.6). To **search resources by an attribute value**, use `GET /api/resources?attributeName=voltage&attributeValue=220` (section 3.5) — and critically: **only attributes with `searchable: true` are matchable this way**. An attribute created with the default `searchable: false` (or explicitly set false) will never be found via that search, even with an exact value match — set `searchable: true` on any attribute you want to expose as a filter facet in the UI. Matching is case-insensitive on both name and value.

---

## 5. Units — `/api/units`

Simple reference/lookup data for units of measure (kg, m³, hour, piece, ...). No audit fields, hard delete, globally unique `code`.

### 5.1 Create — `POST /` (`COST_WRITE`)

Request:
```json
{ "code": "KG", "name": "Kilogram", "symbol": "kg", "decimalPrecision": 3, "active": true }
```
Only `code`, `name` required. `decimalPrecision` defaults to `2` if omitted (how many decimal places to display/round this unit's quantities to in the UI). `code` is case-insensitively unique → `409` on duplicate.

Response `data` (`UnitResponse`):
```json
{ "id": "uuid", "code": "KG", "name": "Kilogram", "symbol": "kg", "decimalPrecision": 3, "active": true }
```

### 5.2 Update — `PUT /{id}` (`COST_WRITE`)

Full replace, same shape as create (`code`, `name`, `symbol`, `decimalPrecision`, `active`).

### 5.3 Delete — `DELETE /{id}` (`COST_WRITE`)

`409` if any resource (even soft-deleted) or resource price references this unit — once used, effectively permanent. No request body.

### 5.4 Get by id — `GET /{id}` (`COST_READ`)

### 5.5 List/search — `GET /` (`COST_READ`)

Query params: `code`, `name`, `active`, plus `page`/`size`/`sort`. Response `data`: `PageResponse<UnitResponse>`.

---

## 6. Resource Prices — `/api/resource-prices`

Time-versioned prices per (resource, supplier, region) with an approval workflow. **Historical prices are never overwritten** — every change is a new record. This is the most stateful module; read carefully before building the price-management UI.

### 6.1 Create — `POST /` (`COST_WRITE`)

Request:
```json
{
  "resourceId": "uuid",
  "regionId": "uuid",
  "supplierId": "uuid",
  "price": 105.00,
  "vat": 18,
  "currency": "AZN",
  "effectiveDate": "2026-07-21",
  "expireDate": null
}
```
All fields except `expireDate` are required. `currency` must be a 3-letter code (validated as exactly 3 chars, uppercased server-side regardless of input case). `resourceId`/`regionId`/`supplierId` must all reference existing rows → `404` if any doesn't. `expireDate`, if given, must not be before `effectiveDate` → `400`. `price` must be `> 0`, `vat` must be `0–100`.

**Every new price starts with `status: 1` (PENDING)** — it is not yet in effect and won't be returned by "current price" lookups until approved.

Response `data` (`ResourcePriceResponse`):
```json
{
  "id": "uuid", "resourceId": "uuid", "regionId": "uuid", "supplierId": "uuid",
  "price": 105.0000, "vat": 18.0000, "currency": "AZN",
  "effectiveDate": "2026-07-21", "expireDate": null, "status": 1,
  "createdBy": "uuid", "createdDate": "2026-07-21T15:48:46.14",
  "approvedBy": null, "approvedDate": null
}
```

### Status codes

| code | meaning |
|---|---|
| 1 | PENDING — awaiting approve/reject, editable |
| 2 | APPROVED — immutable, may be currently active or historical depending on dates |
| 3 | REJECTED — immutable, never took effect |

There is no numeric "4 = EXPIRED" — an approved price whose `expireDate` has passed is still `status: 2`, just no longer returned by the "current price" endpoint. Compute "is this row currently in effect" client-side as: `status === 2 && effectiveDate <= today && (expireDate === null || expireDate >= today)`.

### 6.2 Update — `PUT /{id}` (`COST_WRITE`)

**Only works while `status: 1` (PENDING)** — same request shape as create minus `resourceId` (can't reassign which resource a price is for). Calling this on an `APPROVED` or `REJECTED` price → `409` (`"Only a pending price can be updated; this price has already been decided on"`). Build the UI so the edit action is simply unavailable/disabled once a price leaves PENDING status — don't let the user attempt it.

### 6.3 Approve — `PATCH /{id}/approve` — **requires `COST_APPROVE`, not `COST_WRITE`**

No request body. Only works on `status: 1` → `409` otherwise. This is the only endpoint in the whole API gated by `COST_APPROVE` instead of `COST_WRITE`/`COST_READ` — a user with plain `COST_WRITE` (e.g. an OPERATOR role) can create/edit prices but cannot approve or reject them; only roles with `COST_APPROVE` (SUPER_ADMIN, ADMIN, EXPERT per the seeded RBAC) can. Check the current user's permissions (from `/api/auth/me` → `roles`, cross-referenced against your own knowledge of which roles have `COST_APPROVE`) before showing the Approve/Reject buttons, or just attempt the call and handle a `403` gracefully.

Side effect: if another `APPROVED` price already covers the same (resource, supplier, region) and its window overlaps this one's `effectiveDate`, that older price's `expireDate` is automatically set to `(this price's effectiveDate - 1 day)` — **its `price`/`vat` value is never touched**, only its validity window closes. Refresh both the current-price view and the history list after a successful approve.

Response `data`: updated `ResourcePriceResponse` with `status: 2`, `approvedBy`/`approvedDate` filled in.

### 6.4 Reject — `PATCH /{id}/reject` — **requires `COST_APPROVE`**

No request body. Only works on `status: 1` → `409` otherwise. Sets `status: 3` and fills `approvedBy`/`approvedDate` (this pair records "who made the decision", for both approve and reject — there's no separate `rejectedBy`).

### 6.5 Get by id — `GET /{id}` (`COST_READ`)

### 6.6 Current price — `GET /current` (`COST_READ`)

Query params, **all three required** (no defaults/omission — the combination is what defines "one active price"): `resourceId`, `supplierId`, `regionId`. `404` (`"No current price found..."`) if none is currently approved-and-in-window for that exact triple — this is a normal/expected response, not an error state, when a resource simply has no price set yet for that supplier/region.

### 6.7 History — `GET /history` (`COST_READ`)

Query params: `resourceId` **required**, `supplierId`/`regionId` optional (narrow further if given), plus `page`/`size`/`sort` (defaults to `sort=effectiveDate,desc`). Returns **all statuses** (pending, approved, rejected) — filter client-side by `status` if you only want to display approved history. Response `data`: `PageResponse<ResourcePriceResponse>`.

### 6.8 Search — `GET /search` (`COST_READ`)

Query params (all optional): `resourceId`, `supplierId`, `regionId`, `status` (integer 1/2/3), `currency`, plus `page`/`size`/`sort` (defaults to `sort=effectiveDate,asc` — note the different default direction vs. `/history`).

---

## 7. Regions — `/api/regions`

Simple reference data (`id`, `code`, `name`, `active`) — identical shape/behavior pattern to Units (section 5), just a different domain concept. No audit fields, hard delete, globally unique `code`.

- `POST /` (`COST_WRITE`) — request/response: `{ "code": "BAKU", "name": "Baku", "active": true }` (`active` optional, defaults `true`).
- `PUT /{id}` (`COST_WRITE`) — full replace, same shape.
- `DELETE /{id}` (`COST_WRITE`) — `409` if referenced by any resource price.
- `GET /{id}` (`COST_READ`).
- `GET /` (`COST_READ`) — query params `code`, `name`, `active`, plus `page`/`size`/`sort`. Response `data`: `PageResponse<RegionResponse>`.

---

## 8. Suppliers — `/api/suppliers`

Simple reference data (`id`, `code`, `name`, `active`) — identical shape/behavior pattern to Regions/Units. No audit fields, hard delete, globally unique `code`.

- `POST /` (`COST_WRITE`) — request/response: `{ "code": "ACME", "name": "Acme Supplies", "active": true }`.
- `PUT /{id}` (`COST_WRITE`) — full replace, same shape.
- `DELETE /{id}` (`COST_WRITE`) — `409` if referenced by any resource price.
- `GET /{id}` (`COST_READ`).
- `GET /` (`COST_READ`) — query params `code`, `name`, `active`, plus `page`/`size`/`sort`. Response `data`: `PageResponse<SupplierResponse>`.

---

## Global notes

### CORS

Backend allows `http://localhost:5173` as the CORS origin in dev (Vite default). If your dev server runs elsewhere, that's a backend config change, not a frontend workaround.

### Permission model quick reference

Every business endpoint (sections 2–8) requires a valid `Authorization: Bearer <accessToken>` header, then one of:
- `COST_READ` — all `GET` endpoints.
- `COST_WRITE` — all `POST`/`PUT`/`DELETE`/`PATCH` endpoints **except** approve/reject.
- `COST_APPROVE` — only `PATCH /api/resource-prices/{id}/approve` and `/reject`.

The seeded roles (`SUPER_ADMIN`, `ADMIN`, `EXPERT`, `ANALYST`, `OPERATOR`, `VIEWER`) map to these at different levels — `VIEWER` has `COST_READ` only, `OPERATOR`/`ANALYST` add `COST_WRITE`, `EXPERT`/`ADMIN`/`SUPER_ADMIN` add `COST_APPROVE` too. Design the UI to hide/disable actions the current user's role can't perform, rather than only relying on the `403` after the fact.
