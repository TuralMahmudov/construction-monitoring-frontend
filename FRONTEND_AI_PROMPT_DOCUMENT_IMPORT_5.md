# CCMS Frontend — Sənəd İdxalı + Toplu Resurs Yaratma + Bildirişlər (TİKİLİB, canlı test edilib)

> ## ✅ Bu fayl `FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_1/2/3/4.md`-i ƏVƏZ EDİR
> Əvvəlki fayllar (`_1`-`_4`) TƏKLİF idi — kod yoxdu, sadəcə dizayn müzakirəsi idi. **Bu fayl
> artıq tikilmiş, canlı Postgres+MinIO-ya qarşı test edilmiş backend-i təsvir edir.** `_4`-də
> razılaşdırılan dizayn demək olar dəyişmədən icra olundu — fərqlər aşağıda "§8: `_4`-dən fərqlər"
> bölməsində aydın işarələnib. Kod yazmağa başlaya bilərsiniz.
>
> Tam detal/canlı test nəticələri: `PROJECT_STATUS.md` bölmə **4bb**.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## 0. Gating — YENİ: `/api/auth/me` indi `permissions` qaytarır

Əvvəlki fayllarda açıq sual idi (§9.3), indi həll olunub: `GET /api/auth/me` cavabına
`permissions: string[]` sahəsi əlavə olundu (istifadəçinin bütün rollarındakı icazələrin
birləşməsi). Artıq rol adlarını hardcode etməyə ehtiyac yoxdur:

```json
{
  "roles": ["ANALYST"],
  "permissions": ["COST_READ", "COST_WRITE", "REPORT_READ", "REPORT_EXPORT",
                  "VIEW_ALL_ORGANIZATION_RESOURCES", "DOCUMENT_UPLOAD", "DOCUMENT_REVIEW"]
}
```

Bu modulda istifadə olunan icazələr:

| İcazə | Kim üçün | Nə üçün |
|---|---|---|
| `DOCUMENT_UPLOAD` | Təşkilat (vendor) hesabları | `POST /api/documents`, `GET /mine` |
| `DOCUMENT_REVIEW` | Mərkəzi işçi | Bütün sənədlərə baxış, kilid, status, bulk-create |
| `COST_WRITE` | Mərkəzi işçi (bulk-create üçün əlavə) | Resurs/qiymət yaratma |
| `VIEW_ALL_ORGANIZATION_RESOURCES` | Mərkəzi işçi (bulk-create üçün əlavə) | Vendor adından resurs/qiymət yaratmaq |

`Emal et`/`Bulk create` düyməsini göstərmək üçün: `permissions.includes('DOCUMENT_REVIEW') &&
permissions.includes('COST_WRITE') && permissions.includes('VIEW_ALL_ORGANIZATION_RESOURCES')`.
Canlı DB-də bu üçünü də daşıyan hazır rol: `ANALYST` (və `ADMIN`/`SUPER_ADMIN`).

`DOCUMENT_UPLOAD`-u olan istifadəçi əgər `organizationId === null`-dursa (mərkəzi hesab), upload
düyməsi YENƏ DƏ göstərilməməlidir — backend bunu `400`-lə rədd edir (`organizationId != null`
şərti həm icazədən, həm bu yoxlamadan asılıdır).

---

## 1. Vendor tərəfi: sənəd yükləmə

### 1.1 `POST /api/documents` (multipart, `DOCUMENT_UPLOAD`)

```
Content-Type: multipart/form-data
file: <binary>              — .xlsx/.xls/.pdf/.doc/.docx/.jpg/.jpeg/.png (başqası → 400)
description: "..."          — opsional, sərbəst mətn, form field (query/body param, fayl deyil)
```

Max fayl ölçüsü: **20MB** (aşarsa `400 "The uploaded file exceeds the maximum allowed size"`).

```json
// 201
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "id": "2d9ecad7-...",
    "organizationId": "62962fa4-...",
    "organizationName": "Acme Construction Supplies",
    "uploadedBy": "0fb44dce-...",
    "uploadedByName": "acme-vendor",
    "originalFilename": "qiymetler_2026_Q3.xlsx",
    "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "fileSize": 245678,
    "status": 1,
    "description": "2026 Q3 qiymət siyahısı",
    "createdAt": "2026-08-10T10:15:00Z"
  }
}
```

`status` — INTEGER (əvvəlki `_4`-də `"NEW"` kimi string plan olunmuşdu, real API rəqəm istifadə
edir): `1=NEW`, `2=IN_PROGRESS`, `3=COMPLETED`, `4=REJECTED`. Chip mapping:

| `status` | Ad | Rəng |
|---|---|---|
| `1` | Yeni | sarı |
| `2` | Emalda | mavi |
| `3` | Tamamlandı | yaşıl |
| `4` | Rədd edildi | qırmızı |

### 1.2 `GET /api/documents/mine` (paged, `DOCUMENT_UPLOAD`)

Öz təşkilatının sənədləri, standart `PageResponse` zərfi (`content/page/size/totalElements/
totalPages/last`). Hər element §1.1-dəki `data` formasındadır.

### 1.3 `GET /api/documents/{id}/download` (`DOCUMENT_UPLOAD` və ya `DOCUMENT_REVIEW`)

Auth-qorunan stream, `Content-Disposition: attachment; filename="..."` header-i ilə gəlir —
`window.open` yerinə blob-fetch + `<a download>` və ya birbaşa Authorization header-li `fetch`
lazımdır (sadə `<a href>` işləməz, çünki JWT header tələb olunur).

---

## 2. Mərkəzi tərəf: sənədlərin idarəsi

### 2.1 `GET /api/documents?organizationId=&status=&page=&size=` (`DOCUMENT_REVIEW`)

Bütün təşkilatların sənədləri. Sütunlar: `organizationName`, `originalFilename`,
`uploadedByName`, `createdAt`, `status` (chip), `processedByName` (varsa).

Sağdakı düymələr (statusa görə):

| `status` | Düymələr |
|---|---|
| `1` (NEW) | `Yüklə` + `Emal et` |
| `2` (IN_PROGRESS), `processedBy === mənim id-im` | `Yüklə` + `Emal et` (davam et) |
| `2` (IN_PROGRESS), başqasının | `Yüklə` + `Emal et` (deaktiv, tooltip: `processedByName`) |
| `3` (COMPLETED) | `Yüklə` + `Bax` (§5) |
| `4` (REJECTED) | `Yüklə` (izah `reviewComment`-də) |

### 2.2 `PATCH /api/documents/{id}/process` — "Emal et" (kilid, `DOCUMENT_REVIEW`)

Body yoxdur. Davranış:

- `NEW` → `IN_PROGRESS`, `processedBy`/`processedByName`/`processedDate` dolur, **`200`**.
- `IN_PROGRESS`, kilid mənimdir → **`200`**, dəyişiklik yoxdur (idempotent, "davam et" üçün
  təhlükəsiz təkrar çağırıla bilər).
- `IN_PROGRESS`, kilid başqasınındır və **24 saatdan az köhnədir** → **`409`**:
  ```json
  { "status": 409, "error": "Conflict",
    "message": "This document is currently being processed by Əli Vəliyev" }
  ```
  Frontend bu mesajı olduğu kimi göstərə bilər (artıq ad daxildir).
- `IN_PROGRESS`, kilid başqasınındır amma **24 saatdan köhnədir** → kilid avtomatik sizə keçir,
  **`200`** (backend qərarı — açıq sual idi, bu formada bağlandı, konfiqurasiya olunan
  `ccms.documents.lock-timeout-hours`, defolt 24).
- `COMPLETED`/`REJECTED` → **`409`** ("...already COMPLETED and can no longer be processed").

### 2.3 `PATCH /api/documents/{id}/status` — rədd et / tamamla (`DOCUMENT_REVIEW`)

```json
{ "status": "REJECTED", "reviewComment": "Sənəd oxunmur, təkrar yükləyin" }
```
və ya
```json
{ "status": "COMPLETED" }
```

(`status` STRING olaraq göndərilir, `"COMPLETED"`/`"REJECTED"`, case-insensitive.)

- `REJECTED`: `NEW`/`IN_PROGRESS`-dan istənilən vaxt, **istənilən** `DOCUMENT_REVIEW` sahibi (kilid
  sahibi olmaq şərt deyil) çağıra bilər. `COMPLETED` sənəd üçün → `400 "A completed document
  cannot be rejected"`.
- `COMPLETED`: **yalnız hazırkı kilid sahibi**, sənəd `IN_PROGRESS` olmalıdır, əks halda `409
  "Only the employee currently processing this document (while it is IN_PROGRESS) may complete
  it"`. `reviewComment` bu halda opsionaldır.

---

## 3. "Emal et" — Toplu Resurs Yaratma forması

Bu, mövcud "yeni resurs" formundan (my-resources create) ayrı, yeni komponentdir.

### 3.1 Kateqoriya seçimi

Mövcud kateqoriya ağacı (`GET /api/resource-categories/tree`), yalnız leaf seçilə bilər — dəyişən
heç nə yoxdur.

### 3.2 Mövcud productların siyahısı — **yeni endpoint LAZIM DEYİL**

`GET /api/products?category={leafId}` artıq mövcuddur, məhz bu iş üçündür. Hər product
sətrində: `id`, `name`, `code`, `description` (avtomatik yaradılıb, atributları özündə göstərir),
`unitId`.

### 3.3 `POST /api/documents/{id}/resources` — toplu göndərmə (YENİ)

Auth: `DOCUMENT_REVIEW` **VƏ** `COST_WRITE` **VƏ** `VIEW_ALL_ORGANIZATION_RESOURCES` (§0-dakı
gating cədvəli). Əlavə şərt (backend yoxlayır): sənəd **`IN_PROGRESS`** olmalı və **kilid sizin
üzərinizdə** olmalıdır (§2.2-ni əvvəlcə çağırın) — əks halda `409`.

Request:

```json
{
  "rows": [
    {
      "productId": "da97043d-aa62-4650-b252-d879fa7b8ecf",
      "manufacturer": "Polad Zavodu MMC",
      "brand": "Optional",
      "model": "Optional",
      "specification": "Optional",
      "price": {
        "regionId": "c8c87266-ebf9-4118-8a55-823ee6fea18a",
        "price": 125.50,
        "currency": "AZN",
        "effectiveDate": "2026-08-10",
        "expireDate": null,
        "comment": "Optional"
      }
    },
    {
      "newProduct": {
        "categoryId": "87dd460a-a991-4fb0-8c56-de8c2104bd0d",
        "name": "Yeni Məhsul Adı",
        "unitId": "d9650623-0c08-4dca-be92-012dfc35454d",
        "attributes": []
      },
      "manufacturer": "Başqa MMC"
    }
  ]
}
```

- Hər sətirdə **ya `productId`, ya `newProduct`** (ikisi eyni anda YOX) — "+ Yeni product" sətri
  üçün `newProduct` göndərin, mövcud find-or-create (`matchKey`) yoxlaması avtomatik işləyir: eyni
  kateqoriya+atributlarla product artıqsa təzəsi yaranmır, mövcud olana bağlanır.
- `manufacturer` məcburidir (boş ola bilməz), qalanı opsional.
- `price` tamamilə opsionaldır — göndərilməsə, resurs qiymətsiz yaranır, sonra ayrıca əlavə oluna
  bilər (mövcud `POST /api/resource-prices` və ya `PriceSection` axını).
- `price.regionId`/`price/currency`/`effectiveDate` price obyekti göndərilirsə məcburidir.
  `vat` YOXDUR bu formda (avtomatik `0` qoyulur, "Mənim Resurslarım"-ın sadələşdirilmiş qiymət
  forması ilə eyni).

Response (**`201`**, hər sətir müstəqildir — biri uğursuz olsa digərləri təsir görmür):

```json
{
  "success": true,
  "data": {
    "results": [
      { "index": 0, "success": true, "resourceId": "e91a7c36-..." },
      { "index": 1, "success": true, "resourceId": "5b89ecea-..." },
      { "index": 2, "success": false, "error": "Region not found: 00000000-..." }
    ]
  }
}
```

Frontend `success: false` olan sətirləri qırmızı işarələyib `error` mesajını göstərsin, istifadəçi
o sətri düzəldib **yenidən göndərə bilsin** (yalnız uğursuz sətirlərlə yeni `POST` çağırışı kifayət
edir — uğurlu sətirlər artıq DB-dədir, təkrar göndərməyə ehtiyac yoxdur).

Bu addım **kateqoriya üzrə təkrarlana bilər** (dəfələrlə `POST` çağırıla bilər, hər dəfə fərqli
kateqoriya/sətirlərlə) — sənəd `IN_PROGRESS` qaldığı müddətcə.

Yaranan hər resursda `documentId` sahəsi bu sənədin id-sinə bərabərdir (§5).

### 3.4 "X" (çıxar) düyməsi

Bu, **tamamilə frontend-only** konseptdir — backend-ə heç nə göndərilmir. Sadəcə istifadəçi bu
sessiyada həmin sətri doldurmaq istəmirsə, formdan gizlədin/çıxarın (state-də saxlamayın). Eyni
kateqoriyanı sonra yenidən "Emal et" ilə açsanız, bütün mövcud productlar yenidən görünəcək (bu
seçim persist olunmur — qəsdən belədir).

---

## 4. "Emalı bitir" (§2.3-dəki `PATCH .../status {COMPLETED}`)

Kateqoriya bitdikdə DEYİL — bütün sənəd üzrə, mərkəzi işçi bütün lazımi kateqoriyaları emal
etdikdən sonra bir dəfə basılır. Uğurlu olduqda sənəd sətrində `Emal et` yox olur, `Bax` görünür.

**Qeyd:** `COMPLETED`-dən geri (yenidən `IN_PROGRESS`-a) qayıtmaq yolu YOXDUR bu versiyada —
unudulan bir sətir varsa, hazırda düzəliş yolu yoxdur (gələcək iş kimi qeyd olunub).

---

## 5. "Bax" — audit görünüşü

`GET /api/resources?documentId={id}` — mövcud endpoint-ə əlavə edilən yeni filtr, ayrıca endpoint
DEYİL. Standart `PageResponse<ResourceResponse>`, hər elementdə artıq `documentId` sahəsi də var.
Redaktə yoxdur, sadəcə siyahı (mövcud `Resource` cədvəl komponentini bu filtrlə istifadə edin).

---

## 6. Bildirişlər

### 6.1 `GET /api/notifications/mine?page=&size=`

```json
{
  "success": true,
  "data": {
    "content": [
      {
        "id": "55502a67-...",
        "type": "DOCUMENT_UPLOADED",
        "message": "Acme Construction Supplies yeni sənəd yüklədi: qiymetler_2026_Q3.xlsx",
        "referenceType": "DOCUMENT",
        "referenceId": "2d9ecad7-...",
        "isRead": false,
        "createdAt": "2026-08-10T10:15:00Z"
      }
    ],
    "page": 0, "size": 20, "totalElements": 1, "totalPages": 1, "last": true,
    "unreadCount": 1
  }
}
```

`unreadCount` eyni cavabın içindədir (§9.4-ün qərarı — ayrıca yüngül endpoint yoxdur, header-dəki
zəng badge-i üçün bu sorğunu istifadə edin, 30 saniyəlik polling ilə).

### 6.2 `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`

Body yoxdur, `200` + boş `data`. Bildirişə klik → `referenceType==="DOCUMENT"` olduğu üçün
`referenceId` ilə sənəd detalına yönləndirin, sonra bu endpoint-i çağırın.

**Qeyd:** bildiriş yalnız `DOCUMENT_UPLOADED` üçün göndərilir (sənəd yüklənəndə, `DOCUMENT_REVIEW`
sahiblərinin hamısına). `COMPLETED`/`REJECTED` olanda vendor-a bildiriş getmir bu versiyada.

---

## 7. Xəta formaları (bu modulda görəcəyiniz spesifik hallar)

| Kod | Nə vaxt | Nümunə mesaj |
|---|---|---|
| `400` | Mərkəzi hesab (`organizationId=null`) sənəd yükləməyə cəhd edir | "This action requires an organization account" |
| `400` | Whitelist-də olmayan fayl tipi | "Unsupported file type: .docm - allowed: xlsx, xls, pdf, doc, docx, jpg, jpeg, png" |
| `400` | 20MB-dan böyük fayl | "The uploaded file exceeds the maximum allowed size" |
| `400` | `COMPLETED` sənədi rədd etmə cəhdi | "A completed document cannot be rejected" |
| `403` | İcazəsiz istifadəçi (məs. vendor mərkəzi siyahıya baxmaq istəyir) | standart 403 |
| `409` | Kiliddə olan sənədi başqası açmaq/emal etmək istəyir | "This document is currently being processed by {ad}" |
| `409` | Kilid sahibi olmayan `Emalı bitir`/bulk-create çağırır | "Only the employee currently processing..." / "This document must be locked to you..." |

---

## 8. `_4`-dən fərqlər (dizayn dəyişməyib, YALNIZ texniki detallar dəqiqləşib)

1. `document.status` **STRING yox, INTEGER**-dir (`1/2/3/4`, §1.1-dəki cədvəl).
   `PATCH .../status` request body-sində göndərdiyiniz `status` isə **STRING** qalır
   (`"COMPLETED"`/`"REJECTED"`) — asimmetrikdir, diqqət edin.
2. `POST /api/documents/{id}/resources` — array birbaşa body-nin özü deyil, `{"rows": [...]}`
   obyektinin içindədir (§3.3, §9.2-nin qərarı: yeni bulk endpoint, N ayrı sorğu yox).
3. Bulk-yaradılan resurslar review-statussuzdur (`§4.6`-da artıq razılaşdırılmışdı) — bu, `Resource`
   cavabında ümumiyyətlə `status` sahəsi göstərməməklə (və ya `null`) təsdiqlənir.
4. `GET /api/auth/me`-də `permissions` sahəsi indi var (§0) — §9.3-dəki açıq sual bağlandı.
5. Kilid timeout: **24 saat**, avtomatik takeover (admin-override endpoint-i tikilmədi, ən sadə
   variant seçildi).

Bunlardan başqa `_4`-dəki bütün UX/axın qərarları (kateqoriya-təkrar, "+Yeni product", "X" düyməsi,
"Emalı bitir" sənəd-səviyyəli, "Bax" audit-only) olduğu kimi tikilib.
