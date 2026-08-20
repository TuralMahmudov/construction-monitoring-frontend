# CCMS Frontend — Rüb (Dövr) İzləməsi + Dublikat-Resurs Bayrağı (`superseded`)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas modullar), **`FRONTEND_AI_PROMPT_PRODUCTS.md`** və **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`**-nin **davamıdır** — konvensiyalar (unified response envelope, `PageResponse<T>`, auth axını, MUI stack) təkrarlanmır, birbaşa istinad edilir. `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6-da təsvir olunan `GET /api/resource-prices/averages` (canlı bazar orta/median) **dəyişməyib** — bu fayl ona **əlavə/paralel** yeni bir endpoint (`period-averages`, tarixi/trend) və mövcud `ResourceResponse`/`ResourcePriceResponse`/`DocumentResponse`-a əlavə olunan sahələri təsvir edir.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst (qısa)

Backend-də iki ayrı, lakin əlaqəli iş görüldü:

1. **Rüb (period) izləməsi (2026-08-14):** hər qiymət/sənəd özünün hansı təqvim rübünü (Q1-Q4) təmsil etdiyini daşıyır — bu, "bu gün etibarlıdırmı" sualından (`effectiveDate`/`expireDate`) **tamamilə müstəqildir**. Məqsəd: rüblərarası trend hesabatı (Excel export-un təməl infrastrukturu, Excel export-un özü hələ tətbiq edilməyib).
2. **Dublikat-resurs bug-ının həlli (2026-08-17):** bir təşkilat eyni məhsul üçün sənədi/resursu yenidən emal edəndə, köhnə resurs artıq "canlı" bazar hesablamasına qarışmır — `superseded` bayrağı ilə işarələnir, amma **silinmir, siyahıdan yox olmur**.

---

## 1. Qiymət yaradanda: `periodYear`/`periodQuarter` (opsional override)

`POST /api/resource-prices` body-sinə 2 yeni **opsional** sahə əlavə olunub:

```json
{
  "resourceId": "uuid", "regionId": "uuid", "price": 100.00, "vat": 18, "currency": "AZN",
  "effectiveDate": "2026-08-17", "expireDate": null,
  "periodYear": 2026, "periodQuarter": 3,
  "comment": null
}
```

- **Adi halda formaya bu sahələri QOYMAYIN** — server `effectiveDate`-dən avtomatik hesablayır (2026-08-17 → `periodYear=2026, periodQuarter=3`).
- Yalnız **gecikmiş məlumat** üçün göstərin: məsələn, istifadəçi "Bu, əslində Mart ayının qiymət siyahısıdır, indi daxil edirəm" desə — formaya kiçik, gizli-defolt bir "Hansı rübə aiddir?" seçici (il + rüb dropdown, Q1-Q4) əlavə edin, boş buraxılsa server öz defolt hesablamasını edir.
- `periodQuarter` göndərilsə, `1-4` aralığında olmalıdır (server-side validasiya, `400` verər əks halda).

**`ResourcePriceResponse`-da da bu iki sahə həmişə dolu gəlir** (heç vaxt `null` deyil, server hər zaman hesablayır) — `GET /api/resource-prices/{id}`, `/current`, `/history`, `/search` cavablarında görünür. İstəsəniz Price Detail/History cədvəlində "Rüb" sütunu kimi göstərin: `"2026 Q3"` formatında.

---

## 2. Sənədlərdə: `periodYear`/`periodQuarter` + düzəliş endpoint-i

`DocumentResponse`-a 2 yeni sahə əlavə olunub:

```json
{
  "id": "uuid", "organizationId": "uuid", "organizationName": "...",
  "originalFilename": "qiymet-siyahisi-mart.xlsx", "status": 2,
  "periodYear": 2026, "periodQuarter": 1,
  "createdAt": "2026-04-05T10:00:00Z"
}
```

- Yüklənən yeni sənədlər **avtomatik** yükləmə tarixinin rübünə təyin olunur (`createdAt`-dan, yuxarıdakı misalda aprel ayında yüklənsə də istifadəçi bunu düzəldə bilər — aşağıya bax).
- **Köhnə sənədlər (bu funksiyadan əvvəl yaradılanlar) üçün bu sahələr `null` ola bilər** — `"—"` və ya "Təyin edilməyib" kimi göstərin, boş sahə kimi buraxmayın.

### `PATCH /api/documents/{id}/period` — rübü düzəltmək

**İcazə:** `DOCUMENT_REVIEW` (mərkəzi review komandası, adi vendor istifadəçisi görməsin).

```json
// Request body:
{ "periodYear": 2026, "periodQuarter": 1 }
```

- Cavab: yenilənmiş `DocumentResponse`.
- **Bloklanma qaydası:** sənəd `COMPLETED` statusuna çatdıqdan sonra bu endpoint `400`/xəta qaytarır — düymə/forma yalnız `status !== COMPLETED` olanda aktiv olsun.
- **Ekran:** Document Detail səhifəsində, "Emal et" (`process`) düyməsinin yanında kiçik bir "Rübü düzəlt" (qələm ikonu) — açılan mini-dialoq: il (rəqəm) + rüb (Q1-Q4 dropdown). Sənəd `IN_PROGRESS`/`PENDING` ikən görünsün, `COMPLETED` olduqda gizli və ya deaktiv (tooltip: "Tamamlanmış sənədin rübü dəyişdirilə bilməz").

---

## 3. YENİ: `GET /api/resource-prices/period-averages` — Tarixi/Trend Bazar Statistikası

**İcazə:** `COST_READ` (canlı `/averages` endpoint-i ilə eyni, təşkilat-filtrsiz — bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6).

Query params (hamısı opsional): `productId`, `regionId`, `periodYear`, `periodQuarter`, `name` (məhsul adına görə, case-insensitive), + `page`/`size`/`sort` (defolt sıra `periodYear,periodQuarter`).

Response `data`: `PageResponse<ResourcePricePeriodAverageResponse>`:
```json
{
  "productId": "uuid", "categoryId": "uuid", "resourceName": "Portland Cement",
  "regionId": "uuid",
  "periodYear": 2026, "periodQuarter": 3,
  "avgPrice": 130.0000, "medianPrice": 130.0000, "minPrice": 100.0000, "maxPrice": 200.0000,
  "sampleCount": 2, "resourceCount": 2,
  "previousAvgPrice": 100.0000, "previousMedianPrice": 100.0000,
  "periodOverPeriodChangePct": 30.0000,
  "calculatedAt": "2026-08-17T14:30:00Z"
}
```

- Bu, canlı `/averages`-in **tarixi/trend qardaşıdır** — eyni sahələr (`avgPrice`/`medianPrice`/`minPrice`/`maxPrice`/`sampleCount`/`resourceCount`, bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6-dakı `sampleCount` vs `resourceCount` izahı — eyni məntiq burada da keçərlidir), amma **"bu gün etibarlıdırmı" pəncərəsinə baxmır**, sadəcə həmin `(productId, regionId, periodYear, periodQuarter)` üçün göndərilmiş qiymətləri göstərir.
- **Yeni sahələr:**
  - `previousAvgPrice`/`previousMedianPrice`: bir əvvəlki **məlumatı olan** rübün rəqəmi (mütləq bilavasitə əvvəlki təqvim rübü deyil — əgər arada rüb boş keçibsə, ən yaxın əvvəlki mövcud rüb götürülür). Heç bir əvvəlki rüb yoxdursa `null`.
  - `periodOverPeriodChangePct`: işarəli faiz dəyişmə (`+30.00%` yuxarı, `-15.00%` aşağı). `previousAvgPrice` `null` və ya `0` olduqda bu da `null`-dur.
- Bir sətir = bir `(productId, regionId, periodYear, periodQuarter)` kombinasiyası. Eyni məhsul/region üçün bir neçə rüb sətri gələ bilər (məsələn Q1, Q2, Q3 ayrı-ayrı sətirlərdir).

### ⚠️ Bilinən biznes qaydası — eyni rübdə "köhnə" və "yeni" resurs qarışa bilər

Bu endpoint (`period-averages`) `superseded` bayrağına HEÇ BAXMIR (qəsdən — tarixi rəqəmlər geriyə doğru dəyişməsin deyə, bax bölmə 4). Nəticə: əgər bir təşkilatın köhnə resursu (superseded olan) VƏ onu əvəzləyən yeni resursu **EYNİ rübün** içində qiymət alıbsa (məsələn hər ikisi Q3-də yaradılıb), o rübün sətrində hər ikisinin qiyməti **birlikdə ortalanır** (median) — yəni bir təşkilatın "səsi" real cari qiymətindən fərqli, köhnə+yeni qarışığı ola bilər. Bu, bilinən, backend-də qəbul edilmiş bir limitdir (düzəldilməyib, "sadə saxlayaq" qərarı). **Fərqli rüblərdə problemsizdir** — yalnız eyni rübün içində reprocessing baş verərsə təsir edir.

**Frontend üçün:** bunu düzəltməyə çalışmayın (backend işi), sadəcə bilin ki, trend qrafikində/cədvəlində bəzən bir rübün rəqəmi gözlədiyinizdən bir az fərqli görünə bilər — bu, data xətası deyil, sənədləşdirilmiş bir kənar haldır. İstəsəniz cədvəldə heç bir əlavə işarə qoymayın (bu, çox nadir və keçici bir haldır, hər dəfə göstərmək UX-i doldurar).

### Ekran təklifi: "Bazar Trendi" tab-ı

Resource Detail-dakı mövcud "Bazar Qiyməti" tab-ına (bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6, "İstifadə nöqtəsi 1") **ikinci alt-bölmə** əlavə edin: "Tarixi Trend".
- `GET /api/resource-prices/period-averages?productId={resource.productId}&size=50` (regionId verməyin, bütün regionlar).
- Region seçici ilə filtrlənə bilən sadə **xətt qrafiki** (rüb üzrə `avgPrice`/`medianPrice`, X oxu `"{periodYear} Q{periodQuarter}"`) + altında cədvəl: Rüb, Orta, Median, Min, Max, Nümunə (`sampleCount`/`resourceCount`), Əvvəlki dövrlə fərq (`periodOverPeriodChangePct`, müsbət yaşıl ↑, mənfi qırmızı ↓, `null` isə "—").
- Nəticə boş ola bilər (`totalElements: 0`) — "Bu məhsul üçün hələ tarixi məlumat yoxdur." (normal, xəta deyil).

---

## 4. YENİ: `ResourceResponse.superseded` — "Əvəzlənmiş" resurs bayrağı

`GET /api/resources`, `/{id}`, `POST`, `PUT` cavablarına **1 yeni sahə** əlavə olunub (`active`-dən sonra):

```json
{
  "id": "uuid", "productId": "uuid", "product": { "...": "..." },
  "specification": "...", "manufacturer": "...", "brand": "...", "model": "...",
  "organizationId": "uuid", "organizationName": "...",
  "active": true,
  "superseded": true,
  "hasPrice": true,
  "createdBy": "uuid", "createdDate": "..."
}
```

### Bu nə deməkdir

Eyni təşkilat, eyni məhsul üçün, **hər hansı BİR regionda** yeni bir resurs/qiymət yaradanda (məsələn sənəd yenidən emal edilib), köhnə resurs avtomatik `superseded: true` olur.

**⚠️ Vacib incəlik — `superseded` regiona görə DEYİL, bütün resursa görədir:** bir resursun bir neçə regionda (Bakı, Şəki və s.) ayrı-ayrı qiyməti ola bilər (bu, normal haldır — eyni resurs müxtəlif regionlarda fərqli qiymətlərlə satıla bilər). Əgər YALNIZ bir region üçün yeni sənəd/resurs gəlirsə, o resursun **bütün regionlardakı** `superseded` bayrağı `true` olur — amma yalnız toxunulan regionun qiyməti faktiki bağlanır (`expireDate` təyin olunur), digər regionların qiyməti isə **arxa planda dəyişmədən, hələ də bazar hesablamasında iştirak etməyə davam edir**. Yəni `superseded=true` görəndə **"bu resursun bazar hesablamasına heç bir töhfəsi qalmayıb"** demə deyil — sadəcə "bu resursun ƏN AZI bir regionunun qiyməti köhnəlib" deməkdir.

Bu, bayrağı `active`-dən fərqləndirir:

| Sahə | Kim təyin edir | Məna |
|---|---|---|
| `active` | İstifadəçi əl ilə (mövcud "deaktiv et" əməliyyatı) | "Bu elanı kataloqdan gizlət" |
| `superseded` | **Sistem avtomatik** | "Bu resurs daha yeni bir resursla əvəzləndi" |

### Necə göstərilsin

- **Resurs siyahısından/detaildan GİZLƏTMƏYİN** — `superseded=true` olan resurs hələ də görünməli, sadəcə vizual olaraq fərqlənməlidir (audit/tarixçə üçün faydalıdır).
- `DataGrid`-də status sütununa/yanına kiçik, solğun bir chip: **"Əvəzlənib"** (boz, `active` chip-dən fərqli rəngdə — məsələn `active=false`-un rəngindən (qırmızı/"Deaktiv") ayrı saxlayın, bunlar fərqli anlayışlardır, eyni rəngə düşərsə istifadəçi qarışdırar).
- Resource Detail-da bir xəbərdarlıq zolağı (info, xəta deyil) — **yuxarıdakı incəliyə görə mətni ehtiyatlı yazın**, "bazar hesablamasında ARTIQ İŞTİRAK ETMİR" demə (yanlış ola bilər, digər regionlar hələ iştirak edə bilər): **"Bu resursun ən azı bir regiondakı qiyməti daha yeni bir resurslə əvəzlənib."** — `Prices` tab-ında hansı region(lar)ın qiymətinin `expireDate`-i "birdən-birə" bağlandığını (istifadəçi özü bağlamayıb, sistem edib) izah edir. Əgər `Prices` tab-ında artıq region sütunu varsa, bağlı (`expireDate` dolu) sətirləri bir işarə ilə (məs. solğun/italik) fərqləndirin ki, istifadəçi MƏHZ HANSI regionun köhnəldiyini görsün.
- **Filtr seçimi (opsional, faydalı olardı):** Resurs siyahısında `active` filtri kimi bir `superseded` filtri/toggle əlavə edə bilərsiniz ("Yalnız cari resursları göstər" — `superseded=false`), backend-də ayrıca query param YOXDUR hələ, bu, sırf client-side filtrasiya olardı (səhifədəki mövcud data üzərində).

---

## Naviqasiya/Ekran dəyişikliklərinin xülasəsi

```
Resource Detail
├── General          (mövcud, + "Əvəzlənib" xəbərdarlıq zolağı əgər superseded=true)
├── Attributes        (mövcud)
├── Prices            (mövcud, + "Rüb" sütunu)
└── Bazar Qiyməti      (mövcud, bax ADMIN_PANEL bölmə 6)
    └── Tarixi Trend  ← YENİ alt-bölmə (bölmə 3)

Document Detail
└── "Rübü düzəlt" düyməsi  ← YENİ (bölmə 2), yalnız status !== COMPLETED

Resources siyahısı (DataGrid)
└── "Əvəzlənib" chip  ← YENİ (bölmə 4), active chip-dən ayrı
```

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `POST /api/resource-prices` body | — | + opsional `periodYear`/`periodQuarter` |
| `ResourcePriceResponse` | — | + `periodYear`/`periodQuarter` (həmişə dolu) |
| `DocumentResponse` | — | + `periodYear`/`periodQuarter` (köhnə sənədlərdə `null` ola bilər) |
| **`PATCH /api/documents/{id}/period`** | yox idi | YENİ (`DOCUMENT_REVIEW`, `COMPLETED`-dən sonra bloklanır) |
| **`GET /api/resource-prices/period-averages`** | yox idi | YENİ (`COST_READ`, filtrsiz, trend sahələri ilə) |
| `ResourceResponse` | — | + `superseded` (bool, sistem-təyinli, siyahıdan gizlətmə) |
