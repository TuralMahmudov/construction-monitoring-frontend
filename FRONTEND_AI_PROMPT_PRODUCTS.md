# CCMS Frontend — Products/Resources Ayrılması (Kataloq vs Elan)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas 8 modul), **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`** (təşkilat modeli) və **`FRONTEND_AI_PROMPT_RESOURCE_CREATION.md`**-un (struktur atribut lüğəti + "resurs yarat" formu) **davamı deyil, ƏVƏZLƏYİCİSİDİR** — bax bölmə 0.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

> **2026-07-31 yeniləməsi:** `specification`/`manufacturer`/`brand`/`model` bu sənədin əvvəlki versiyasında `product`-da idi — **artıq deyil**, bu 4 sahə `resource`-a köçüb (bax bölmə 0-ın son sətri və bölmə 2/3/4/6/8). Səbəb: eyni product-u fərqli təşkilat fərqli brenddə sata bilər, ona görə brend/spesifikasiya elana (resource) xasdır, product-un paylaşılan identitetinə yox. `product.description` isə artıq client-dən gəlmir — server kateqoriya adı + atributlardan avtomatik qurur.

## ⚠️ 0. Ən vacib xəbərdarlıq — köhnə 3 sənəddə NƏ ARTIQ YANLIŞDIR

Bu, backend-də **2026-07-30** tarixində edilmiş böyük bir struktur dəyişikliyidir: `resources` cədvəli iki fərqli şeyə bölündü:

1. **`product`** — "bu nədir?" (kateqoriya, atributlar, ölçü vahidi) + öz sabit `code`-u + server-generated `description`. Bir kateqoriyada **eyni atribut kombinasiyası = həmişə eyni product**.
2. **`resource`** ("elan"/"listing") — "kim, hansı qiymətə, hansı brenddə satır?" `productId` + `organizationId` + `status` + **`specification`/`manufacturer`/`brand`/`model`** (2026-07-31-dən etibarən, bax aşağıdakı xəbərdarlıq qutusu).

Köhnə 3 sənəddə bunlar oxuyub istifadə etsəniz **404/400/xəta** alacaqsınız — köhnə sənədə deyil, **BU SƏNƏDƏ** güvənin:

| Köhnə sənəd, bölmə | Nə deyirdi | Niyə artıq YANLIŞDIR |
|---|---|---|
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 1.5 | `POST /api/resource-attributes { resourceId, categoryAttributeDefinitionId, value }` | Endpoint **silinib**. Atributlar indi `resource`-a yox, `product`-a bağlanır, və resurs yaradılmazdan ƏVVƏL, `POST /api/products` çağırışının bir hissəsi kimi göndərilir (bax § 2). |
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 2 | `POST /api/resources { categoryId, name, unitId, specification, manufacturer, brand, model, ... }` | Body tamamilə dəyişib: indi yalnız `{ productId, organizationId? }` (bax § 3). Bu sahələr artıq `POST /api/products`-a aiddir. |
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 3 | `GET /api/resources/manufacturers\|brands\|models` | Endpoint-lər **köçürülüb** → `GET /api/products/manufacturers\|brands\|models` (eyni forma). |
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 5 | "Resurs Yarat" tək-pəncərə axını (kateqoriya+atribut+əsas məlumat+`POST /api/resources`) | Axın **iki addıma** bölündü: əvvəlcə `POST /api/products` (kateqoriya+atribut+əsas məlumat, find-or-create), sonra `POST /api/resources { productId }` (bax § 6). |
| `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` § 2 | `ResourceResponse.matchGroupId` | Sahə **yoxdur** artıq. `ResourceResponse` indi `productId` + tam gömülü `product` obyekti daşıyır (bax § 3). |
| `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` § 5 | `GET/PATCH /api/resource-match-groups/pending-review\|confirm` | Endpoint-lər **köçürülüb** → `GET/PATCH /api/products/pending-review\|/{id}/confirm` (bax § 7), cavab forması dəyişib (`MatchGroupReviewResponse` → `ProductReviewResponse`). |
| `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` § 6 | `GET /api/resource-prices/averages?matchGroupId=` | Query param adı dəyişib → `?productId=` (bax § 8). Cavabdakı `matchGroupId` sahəsi də `productId`-yə çevrilib. |

**Dəyişməyənlər (bu sənəd təkrarlamır, köhnə sənədlərə güvənin):** auth axını, `PageResponse<T>`/`ApiResponse` zərfi, `PriceStatus`/hibrid təsdiq modeli, `organization_id` görünürlük qaydaları (404 iki mənalı ola bilər), `FLAGGED` qiymət review-u (`/api/resource-prices/flagged`), rəqəm input/dialoq-bağlama UX qaydaları (`RESOURCE_CREATION.md` § 6).

---

## 1. Yeni mental model — 1 cümlə ilə

**Product = kataloq kartı (nə satılır, öz kodu ilə). Resource = o kartın altında bir təşkilatın elanı (kim, neçəyə).** Eyni product-u 5 fərqli təşkilat elan edə bilər — hamısı eyni `productId`-yə bağlanır, amma öz `resourceId`-si (və öz qiymətləri) var.

**Ölçü vahidi (`unitId`) da `resource`-dan `product`-a köçdü** — vahid məhsulun daxili xüsusiyyətidir (məs. "polad boru" → metr), elanın yox. `GET /api/units` özü dəyişməyib, sadəcə hansı cədvəl ona istinad edir dəyişib: `product.unitId` var, `resource.unitId` **yoxdur** (§ 2, § 3.2).

```
resource-categories (ağac, dəyişməyib)
        │
        ▼  (category + atributlar)
    products  ←──────────────┐  product_attributes
    öz `code`-u                atribut dəyərləri (auto-fill)
        │
        ▼  productId
    resources  (təşkilatın elanı: yalnız productId+organizationId+status)
        │
        ▼  resourceId
    resource_prices  (dəyişməyib)
```

---

## 2. `POST /api/products` — find-or-create (ƏN VACİB yeni endpoint)

Bu, köhnə `POST /api/resources`-un "atribut+əsas məlumat" hissəsinin yerini tutur. Kateqoriya + atribut dəyərləri göndərirsiniz; backend **avtomatik qərar verir**: eyni kombinasiya artıq varsa mövcud product-u qaytarır, yoxdursa yenisini yaradır.

```json
// POST /api/products
{
  "categoryId": "uuid",
  "name": "Armatur Ø15",
  "unitId": "uuid",
  "attributes": [
    { "categoryAttributeDefinitionId": "uuid-of-the-LINK", "value": "15" }
  ]
}
```
> **DƏYİŞİB (2026-07-31):** `description`/`specification`/`manufacturer`/`brand`/`model` bu body-də **artıq yoxdur**. `description` server tərəfindən avtomatik qurulur (kateqoriya adı + göndərilən atributlar, aşağıda), digər 3 sahə isə `POST /api/resources`/`POST /api/resources/mine` body-sinə köçüb (bax § 3, § 4) — çünki bunlar elana (kim, hansı brenddə satır) aiddir, məhsulun paylaşılan identitetinə yox.

- `attributes[].categoryAttributeDefinitionId` — **eyni ID** `GET /api/resource-categories/{categoryId}/attributes`-dan gəlir (`RESOURCE_CREATION.md` § 1.4-də təsvir olunan "LINK id"-i, dəyişməyib). Boş buraxıla bilər (`[]`) — o zaman `matchKey` boş olur və yaradılan product `reviewStatus=2 (PENDING_REVIEW)` alır (bax § 7).
- `name`/`unitId` — **yalnız yeni product yaradılırsa istifadə olunur**. Əgər eyni kombinasiya artıq varsa, bu sahələr sükutla nəzərə alınmır və mövcud product-un öz (əvvəlcədən yadda saxlanmış) dəyərləri qaytarılır.

**Cavab:**
```json
// 201 (yeni yaradıldı) və ya 200 (mövcud tapıldı)
{
  "success": true,
  "message": "Product created" /* və ya "Existing product matched" */,
  "data": {
    "matched": false,   // true = mövcud product tapıldı, false = yeni yaradıldı
    "product": {
      "id": "uuid", "categoryId": "uuid", "code": "MAT-000001",
      "name": "Armatur Ø15",
      "description": "Armatur — Diametr: 15",
      "unitId": "uuid", "reviewStatus": 1, "active": true,
      "createdBy": "uuid", "createdDate": "...", "modifiedBy": "uuid", "modifiedDate": "..."
    }
  }
}
```
- **`description`-ı formda göstərin, amma redaktə edilə bilən input kimi YOX** — bu, backend-də `kateqoriyanın adı + "attributeName: value, ..."` şəklində avtomatik qurulur (`"Armatur — Diametr: 15"` kimi) və heç bir sorğuda client tərəfindən göndərilmir/dəyişdirilmir.
- **`matched: true` gələndə istifadəçiyə bildirin**: "Bu xüsusiyyətlərlə artıq mövcud bir məhsul var: **{code} — {name}**. Elanınız bu məhsul altında yaradılacaq." (formdakı `name` sahəsi göndərilən dəyərlə DEYİL, qayıdan `product.name` ilə əvəz olunmalıdır ki, istifadəçi çaşmasın).
- `matched: false` gələndə: "Yeni məhsul yaradıldı: **{code}**." — bu, adi axışdır, xəbərdarlıq lazım deyil.

### 2.1 `GET /api/products/{id}` və `GET /api/products/{id}/attributes`

```
GET /api/products/{id}            → yuxarıdakı "product" forması (tək obyekt, zərfsiz data)
GET /api/products/{id}/attributes → List<ProductAttributeResponse>
```
```json
[
  {
    "id": "uuid", "productId": "uuid",
    "categoryAttributeDefinitionId": "uuid", "attributeDefinitionId": "uuid",
    "attributeName": "Diametr", "dataType": 1, "value": "15",
    "unitCode": "MM", "unitSymbol": "mm",
    "sortOrder": 0, "searchable": true, "required": false, "affectsMatchGroup": true, "active": true
  }
]
```
Bu, mövcud bir product seçiləndə (bax § 6.2) formu **auto-fill** etmək üçün istifadə olunur — ad/tip/vahid artıq cavabda var, əlavə sorğu lazım deyil (`RESOURCE_CREATION.md` § 1.5-dəki eyni prinsip).

### 2.2 `PUT /api/products/{id}` — YALNIZ kosmetik sahələr

```json
// PUT /api/products/{id}
{ "name": "...", "active": true }
```
`categoryId`/`attributes`/`unitId`/`code`/`description` **dəyişməzdir** — bunları redaktə forması heç göstərməsin (`description` avtomatik qaldığı üçün, `specification`/`manufacturer`/`brand`/`model` isə artıq burada deyil — onları redaktə etmək üçün bax § 3.3). Xüsusiyyətləri dəyişmək istəyən istifadəçi əslində **fərqli bir product** axtarır (yeni `POST /api/products` çağırışı ilə).

### 2.3 `PATCH /api/products/{id}/enable` \| `/disable`

Body yoxdur. Product-u kataloqdan gizlədir (yeni elanlar üçün seçilə bilməz), amma mövcud elanlara toxunmur. Silmə endpoint-i yoxdur (bilərəkdən — çoxlu elan istinad edə bilər).

### 2.4 `GET /api/products` — siyahı/axtarış

```
GET /api/products?category={categoryId}&name=&code=&unit=&active=&attributeName=&attributeValue=&page=0&size=20&sort=name
```
`COST_READ`. **Bu, kateqoriya ağacında "bu kateqoriyanın altındakı məhsullar" siyahısını qurmaq üçün əsas endpoint-dir** (bax § 6.1) — `category={leafCategoryId}` ilə çağırın. `manufacturer`/`brand` filtrləri **artıq burada deyil** (bu sahələr `product`-da yoxdur) — brendə görə axtarış lazımdırsa `GET /api/resources` üzərindən aparılmalıdır (bax § 3.4).

### 2.5 Autocomplete — YENİDƏN köçüb (2026-07-31)

> Bu sənədin əvvəlki versiyası bu endpoint-ləri `/api/resources/...` → `/api/products/...` kimi göstərirdi. **Bu artıq YANLIŞDIR** — 2026-07-31-də geri, `/api/resources/...`-a köçürüldü, çünki manufacturer/brand/model artıq `product`-da deyil, `resource`-dadır:

```
GET /api/resources/manufacturers?search=nor
GET /api/resources/brands?search=
GET /api/resources/models?search=bo
```
Forma/istifadə eyni qalıb (siyahı halında string array) — path `/api/products/...` DEYİL, `/api/resources/...`.

---

## 3. `resources` — indi sadəcə "elan"

### 3.1 `POST /api/resources`

```json
// köhnə (artıq YANLIŞ, 4t dövrü): { productId, organizationId }
// YENİ (2026-07-31):
{
  "productId": "uuid",
  "organizationId": "yalnız mərkəzi admin üçün mənalı, adi istifadəçi göndərməsin",
  "specification": "opsional",
  "manufacturer": "Norm",
  "brand": "opsional",
  "model": "opsional"
}
```
- `productId` — § 2-dəki `POST /api/products` cavabından gələn `product.id`.
- `organizationId` — dəyişməyib: adi istifadəçi üçün formaya qoymayın (server öz təşkilatını avtomatik yazır), yalnız mərkəzi admin üçün advanced/gizli-defolt sahə.
- **`manufacturer` MƏCBURİDİR** (boş/yox olsa `400` + `"Manufacturer is required"`). `specification`/`brand`/`model` opsionaldır. Bunlar bu elana xasdır — eyni `productId`-yə bağlanan başqa bir `resource` fərqli `manufacturer`/`brand`/`model` göstərə bilər (§ 1-dəki misal: Vendor A "Norm", Vendor B "AzTexnika").

### 3.2 `ResourceResponse` — `product`-dan ayrı, öz sahələri ilə

```json
{
  "id": "uuid",
  "productId": "uuid",
  "product": {
    "id": "uuid", "categoryId": "uuid", "code": "MAT-000001", "name": "Armatur Ø15",
    "description": "Armatur — Diametr: 15",
    "unitId": "uuid", "reviewStatus": 1, "active": true,
    "createdBy": "uuid", "createdDate": "...", "modifiedBy": "uuid", "modifiedDate": "..."
  },
  "specification": "DN100 SCH40",
  "manufacturer": "Norm",
  "brand": "Norm",
  "model": "NP-100",
  "organizationId": "uuid-or-null",
  "status": null,
  "active": true,
  "createdBy": "uuid", "createdDate": "...", "modifiedBy": "uuid", "modifiedDate": "..."
}
```
- **Vacib UI qaydası:** `code`/`name`/atribut/unit/`description` **`resource.product.*`-dan** oxunur, amma **`specification`/`manufacturer`/`brand`/`model` birbaşa `resource.*`-dan** oxunur (`resource.product.*`-da DEYİL — bu sənədin əvvəlki versiyasında bu 4 sahə `product` içində idi, artıq `resource`-un özündədir). Yəni Resource Detail başlığı `resource.product.code + " — " + resource.product.name`, brend sətri isə `resource.manufacturer` / `resource.brand` / `resource.model`.
- `matchGroupId` sahəsi **yoxdur** (`ADMIN_PANEL.md` § 2-nin yerini `productId`+`product` tutur).

### 3.3 `PUT /api/resources/{id}` — `active` + brend sahələri

```json
{ "active": false, "specification": "...", "manufacturer": "...", "brand": "...", "model": "..." }
```
`productId`/kateqoriya/atribut/unit **dəyişməzdir** — elanın nə olduğunu dəyişmək istəsəniz, yeni bir listing yaradın (fərqli/yeni `productId` ilə). Amma `specification`/`manufacturer`/`brand`/`model` bu elana aid olduğu üçün burada redaktə edilə bilər (məs. vendor öz brend adını düzəldirsə).

### 3.4 `GET /api/resources` — filtrlər

```
GET /api/resources?product={productId}&organization={orgId}&status=&active=&page=0&size=20&sort=createdDate
```
Köhnə `name/code/category/unit/attributeName/attributeValue` filtrləri **`GET /api/products`-dadır** (§ 2.4). Konkret bir product-un bütün elanlarını görmək üçün `?product={productId}` istifadə edin (Product Detail-də "Bu məhsulu satan təşkilatlar" siyahısı üçün əla, brendə görə fərqləndirmək üçün hər elanın öz `manufacturer`/`brand`-ına baxın, § 3.2).

### 3.5 `GET /{resourceId}/attributes` yoxdur, manufacturer/brand/model autocomplete `/api/resources`-dadır

`GET /api/products/{productId}/attributes` (§ 2.1) atributları verir. Manufacturer/brand/model autocomplete isə **`/api/resources/manufacturers|brands|models`**-dadır (bax § 2.5 — bu sənədin əvvəlki versiyasında `/api/products/...` idi, 2026-07-31-də geri köçürülüb).

---

## 4. "Mənim Resurslarım" (`/api/resources/mine`) — dəyişiklik

`POST /api/resources/mine` indi § 6-dakı ("Elan Yarat") **iki yolu da birbaşa dəstəkləyir** — hansı sahələrin göndərildiyinə görə backend özü ayırd edir:

**Yol A — mövcud product artıq seçilib (tree/siyahıdan):**
```json
// POST /api/resources/mine
{ "productId": "uuid", "manufacturer": "..." /* MƏCBURİ, bax aşağı */, "specification": "...", "brand": "...", "model": "..." }
```
`categoryId`/`name`/`description`/`unitId`/`attributes` bu yolda göndərilsə belə sükutla nəzərə alınmır (product artıq mövcuddur). **Amma `manufacturer` yenə də MƏCBURİDİR** — 2026-07-31-dən əvvəl bu yolda heç bir brend sahəsi lazım deyildi, indi isə `manufacturer`/`brand`/`model`/`specification` elana (resource-a) aid olduğu üçün productId olsa belə soruşulmalıdır.

**Yol B — kateqoriya seçilib, yeni/naməlum kombinasiya (`productId` göndərilmir):**
```json
// POST /api/resources/mine
{
  "categoryId": "uuid", "name": "...", "unitId": "uuid" /* bu ikisi MƏCBURİ bu yolda */,
  "manufacturer": "..." /* HƏMİŞƏ MƏCBURİ */, "specification": "...", "brand": "...", "model": "...",
  "attributes": [{ "categoryAttributeDefinitionId": "uuid", "value": "15" }]
}
```
> **DƏYİŞİB (2026-07-31):** `description` sahəsi bu body-dən silinib (product tərəfində avtomatik qurulur, bax § 2). `specification`/`manufacturer`/`brand`/`model` isə artıq product-a yox, birbaşa yaradılan `resource`-a yazılır.

Backend arxa planda `ProductService.resolve()` çağırır (§ 2 ilə eyni find-or-create, `name`/`unitId`/`attributes` ilə — `manufacturer` bu çağırışa DAXİL DEYİL), sonra `productId` ilə `SUBMITTED` statuslu bir listing yaradır, `specification`/`manufacturer`/`brand`/`model`-i həmin listing-ə (`resource`) yazır. `categoryId`/`name`/`unitId` yalnız **bu yolda** (productId göndərilməyəndə) məcburidir; `manufacturer` isə **hər iki yolda** məcburidir — boş/yox olsa `400` + `"Manufacturer is required"`.

**Frontend qaydası:** § 6.1 ("Mövcud məhsul seç") axınında `POST /api/products` çağırmağa **ehtiyac yoxdur** — birbaşa `POST /api/resources/mine { productId, manufacturer, ... }` kifayətdir.

`MyResourceResponse`/`MyResourceDetailResponse`-in forması dəyişməyib (`code`/`name`/`description`/`unitId` product-dan, `specification`/`manufacturer`/`brand`/`model` isə **indi resource-un özündən** doldurulur) — frontend tərəfində heç bir sahə adı dəyişikliyi lazım deyil, sadəcə hansı sorğuların bu sahələri MƏCBURİ elan etdiyi dəyişib (yuxarıda).

---

## 5. Kateqoriya + Product Ağacı (yeni UI konsepti)

İstifadəçinin əsl istəyi budur: **kateqoriya ağacında bir leaf-ə klikləyəndə onun altındakı product-ları görmək**, və mövcud product seçiləndə xüsusiyyətlərin avtomatik dolması.

```
Resource Categories (ağac, GET /api/resource-categories/tree)
  └─ Polad Boru (leaf)
       └─ [klikləndə] GET /api/products?category={buCategoryId}
            ├─ MAT-000001 — Armatur Ø15 (Norm)
            ├─ MAT-000002 — Armatur Ø20 (AzTexnika)
            └─ [+ Yeni Məhsul]  → § 6 axını
```
Bu, backend-də tək bir sxem DƏYİŞİKLİYİ deyil, sadəcə **iki mövcud endpoint-in (`/tree` + `/products?category=`) birlikdə istifadəsidir** — kateqoriya ağacı sorğusu özü dəyişməyib, yüngül qalsın deyə product siyahısı ayrıca, leaf seçiləndə yüklənir.

---

## 6. Yeni axın — "Elan Yarat" (əvəzləyir: `RESOURCE_CREATION.md` § 5 "Resurs Yarat")

> **2026-07-31 yeniləməsi:** forma iki mənbədən auto-fill alır — **kateqoriya** seçiləndə `Ad` dolur, **product** seçiləndə əlavə olaraq `Təsvir`/`Xüsusiyyətlər`/`Vahid` də dolur. `İstehsalçı`/`Brend`/`Model`/`Spesifikasiya` isə **hər iki halda həmişə** istifadəçidən soruşulur (bunlar `resource`-a yazılır, product-a nə seçildiyindən asılı olmayaraq).

```
──────────────────────────────────────────
 Elan Yarat
──────────────────────────────────────────
 Kateqoriya *   [Select/Autocomplete - /api/resource-categories/tree, leaf seçilir]
                 → seçiləndə "Ad" avtomatik kateqoriyanın adı ilə dolur (§ 6.2, addım 1)
 Məhsul         ( ) Mövcud məhsul seç      ( ) Yeni məhsul yarat
──────────────────────────────────────────
 İstehsalçı *   [autocomplete - /api/resources/manufacturers]     ← HƏMİŞƏ soruşulur
 Brend          [autocomplete - /api/resources/brands]            ← HƏMİŞƏ soruşulur (opsional)
 Model          [autocomplete - /api/resources/models]            ← HƏMİŞƏ soruşulur (opsional)
 Spesifikasiya  [mətn]                                             ← HƏMİŞƏ soruşulur (opsional)
──────────────────────────────────────────
```

### 6.1 "Mövcud məhsul seç" seçilərsə

1. `GET /api/products?category={categoryId}` — nəticəni (kod+ad ilə, artıq `manufacturer`/`brand` product-da olmadığı üçün cavabda yoxdur) siyahı/Autocomplete kimi göstərin.
2. İstifadəçi seçəndə: `product.description`/`product.unitId` avtomatik dolur, `GET /api/products/{id}/attributes` çağırıb xüsusiyyətləri **salt-oxunan** göstərin (istifadəçi bunları burada dəyişə bilməz — dəyişmək istəsə "Yeni məhsul yarat" seçməlidir).
3. İstehsalçı/Brend/Model/Spesifikasiya inputları **yenə də boş və redaktə oluna bilən qalır** — mövcud product seçilsə belə bunlar bu elana xasdır, product-dan gəlmir.
4. "Yadda saxla": `POST /api/resources { productId: seçilənId, manufacturer, brand, model, specification }`.

### 6.2 "Yeni məhsul yarat" seçilərsə (əsasən köhnə `RESOURCE_CREATION.md` § 5 axını, sadəcə son addım fərqli)

1. Kateqoriya seçiləndə: **Ad** sahəsi avtomatik seçilən kateqoriyanın `name`-i ilə dolur (istifadəçi istəsə dəyişə bilər); paralel olaraq `GET /api/resource-categories/{categoryId}/attributes` (dəyişməyib) çağırılıb dinamik xüsusiyyət inputları qurulur (`dataType`-a görə input tipi, `RESOURCE_CREATION.md` § 1.2/1.4 cədvəlləri **hələ də etibarlıdır**).
2. Əsas məlumat inputları: Ad (auto-doldurulmuş, redaktə oluna bilər), Vahid + doldurulmuş xüsusiyyətlər. **`description` inputu YOXDUR** — server avtomatik qurur (§ 2).
3. İstehsalçı/Brend/Model/Spesifikasiya inputları (yuxarıdakı diaqram) — bunlar `POST /api/products`-a DEYİL, sonrakı `POST /api/resources`-a gedəcək.
4. "Yadda saxla":
   a. `POST /api/products { categoryId, name, unitId, attributes: [...] }` çağırın (**`manufacturer`/`brand`/`model`/`specification` bu body-yə DAXİL ETMƏYİN**).
   b. Cavabdakı `matched`-ə baxın:
      - `matched: true` → istifadəçiyə xəbərdarlıq göstərin (bax § 2-dəki mətn), Ad/Təsvir sahələrini qayıdan `product`-un dəyərləri ilə əvəz edin.
      - `matched: false` → yeni yaradıldı, davam edin.
   c. `POST /api/resources { productId: cavabdakı product.id, manufacturer, brand, model, specification }` çağırın (bu 4 sahə istifadəçinin bu formda doldurduğu dəyərlərdir, addım (a)-dan asılı deyil).
5. Uğurlu olsa Resource Detail-ə yönləndirin.

**Diqqət:** addım (a) və (c) **ardıcıl iki HTTP çağırışıdır** — (a) uğursuz olsa (b)/(c)-yə keçməyin, (a)-nın öz validasiya xətalarını (400 — keçərsiz `NUMBER`/`ENUM` dəyəri, `RESOURCE_CREATION.md` § 1.5-dəki eyni qaydalar) formada göstərin; (c)-nin öz validasiyası isə `manufacturer` boşdursa `400 "Manufacturer is required"` qaytarır.

---

## 7. Aşağı-əminlikli Product Review (`ADMIN_PANEL.md` § 5-i əvəz edir)

```
GET /api/products/pending-review    (COST_APPROVE)
PATCH /api/products/{id}/confirm    (COST_APPROVE)
```
```json
// GET /pending-review → PageResponse<ProductReviewResponse>
{
  "id": "uuid", "categoryId": "uuid", "code": "MAT-000003", "name": "...",
  "matchKey": "", "createdDate": "2026-07-30T...", "reviewStatus": 2,
  "listings": [ { "id": "uuid", "organizationId": "uuid-or-null" } ]
}
```
- Forma demək olar eynidir (`ADMIN_PANEL.md` § 5.1), fərqlər: sahə adı `resources` → **`listings`** oldu, hər element daxilində artıq `code`/`name` **yoxdur** (çünki listing-in özündə bu sahələr yoxdur) — sadəcə `id`/`organizationId`. Ekranda "İçindəki elanlar" sütununda ad/kod göstərmək lazım deyil, bunun əvəzinə **product-un öz `code`/`name`-i onsuz da sətrin başındadır** — göstərmək istədiyiniz məhz elan sayı/təşkilat sayıdır ("3 təşkilat bu məhsulu elan edir" kimi).
- `PATCH /{id}/confirm` — body yoxdur, cavab yenilənmiş `ProductReviewResponse` (`reviewStatus: 1`), sətir siyahıdan yox olur. **Eynidir**, sadəcə path dəyişib.

Naviqasiya: "Admin Panel" → "Uyğunlaşdırma Baxışı" adı **"Məhsul Baxışı" (Product Review)** kimi yenilənə bilər (məcburi deyil, sırf UX).

---

## 8. Bazar Qiyməti Analitikası — `productId` ilə (`ADMIN_PANEL.md` § 6-nı əvəz edir)

```
GET /api/resource-prices/averages?productId=&regionId=&name=&page=&size=&sort=
```
```json
{
  "productId": "uuid",          // əvvəlki adı matchGroupId idi
  "categoryId": "uuid", "resourceName": "Armatur Ø15",
  "regionId": "uuid", "avgPrice": 210.0000, "medianPrice": 210.0000,
  "minPrice": 200.0000, "maxPrice": 220.0000, "sampleCount": 2, "calculatedAt": "..."
}
```
- **query param və cavab sahəsi adı `matchGroupId` → `productId`** (`ADMIN_PANEL.md` § 6-da təsvir olunan trimmed mean/median göstərimi, boş nəticə davranışı — dəyişməyib).
- **DƏYİŞİB (2026-07-31): `manufacturer`/`brand`/`model` bu cavabdan tamamilə ÇIXARILDI.** Səbəb: bu sorğu `(productId, regionId)` üzrə **bir neçə təşkilatın qiymətini birlikdə** ortalayır, hər təşkilatın öz brendi ola bilər (§ 1) — ortalanan qrupu düzgün təsvir edən TƏK bir manufacturer/brand/model yoxdur, ona görə göstərilmir. Bu 3 sahəyə görə filtr/sıralama da yoxdur. Brendə görə məlumat lazımdırsa, bu, artıq "bazar ortalaması" deyil, konkret elanlar səviyyəsindədir — `GET /api/resources?product={productId}` ilə həmin product-un bütün elanlarını (hər birinin öz `manufacturer`/`brand`/`model`-i ilə, § 3.2) çəkin.
- **Resource Detail → "Bazar Qiyməti" tab-ı:** açılışda çağırılan sorğu `?productId={resource.productId}` olur — `resource.productId` həmişə doludur (`NOT NULL`).

---

## 9. Xülasə cədvəl

| Nə | Əvvəl (köhnə 3 sənəd) | İndi |
|---|---|---|
| Məhsul identiteti haradadır | `resources` cədvəlində (hər elan öz kopyasını saxlayırdı) | `products`-da (bir dəfə, öz `code`-u ilə) |
| Elan (listing) yaratmaq | `POST /api/resources` (bütün əsas məlumat+atribut) | `POST /api/products` (əsas məlumat+atribut, find-or-create) → `POST /api/resources { productId, manufacturer, ... }` |
| Atribut əlavə etmək | `POST /api/resource-attributes { resourceId, ... }` | `POST /api/products` body-sinin `attributes[]` sahəsi (yaradılış anında, toplu) |
| Atribut redaktəsi | `PUT/DELETE /api/resource-attributes/{id}` | **Yoxdur** — fərqli atribut = fərqli product, yeni `POST /api/products` |
| `specification`/`manufacturer`/`brand`/`model` haradadır | `resources`-da (2026-07-20-dən əvvəl) → `products`-da (4t, 2026-07-30) | **`resources`-da (2026-07-31-dən etibarən, yekun qərar)** — hər elan öz brendini göstərə bilər |
| `product.description` | client göndərirdi (sərbəst mətn) | **server qurur**: kateqoriya adı + atributlar, client-dən gəlməz |
| İstehsalçı/Brend/Model autocomplete | `/api/resources/manufacturers\|brands\|models` (4t-dən əvvəl) → `/api/products/...` (4t) | **`/api/resources/manufacturers\|brands\|models`** (2026-07-31, geri köçüb) |
| `ResourceResponse.matchGroupId` | var idi | yoxdur — `productId`+gömülü `product`, üstəlik öz `specification`/`manufacturer`/`brand`/`model` sahələri |
| Aşağı-əminlik review | `/api/resource-match-groups/pending-review\|confirm` | `/api/products/pending-review\|/{id}/confirm` |
| Bazar orta qiymət sorğusu | `?matchGroupId=` | `?productId=`, cavabda **`manufacturer`/`brand`/`model` yoxdur** (2026-07-31) |
| `resource.code`/`resource.name`/`description`/atribut/unit haradan oxunur | birbaşa `resource.*` | `resource.product.*` |
| `resource.specification`/`manufacturer`/`brand`/`model` haradan oxunur | — | **birbaşa `resource.*`** (`resource.product.*` DEYİL) |

---

## 10. Ekran naviqasiyası — dəyişən hissələr

```
Sidebar:
├── Resource Categories (dəyişməyib)
│     └── [leaf seçiləndə] altında Product siyahısı (§ 5) — YENİ
├── Products  ← YENİ, ayrıca da açıla bilər (GET /api/products, filtrsiz axtarış)
│     └── Product Detail
│         ├── General (code/name/description — yalnız name redaktə oluna bilər, § 2.2)
│         ├── Attributes (salt-oxunan, § 2.1)
│         └── Elanlar (bu məhsulu satan təşkilatlar, hər biri öz istehsalçı/brend/modeli ilə — GET /api/resources?product={id})
├── Resources (mövcud, indi "Elanlar" kimi düşünün)
│     └── Resource Detail
│         ├── General (code/name/description/unit resource.product.*-dan; istehsalçı/brend/model/spesifikasiya resource.*-dan, § 3.2)
│         ├── Prices (dəyişməyib)
│         └── Bazar Qiyməti (?productId=, istehsalçı/brend/model göstərilmir, § 8)
└── Admin Panel
      ├── Kənar Dəyər Qiymətlər (dəyişməyib)
      ├── Məhsul Baxışı (əvvəlki "Uyğunlaşdırma Baxışı", § 7)
      └── Bazar Qiymətləri (indi productId əsaslı, § 8)
```
