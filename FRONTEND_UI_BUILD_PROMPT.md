# CCMS Frontend — Remaining UI Screens (React + MUI)

> Bu faylı olduğu kimi frontend-i yazan AI alətinə verin. Kateqoriya ağacı (tree, CRUD, alt-kateqoriya əlavəetmə) **artıq hazırdır** — bu prompt yalnız **çatışmayan** ekranlar üçündür: Resources, Resource Prices, Units, Regions, Suppliers.
>
> **API kontraktı üçün həmişə `FRONTEND_AI_PROMPT.md`-ə istinad edin** — dəqiq request/response JSON-ları, sahə adları, query param adları (məs. `category` vs `categoryId` fərqi) və bütün "gotcha"-lar ordadır. Bu fayl yalnız **UI/UX strukturunu** (səhifələr, formlar, cədvəllər, naviqasiya) təsvir edir.

**Stack:** React + Material-UI (MUI v5+). Cədvəllər üçün `DataGrid` (və ya `Table`+`TablePagination`), formlar üçün MUI `TextField`/`Select`/`Autocomplete`/`DatePicker`/`Switch`, dialoglar üçün MUI `Dialog`.

---

## Niyə cədvəllər boşdur

`resource_categories`-dən başqa hər şey boşdur, çünki onlara heç bir UI yoxdur — backend-in özü tam işləkdir (bax `PROJECT_STATUS.md`, bütün endpoint-lər canlı test edilib). Problem data-da deyil, ekranların çatışmamasındadır. Aşağıdakı 5 modul üçün ekranlar əlavə edilməlidir.

---

## Naviqasiya strukturu (tövsiyə)

```
Sidebar:
├── Resource Categories (mövcud — dəyişməyin)
├── Resources                    ← YENİ, əsas iş ekranı
├── Reference Data               ← YENİ, alt-menyu:
│   ├── Units
│   ├── Regions
│   └── Suppliers
```

Bir Resource-un daxilində (detail səhifəsində) əlavə tab-lar:
```
Resource Detail
├── General (əsas sahələr)
├── Attributes (EAV xüsusiyyətlər)
└── Prices (qiymət tarixçəsi + approval)
```

---

## 1. Units, Regions, Suppliers — üç ekran, EYNİ pattern

Bu üçü strukturca eynidir (`id, code, name, active` — Units-də əlavə `symbol`, `decimalPrecision` var). Bir dəfə component yazıb üçünə də istifadə edə bilərsiniz (parametrik).

**List səhifəsi:**
- MUI `DataGrid`, sütunlar: `code`, `name` (Units üçün əlavə `symbol`, `decimalPrecision`), `active` (yaşıl/boz chip), Actions (Edit, Delete icon-ları).
- Üstdə axtarış paneli: `code` TextField, `name` TextField, `active` Select (Hamısı/Aktiv/Deaktiv) — dəyişəndə `GET /api/units?code=&name=&active=` çağırılır.
- Pagination: DataGrid-in server-side pagination-u, `page`/`size`/`sort` parametrlərini API-ya ötürün (bax `FRONTEND_AI_PROMPT.md` bölmə 0 — `PageResponse<T>` şəkli).
- "+ Yeni" düyməsi → Create dialog.

**Create/Edit dialog:**
- Units: `code` (TextField, məcburi, max 20), `name` (TextField, məcburi, max 100), `symbol` (TextField, opsional, max 20), `decimalPrecision` (Number input, defolt 2), `active` (Switch, defolt aktiv).
- Regions/Suppliers: `code` (TextField, məcburi, max 20), `name` (TextField, məcburi, max 150), `active` (Switch).
- Submit: `POST /api/units` (yaratma) və ya `PUT /api/units/{id}` (redaktə) — eyni body şəkli.
- **409 xəta idarəsi**: duplicate `code` göndərilsə backend 409 qaytarır (`"Unit code 'X' already exists"`) — bunu forma altında qırmızı mətn kimi göstərin, dialoqu bağlamayın.

**Delete:**
- Silmə düyməsi basılanda təsdiq dialogu göstərin ("Bu [unit/region/supplier] silinsin?").
- **409 xəta idarəsi**: əgər hər hansı resurs/qiymət bu qeydi istifadə edirsə, backend 409 qaytarır (`"Cannot delete a unit that is assigned to resources..."`) — bunu snackbar/toast ilə göstərin, silməyin, dialoqu bağlayın. Bu, **gözlənilən normal hal**dır (səhv deyil) — istifadəçiyə aydın izah edin: "Bu qeyd istifadə olunur, silinə bilməz."

---

## 2. Resources — əsas iş ekranı

### List səhifəsi (`/resources`)

- `DataGrid`, sütunlar: `code`, `name`, **Category** (categoryId-dən ad göstərmək üçün aşağıya bax), **Unit** (unitId-dən simvol/ad), `manufacturer`, `brand`, `model`, `active`, Actions.
- Axtarış paneli: `name`, `code`, Category (aşağıdakı tree-picker), `manufacturer`, `brand`, Unit (select), Status (Aktiv/Deaktiv). API çağırışında bu sahələr `name/code/category/manufacturer/brand/unit/status` query param-larına gedir (**diqqət**: `category` və `unit`, `categoryId`/`unitId` DEYİL — bax `FRONTEND_AI_PROMPT.md` 3.5).
- Kateqoriya sütununda ad göstərmək üçün: kateqoriyaların tam siyahısını (və ya artıq mövcud tree data-nı) yaddaşda saxlayıb `categoryId → name` lookup map qurun; hər sorğuda ayrıca çağırış etməyin.
- Unit sütununda da eyni məntiqlə `unitId → symbol` lookup map.

### Category picker (Resource yaradanda/redaktə edəndə)

Kateqoriyalar hierarxikdir (`GET /api/resource-categories/tree`). Resource-a kateqoriya seçdirərkən:
- Artıq mövcud tree data-nı (sidebar-dakı ağac üçün istifadə etdiyiniz) yenidən istifadə edin.
- MUI `Autocomplete` ilə **düzləşdirilmiş** (flattened) siyahı göstərin, hər sətirdə tam yol: `"Materials > Cement"` (parent adlarını `" > "` ilə birləşdirərək). Sadəcə leaf-lər deyil, bütün kateqoriyalar seçilə bilməlidir (həm leaf, həm branch — backend bunu məhdudlaşdırmır).

### Create/Edit dialog

Sahələr: `categoryId` (yuxarıdakı picker, məcburi), `code` (TextField, məcburi), `name` (TextField, məcburi), `description` (multiline TextField, opsional), `unitId` (Select/Autocomplete, unit siyahısından, opsional), `specification` (TextField, opsional), `manufacturer` (TextField, opsional), `brand` (TextField, opsional), `model` (TextField, opsional), `active` (Switch).

- `PUT /{id}` **bütün sahələri** qəbul edir (categoryId daxil — resurs başqa kateqoriyaya köçürülə bilər elə bu formadan), fərqli olaraq Resource Categories-in `PUT`-undan (o yalnız 3 sahə qəbul edir).
- **404 xəta idarəsi**: mövcud olmayan `unitId` və ya `categoryId` göndərilsə 404 qaytarılır — praktikada baş verməməlidir (siz select-dən seçdiyiniz üçün), amma error handling əlavə edin.
- **409**: duplicate `code` (qlobal unikal, kateqoriyadan asılı olmayaraq) → forma altında göstərin.

### Delete

Soft-delete-dir (backend-də) — UI-dan fərqi yoxdur, sadəcə adi "Sil" düyməsi, silinən resurs siyahıdan yox olur. Təsdiq dialogu göstərin.

---

## 3. Resource Detail → "Attributes" tab

Resource-un üstünə klikləyəndə açılan detail səhifəsində ikinci tab.

- Cədvəl (paginasiyasız, sadə array — `GET /api/resources/{resourceId}/attributes`): `attributeName`, `attributeValue`, `unit`, `sortOrder`, `searchable` (checkbox/chip), `required` (chip), `active`, Actions.
- `sortOrder`-ə görə sıralı gəlir, əlavə sort lazım deyil.
- "+ Yeni xüsusiyyət" düyməsi → dialog: `attributeName` (TextField, məcburi), `attributeValue` (TextField, məcburi), `unit` (TextField, opsional, sərbəst mətn — bu, Units cədvəlinə istinad DEYİL, sadəcə "mm", "kg" kimi sərbəst vahid yazısıdır), `sortOrder` (Number), `searchable` (Switch — **izah edin istifadəçiyə**: "Bu xüsusiyyət resurs axtarışında filtr kimi istifadə oluna bilsin?"), `required` (Switch — sadəcə informativ bayraq), `active` (Switch).
- **409**: eyni resursda duplicate `attributeName` (case-insensitive) → forma altında göstərin.
- Delete: hard delete, sadə təsdiq dialogu kifayətdir.

---

## 4. Resource Detail → "Prices" tab (ən mürəkkəb hissə)

### Nümayiş məntiqi

Backend-də "cari qiymət" almaq üçün **hər zaman resourceId+supplierId+regionId üçlüyü lazımdır** (`GET /api/resource-prices/current`) — tək çağırışla "bu resursun bütün cari qiymətləri" almaq mümkün deyil. Ona görə bu tab üçün tövsiyə olunan yanaşma:

1. Tab açılanda `GET /api/resource-prices/history?resourceId={id}&size=100` çağırın (bir resursun bütün qiymət qeydləri, bütün status/supplier/region kombinasiyaları daxil).
2. Client-side qruplaşdırın: `(supplierId, regionId)` cütlüyünə görə qruplar yaradın.
3. Hər qrup üçün "cari" olanı tapın: `status === 2 (APPROVED)` VƏ `effectiveDate <= bugün` VƏ (`expireDate === null` VƏ YA `expireDate >= bugün`).
4. Nəticəni belə göstərin:

```
┌─ Cari Qiymətlər (supplier/region üzrə) ────────────────┐
│ Təchizatçı      Region        Qiymət      Etibarlıdır   │
│ Acme Supplies   Baku          105.00 AZN  21.07.2026-dən │
│ Best Materials  Ganja         98.50 AZN   01.06.2026-dən │
└──────────────────────────────────────────────────────────┘

┌─ Tam Tarixçə (bütün statuslar) ─────────────────────────┐
│ [Cədvəl: Təchizatçı, Region, Qiymət, VAT, Valyuta,      │
│  Effektiv tarix, Bitmə tarixi, Status(chip), Actions]   │
└──────────────────────────────────────────────────────────┘
```

Status chip rəngləri: PENDING(1)=sarı, APPROVED(2)=yaşıl, REJECTED(3)=qırmızı.

### "+ Yeni qiymət" dialogu

Sahələr:
- **Region** (Select/Autocomplete, `/api/regions`-dan siyahı, məcburi)
- **Supplier** (Select/Autocomplete, `/api/suppliers`-dan siyahı, məcburi)
- **Qiymət** (Number input, məcburi, `> 0`)
- **VAT** (Number input, məcburi, `0-100`, faiz kimi göstərin, məs. "18" = 18%)
- **Valyuta** (Autocomplete, `freeSolo`, tövsiyə olunan siyahı: `AZN, USD, EUR, TRY, GBP, RUB` — amma istifadəçi başqa 3-hərfli kod da yaza bilsin)
- **Effektiv tarix** (DatePicker, məcburi, defolt bugün)
- **Bitmə tarixi** (DatePicker, opsional — "Naməlum müddətə qədər" checkbox-u ilə boş buraxıla bilsin)

Submit: `POST /api/resource-prices`, body-yə `resourceId` avtomatik əlavə olunur (hazırkı resurs). Yaradılan qiymət **həmişə "Gözləmədə" statusunda başlayır** — bunu istifadəçiyə forma göndəriləndən sonra aydın bildirin ("Qiymət yaradıldı, təsdiq gözləyir").

### Redaktə (yalnız PENDING sətirlər üçün)

- Edit düyməsi **yalnız `status === 1 (PENDING)`** olan sətirlərdə görünsün/aktiv olsun. `APPROVED`/`REJECTED` sətirlərdə Edit düyməsini ya gizlədin, ya da disabled edin (tooltip: "Təsdiqlənmiş/rədd edilmiş qiymət redaktə oluna bilməz — yenisini yaradın").
- Redaktə dialogu yaratma dialoqu ilə eynidir, sadəcə `resourceId` göndərilmir (`PUT /{id}`).

### Approve / Reject düymələri

- **Yalnız `PENDING` sətirlərdə göstərin.**
- **Rol-əsaslı gizlətmə**: `/api/auth/me` cavabındakı `roles` massivinə baxın. Yalnız `SUPER_ADMIN`, `ADMIN`, `EXPERT` rollarında olan istifadəçilər approve/reject edə bilər (backend-də `COST_APPROVE` icazəsi). Digər rollarda (`ANALYST`, `OPERATOR`, `VIEWER`) bu düymələri UI-da göstərməyin. (Backend bunu enforce edir, amma UI-da əvvəlcədən gizlətmək daha yaxşı təcrübədir.)
- Approve: `PATCH /api/resource-prices/{id}/approve`, body yoxdur. Uğurlu olsa: **həm cari qiymətlər bölməsini, həm tam tarixçəni yenidən yükləyin** — çünki approve əməliyyatı başqa bir sətrin (əvvəlki aktiv qiymətin) `expireDate`-ini də avtomatik dəyişə bilər.
- Reject: `PATCH /api/resource-prices/{id}/reject`, eyni qayda.
- Hər ikisi üçün təsdiq dialogu göstərməyə ehtiyac yoxdur (geri qaytarıla bilməz əməliyyatlardır, amma sadə/tez-tez istifadə olunan aksiyalardır) — sadəcə snackbar ilə nəticəni bildirin.

---

## Ümumi qeydlər

- Bütün formalar üçün backend-dən gələn `validationErrors` obyektini (400 xətalarında) hər sahənin altında göstərin (`FRONTEND_AI_PROMPT.md` bölmə 0-da şəkli var).
- Bütün mutasiya (create/update/delete/approve/reject) düymələri `COST_WRITE` icazəsi tələb edir (approve/reject istisna olmaqla — onlar `COST_APPROVE`). `VIEWER` rolunda olan istifadəçi üçün bütün "+ Yeni"/Edit/Delete düymələrini gizlədin, yalnız `COST_READ` səviyyəsində (görüntüləmə) buraxın.
- Hər list səhifəsində boş vəziyyət (empty state) göstərin: "Hələ heç bir [unit/region/supplier/resource] yoxdur — '+ Yeni' düyməsi ilə əlavə edin."
