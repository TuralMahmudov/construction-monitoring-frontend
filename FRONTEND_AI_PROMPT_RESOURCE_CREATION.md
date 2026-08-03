# CCMS Frontend — Struktur Atribut Lüğəti + Bir-Pəncərəli "Resurs Yarat" + Hibrid Qiymət + UX Düzəlişləri

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas 8 modul), **`FRONTEND_UI_BUILD_PROMPT.md`** (ilk UI strukturu) və **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`**-un (admin panel/təşkilat modeli) **davamıdır**. Əvvəlki üç faylda təsvir olunan konvensiyalar (unified response envelope, `PageResponse<T>`, auth axını, MUI stack) təkrarlanmır.
>
> **Bu fayl 2026-07-28-də edilmiş bir neçə backend dəyişikliyini əhatə edir və bunlardan BİRİ MÖVCUD FRONTEND-İ SINDIRAN (breaking) DƏYİŞİKLİKDİR** — bölmə 1-ə xüsusi diqqət yetirin, resurs atributları ilə bağlı **HƏR ŞEY** yenidən yazılmalıdır.

> ## ⚠️⚠️⚠️ 2026-07-30 YENİLƏMƏSİ: bu faylın § 1.5, § 2, § 3 və § 5-i ARTIQ KÖHNƏLİB
> Backend `resources`-u `products` (kataloq, öz kodu) + `resources` (elan) olaraq ikiyə böldü. Bu 4 bölmədə təsvir olunan `POST /api/resources` body-si, `POST /api/resource-attributes` endpoint-i və `/api/resources/manufacturers|brands|models` artıq **işləmir/başqa cür işləyir**. Kod yazmazdan əvvəl **`FRONTEND_AI_PROMPT_PRODUCTS.md`**-ı oxuyun — o fayl bu bölmələrin tam yenilənmiş versiyasıdır. Bu fayldan yalnız § 1.1-1.4 (Atribut Lüğəti admin ekranları, dəyişməyib) və § 4, § 6 (qiymət təsdiqi, UX qaydaları, dəyişməyib) hələ də etibarlıdır.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## ⚠️ 0. Ən vacib xəbərdarlıq — oxumadan kod yazmayın

Bu sənəddə təsvir olunan dəyişikliklər bir-biri ilə bağlıdır:
1. **Resurs atributları (EAV) tam yenidən dizayn edildi** — köhnə sərbəst-mətn "Ad/Dəyər/Vahid" forması artıq **işləməyəcək** (backend bu sahələri artıq qəbul etmir).
2. **Resurs yaratma formu sadələşdi** — `code` və `active` sahələri formadan **çıxarılmalıdır**, backend onları artıq qəbul etmir/avtomatik idarə edir.
3. **Qiymət təsdiq axını dəyişdi** — normal qiymət artıq təsdiq gözləmir.
4. İstifadəçidən 3 əlavə UX tələbi var (bölmə 6) — bunlar bütün tətbiqə aiddir, təkcə yeni ekranlara yox.

---

## 1. ⚠️ BREAKING: Resurs Atributları (EAV) tam yenidən dizayn edildi

### 1.1 Köhnə model (artıq YOXDUR)

Əvvəlki sənədlərdə (`FRONTEND_UI_BUILD_PROMPT.md`) təsvir olunan "Atribut əlavə et" forması sərbəst mətn idi: istifadəçi özü `attributeName` (məs. "Diametr"), `attributeValue` (məs. "15"), `unit` (məs. "mm") yazırdı, üstəlik `sortOrder`/`searchable`/`required` bayraqlarını da özü təyin edirdi. **Bu forma artıq mövcud deyil, backend bu sahələri qəbul etmir.**

### 1.2 Yeni model: Attribute Definition Lüğəti

Atributlar indi **qlobal, admin tərəfindən əvvəlcədən yaradılan bir lüğətdir** (Diametr, Marka, Material, Uzunluq, Çəki, Güc və s.), kateqoriyalarla **many-to-many** əlaqəlidir. Hər atributun sabit bir **data tipi** var:

| `dataType` kodu | Məna | Vendor nə görür |
|---|---|---|
| `1` | NUMBER | Yalnız rəqəm daxil edən input, yanında sabit vahid göstərilir (məs. "mm") |
| `2` | TEXT | Sərbəst mətn input |
| `3` | ENUM | Əvvəlcədən təyin olunmuş siyahıdan seçim (Select/Autocomplete) |
| `4` | BOOLEAN | Switch/Checkbox |
| `5` | DATE | Tarix seçici |

**Vacib:** `NUMBER` tipli atributlarda vendor **YALNIZ rəqəmi yazır** — vahid heç vaxt əl ilə yazılmır, sistemdən gəlir (`defaultUnitCode`/`defaultUnitSymbol`). Məsələn Diametr = `12` yazılır, ekranda "12 mm" göstərilir.

### 1.3 Yeni admin ekranları — "Atribut Lüğəti" (Admin Panel-ə əlavə)

**`/api/attribute-definitions`** (CRUD, `COST_WRITE`/`COST_READ`):
```json
// POST /api/attribute-definitions
{ "name": "Diametr", "dataType": 1, "defaultUnitId": "uuid-of-mm-unit", "active": true }

// Response (həm POST, həm GET /{id}, GET / (PageResponse) üçün eyni forma)
{
  "id": "uuid", "name": "Diametr", "dataType": 1,
  "defaultUnitId": "uuid", "defaultUnitCode": "MM", "defaultUnitSymbol": "mm",
  "active": true,
  "enumValues": []   // yalnız dataType=3 (ENUM) olanda dolu olur
}
```
- `GET /` — pagination + filtr (`name`, `dataType`, `active`).
- `DELETE /{id}` — 409 qaytarır əgər hər hansı kateqoriyaya bağlıdırsa (əvvəlcə unlink lazımdır).

**ENUM tipli atributlar üçün dəyər siyahısı — `/api/attribute-definitions/{id}/enum-values`:**
```json
// POST /api/attribute-definitions/{markaId}/enum-values
{ "value": "A400", "sortOrder": 0, "active": true }
// Response: { "id": "uuid", "attributeDefinitionId": "uuid", "value": "A400", "sortOrder": 0, "active": true }
```
`PUT`/`DELETE /{id}/enum-values/{enumValueId}`, `GET /{id}/enum-values` (siyahı) — hamısı `COST_WRITE`/`COST_READ`.

**Ekran:** "Admin Panel" → "Atribut Lüğəti" (yeni səhifə). Sadə `DataGrid`: Ad, Tip (chip), Vahid (yalnız NUMBER üçün), Aktiv. Sətrə click-də detal panel/dialoq açılır, orada ENUM tipdirsə "Dəyərlər" alt-siyahısı (chip-lər + "+ Yeni dəyər" düyməsi) göstərilir.

### 1.4 Kateqoriya ↔ Atribut əlaqəsi — "Kateqoriya Atributları" admin ekranı

**`GET/POST /api/resource-categories/{categoryId}/attributes`** — bu, həm admin-in kateqoriyaya atribut bağlaması, həm də **vendor-un "resurs yarat" formunda dinamik xüsusiyyət inputlarını qurması üçün istifadə edəcəyi ƏN VACİB endpoint-dir** (bax bölmə 5).

```json
// POST /api/resource-categories/{categoryId}/attributes
{
  "attributeDefinitionId": "uuid",
  "required": false, "visible": true, "searchable": true, "filterable": false,
  "sortOrder": 0, "affectsMatchGroup": true
}

// GET /api/resource-categories/{categoryId}/attributes → List<CategoryAttributeDefinitionResponse>
[
  {
    "id": "uuid-of-the-LINK",          // ⚠️ bu ID-ni saxlayın - resource-attribute yaradanda BU lazımdır
    "categoryId": "uuid",
    "attributeDefinitionId": "uuid",
    "attributeName": "Diametr",         // ad hazır gəlir, ayrı sorğu lazım deyil
    "dataType": 1,
    "defaultUnitId": "uuid", "defaultUnitCode": "MM", "defaultUnitSymbol": "mm",
    "enumValues": [],                   // ENUM-dursa dolu gəlir
    "required": false, "visible": true, "searchable": true, "filterable": false,
    "sortOrder": 0, "affectsMatchGroup": true
  }
]
```
- `required`/`visible`/`searchable`/`filterable`/`affectsMatchGroup` — bunların **hamısı admin qərarıdır**, vendor-a heç biri göstərilmir/soruşulmur.
  - `visible=false` olan atributu vendor-un formunda **göstərməyin**.
  - `required=true` olanları formda `*` ilə işarələyin və boş buraxılmasına icazə verməyin (frontend-side validasiya — backend özü də `NUMBER`/`ENUM` üçün dəyəri doğrulayır, amma `required` bayrağını backend enforce etmir, sırf informativ, frontend məsuliyyətidir).
  - `searchable`/`filterable`/`affectsMatchGroup` — vendor-a göstərməyə belə ehtiyac yoxdur, bunlar yalnız admin-in "Kateqoriya Atributları" idarəetmə ekranında görünür.
- `PUT`/`DELETE /api/category-attribute-definitions/{linkId}` — əlaqənin konfiqini dəyişmək/silmək (`DELETE` 409 qaytarır əgər hər hansı resurs artıq bu atributdan istifadə edirsə).

**Ekran:** Resource Category Detail-ə yeni bir tab: "Atributlar". `DataGrid`: Atribut adı, Tip, Vahid, Required/Searchable/Filterable/AffectsMatchGroup (switch-lər, inline redaktə oluna bilər), sıra (drag-and-drop ilə `sortOrder` dəyişdirmək gözəl olar, məcburi deyil). "+ Atribut bağla" düyməsi → Attribute Definition-lardan Autocomplete + konfiq switch-ləri olan kiçik dialoq.

### 1.5 Resurs-a atribut əlavə etmək — dəyişən hissə

> ⚠️ **2026-07-30: bu bölmə köhnəlib.** `POST /api/resource-attributes` **silinib**. Atributlar indi `POST /api/products` çağırışının `attributes[]` sahəsi kimi, məhsul yaradılan/tapılan anda **toplu** göndərilir — sonradan tək-tək əlavə/redaktə/silmə yoxdur. Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 2**. `categoryAttributeDefinitionId`-nin haradan gəldiyi (aşağıdakı `GET .../attributes` axını) dəyişməyib, sadəcə hara göndərildiyi dəyişib.

```json
// KÖHNƏ, ARTIQ İŞLƏMİR: POST /api/resource-attributes
{
  "resourceId": "uuid",
  "categoryAttributeDefinitionId": "uuid",   // bölmə 1.4-dəki "id" sahəsi - NÖVÜ/ADI YOX, məhz bu ID
  "value": "15",                             // NUMBER üçün sadəcə rəqəm, vahid yazılmır
  "active": true
}

// Response
{
  "id": "uuid", "resourceId": "uuid",
  "categoryAttributeDefinitionId": "uuid", "attributeDefinitionId": "uuid",
  "attributeName": "Diametr", "dataType": 1,   // ad/tip artıq cavabda var - UUID göstərməyə ehtiyac yoxdur
  "value": "15", "unitCode": "MM", "unitSymbol": "mm",
  "sortOrder": 0, "searchable": true, "required": false, "affectsMatchGroup": true,
  "active": true
}
```
- `PUT /api/resource-attributes/{id}` — indi YALNIZ `{ "value": "...", "active": true }` qəbul edir (ad/tip dəyişməz — dəyişmək istəsə, sil-yenidən-yarat).
- **Validasiya (backend edir, frontend-də uyğun mesaj göstərin):**
  - `NUMBER` → rəqəm deyilsə `400 "Value 'X' is not a valid number"`.
  - `ENUM` → siyahıda olmayan dəyər `400 "Value 'X' is not one of the allowed values for 'Marka'"` — buna görə **frontend-də ENUM sahəsini həmişə Select/Autocomplete edin, sərbəst mətn YOX** (istifadəçi səhv yazmasın deyə, həm də UX üçün).
  - Başqa kateqoriyanın `categoryAttributeDefinitionId`-si göndərilsə → `400`. Bu, praktikada baş verməməlidir, çünki siz həmişə həmin resursun öz kateqoriyasının `GET .../attributes` siyahısından seçirsiniz.
  - Eyni atribut ikinci dəfə əlavə edilsə → `409`.

---

## 2. Resurs yaratma — `code`/`active` formadan çıxarıldı

> ⚠️ **2026-07-30: bu bölmə köhnəlib.** `POST /api/resources` body-si bu deyil artıq — indi yalnız `{ productId, organizationId? }`. Aşağıdakı sahələr (`name`/`unitId`/`specification`/`manufacturer`/`brand`/`model`) `POST /api/products`-a köçdü. Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 2-3**. Kodun avtomatik generasiya olunması prinsipi (aşağıda) dəyişməyib — sadəcə indi `product.code` üçündür, `resource.code` deyil (o, artıq mövcud deyil).

```json
// KÖHNƏ, ARTIQ İŞLƏMİR: POST /api/resources
{
  "categoryId": "uuid",
  "name": "Armatur Ø15",
  "description": "opsional",
  "unitId": "uuid",
  "specification": "opsional, kiçik əlavə qeyd üçün (böyük textarea ETMƏYİN - əsas texniki data atributlarda olmalıdır)",
  "manufacturer": "Norm",
  "brand": "Norm",
  "model": "opsional",
  "organizationId": "yalnız mərkəzi admin üçün mənalı, vendor formunda BU SAHƏ HEÇ GÖSTƏRİLMƏSİN"
}
```
- **`code` sahəsini formadan tamamilə çıxarın.** Server avtomatik generasiya edir (`MAT-000253` formatında, kateqoriyanın tipinə görə prefiks: MAT/MCH/LAB/TRN/SRV/OTH). Göndərsəniz belə **sükutla nəzərə alınmır**.
- **`active` sahəsini də create formundan çıxarın.** Yeni resurs həmişə aktiv yaranır. Deaktivasiya yalnız **sonradan, Resource Detail → "Redaktə et" ekranında** bir Switch ilə edilir (`PUT /api/resources/{id}` — bu endpoint `active`-i hələ də qəbul edir, YALNIZ create-dən çıxarılıb).
- Yaradılan resursun cavabında `code` artıq dolu gəlir (`"MAT-000001"` kimi) — bunu Resource Detail başlığında, siyahıda göstərin (redaktə oluna bilməz, salt-oxunan).

---

## 3. İstehsalçı / Brend / Model — Autocomplete

> ⚠️ **2026-07-30: path dəyişdi.** `/api/resources/...` → `/api/products/...` (aşağıdakı forma/məntiq eynidir). Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 2.5**.

```
KÖHNƏ, ARTIQ İŞLƏMİR:
GET /api/resources/manufacturers?search=nor  → ["Norm", "Norm1"]
GET /api/resources/brands?search=            → (boş axtarış, maks. 20 nəticə)
GET /api/resources/models?search=bo
```
- `COST_READ` icazəsi kifayətdir, hər üç sahə üçün eyni forma.
- **MUI `Autocomplete` `freeSolo` rejimində istifadə edin**: istifadəçi yazdıqca (debounce ~300ms) bu endpoint-ə sorğu göndərin, gələn siyahını dropdown kimi göstərin. Siyahıda uyğun dəyər yoxdursa, istifadəçi sadəcə yazdığını saxlayır (heç bir "yeni yarat" düyməsi lazım deyil — resurs yaradılanda/yenilənəndə həmin mətn sadəcə saxlanılır, yeni master cədvəl yoxdur).
- Bu, cross-organization sorğudur (bütün təşkilatların istifadə etdiyi adları görürsünüz) — bu, **qəsdəndir**, paylaşılan adlandırma lüğətidir, məxfi data deyil.

---

## 4. Qiymət təsdiqi — hibrid model (DƏYİŞDİ)

Köhnə qayda (`FRONTEND_AI_PROMPT.md`/`ADMIN_PANEL`): hər yeni qiymət `PENDING(1)` statusu ilə yaranırdı, admin təsdiqləməli idi.

**Yeni qayda:**
- Normal (kənar dəyər olmayan) qiymət **birbaşa `APPROVED(2)`** statusu ilə yaranır — **heç bir təsdiq gözləmir**, dərhal bazar orta/median hesablamasına qatılır.
- Yalnız **kənar dəyər (outlier)** aşkarlanan qiymətlər (mediandan həddindən artıq fərqli) hələ də `FLAGGED(4)` statusu ilə yaranır və admin review-a (bax `ADMIN_PANEL` bölmə 4) düşür.

**Frontend-də dəyişməli olan yerlər:**
- `POST /api/resource-prices` cavabındakı `status`-a baxın:
  - `status === 2` → **"Qiymət əlavə olundu"** (adi uğur mesajı — təsdiq gözləmə mesajı ARTIQ YOXDUR).
  - `status === 4` → əvvəlki kimi: **"Qiymət əlavə olundu, lakin bazar qiymətindən əhəmiyyətli fərqləndiyi üçün admin nəzərdən keçirməsinə göndərildi."**
- **Edit düyməsi məntiqi dəyişmədi** (`status===1||status===4` və `createdBy===me||isCentralAdmin`), amma **praktiki nəticə dəyişdi**: adi hallarda qiymət indi dərhal `APPROVED` olduğu üçün **Edit düyməsi adətən görünməyəcək** (yalnız `FLAGGED` qalanda görünür) — bu, gözlənilən davranışdır, bug deyil. İstifadəçiyə lazım gəlsə izah edin: "Əlavə olunan qiymət dərhal aktivləşir, səhv olsa yeni qiymət əlavə edin (köhnəsini redaktə etmək əvəzinə)."
- `PriceStatus` chip rəngləri dəyişmir (1=sarı, 2=yaşıl, 3=qırmızı, 4=narıncı) — sadəcə `2`-nin daha tez-tez görünəcəyini gözləyin.

---

## 5. Yeni "Resurs Yarat" ekranı — bir pəncərə, popup yox

> ⚠️ **2026-07-30: bu axın köhnəlib.** Tək-addımlı `POST /api/resources` çağırışı iki addıma bölündü (`POST /api/products` → `POST /api/resources`). "Bir pəncərə, popup yox" prinsipi və aşağıdakı forma-tərtibatı (kateqoriya+əsas məlumat+dinamik xüsusiyyətlər) **hələ də etibarlıdır**, sadəcə "Yadda saxla" düyməsinin arxasındakı HTTP çağırışları dəyişib. Bax **`FRONTEND_AI_PROMPT_PRODUCTS.md` § 6** (tam yeni axın, addım-addım).

ChatGPT ilə edilən dizayn müzakirəsi əsasında (istifadəçi təsdiqlədi): **modal/popup silsiləsi YOX, normal tam səhifə (və ya bir tək dialoq, çoxlu alt-pəncərə açıb-bağlamadan)**.

```
──────────────────────────────────────────
 Resurs Yarat
──────────────────────────────────────────
 Əsas məlumatlar
   Kateqoriya *        [Select/Autocomplete - /api/resource-categories/tree]
   Ad *                [TextField]
   Vahid *              [Select - /api/units]
   İstehsalçı            [Autocomplete freeSolo - bölmə 3]
   Brend                 [Autocomplete freeSolo - bölmə 3]
   Model                 [Autocomplete freeSolo - bölmə 3]
   Təsvir (opsional)     [kiçik TextField, BÖYÜK textarea yox]

──────────────────────────────────────────
 Xüsusiyyətlər   ← Kateqoriya seçiləndə avtomatik dolur
   (Kateqoriya seçilməyibsə: "Əvvəlcə kateqoriya seçin")
   Diametr (mm) *      [Number input]
   Marka *              [Select: A400/A500/... enumValues-dan]
   ...                  (hər GET .../attributes sətri üçün bir input, sortOrder-ə görə sıralı,
                          visible=false olanlar göstərilmir)
──────────────────────────────────────────
        [Ləğv et]                    [Yadda saxla]
──────────────────────────────────────────
```

**Axın (addım-addım):**
1. İstifadəçi Kateqoriya seçir → frontend dərhal `GET /api/resource-categories/{categoryId}/attributes` çağırır, nəticəni state-də saxlayır (`sortOrder`-ə görə, `visible=true` filtri ilə).
2. Hər sətir üçün `dataType`-a görə uyğun input render olunur (bax bölmə 1.2 cədvəli). `categoryAttributeDefinitionId` (yəni sətrin `id`-si) hər inputun açarı kimi yadda saxlanılır.
3. "Yadda saxla"-da: əvvəlcə `POST /api/resources` (yalnız əsas məlumatlarla, `code`/`active` göndərmədən) → `resourceId` alınır.
4. Sonra doldurulmuş hər xüsusiyyət üçün ardıcıl `POST /api/resource-attributes { resourceId, categoryAttributeDefinitionId, value }` (boş buraxılan, `required=false` sahələr göndərilmir).
5. Uğurlu olsa Resource Detail-ə yönləndirin (və ya siyahıya qayıdın + toast).
6. **Qiymət bu ekranda YOXDUR.** Resource Detail-in mövcud "Prices" tab-ında (bax `FRONTEND_UI_BUILD_PROMPT.md`) "+ Qiymət əlavə et" ilə ayrıca əlavə olunur — resurs yaradılması ilə qiymət əlavə olunması **fərqli, ardıcıl addımlardır**, eyni formda deyil.

**Kateqoriya dəyişəndə:** əgər istifadəçi artıq bəzi xüsusiyyət dəyərləri doldurmuşdusa və sonra kateqoriyanı dəyişsə, köhnə doldurulmuş dəyərləri təmizləyin (yeni kateqoriyanın fərqli atributları ola bilər) — sadə bir təsdiq dialoqu ("Kateqoriyanı dəyişmək doldurulmuş xüsusiyyətləri siləcək, davam edilsin?") əlavə etməyi düşünün.

---

## 6. Ümumi UX düzəlişləri (bütün tətbiqə aiddir, təkcə yeni ekranlara yox)

### 6.1 Rəqəm sahələrində "15" yazanda "015" çıxması

Bu, Qiymət/ƏDV və istənilən `NUMBER` tipli atribut inputunda baş verirsə, səbəb adətən: state-in defolt dəyəri `0` (rəqəm və ya `"0"` mətn) olur, istifadəçi yazanda köhnə "0" silinmədən yeni rəqəm ONUN qabağına/yanına əlavə olunur. Düzəliş:
- Bu tip inputların defolt/başlanğıc state dəyəri **HƏMİŞƏ boş sətir (`''`) olsun, `0` YOX**.
- `onFocus`-da mövcud mətni seçin ki, yazmağa başlayanda köhnə dəyər avtomatik əvəz olunsun:
  ```jsx
  <TextField
    type="number"
    value={value}                       // '' və ya "15" - HEÇ VAXT ədədi 0 ilə başlamayın
    onChange={(e) => setValue(e.target.value)}   // xam string saxlayın, formatlaşdırma YOX
    onFocus={(e) => e.target.select()}  // fokuslananda mətni seçir - yeni rəqəm köhnəni əvəz edir
  />
  ```
- **Formatlaşdırma (aparıcı sıfırları təmizləmə, decimal yuvarlaqlaşdırma) yalnız `onBlur`-da edin**, `onChange`-də YOX — hər hərfdə formatlamaq kursor mövqeyini pozur və məhz bu cür "015" effektlərinə səbəb olur.
- Bu qayda **Qiymət, ƏDV, hər NUMBER tipli atribut dəyəri, və tapılacaq istənilən digər rəqəm inputuna** tətbiq olunmalıdır.

### 6.2 UUID heç yerdə göstərilməsin — hər zaman ad göstərilsin

Aşağıdakı cədvəl backend-in **artıq ad verdiyi** (heç bir əlavə iş lazım deyil) və **hələ də yalnız UUID verdiyi** (frontend-də lookup map lazımdır) sahələri ayırır:

| Sahə | Vəziyyət | Nə etmək lazımdır |
|---|---|---|
| Resurs atributunun adı/tipi/vahidi (`attributeName`, `dataType`, `unitCode`/`unitSymbol`) | ✅ Artıq cavabda var (bölmə 1.5) | Heç nə — birbaşa göstərin |
| Kateqoriya atributunun adı/vahidi (`CategoryAttributeDefinitionResponse.attributeName` və s.) | ✅ Artıq cavabda var | Heç nə |
| `Resource.categoryId` | ❌ Xam UUID | `/api/resource-categories` siyahısından (bir dəfə yükləyib saxlayın) id→ad map-i qurun |
| `Resource.unitId` | ❌ Xam UUID | `/api/units` siyahısından map |
| `Resource.organizationId` | ❌ Xam UUID, **CRUD endpoint-i hələ də yoxdur** | Ad göstərmək mümkün deyil (bilinən məhdudiyyət, `ADMIN_PANEL` sənədində də qeyd olunub) — sadəcə "Təşkilata məxsus"/"Ümumi" chip-i göstərin, UUID-i heç yerdə çap etməyin (istəsəniz tooltip-də saxlaya bilərsiniz, əsas mətndə YOX) |
| `Resource.matchGroupId` | ❌ Xam UUID, adı yoxdur (konsepti "eyni məhsul qrupu"dur, insan-oxunaqlı adı yoxdur) | UUID-i istifadəçiyə göstərməyin — sadəcə "Bazar Qiyməti" tab-ının açarı kimi arxa planda istifadə edin |
| `ResourcePrice.regionId`/`supplierId` | ❌ Xam UUID | `/api/regions`/`/api/suppliers` siyahılarından map (kiçik siyahılardır, bir dəfə yükləyin) |
| `ResourcePrice.createdBy`/`approvedBy` | ❌ Xam UUID | `organizations`-da olduğu kimi, istifadəçi CRUD-u yoxdursa ad göstərilə bilməz — "Siz" (əgər `=== currentUser.id`-dirsə) və ya sadəcə göstərməyin |

**Qayda olaraq:** heç bir ekranda `{uuid-string}` formatlı mətn görünməsin. Ad mövcud deyilsə (lookup mümkün deyilsə), UUID-i göstərmək əvəzinə mənalı bir yer tutucu göstərin ("Naməlum", "Ümumi", "—") və ya UUID-i yalnız tooltip/debug-info kimi gizli saxlayın.

### 6.3 Modal/Dialoq bağlama — X düyməsi, kənara klik bağlamasın

Hazırkı problem: dialoq/pəncərə açılanda kənara (backdrop-a) klik edən kimi bağlanır — bu, istənməyən data itkisinə səbəb olur (istifadəçi forma doldurarkən səhvən kənara klikləyəndə hər şey itir). Düzəliş **bütün `Dialog` komponentlərinə tətbiq olunmalıdır**:

```jsx
<Dialog
  open={open}
  onClose={(event, reason) => {
    if (reason === 'backdropClick') return; // kənara klik ilə bağlanmasın
    onClose();                              // ESC düyməsi ilə bağlanmaq hələ də OK
  }}
>
  <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    Başlıq
    <IconButton onClick={onClose} size="small">
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent>...</DialogContent>
</Dialog>
```
- Hər dialoqun sağ-yuxarı küncündə **açıq-aydın bir X (bağla) düyməsi** olmalıdır.
- Kənara klik (backdrop) artıq bağlamır — yalnız X düyməsi, "Ləğv et" düyməsi, və ya ESC bağlayır.
- Əgər formada doldurulmuş məlumat varsa və istifadəçi X-ə basırsa, kiçik bir təsdiq ("Dəyişikliklər saxlanılmayacaq, davam edilsin?") əlavə etməyi düşünün (məcburi deyil, amma yaxşı UX-dir).

---

## 7. Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| Resurs atributu yaratmaq | `{attributeName, attributeValue, unit, sortOrder, searchable, required}` sərbəst | `{resourceId, categoryAttributeDefinitionId, value, active}` — ad/tip/vahid `GET .../attributes`-dan gəlir |
| Atribut siyahısı mənbəyi | Yox idi (əl ilə yazılırdı) | `GET /api/resource-categories/{id}/attributes` — dinamik forma qurmaq üçün |
| Atribut lüğəti idarəetməsi | Yox idi | `/api/attribute-definitions` (+ `/enum-values`), yeni admin ekranı |
| `POST /api/resources` body | `+code +active` | `code`/`active` YOXDUR — avtomatik/defolt |
| Resurs kodu | İstifadəçi yazırdı | Avtomatik (`MAT-000253` formatı), dəyişməzdir |
| İstehsalçı/Brend/Model | Sərbəst mətn | Autocomplete (`freeSolo`), 3 yeni endpoint |
| Yeni qiymətin ilkin statusu | `PENDING(1)` (təsdiq gözləyir) | `APPROVED(2)` (dərhal aktiv) — yalnız kənar dəyər `FLAGGED(4)` qalır |
| Rəqəm inputları | "015" problemi ola bilər | `''` defolt + `onFocus` select + `onBlur`-da formatla (bölmə 6.1) |
| UUID göstərilməsi | Bəzi yerlərdə xam UUID | Heç yerdə xam UUID YOX (bölmə 6.2 cədvəli) |
| Dialoq bağlama | Kənara klik bağlayır | Yalnız X/Ləğv et/ESC bağlayır (bölmə 6.3) |
