# CCMS Frontend — Sənəd İdxalı + Toplu Resurs Yaratma + Bildirişlər (v2, TƏKLİF)

> ## ⚠️ Bu fayl v1-i ƏVƏZ EDİR
> V1 (bu faylın əvvəlki versiyası) backend tərəfindən frontend-ə göndərilmiş ilkin təklif idi.
> Frontend komandası (Tural + AI) daxili müzakirə apardı və **mərkəzi işçinin sənəddən resurs
> yaratma axını əhəmiyyətli dərəcədə dəyişdi** — v1-dəki §1 ("Mənim Resurslarım"a təşkilat
> filtri əlavə etmək) fikri **tam ləğv olunur**, yerinə **sənədə bağlı, kateqoriya-əsaslı toplu
> resurs yaratma forması** gəlir (bax §4). Qalan hissələr (yükləmə, bildirişlər, baxış) əsasən
> saxlanılıb, kiçik dəqiqləşdirmələrlə.
>
> **Hələ TİKİLMƏYİB — bu da TƏKLİFDİR.** Kod yazılmayıb, sadəcə bu sənəd backend ilə müzakirə
> üçün hazırlanıb. Razılaşma əldə olunandan sonra icraya başlanacaq (əvvəlcə backend, sonra
> frontend).

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## 0. Fon — nə üçün bu dəyişiklik lazımdır

Rəhbərlik qərarı: təşkilatlar (vendor-lar) artıq "Mənim Resurslarım" bölməsində məlumatı əl
ilə xana-xana doldurmayacaq. Əvəzində:
- Təşkilat öz Excel/PDF/Word/skan sənədini **yükləyir** (§1).
- **Mərkəzi təşkilat işçisi** sənədi açıb, orada göstərilən məhsulları **kateqoriya üzrə toplu
  şəkildə** sistemə daxil edir — hər məhsul üçün ayrıca "yeni resurs" formu açmadan, bir
  ekranda bir neçə resurs eyni anda yaradır (§4). Bu, mövcud tək-resurs formundan (my-resources
  create) **tamamilə ayrı, yeni bir komponentdir** — köhnə forma toxunulmadan qalır, gələcəkdə
  başqa məqsəd üçün lazım ola bilər.
- Mərkəzi işçi hansı təşkilatın nə vaxt nə idxal etdiyini görməli, sənədi emal edərkən
  **kiliddə saxlamalı** (başqası eyni sənədi paralel aça bilməməli) və bildiriş almalıdır.

---

## 1. Vendor tərəfi: "Sənəd İdxalı" (yükləmə) — dəyişməyib

Tamamilə yeni menyu elementi — yalnız təşkilat (vendor) hesabları görür. Gating:
`organizationId != null` VƏ `DOCUMENT_UPLOAD` icazəsi.

### 1.1 `POST /api/documents` — sənəd yükləmə (multipart)

```
Content-Type: multipart/form-data
file: <binary>
description: "2026 Q3 qiymət siyahısı"   (opsional, sərbəst mətn)
```

```json
// Response (201)
{
  "id": "uuid",
  "organizationId": "uuid",
  "originalFilename": "qiymetler_2026_Q3.xlsx",
  "contentType": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "fileSize": 245678,
  "status": "NEW",
  "description": "2026 Q3 qiymət siyahısı",
  "uploadedByName": "acme-vendor",
  "processedByName": null,
  "createdDate": "2026-08-10T10:15:00Z"
}
```

- Qəbul edilən formatlar: `.xlsx`, `.xls`, `.pdf`, `.doc`, `.docx`, `.jpg`, `.jpeg`, `.png`.
  Uyğunsuz format → `400`.
- Max fayl ölçüsü: 20MB (təklif) — frontend seçim anında yoxlayır.

### 1.2 `GET /api/documents/mine` — öz təşkilatının sənədləri

Statusa görə rəngli chip (bax §2 üçün tam enum): `NEW`=sarı, `IN_PROGRESS`=mavi ("Emalda"),
`COMPLETED`=yaşıl ("Tamamlandı"), `REJECTED`=qırmızı ("Rədd edildi" — `reviewComment` tooltip
ilə).

### 1.3 `GET /api/documents/{id}/download` — sənədi endirmək

Auth-qorunan stream endpoint (bax §5).

---

## 2. YENİ: Sənəd data modeli (status + kilid + resurs əlaqəsi)

### 2.1 Status enum (təsdiqlənmiş, v1-dəki `0/1/2` rəqəm kodları ƏVƏZ OLUNUR)

| Status | Məna |
|---|---|
| `NEW` | Yükləndi, hələ heç kim toxunmayıb |
| `IN_PROGRESS` | Bir mərkəzi işçi "Emal et" ilə açıb, hazırda üzərində işləyir |
| `COMPLETED` | Mərkəzi işçi "Emalı bitir" düyməsinə basıb, sənəd üzrə iş bitib |
| `REJECTED` | Mərkəzi işçi sənədi yararsız hesab edib rədd edib (emal başlamazdan əvvəl və ya sonra da mümkün olmalıdır) |

### 2.2 Kilid davranışı (YENİ tələb)

- `NEW` sənəd üzərində hər hansı mərkəzi işçi "Emal et" bassa: sənəd `IN_PROGRESS`-a keçir,
  `processedByUserId`/`processedByName` həmin işçinin adı ilə doldurulur.
- Sənəd `IN_PROGRESS` olduğu müddətdə **yalnız onu açan işçi** emala davam edə bilər. Başqa bir
  mərkəzi işçi eyni sənədi açmağa çalışsa → `409 Conflict` (və ya bənzər), frontend "Bu sənəd
  hazırda **{processedByName}** tərəfindən emal olunur" mesajı göstərəcək, `Emal et` düyməsi
  görünsə də kliklənməyəcək (deaktiv, tooltip ilə).
- **Açıq sual (§9-a bax):** əgər ilk açan işçi sessiyanı bitirmədən tərk edərsə (browser
  bağlanır, uzun müddət geri qayıtmır), kilid necə azad olunur? Timeout? Admin override
  (kiminsə kiliddi məcburi açması)? Bu, backend qərarı tələb edir.

### 2.3 `resource.documentId` (YENİ sahə)

`resource` cədvəlinə `documentId` (nullable FK → `document.id`) əlavə olunur. Sənəd emalı
zamanı yaradılan **hər resurs** öz mənbə sənədinə bağlanır. Bu, §4.6-dakı "Bax" ekranının
əsasını təşkil edir: `GET /api/resources?documentId=<uuid>` ilə həmin sənəddən yaranan bütün
resurslar (və onların productları) siyahılanır.

---

## 3. Mərkəzi tərəf: bütün sənədlərə baxış ekranı

Gating: `DOCUMENT_REVIEW` icazəsi.

### 3.1 `GET /api/documents?organizationId=&status=&page=&size=`

Sütunlar: Təşkilat adı, Fayl adı, Yükləyən, Tarix, Status (chip), Emal edən (`processedByName`,
varsa), **Əməliyyat** (sağ tərəf):

| Sənəd statusu | Sağdakı düymələr |
|---|---|
| `NEW` | `Yüklə` + `Emal et` |
| `IN_PROGRESS` (mən özüm açmışam) | `Yüklə` + `Emal et` (davam et) |
| `IN_PROGRESS` (başqası açıb) | `Yüklə` + `Emal et` (deaktiv, tooltip: kim emal edir) |
| `COMPLETED` | `Yüklə` + `Bax` (§4.6) |
| `REJECTED` | `Yüklə` (izah `reviewComment`-də) |

### 3.2 `PATCH /api/documents/{id}/status` — rədd etmək üçün

```json
{ "status": "REJECTED", "reviewComment": "Sənəd oxunmur, təkrar yükləyin" }
```

---

## 4. YENİ: "Emal et" — Toplu Resurs Yaratma forması

Bu, **mövcud "yeni resurs" formundan (my-resources create) tamam ayrı, yeni komponentdir.**
Köhnə forma dəyişmir, paralel mövcud qalır.

### 4.1 Açılış

`Emal et` klikində sənəd `IN_PROGRESS`-a keçir (əgər `NEW`-dirsə) və toplu-yaratma forması açılır.
`organizationId` sənəddən avtomatik gəlir (istifadəçi seçmir).

### 4.2 Addım 1 — Kateqoriya seçimi

Kateqoriya seçici pəncərə (`resource_categories` ağacı), **yalnız son leaf seçilə bilər**
(mövcud "Resurs Kataloqu" ağacındakı seçim davranışı ilə eyni).

### 4.3 Addım 2 — Mövcud productlar siyahısı

Seçilən leaf-ə bağlı bütün mövcud productlar **alt-alta** göstərilir. Hər sətirdə:
- Product-un öz məlumatları (ad, atributlar, vahid) — **avtomatik dolu, dəyişməz**.
- Yanında (sığmasa, aydın vizual ayrım ilə 2-ci sətirdə) mərkəzi işçinin dolduracağı
  **resurs-səviyyəli sahələr**: `manufacturer` (məcburi), `brand`/`model`/`specification`
  (opsional), qiymət (bax §4.3.1) və s. — mövcud resurs yaratma formundakı eyni sahələr.

#### 4.3.1 Qiymət sahəsi

Qiymət resursa bağlıdır (bax mövcud `MyResourcePrice`: `regionId`+`price`+`currency`+
`effectiveDate`+`expireDate`+`comment`, bir resursun bir neçə regionda qiyməti ola bilər).
Sətrin qarışmaması üçün:
- **Defolt görünüş:** hər sətirdə tək bir kompakt qiymət sahəsi (region + məbləğ, ən çox
  işlədilən region avtomatik seçili).
- **"+ Region" kiçik düymə/link:** yalnız kliklənəndə sətrin altında əlavə region-qiymət cütü
  açılır (accordion) — nadir hallar üçün, defolt görünüşü doldurmur.
- Bu formda qiymət ümumiyyətlə boş buraxıla bilər — sonradan resursun üstünə keçib əlavə etmək
  imkanı da qalır (indiki `PriceSection`/`MyResourcePricesList` axını dəyişmir).
- Hər sətrin başında/sonunda **`X` (çıxar) düyməsi** — bu product sənəddə yoxdursa, işçi onu
  bu sessiyadan çıxarır (heç nə backend-ə getmir, sadəcə client-side "bunu doldurmuram"
  işarəsi, sətir formdan yox olur/boz olur).

### 4.4 Addım 3 — Yeni product əlavə etmək

Siyahının altında **həmişə görünən** bir "+ Yeni product" sətri (kateqoriyada mövcud product
olsun-olmasın, bu sətir hər zaman var). Klikləndikdə kateqoriya+atribut formu açılır (mövcud
resurs-yaratma formundakı "b yolu" ilə eyni): **mövcud find-or-create/matchKey yoxlaması
saxlanılır** — eyni atributlarla product artıq varsa, təzəsi yaradılmır, mövcud olana resurs
bağlanır. Uyğunluq yoxdursa, yeni product yaradılır və ona resurs bağlanır.

### 4.5 Göndərmə

Toplu göndərmə — bir sorğuda bir neçə resurs. **Backend-dən soruşulası sual:** yeni bulk
endpoint (`POST /api/documents/{id}/resources`, array body) istənilir, yoxsa frontend
`POST /api/resources {..., documentId}`-i hər sətir üçün ardıcıl çağırsın (N sorğu)?

Bu addım **kateqoriya üzrə təkrarlana bilər** — sənəddə bir neçə kateqoriyadan məhsul varsa,
işçi "Emal et"-i həmin sənəd üzərində dəfələrlə aça bilər (hər dəfə fərqli kateqoriya seçib).

### 4.6 Resurs statusu (bulk yaradılan resurslar üçün) — YENİDƏN BAXILDI

**Əvvəlki versiya səhv idi:** `my-resources`-un `DRAFT/SUBMITTED/CLARIFICATION_NEEDED/APPROVED/
REJECTED` review-statusunu bulk resurslara da tətbiq etmək istəyirdi, "kənar qiymət" üçün isə
Resource.status üzərində ikinci bir yoxlama qatı təklif edirdi. Kodu yoxlayanda məlum oldu ki,
bu **artıq mövcud olan bir sistemi təkrarlayırdı**:

- Birbaşa (`POST /api/resources`, "Resurslar (Elanlar)") yaradılan resurslarda review-status
  konsepsiyası **ümumiyyətlə yoxdur** — yalnız `active: boolean` var (bax `resource.types.ts`).
  DRAFT/SUBMITTED/APPROVED yalnız vendor-un özü doldurduğu `my-resources` axınına aiddir.
- "Kənar qiymət" yoxlaması artıq **`ResourcePrice` üzərində tam işlək şəkildə mövcuddur**:
  `POST /api/resource-prices` → status `PENDING`, backend median/market-orta-qiymətdən
  kənarlaşmanı avtomatik hesablayıb `FLAGGED` edir, `GET /api/resource-prices/flagged` admin
  baxışına verir, `PATCH /api/resource-prices/{id}/approve|reject` ilə həll olunur. Bu, məhz
  eyni məqsədə xidmət edir.

**Yekun qərar:** bulk-created resurslar **review-statussuz** yaranır (birbaşa `POST
/api/resources` yolu ilə eyni semantika, sadəcə `documentId` əlavə olunur) — mərkəz işçisi
etibarlı mənbədir, əlavə təsdiq mərhələsi lazım deyil. Qiymətin kənarlığı isə §4.3.1-də
yaradılan `ResourcePrice` qeydi artıq mövcud `PENDING→FLAGGED→approve/reject` axınından keçir,
heç nə yenidən qurulmur. Nəticədə resurs istənilən vaxt sərbəst redaktə oluna bilər (`PUT
/api/resources/{id}`, indiki kimi, status-a görə məhdudiyyət yoxdur).

### 4.7 "Emalı bitir" + "Bax"

Kateqoriya bitdikdə **"Emalı bitir" BASILMIR** — bu, bütün sənəd üzrə, mərkəzi işçi bütün
məhsulları daxil etdikdən sonra basdığı ayrıca bir addımdır (sənəd sətrində və ya son emal
formunda ola bilər). Bu, `PATCH /api/documents/{id}/status {"status": "COMPLETED"}` çağırır,
kilid azad olunur, sənəd sətrində `Emal et` yerinə `Bax` görünür.

`Bax` → `GET /api/resources?documentId=<uuid>` — bu sənəddən yaranan bütün product/resursların
sadə siyahı görünüşü (redaktə yox, sadəcə baxış/audit).

---

## 5. Sənədə baxış (fayl özü, dəyişməyib)

- **PDF** → `GET /api/documents/{id}/download` yeni tabda (`window.open`), native viewer.
- **Excel/Word** → sadəcə endirmə, inline preview Faza 1-də yoxdur.
- **JPG/PNG** → `<img>` modal/lightbox.
- Auth tələb olunur, presigned/açıq URL yoxdur.

---

## 6. Bildirişlər (in-app siyahı, polling) — dəyişməyib

### 6.1 `GET /api/notifications/mine`

```json
{
  "content": [
    {
      "id": "uuid", "type": "DOCUMENT_UPLOADED",
      "message": "Acme Construction Supplies yeni sənəd yüklədi: qiymetler_2026_Q3.xlsx",
      "referenceType": "DOCUMENT", "referenceId": "uuid-of-document",
      "isRead": false, "createdDate": "2026-08-10T10:15:00Z"
    }
  ],
  "totalElements": 1,
  "unreadCount": 3
}
```

### 6.2 `PATCH /api/notifications/{id}/read`, `PATCH /api/notifications/read-all`

### 6.3 UI

- Header-də zəng ikonu + qırmızı badge (`unreadCount`).
- Klik → dropdown/panel, son N bildiriş.
- Bildirişə klik → sənəd detalına yönləndir + `PATCH .../read`.
- Polling: 30 saniyə (təklif, dəyişməyib).

---

## 7. LƏĞV OLUNAN HİSSƏ (v1-dən)

v1-in §1-i ("Mənim Resurslarım"a mərkəzi işçi üçün təşkilat filtri əlavə etmək) **tam ləğv
olunur**. Səbəb: yeni axında `organizationId` artıq sənəddən gəlir, ayrıca təşkilat-seçici
ekrana ehtiyac qalmır. Bunun bir nəticəsi: əvvəlki texniki blokerlərdən biri (org-picker üçün
`ORGANIZATION_READ` icazəsinin admin-only olması) artıq **əhəmiyyətsizdir** — bu axında org
seçici ümumiyyətlə yoxdur.

**Açıq sual:** sənədsiz, əl ilə (adhoc) mərkəzi işçinin bir təşkilat adından tək resurs
yaratmasına hələ də ehtiyac varmı? Əgər yoxdursa, bundan sonra resurs yaratmağın yeganə yolu
sənəd emalı olacaq.

---

## 8. Mockup-lar

### 8.1 Mərkəzi — Sənədlərin siyahısı
```
──────────────────────────────────────────────────────────────
 Sənədlərin İdarəsi        [Təşkilat: hamısı ▾] [Status: hamısı ▾]
──────────────────────────────────────────────────────────────
 Təşkilat   Fayl              Emal edən    Status         
 Acme MMC   qiymetler_Q3.xlsx  —           🟡 Yeni        [Yüklə] [Emal et]
 Acme MMC   siyahi_2.pdf       Əli Vəliyev 🔵 Emalda       [Yüklə] [Emal et (deaktiv, Əli emal edir)]
 Beta MMC   metal_8.docx       Aygün       🟢 Tamamlandı   [Yüklə] [Bax]
──────────────────────────────────────────────────────────────
```

### 8.2 Mərkəzi — "Emal et" toplu forması
```
──────────────────────────────────────────────────────────────
 Sənəd: qiymetler_Q3.xlsx (Acme MMC)         [Kateqoriya: Polad borular ▾]
──────────────────────────────────────────────────────────────
 ▢ Qara polad boru, Ø32     manufacturer:[___] brand:[___] qiymət:[___]  [X]
 ▢ Qara polad boru, Ø40     manufacturer:[___] brand:[___] qiymət:[___]  [X]
                             model:[___] specification:[___]
 + Yeni product əlavə et
──────────────────────────────────────────────────────────────
                                    [Yadda saxla]   [Emalı bitir]
──────────────────────────────────────────────────────────────
```

---

## 9. Backend-dən soruşulan suallar (razılaşma lazımdır)

1. **Kilid timeout/release** (§2.2) — açıq qalan işçi sessiyanı tərk edərsə, kilid necə azad
   olunur? Timeout-la avtomatik, yoxsa admin əl ilə açır?
2. **Bulk endpoint** (§4.5) — `POST /api/documents/{id}/resources` (array) yeni endpoint kimi
   istəyirik, yoxsa mövcud `POST /api/resources`-a `documentId` əlavə edib N dəfə çağıraq?
3. **Permissions array** — `AuthUser`-də hazırda `permissions: string[]` yoxdur (yalnız
   `roles`). `DOCUMENT_UPLOAD`/`DOCUMENT_REVIEW` kimi icazələri frontend-də necə yoxlayaq —
   `/api/auth/me` permissions qaytarsın, ya da dəqiq rol→icazə xəritəsini bizə verin ki,
   `permissions.ts`-də hardcode edək (əvvəlki `CENTRAL_ADMIN_ROLES` kimi)? **Diqqət:**
   `DOCUMENT_UPLOAD`/`DOCUMENT_REVIEW`-dən əlavə, "Emal et" formundakı qiymət sahəsi (§4.3.1,
   `POST /api/resource-prices`) `COST_WRITE` icazəsi tələb edir (bax mövcud `PriceSection`
   gating-i) — mərkəzi işçinin roluna bu üçü də (DOCUMENT_UPLOAD + DOCUMENT_REVIEW +
   COST_WRITE) verilməlidir, yoxsa bulk formda qiymət daxil edərkən `403` alınacaq. Rol→icazə
   xəritəsi hazırlananda bu üçünün eyni rola bağlı olduğu unudulmasın.
4. **`unreadCount`** (§6.1) — ayrıca yüngül endpoint istəyirsiniz, yoxsa siyahı cavabının
   içində kifayətdir?
5. **Yükləmə formu** (§1.1) — `description`-dan başqa struktur sahə (məs. "hansı dövrə
   aiddir") lazımdırmı?
6. ~~Qiymət-kənarlıq yoxlaması~~ — **artıq sual deyil**, mövcud `ResourcePrice`
   `PENDING→FLAGGED→approve/reject` axını (bax §4.6) bunu onsuz da edir, dəyişiklik lazım deyil.
7. ~~Manual "Dəqiqləşdirməyə göndər" endpoint-i~~ — **artıq sual deyil**, eyni səbəbdən (§4.6):
   bulk resurslar review-statussuzdur, kənar qiymət isə mövcud flagged-price ekranından
   idarə olunur.
8. ~~APPROVED resursun redaktəsi~~ — **artıq sual deyil**, bulk resurslarda review-status
   olmadığı üçün bu məhdudiyyət tətbiq olunmur, `PUT /api/resources/{id}` indiki kimi sərbəst
   işləyir.

Bu suallara cavab aldıqdan sonra backend icrası başlayacaq, ardınca frontend.
