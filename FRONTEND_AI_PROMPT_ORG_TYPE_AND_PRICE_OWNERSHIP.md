# CCMS Frontend — Təşkilat tipi (Manufacturer/Distributor/Reseller) + Qiymət sahibliyi + Supplier-in ləğvi

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu fayl **2026-08-04**-də backend-də edilmiş bir dəyişikliyi əhatə edir və aşağıdakı köhnə
> sənədlərdəki müvafiq hissələri **əvəz edir** (o fayllardakı digər bölmələr hələ də etibarlıdır,
> yalnız aşağıda sadalanan hissələr köhnəlib):
> - `FRONTEND_AI_PROMPT.md` § 6 (Resource Prices) və § 8 (Suppliers) — § 8 tamamilə silinməlidir,
>   § 6-dakı `supplierId` sahələri bu faylda `organizationId`-yə düzəldilib.
> - `FRONTEND_AI_PROMPT_ADMIN_PANEL.md`-dəki qiymət review cədvəlində `supplierId` sütunu.
> - `FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` § 2-dəki **"`type` sahəsi YOXDUR"** cümləsi —
>   artıq VAR, bax bölmə 1.
> - `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 6.2 cədvəlindəki `organizationId`/`supplierId`
>   sətirləri — bax bölmə 4 (indi bəziləri həll olunub).
>
> Backend tərəfi `PROJECT_STATUS.md` bölmə 4x-də tam təsvir olunub (miqrasiya, test nəticələri).
>
> **Yeniləmə (eyni gün, sonrakı tur):** bölmə 4-dəki `createdBy`/`approvedBy` boşluğu bağlandı
> (bax bölmə 4-ün özü, artıq yenilənib) və frontend-in ayrıca göndərdiyi sorğuya cavab olaraq
> resurs filtrləri + `organizationName`/`username` əlavə olundu (bax **bölmə 7**, ən sonda).
> Backend tərəfi `PROJECT_STATUS.md` bölmə 4y/4z-də.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## 1. Təşkilat tipi (`Organization.type`) — yeni sahə

Rəhbərliyin tələbi idi: sistemə istehsalçı, satış müəssisəsi (distribyutor) və satınalıb-satan
(reseller) təşkilatları eyni şəkildə qeydiyyatdan keçə bilsin. Bunun üçün `type` sahəsi
genişləndirildi:

| Kod | Mənası | Frontend-də göstərilməli ad (təklif) |
|---|---|---|
| 1 | CENTRAL | (heç vaxt görməyəcəksiniz — API ilə yaradılmır, yalnız sistemin öz seed datasıdır) |
| 2 | MANUFACTURER | İstehsalçı |
| 3 | DISTRIBUTOR | Satış müəssisəsi / Distribyutor |
| 4 | RESELLER | Satınalıb-satan / Reseller |
| 5 | GOVERNMENT | Dövlət qurumu |
| 6 | OTHER | Digər |

**⚠️ Əvvəlki `FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` § 2-də deyilirdi ki "`type` sahəsi YOXDUR,
server həmişə VENDOR yaradır" — bu artıq düz DEYİL.** İndi:

### `POST /api/organizations` (`ORGANIZATION_WRITE`) — dəyişən hissə

```json
{
  "name": "Acme Construction Supplies",
  "type": 2,
  "taxId": "TAX-0099",
  "contactInfo": "acme@example.com",
  "username": "acme-vendor",
  "email": "acme-vendor@example.com",
  "password": "VendorPass123!",
  "roleNames": ["OPERATOR"]
}
```

- **`type` indi MƏCBURİDİR** — "Yeni Təşkilat" formasına yuxarıdakı cədvəldən bir `Select`
  əlavə edin (2/3/4/5/6 dəyərləri, CENTRAL(1)-i formaya qoymayın — göndərsəniz `400 "CENTRAL
  is not a valid organization type here"` alarsınız).
- `PUT /api/organizations/{id}` də eyni şəkildə **opsional** `type` qəbul edir (göndərilməzsə
  dəyişmir) — "Redaktə et" formasına da eyni Select-i əlavə edin ki, admin sonradan təşkilatın
  tipini düzəldə bilsin.

### Köhnə (miqrasiyadan əvvəl yaradılmış) təşkilatlar

Bu dəyişiklikdən əvvəl yaradılmış bütün vendor təşkilatlar avtomatik **`OTHER(6)`** kimi
işarələnib (əvvəlki tək "VENDOR" mənasını daşıyan kod-2 artıq MANUFACTURER mənasını daşıdığı
üçün, köhnə sətirlər səhvən "İstehsalçı" kimi görünməsin deyə). Təşkilatlar siyahısında bu
təşkilatların çoxu ilk baxışda "Digər" göstəriləcək — bu, gözlənilən haldır, admin panelə **"Bu
təşkilat gerçəkdə istehsalçıdır/distribyutordur?" tipində bir yenidən-təsnifat axtarışı/filtri**
əlavə etməyi düşünün ki, admin köhnə təşkilatları tədricən düzgün tipə köçürə bilsin (`PUT`
ilə, yuxarıda).

---

## 2. Supplier tamamilə silindi — "Təchizatçı əlavə et" menyusunu çıxarın

`Supplier`/`suppliers` və `/api/suppliers` endpoint-i backend-də **tamamilə silinib**. Nəticələr:

- `FRONTEND_AI_PROMPT.md` § 8-də təsvir olunan "Suppliers" CRUD ekranı/menyusu (əgər tikilibsə)
  **UI-dan tamamilə çıxarılmalıdır**. `/api/suppliers` çağırışı indi `404` qaytarır.
- Ayrıca "Təchizatçı" konsepti **admin panel naviqasiyasından** silinməlidir — artıq lazım
  deyil, çünki "qiyməti kim təqdim edib" sualının cavabı birbaşa **Organization**-dır (bax
  bölmə 3).
- Əgər hardcoded `Supplier` seçim sahəsi olan bir forma varsa (məs. "Yeni Qiymət" ekranında),
  bax bölmə 3 — o sahə tamamilə çıxarılmalıdır, əvəzi YOXDUR (əvəzsiz silinir, çünki artıq
  server-side avtomatik həll olunur).

---

## 3. "Yeni Qiymət" forması — Təşkilat/Təchizatçı sahəsi tamamilə çıxarılır

Bu, ən böyük UX dəyişikliyidir. Əvvəllər `POST /api/resource-prices` bir `supplierId` (əl ilə
seçilən) tələb edirdi. **İndi bu sahə API-dan tamamilə silinib** — nə `supplierId`, nə
`organizationId`, HEÇ BİRİ request body-də göstərilmir:

```json
{
  "resourceId": "uuid",
  "regionId": "uuid",
  "price": 105.00,
  "vat": 18,
  "currency": "AZN",
  "effectiveDate": "2026-08-04",
  "expireDate": null,
  "comment": "opsional"
}
```

**Server bunu həmişə sorğunu göndərən istifadəçinin öz təşkilatından avtomatik təyin edir** —
əvvəllər bu yalnız "Mənim Resurslarım" (`/api/resources/mine/.../prices`) axınında belə idi,
indi **ümumi `/api/resource-prices` endpoint-i də eyni qaydaya tabedir**.

### Nə etmək lazımdır formada

- **"Təşkilat"/"Təchizatçı" seçim sahəsini formadan tamamilə çıxarın.** Qalan forma: Region
  (Select), Qiymət (Number), ƏDV (Number, opsional deyil əgər ümumi `/api/resource-prices`
  çağırırsınızsa — bax aşağıda "Mənim Resurslarım"la fərq), Valyuta, Tarix, Şərh (opsional).
- Cavabda (`ResourcePriceResponse`) təşkilat indi avtomatik dolu gəlir — bunu **"Təqdim edən: X
  Təşkilatı"** kimi göstərin (ad üçün bölmə 4-ə bax).

### Kim bu formanı görməlidir

- **Mərkəzi (CENTRAL) istifadəçilər bu formanı UMUMIYYƏTLƏ görməməlidir.** Backend indi bunu
  sərt qadağan edir: `organizationId=NULL` olan istifadəçi (yəni `/api/auth/me`-də
  `organizationId` boşdursa) qiymət göndərməyə cəhd etsə → `400 "Only an organization account
  can submit a price"`. UX baxımından "Yeni Qiymət" düyməsini/formanı CENTRAL rolu üçün əvvəlcədən
  gizlədin (backend-in 400-ünü gözləməyin) — `isCentralAdmin`/`organizationId == null` yoxlaması
  kifayətdir (`FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` § "Gating"-dəki eyni məntiq).
- **Adi təşkilat istifadəçiləri (vendor)** — resursun sahibi olan öz təşkilatlarının resursuna,
  YA DA "paylaşılan" (mərkəzi kataloq, sahibsiz) resursa qiymət göndərə bilər. Başqa təşkilatın
  ÖZ resursuna (paylaşılmayan) cəhd etsə → `404 "Resource not found"` (texniki cəhətdən bu,
  "gizli saxlama" məqsədi daşıyır — başqasının resursunun mövcudluğunu belə açmır). Bu halı
  UI-da sadəcə "Resurs tapılmadı" kimi göstərin, texniki mesajı çıxarmayın.

---

## 4. UUID heç yerdə göstərilməsin — YENİLƏNMİŞ ümumi qayda

`FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` § 6.2-də bu qayda artıq var idi, amma bəzi sətirləri
indi köhnəlib. **Ümumi prinsip dəyişməyib və bütün tətbiqə aiddir**: heç bir ekranda
`a1b2c3d4-...` formatlı xam UUID mətn kimi görünməsin — həmişə insan-oxunaqlı ad göstərilsin,
mümkün deyilsə mənalı yer tutucu ("Naməlum", "Ümumi", "—") göstərilsin.

**Sizin qeyd etdiyiniz konkret problem** ("təşkilat və istifadəçi kimi UUID görünür ekranda")
məhz bu qaydanın pozulmasıdır — çox güman ki hazırkı frontend `organizationId`/`createdBy` kimi
sahələri birbaşa (lookup etmədən) ekrana çap edir. Aşağıdakı cədvəl bunu düzəltmək üçün **hansı
ID-nin indi ad-a çevrilə biləcəyini** göstərir:

| Sahə | Vəziyyət | Nə etmək lazımdır |
|---|---|---|
| `Resource.organizationId` | ✅ **İNDİ MÜMKÜNDÜR** (əvvəlki sənəddə "CRUD yoxdur" deyilirdi — indi var, bax bölmə 1) | `GET /api/organizations` siyahısını (və ya lazım olan `id`-lər üçün `GET /api/organizations/{id}`) bir dəfə yükləyib `id → name` map qurun, hər ekranda bu map-dan göstərin. Kiçik siyahıdırsa (adətən elədir) tam siyahını bir dəfə cache-ləyin. |
| `ResourcePrice.organizationId` (əvvəlki `supplierId`) | ✅ **İNDİ MÜMKÜNDÜR** — eyni Organization map-ı istifadə edin | Qiymət cədvəlində "Təşkilat" sütununda ad göstərin, tip badge-i ilə birgə (bölmə 1-dəki cədvəldən, məs. "Acme MMC 🏭 İstehsalçı") |
| `ResourcePrice.createdBy` / `approvedBy` | ✅ **2026-08-04: İNDİ MÜMKÜNDÜR** — `ResourcePriceResponse`/`FlaggedPriceReviewResponse` artıq `createdByName`/`approvedByName` sahələrini birbaşa qaytarır (server-side resolve olunub, `GET /api/users/{id}`-ə ehtiyac yoxdur) | **Heç bir lookup lazım deyil** — cavabdakı `createdByName`/`approvedByName`-i birbaşa göstərin. `null`-dursa (nadir, məs. köhnə tarixi sətir) "—" göstərin. `createdBy === currentUser.id` olanda hələ də "Siz" göstərməyi düşünə bilərsiniz, amma məcburi deyil |
| `Resource.matchGroupId` | ❌ Adı yoxdur (konsept, insan-oxunaqlı ad daşımır) | Heç göstərməyin — arxa planda "Bazar Qiyməti" tab-ının açarı kimi istifadə edin |
| `ResourcePrice.regionId` | ✅ Mövcud (`/api/regions`) | Dəyişməyib — `/api/regions` siyahısından map |

**Qısaca:** Organization ID-lərin hamısı indi ada çevrilə bilər (bu, sizin "təşkilat UUID kimi
görünür" şikayətinizin düzgün həllidir) — problem sadəcə frontend-in bu lookup-u etməməsindədir.
**2026-08-04 yeniləmə:** `ResourcePrice.createdBy`/`approvedBy` üçün də ad artıq mövcuddur —
əvvəllər bu faylda "hələ mümkün deyil" deyilirdi, indi düzəldi (bax `PROJECT_STATUS.md` § 4y).
Bir qeyd: bu, YALNIZ qiymət (`ResourcePrice`) sahələrinə aiddir — tətbiqin başqa yerlərində (məs.
`Resource.createdBy`, `Product.createdBy`) eyni problem hələ də qala bilər, ayrıca yoxlayın.

---

## 5. Sahə adı dəyişiklikləri (cədvəl) — `supplierId` → `organizationId`

| Endpoint | Köhnə | Yeni |
|---|---|---|
| `POST /api/resource-prices` (body) | `supplierId` (məcburi) | **Sahə tamamilə silinib** (bölmə 3) |
| `PUT /api/resource-prices/{id}` (body) | `supplierId` (məcburi) | **Sahə tamamilə silinib** — təşkilat yaradılışdan sonra dəyişməzdir |
| `ResourcePriceResponse` (bütün cavablar) | `supplierId` | `organizationId` |
| `FlaggedPriceReviewResponse` | `supplierId` | `organizationId` |
| `GET /api/resource-prices/current` (query) | `supplierId` (məcburi) | `organizationId` (məcburi, adı dəyişdi) |
| `GET /api/resource-prices/history` (query) | `supplierId` (opsional) | `organizationId` (opsional, adı dəyişdi) |
| `GET /api/resource-prices/search` (query) | `supplierId` (opsional) | `organizationId` (opsional, adı dəyişdi) |
| `ResourcePriceResponse`/`FlaggedPriceReviewResponse` | — (`createdBy`/`approvedBy` yalnız UUID) | **2026-08-04: yeni sahələr əlavə olundu** — `createdByName`, `approvedByName` (String, `User.username`-dan, nullable). Bax bölmə 4-dəki yenilənmiş cədvəl. |

---

## 6. Sample curl

```bash
TOKEN=$(curl -s -X POST http://localhost:8181/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"acme-vendor","password":"VendorPass123!"}' | jq -r .data.accessToken)

# Yeni qiymət — təşkilat/təchizatçı sahəsi YOXDUR, avtomatik təyin olunur
curl -s -X POST http://localhost:8181/api/resource-prices -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{
    "resourceId": "uuid", "regionId": "uuid",
    "price": 105.00, "vat": 18, "currency": "AZN", "effectiveDate": "2026-08-04"
  }'

# Yeni təşkilat (tip məcburi indi)
ADMIN_TOKEN=$(curl -s -X POST http://localhost:8181/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r .data.accessToken)
curl -s -X POST http://localhost:8181/api/organizations -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" -d '{
    "name": "Acme Construction Supplies", "type": 2,
    "username": "acme-vendor", "email": "acme-vendor@example.com", "password": "VendorPass123!",
    "roleNames": ["OPERATOR"]
  }'
```

---

## 7. 2026-08-04 (eyni gün, sonrakı tur) — sizin sorğunuza cavab: resurs filtrləri + `organizationName` + `username`

Siz (frontend) ayrıca bir sorğu sənədi göndərdiniz, hamısı təsdiqləndi və tətbiq olundu:

### 7.1 `GET /api/resources` — yeni filtrlər

Yeni opsional query param-lar: `name`, `code` (bağlı `Product`-un adına/koduna görə, contains, case-insensitive), `regionId`, `minPrice`, `maxPrice`.

- `regionId` təkbaşına: yalnız bu regionda **cari aktiv (`APPROVED`, `effectiveDate<=bugün<=expireDate`)** qiyməti olan resursları qaytarır.
- `minPrice`/`maxPrice`: eyni "cari aktiv qiymət" tərifinə görə aralıq filtri.
- **Qərar (sizin təklifiniz qəbul edildi):** `minPrice`/`maxPrice` `regionId` olmadan göndərilsə → **`400`** (`"regionId is required when minPrice/maxPrice is given"`). Valyuta konversiyası edilmir — bu tətbiqdə faktiki tək-valyuta (AZN) fərziyyəsi var, region-suz qiymət müqayisəsi mənasız olardı.

```
GET /api/resources?name=polad&code=MAT-0&regionId=<uuid>&minPrice=40&maxPrice=100
```

### 7.2 `organizationName`/`organizationType` — `ResourceResponse`/`ResourcePriceResponse`

Sizin təklifiniz eynilə tətbiq olundu — **yeni endpoint yoxdur, `ORGANIZATION_READ` genişləndirilmədi**:

- `ResourceResponse`-a `organizationName` (String) və `organizationType` (Integer, bölmə 1-dəki kodlar) əlavə olundu.
- `ResourcePriceResponse`-a (və bonus olaraq `FlaggedPriceReviewResponse`-a da, eyni infrastruktur) `organizationName` əlavə olundu.
- **Heç bir lookup lazım deyil** — cavabdakı `organizationName`-i birbaşa göstərin. Bölmə 4-dəki cədvəl artıq tam aktualdır, əlavə dəyişiklik etməyə ehtiyac yoxdur.

### 7.3 `username` — `OrganizationResponse`

`GET /api/organizations` və `GET /api/organizations/{id}` cavablarına `username` (String, yalnız oxumaq üçün) əlavə olundu — təşkilatın bundle giriş hesabının adı. Bağlı giriş hesabı olmayan (nadir, məs. köhnə placeholder təşkilatlar) sətirlərdə `null`.

```json
{ "id": "uuid", "name": "Acme Construction Supplies", "type": 2, "status": 1, "username": "acme-vendor" }
```

### 7.4 Data düzəlişi

"Vendor Alpha MMC" təşkilatının `type=1` (CENTRAL) anomaliyası təsdiqləndi və düzəldildi (indi `6`/OTHER) — miqrasiya `038`. Əlavə frontend işi tələb olunmur, sadəcə məlumat üçün.
