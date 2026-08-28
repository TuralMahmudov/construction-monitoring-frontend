# CCMS Frontend — Admin Panel / Organization Ownership (5 yeni faza)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə (VS Code-da Claude Code CLI və s.) verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas 8 modul) və **`FRONTEND_UI_BUILD_PROMPT.md`**-un (ilk UI strukturu) **davamıdır** — həmin iki faylda təsvir olunan konvensiyalar (unified response envelope, `PageResponse<T>`, auth axını, MUI stack, mövcud naviqasiya) burada təkrarlanmır, birbaşa istinad edilir. Əgər bu üç faylı eyni anda AI alətinə vermək mümkündürsə, hər üçünü verin; mümkün deyilsə, bu faylın "Əvvəlki kontekst (qısa xülasə)" bölməsi kifayət qədər kontekst verir ki, tək başına da işə salına bilsin.
>
> Bu fayl backend-də **5 ardıcıl fazada** (2026-07-27) əlavə olunmuş funksionallığı əhatə edir: (1) `organizations`/`resource_match_groups` DB sxemi, (2) resurs uyğunlaşdırma mühərriki (`match_group_id`), (3) `resource_price_averages` + kənar dəyər (outlier) auto-flag, (3.5) flagged qiymətlər üçün admin review endpoint-i, (4) təşkilat sahiblik/görünürlük modeli API səviyyəsində, (5) mərkəzi admin funksionallığı (match group review + averages-in canlı yenilənməsi). Bütün bunlar **real Postgres-ə qarşı canlı test edilib** — `PROJECT_STATUS.md`-də bölmə 4h-4m-də tam detal var, bu fayl yalnız frontend üçün lazım olan hissəni çıxarır.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Əvvəlki kontekst (qısa xülasə, tam detal üçün `FRONTEND_AI_PROMPT.md`-ə bax)

- Bütün cavablar `{ success, message, data, timestamp }` (uğur) və ya `{ timestamp, status, error, message, path, validationErrors }` (xəta) formatındadır.
- Bütün pagination-lı endpoint-lər `PageResponse<T>` qaytarır: `{ content, page, size, totalElements, totalPages, last }`.
- Auth: `Authorization: Bearer <accessToken>` header, hər sorğuda. Icazələr: `COST_READ` (oxuma), `COST_WRITE` (yazma), `COST_APPROVE` (təsdiq/rədd + **bu fazalarda əlavə olaraq bütün admin-panel endpoint-ləri**).
- Stack: React + MUI v5+, `DataGrid`, MUI `Dialog`/`TextField`/`Select`/`DatePicker`/`Switch`.

---

## ⚠️ Vacib məhdudiyyət: `organizations` üçün CRUD endpoint-i YOXDUR

Backend-də `organizations` cədvəli və entity-si var, amma **heç bir `/api/organizations` controller-i yazılmayıb** — təşkilat yaratmaq, siyahısını almaq və ya adını UUID-dən tapmaq üçün HEÇ BİR endpoint yoxdur. Nəticə:
- `resources.organizationId` yalnız **xam UUID** kimi gəlir, adı yoxdur — heç bir lookup map qurmağa cəhd etməyin, çünki mənbə endpoint-i mövcud deyil.
- Resurs yaradanda `organizationId` təyin etmək istəsəniz (yalnız mərkəzi admin üçün, aşağıya bax), bunu bir **Autocomplete/Select** kimi YOX, sadə bir **UUID mətn sahəsi** kimi qurun (advanced/admin-only, gizli-defolt) — seçim siyahısı üçün backend dəstəyi yoxdur.
- Bunu istifadəçiyə də bildirin: təşkilat idarəetməsi (yaratma/siyahı) hələ ayrı bir backend fazası tələb edir, bu prompt onu əhatə etmir.

---

## 1. `/api/auth/me` — genişlənmiş cavab

`GET /api/auth/me` indi 2 yeni sahə qaytarır:

```json
{
  "id": "uuid",
  "username": "user-alpha",
  "email": "user-alpha@ccms.local",
  "firstName": "Alpha",
  "lastName": "User",
  "enabled": true,
  "organizationId": "uuid-or-null",
  "actorType": 2,
  "roles": ["OPERATOR"]
}
```
- `organizationId`: `null` = mərkəzi/fərdi istifadəçi (heç bir vendor təşkilatına bağlı deyil); UUID = bu istifadəçi həmin təşkilatın adına hərəkət edir.
- `actorType`: `1` = INDIVIDUAL (fərdi/mərkəzi heyət), `2` = ORGANIZATION (vendor təşkilat nümayəndəsi).
- **`VIEW_ALL_ORGANIZATION_RESOURCES` icazəsi `roles`-da GÖRÜNMÜR** (`roles` yalnız rol adlarıdır, permission adları deyil) — hazırda bu icazə yalnız `SUPER_ADMIN` və `ADMIN` rollarına verilib (backend migrasiya `025`). Frontend-də "mərkəzi admin" gating-i belə edin:
  ```js
  const isCentralAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
  ```
  Bu, aşağıdakı **bütün** admin-panel funksionallığı (flagged review, match group review, averages, kross-təşkilat görmə) üçün əsas gating şərtidir.

---

## 2. `ResourceResponse` — 2 yeni sahə

> ⚠️ **2026-07-30: bu bölmə köhnəlib.** `matchGroupId` sahəsi **yoxdur** artıq, `ResourceResponse` tamam başqa formadadır (`productId` + gömülü `product` obyekti, `code`/`name`/... bu obyektdədir). `organizationId`-nin özü (aşağıda) dəyişməyib. Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 3**.

`GET /api/resources`, `GET /api/resources/{id}`, `POST /api/resources`, `PUT /api/resources/{id}` cavablarına 2 yeni sahə əlavə olunub (`active`-dən sonra, `createdBy`-dan əvvəl) — **[köhnə, 2026-07-27 versiyası]**:

```json
{
  "id": "uuid", "categoryId": "uuid", "code": "CEM-001", "name": "Portland Cement",
  ...
  "active": true,
  "organizationId": "uuid-or-null",
  "matchGroupId": "uuid-or-null",
  "createdBy": "uuid", "createdDate": "...", "modifiedBy": "uuid", "modifiedDate": "..."
}
```
- `organizationId`: bu resursun hansı təşkilata məxsus olduğu (`null` = ümumi/mərkəzi resurs, hər kəs görə bilər). Ad yoxdur (bax yuxarıdakı məhdudiyyət) — sadəcə bir chip göstərin: `null` → "Ümumi/Mərkəzi" (boz chip), qeyri-null → "Təşkilata məxsus" (mavi chip, tooltip-də UUID-i göstərə bilərsiniz, ad yox).
- `matchGroupId`: bu resursun avtomatik uyğunlaşdırma mühərriki tərəfindən hansı "eyni məhsul" qrupuna bağlandığı (`null` ola bilməz praktikada — hər resurs yaradılanda avtomatik təyin olunur). Bunu Resource Detail səhifəsində yeni "Bazar Qiyməti" tab-ının açarı kimi istifadə edin (bax bölmə 6).

### `POST /api/resources` — yeni opsional sahə: `organizationId`

```json
{ "categoryId": "uuid", "code": "CEM-001", "name": "Portland Cement", "organizationId": "uuid-or-omit" }
```
- **Adi istifadəçi üçün bu sahəni formaya HEÇ QOYMAYIN** — server öz `organizationId`-ni avtomatik yazır (istifadəçinin öz təşkilatı, ya `null`), göndərsəniz belə **görməzdən gəlinir** (spoofing qorunması, backend-də canlı test edilib).
- **Yalnız mərkəzi admin** (`isCentralAdmin === true`) üçün formaya əlavə, gizli-defolt bir "Təşkilata təyin et (advanced)" bölməsi əlavə edin: UUID mətn sahəsi, boş buraxılsa resurs ümumi/mərkəzi yaranır.

---

## 3. `PriceStatus` — yeni `FLAGGED(4)` statusu

Köhnə cədvələ (`FRONTEND_AI_PROMPT.md` bölmə 6.1) əlavə:

| code | meaning |
|---|---|
| 1 | PENDING — təsdiq gözləyir, redaktə oluna bilər |
| 2 | APPROVED — dəyişməzdir |
| 3 | REJECTED — dəyişməzdir |
| **4** | **FLAGGED — kənar dəyər (outlier) kimi avtomatik işarələnib, admin nəzərdən keçirməlidir** |

**Status chip rənglərini yeniləyin:** PENDING=sarı, APPROVED=yaşıl, REJECTED=qırmızı, **FLAGGED=narıncı** (bir xəbərdarlıq ikonu ilə, məs. ⚠️) — REJECTED-dən fərqli rəng olsun, çünki bu hələ qərar verilməmiş, sadəcə diqqət tələb edən statusdur.

### Necə yaranır (heç bir frontend əməliyyatı lazım deyil)

`POST /api/resource-prices` çağırışı **eyni qalır** (body dəyişməyib) — sadəcə backend indi cavabda bəzən `status: 1` (PENDING) əvəzinə `status: 4` (FLAGGED) qaytara bilər, əgər göndərilən qiymət həmin resursun "bazar median"-ından `±50%`-dən çox kənara çıxırsa. Frontend-də: qiymət yaratma formu göndəriləndən sonra cavabdakı `status`-a baxın — `4` gəlsə, istifadəçiyə fərqli bir mesaj göstərin (adi "Qiymət yaradıldı, təsdiq gözləyir" əvəzinə): **"Qiymət yaradıldı, lakin bazar qiymətindən əhəmiyyətli dərəcədə fərqləndiyi üçün admin nəzərdənkeçirməsinə göndərildi."**

### `PENDING` + `FLAGGED` — redaktə/təsdiq qaydaları birləşdi

Köhnə qayda "yalnız PENDING redaktə/approve/reject oluna bilər" idi (`FRONTEND_UI_BUILD_PROMPT.md` bölmə 4) — **indi `FLAGGED` sətirlər də daxildir**:
- Edit düyməsi: `status === 1 || status === 4` olanda göstərin.
- Approve/Reject düymələri: `status === 1 || status === 4` olanda göstərin (icazə şərti dəyişməyib — hələ `COST_APPROVE`).

**Yeni nüans — Edit üçün əlavə şərt:** `PUT /api/resource-prices/{id}` indi **yalnız sətri göndərən istifadəçi özü (`price.createdBy === currentUser.id`) VƏ YA mərkəzi admin (`isCentralAdmin`)** redaktə edə bilər — eyni təşkilatdan olan başqa bir həmkar belə (əgər sətri o göndərməyibsə) redaktə edə bilməz, `404` alar. Edit düyməsini belə şərtləndirin:
```js
const canEdit = (price.status === 1 || price.status === 4)
  && (price.createdBy === currentUser.id || isCentralAdmin);
```
`Approve`/`Reject` üçün bu şərt YOXDUR (`COST_APPROVE` sahibləri istənilən istifadəçinin sətrini təsdiq/rədd edə bilər — bu, təsdiq axınının məqsədidir).

---

## 4. `GET /api/resource-prices/flagged` — Flagged Prices review queue (`COST_APPROVE`)

> ⚠️ **2026-08-04: `supplierId` → `organizationId` oldu, `/api/suppliers` silinib.** Bax
> **`FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md`** bölmə 4/5 — ad üçün indi
> `/api/organizations` istifadə edin, `/api/suppliers` deyil.

Query params: `page`/`size`/`sort` (defolt sıra `createdDate` — ən əvvəl flag olunan əvvəl).

Response `data`: `PageResponse<FlaggedPriceReviewResponse>`:
```json
{
  "id": "uuid", "resourceId": "uuid", "regionId": "uuid", "organizationId": "uuid",
  "price": 9999.0000, "vat": 18.0000, "currency": "AZN",
  "effectiveDate": "2026-07-27", "expireDate": null, "status": 4,
  "createdBy": "uuid", "createdDate": "2026-07-27T14:39:35.78",
  "currentMedianPrice": 100.0000,
  "deviationPercent": 2400.0000,
  "sampleCount": 3
}
```
- `currentMedianPrice`/`sampleCount`: `null`/`0` ola bilər (əgər bu, həmin bazar üçün ilk qiymətdirsə — nəzəri olaraq nadir, çünki flag olmaq üçün əvvəlcədən median lazımdır, amma dəfensiv kod yazın).
- `deviationPercent`: **işarəli** faiz (müsbət = median-dan yuxarı, mənfi = aşağı). `+2400.00%` kimi göstərin, böyük mütləq dəyərləri (məs. `> 100%`) qırmızı/qalın vurğulayın.
- `resourceId`/`regionId`/`organizationId` — yenə xam UUID-lər, ad yoxdur. **Bu ekranda ad göstərmək üçün**: səhifə açılanda görünən sətirlərin unikal `resourceId`-lərini toplayıb, hər biri üçün `GET /api/resources/{id}` çağırıb (və ya artıq yüklənmiş Resources siyahısından lookup map) `code`/`name` göstərin; eyni şəkildə `regionId`→`/api/regions`, `organizationId`→`/api/organizations` lookup map-ları (bunlar adətən kiçikdir, tam siyahını bir dəfə yükləyib saxlaya bilərsiniz).

**Ekran:** yeni "Admin Panel" menyusunun altında "Kənar Dəyər Qiymətlər" (Flagged Prices) səhifəsi. `DataGrid`: Resurs (kod+ad), Region, Təchizatçı, Qiymət, Bazar Medianı, Fərq (%), Yaradılma tarixi, Actions (Approve/Reject — eyni `PATCH .../approve` və `/reject`, bax `FRONTEND_AI_PROMPT.md` 6.3/6.4, dəyişməyib). Approve/Reject-dən sonra siyahını yenidən yükləyin (təsdiq/rədd edilən sətir siyahıdan yox olur).

**Boş vəziyyət:** "Hazırda kənar dəyər kimi işarələnmiş qiymət yoxdur." (bu, **yaxşı** bir vəziyyətdir, xəta deyil).

---

## 5. `GET /api/resource-match-groups/pending-review` + `PATCH .../confirm` — Match Group Review (`COST_APPROVE`)

> ⚠️ **2026-07-30: path və cavab forması dəyişdi.** `/api/resource-match-groups/...` → `/api/products/pending-review` + `/api/products/{id}/confirm`. `MatchGroupReviewResponse.resources[]` (`id/code/name`) → `ProductReviewResponse.listings[]` (yalnız `id/organizationId` — `code`/`name` artıq sətrin özündə, `product.code`/`product.name` kimi). Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 7**.

Uyğunlaşdırma mühərriki (backend-də avtomatik işləyir, frontend-dən heç bir çağırış tələb etmir — resurs yaradılanda/atribut dəyişəndə özü işə düşür) bəzən **çox az məlumatla** (məs. brend/istehsalçı/atribut heç biri doldurulmayıb) yeni bir "eyni məhsul qrupu" yaradır — bu, etibarsız ola bilər (fərqli məhsullar səhvən eyni qrupa düşə bilər). Belə hallar admin review-a düşür.

### 5.1 Siyahı — `GET /pending-review`

Query params: `page`/`size`/`sort` (defolt `createdAt`).

Response `data`: `PageResponse<MatchGroupReviewResponse>`:
```json
{
  "id": "uuid",
  "categoryId": "uuid",
  "matchKey": "",
  "createdAt": "2026-07-27T11:44:42.32Z",
  "reviewStatus": 2,
  "resources": [
    { "id": "uuid", "code": "MG-LOW-1", "name": "Bare resource, no signal" }
  ]
}
```
- `matchKey`: normallaşdırılmış siqnatur mətni — çox vaxt boş `""` (elə buna görə də review lazımdır) və ya qısa. Xam texniki mətndir, istifadəçiyə "Uyğunlaşdırma açarı: (boş)" kimi izahla göstərin, tərcümə etməyə çalışmayın.
- `reviewStatus`: bu siyahıda həmişə `2` (PENDING_REVIEW) gələcək (endpoint özü filtrləyir) — ayrıca göstərməyə ehtiyac yoxdur.
- `resources`: bu qrupdakı resurs(lar) — **ad artıq var, əlavə sorğu lazım deyil** (bu, yuxarıdakı `flagged` endpoint-indən fərqli, daha rahat haldır).

### 5.2 Təsdiq — `PATCH /{id}/confirm`

Body yoxdur. Cavab: yenilənmiş `MatchGroupReviewResponse` (`reviewStatus: 1`). Uğurlu olsa sətir siyahıdan yox olur.

**Ekran:** "Admin Panel" menyusunda "Uyğunlaşdırma Baxışı" (Match Group Review) səhifəsi. Sadə kartlar və ya `DataGrid` — hər sətirdə: Uyğunlaşdırma açarı (və ya boşdursa "(boş açar)"), Kateqoriya ID (xam, ad yoxdur — istəsəniz `resource-categories` siyahısından lookup map qura bilərsiniz, bu endpoint mövcuddur), İçindəki resurslar (chip-lər, hər biri kod+ad), Yaradılma tarixi, "Təsdiqlə" düyməsi (`confirm`). **"Rədd et"/"Böl" əməliyyatı YOXDUR** — backend bunu dəstəkləmir, yalnız təsdiqləmə mövcuddur (admin sadəcə "bu qruplaşdırma düzgündür" deyir).

**Boş vəziyyət:** "Nəzərdən keçirilməli yeni qruplaşdırma yoxdur."

---

## 6. `GET /api/resource-prices/averages` — Bazar Qiymət Müqayisəsi (`COST_READ`, **təşkilat-filtrsiz**)

> ⚠️ **2026-08-14: yeni `resourceCount` sahəsi əlavə olundu.** `sampleCount` "neçə TƏŞKİLAT iştirak edir" deməkdir (bir təşkilat neçə resurs yaratsa da, bazar statistikasında 1 səs sayılır — manipulyasiyanın qarşısını almaq üçün qəsdən belədir). `resourceCount` isə "neçə RESURS (xam qiymət təklifi)" hesablamaya daxil olub, kolleksiya edilmədən əvvəlki say. İkisi fərqli ola bilər (məs. 1 org 3 resurs + 1 org 1 resurs → `sampleCount=2`, `resourceCount=4`) — bu, bug deyil. **Hər ikisini göstərin**, tək `sampleCount`-u "nümunə sayı" kimi göstərmək istifadəçini "məlumat itib" düşünməyə vadar edir; məs. "2 təşkilat (4 resurs)" formatı.

> ⚠️ **2026-07-30: query param və cavab sahəsi adı dəyişdi.** `matchGroupId` → `productId` (məna eynidir). `resource.matchGroupId` `null` ola biləcəyi qeydi (§ 6, "İstifadə nöqtəsi 1") **artıq etibarsızdır** — `resource.productId` heç vaxt `null` deyil. § 6-nın son abzasındakı "qrup üçün ad/kod yoxdur" məhdudiyyəti də **aradan qalxıb** (`resourceName`/`manufacturer` həmişə dolu gəlir). Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 8**.

Query params (hər ikisi opsional) — **[köhnə, 2026-07-27 versiyası, indi `matchGroupId`→`productId`]**: `matchGroupId`, `regionId`, + `page`/`size`/`sort`.

Response `data`: `PageResponse<ResourcePriceAverageResponse>`:
```json
{
  "matchGroupId": "uuid",
  "regionId": "uuid",
  "avgPrice": 210.0000,
  "medianPrice": 210.0000,
  "minPrice": 200.0000,
  "maxPrice": 220.0000,
  "sampleCount": 2,
  "resourceCount": 4,
  "calculatedAt": "2026-07-27T11:47:12.00Z"
}
```
- Bu, **yalnız təsdiqlənmiş (`APPROVED`) və hazırda aktiv** qiymətlərdən hesablanır — `FLAGGED`/`PENDING`/`REJECTED` heç vaxt daxil deyil.
- **Diqqət:** bu endpoint `organizationId`-ə görə **filtrlənmir** — bütün təşkilatların qiymətləri aqreqat şəkildə görünür (hansı təşkilatın nə göndərdiyi göstərilmir, yalnız statistika). Bu, **qəsdəndir** (kross-vendor bazar müqayisəsinin bütün mənası budur) — istənilən `COST_READ` istifadəçisi görə bilər, `isCentralAdmin` şərti lazım deyil.
- `avgPrice` sadə orta DEYİL — kənar dəyərlərə qarşı davamlı "trimmed mean"-dir (median-a yaxın olmalıdır adətən); `medianPrice` əsl mediandır. İkisini yan-yana göstərin, fərqli olduqları halda (böyük fərq = qrupda hələ də kənar dəyər riski ola bilər) bir işarə (ⓘ) əlavə edə bilərsiniz.
- `sampleCount` vs `resourceCount` — yuxarıdakı 2026-08-14 qeydinə bax. İkisi eyni ola bilər (hər təşkilatın 1 resursu varsa) və ya fərqli (bir təşkilat çox resurs yaratmışsa).
- Nəticə boş ola bilər (`totalElements: 0`) — hələ heç bir təsdiqlənmiş qiymət yoxdursa. Normal haldır.

### İstifadə nöqtəsi 1: Resource Detail → yeni "Bazar Qiyməti" tab-ı

Mövcud tab-lara (`FRONTEND_UI_BUILD_PROMPT.md` bölmə "Naviqasiya strukturu": General/Attributes/Prices) **4-cü tab əlavə edin: "Bazar Qiyməti"**.
- Açılanda: `GET /api/resource-prices/averages?matchGroupId={resource.matchGroupId}&size=50` (regionId verməyin — bütün regionlar üçün gəlsin).
- Nəticəni region-a görə cədvəl kimi göstərin: Region (regionId-dən `/api/regions` lookup map ilə ad), Orta, Median, Min, Max, Nümunə sayı.
- `resource.matchGroupId` `null`-dursa (nəzəri, praktikada olmamalıdır) tab-ı gizlədin və ya "Bu resurs hələ heç bir bazar qrupuna bağlanmayıb" mesajı göstərin.

### İstifadə nöqtəsi 2: Ayrı "Bazar Qiymətləri" admin ekranı (opsional, lazım görsəniz)

"Admin Panel" menyusunda ümumi bir baxış: istifadəçi bir Region seçir (`/api/regions`-dan), `GET /api/resource-prices/averages?regionId={id}&size=50` çağrılır, nəticə cədvəl kimi göstərilir. `matchGroupId` sütununda ad/kod olmadığı üçün, ya `matchKey`-i göstərmək üçün əlavə bir yol tapın (bu endpoint `matchKey`-i qaytarmır — yalnız `resource-match-groups/pending-review` qaytarır, o da yalnız PENDING_REVIEW olanlar üçün), ya da sadəcə "Qrup: XXXXXXXX (UUID-nin ilk 8 xanası)" kimi göstərin. Bu, bilinən bir məhdudiyyətdir — istəsəniz backend-dən `matchKey`-in bu endpoint-ə də əlavə olunmasını sonra tələb edə bilərsiniz, hazırkı fazada yoxdur.

---

## 7. Görünürlük dəyişikliyi: `404` indi 2 fərqli məna daşıya bilər

`GET /api/resources/{id}`, `PUT`, `DELETE`, `GET /api/resource-prices/{id}`, `PUT`, `/current`, `/history` üçün `404` indi ya:
1. Sətir həqiqətən mövcud deyil, **ya da**
2. Sətir mövcuddur, amma **başqa bir təşkilata məxsusdur** və sizin `organizationId`-niz uyğun gəlmir, **və** sizdə `VIEW_ALL_ORGANIZATION_RESOURCES` yoxdur (yəni `isCentralAdmin === false`).

Bu iki hal **fərqləndirilə bilməz** (backend qəsdən eyni mesajı qaytarır, mövcudluğu sızdırmamaq üçün). Frontend-də: `404` mesajını dəyişməyin, sadəcə generic saxlayın: **"Tapılmadı və ya bu qeydə girişiniz yoxdur."** — istifadəçini çaşdırmayın "mövcud deyil" ilə (çünki bəlkə var, sadəcə başqasınındır).

Eyni şəkildə, **siyahı/axtarış ekranlarında** (`GET /api/resources`, `GET /api/resource-prices/search` və s.) başqa təşkilatların sətirləri sadəcə **görünmür** (xəta yoxdur, sadəcə az nəticə) — bu, gözlənilən davranışdır, "niyə az data var" deyə narahat olmayın, izahını istifadəçiyə lazım gəlsə belə göstərin: adi istifadəçilər üçün "Yalnız öz təşkilatınızın və ümumi resurslar göstərilir." kimi kiçik bir qeyd, `isCentralAdmin` üçün isə "Bütün təşkilatların məlumatları göstərilir (mərkəzi baxış)." kimi.

---

## Naviqasiya strukturu — yenilənmiş tam sxem

```
Sidebar:
├── Resource Categories (mövcud)
├── Resources (mövcud, + Təşkilat chip-i əlavə olunur siyahı/detail-da)
│   └── Resource Detail
│       ├── General
│       ├── Attributes
│       ├── Prices (mövcud, indi FLAGGED statusu + createdBy-əsaslı edit qaydası ilə)
│       └── Bazar Qiyməti  ← YENİ tab (bölmə 6)
├── Reference Data (mövcud: Units/Regions — **Suppliers 2026-08-04-də silinib, menyudan çıxarın**)
└── Admin Panel  ← YENİ menyu, YALNIZ isCentralAdmin (SUPER_ADMIN/ADMIN) üçün görünsün
    ├── Kənar Dəyər Qiymətlər (Flagged Prices)   — bölmə 4
    ├── Uyğunlaşdırma Baxışı (Match Group Review) — bölmə 5
    └── Bazar Qiymətləri (Market Averages, opsional geniş baxış) — bölmə 6, nöqtə 2
```

**Qeyd:** "Admin Panel" menyusunun özü `isCentralAdmin` şərtinə bağlıdır (çünki içindəki 2/3 ekran `COST_APPROVE` tələb edir), amma "Bazar Qiymətləri" alt-ekranı texniki olaraq `COST_READ` kifayətdir — istəsəniz bunu ayrıca, bütün istifadəçilərə açıq bir menyu elementi kimi də yerləşdirə bilərsiniz (məs. sidebar-da ayrıca "Bazar Analizi"), sırf UX seçimidir, backend məhdudiyyəti yoxdur.

---

## Xülasə cədvəl — bu fazalarda dəyişən/əlavə olunan hər şey

| Nə | Əvvəl | İndi |
|---|---|---|
| `GET /api/auth/me` | `roles` yalnız | + `organizationId`, `actorType` |
| `ResourceResponse` | — | + `organizationId`, `matchGroupId` |
| `CreateResourceRequest` | — | + opsional `organizationId` (yalnız mərkəzi admin üçün mənalı) |
| `PriceStatus` | 1/2/3 | + `4` (FLAGGED) |
| Qiymət redaktə/approve/reject | yalnız `status===1` | `status===1 || status===4`, **+ edit üçün `createdBy` şərti** |
| `GET /api/resources`, `/api/resource-prices/*` | filtrsiz | təşkilat-görünürlük filtrli (404/az nəticə = normal) |
| **`GET /api/resource-prices/flagged`** | yox idi | YENİ (`COST_APPROVE`) |
| **`GET/PATCH /api/resource-match-groups/...`** | yox idi | YENİ (`COST_APPROVE`) |
| **`GET /api/resource-prices/averages`** | yox idi | YENİ (`COST_READ`, filtrsiz) |
| `organizations` CRUD | — | **HƏLƏ DƏ YOXDUR** (bilinən məhdudiyyət) |
