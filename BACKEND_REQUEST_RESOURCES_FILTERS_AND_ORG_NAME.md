# Backend üçün sorğu — Resurslar filtrləri + Təşkilat adının göstərilməsi + username

Bu fayl frontend tərəfindən 2026-08-04-də hazırlanıb, backend-ə göndərmək üçündür.

---

## 1. `GET /api/resources` — yeni filtrlər

Hazırda yalnız bunları qəbul edir: `product`, `organization`, `status`, `active`, `page`, `size`, `sort`.

Əlavə olunmalı:

- **`name`, `code`** (string, qismən uyğunluq / contains) — resursun bağlı olduğu `product`-un adına/koduna görə axtarış (join vasitəsilə, `GET /api/products`-dakı `name`/`code` filtrləri kimi).
- **`regionId`** (uuid) — yalnız bu regionda ən azı bir (təsdiqlənmiş?) qiyməti olan resursları qaytarsın.
- **`minPrice`, `maxPrice`** (decimal) — resursun cari qiymətinə görə süzgəc. Qərar veriləsi məqamlar:
  - Hansı qiymət nəzərdə tutulur — yalnız təsdiqlənmiş (`APPROVED`) olan, yoxsa istənilən status?
  - Valyuta fərqli olanda necə müqayisə olunsun? (Təklif: yalnız `regionId` göstərilibsə, həmin region+valyuta üzrə; əks halda bu filtri tələb etmək və ya hər valyutanı ayrıca saxlamaq.)

## 2. Təşkilat adının göstərilməsi — `organizationName` əlavəsi

Hazırda `GET /api/organizations` yalnız `SUPER_ADMIN`/`ADMIN` üçün açıqdır (`ORGANIZATION_READ`). Bu səbəbdən adi (vendor) istifadəçi öz gördüyü resursun/qiymətin təşkilat adını belə görə bilmir — çünki adı çevirmək üçün ayrıca sorğu göndərməyə icazəsi yoxdur.

Təklif: geniş icazə vermək əvəzinə, cavablara birbaşa ad əlavə edin:

- **`ResourceResponse`**-a `organizationName` (və istəsəniz `organizationType`) əlavə olunsun.
- **`ResourcePriceResponse`**-a da eyni şəkildə `organizationName` əlavə olunsun.

Bununla adi istifadəçi öz görə bildiyi resurs/qiymətin təşkilat adını ayrıca sorğusuz görər (görünürlük artıq resurs səviyyəsində məhdudlaşdırılıb — özününkü və ya ümumi resurslar — ona görə bu, əlavə təhlükəsizlik riski yaratmır).

## 3. `OrganizationResponse`-a `username` əlavəsi

Təşkilatın giriş hesabının `username`-i heç yerdə (nə `POST`, nə `GET /api/organizations`) qaytarılmır. Admin panelində "Redaktə et" formasında bunu oxunaqlı (dəyişdirilməz) göstərmək istəyirik ki, admin hansı giriş hesabının hansı təşkilata aid olduğunu görə bilsin.

- `GET /api/organizations` və `GET /api/organizations/{id}` cavablarına `username` əlavə olunsun (yalnız oxumaq üçün).

## 4. Data düzəlişi — "Vendor Alpha MMC" səhv `type`-la görünür

Canlı yoxladım: bu təşkilatın `type` sahəsi `1` (CENTRAL) qayıdır. Kontrakta görə (`FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md` § 1) miqrasiyadan əvvəlki bütün təşkilatlar `6` (OTHER) olmalı idi, CENTRAL(1) isə heç vaxt real sətir olmamalıdır. Bu sətri DB-də yoxlayıb düzəldin (`OTHER` və ya uyğun tipə).

---

**Qeyd:** Heç bir yeni endpoint tələb olunmur — mövcud `GET /api/resources`, `ResourceResponse`, `ResourcePriceResponse`, `GET /api/organizations` genişləndirilir.
