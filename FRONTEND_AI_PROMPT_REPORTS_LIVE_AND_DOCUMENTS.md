# CCMS Frontend — Hesabatlar Modulu: Canlı Bazar Müqayisəsi export + Sənəd/İdxal Hesabatı (2 hesabat)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`**, **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`** və **`FRONTEND_AI_PROMPT_REPORTS.md`**-nin **davamıdır** — konvensiyalar təkrarlanmır. **`FRONTEND_AI_PROMPT_REPORTS.md`**-də təsvir olunan `exportToExcel()` utility-si və "Hesabatlar" səhifəsi strukturu bu sənəddə **reuse olunur** — əgər həmin sənəd hələ tətbiq edilməyibsə, əvvəlcə onu edin (ən azı `exportToExcel` utility-si və "Hesabatlar" landing səhifəsi lazımdır).

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst

Bu, "Hesabatlar" siyahısına əlavə olunan **2 yeni** hesabatdır (əvvəlki sənədlərdə #1 və #3 kimi adlandırılıb):

1. **Canlı Bazar Qiymət Müqayisəsi export** — mövcud `/averages` datası (indi ad-sahələri ilə zənginləşdi), ən aşağı-effort hesabat.
2. **Sənəd/İdxal Hesabatı** — hansı təşkilat hansı rübdə nə göndərib, statusu nədir (nəzarət hesabatı, mövcud `DocumentsAdminTable` datası üzərində).

Hər ikisi **client-side** (SheetJS) generasiya olunur — eyni səbəbdən (bax `FRONTEND_AI_PROMPT_REPORTS.md` kontekst hissəsi): sətir sayı sərhədlidir.

---

## Hesabat #1 — Canlı Bazar Qiymət Müqayisəsi

**Endpoint:** `GET /api/resource-prices/averages` (`COST_READ`) — **mövcud idi**, bu sessiyada 2 dəyişiklik oldu:

1. Yeni opsional query param: **`categoryId`**.
2. Cavaba 4 yeni ad sahəsi əlavə olundu: **`productCode`, `categoryName`, `unitName`, `regionName`** (əvvəllər yalnız ID-lər var idi).

```json
{
  "productId": "uuid", "categoryId": "uuid", "resourceName": "Portland Cement",
  "productCode": "MAT-000010", "categoryName": "Sement və beton məhsulları", "unitName": "Ton",
  "regionId": "uuid", "regionName": "Bakı",
  "avgPrice": 130.0000, "medianPrice": 130.0000, "minPrice": 100.0000, "maxPrice": 200.0000,
  "sampleCount": 2, "resourceCount": 2,
  "calculatedAt": "2026-08-18T14:30:00Z"
}
```

Digər query param-lar (`productId`, `regionId`, `name`) və sahələrin mənası (`sampleCount` vs `resourceCount`) dəyişməyib — bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6.

**⚠️ Diqqət — bu, "hazırkı etibarlı" (live) baxışdır, rüb yoxdur:** bu hesabatda `periodYear`/`periodQuarter`/`previousAvgPrice`/`periodOverPeriodChangePct` sahələri **YOXDUR** (o, `FRONTEND_AI_PROMPT_REPORTS.md`-dəki hesabat #2-nin işidir). Bunlar iki fərqli sual cavablandırır: bu hesabat "bazar HAZIRKI vəziyyəti nədir", #2 isə "bazar RÜB-BƏ-RÜB necə dəyişib". İkisini eyni ekranda qarışdırmayın.

### Ekran

Mövcud "Bazar Qiymətləri" admin ekranını (`FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6, "İstifadə nöqtəsi 2") "Hesabatlar" siyahısına köçürün (və ya ora bir keçid əlavə edin) və üzərinə **"Excel-ə çıxar"** düyməsi əlavə edin:

- Filtrlər: Kateqoriya (indi `categoryId` ilə server-side mümkündür), Region. **Kateqoriya filtri üçün mövcud ağac (tree) seçicisini İSTİFADƏ ETMƏYİN** — hesabat filtri kimi sadə istifadə üçün ağac açılıb-bağlanması yersiz mürəkkəblikdir; sadə axtarış-yazma (autocomplete) dropdown istifadə edin, kateqoriya adına görə (eyni qərar `FRONTEND_AI_PROMPT_REPORTS.md`-dəki hesabat #2 üçün də tövsiyə olunmuşdu — orada tətbiq olunub-olunmadığını frontend AI ilə ayrıca yoxlayın, bu fayl ona təsir etmir).
- Sütunlar: Kod, Resurs, Kateqoriya, Ölçü vahidi, Region, Orta, Median, Min, Max, Nümunə (`sampleCount`+`resourceCount`, format "2 təşkilat (4 resurs)"), Hesablanma tarixi.
- Export məntiqi eyni: cari filtrlərlə bütün səhifələri yığ, Azərbaycan sütun adları ilə obyektə çevir, `exportToExcel(rows, "Canli_Bazar_Qiymeti.xlsx")`.

---

## Hesabat #3 — Sənəd/İdxal Hesabatı

**Endpoint:** `GET /api/documents` (`DOCUMENT_REVIEW`) — **mövcud idi**, bu sessiyada yeni opsional query param-lar əlavə olundu: **`periodYear`, `periodQuarter`** (mövcud `organizationId`/`status`-a əlavə olaraq).

`DocumentResponse` **dəyişməyib** (bax `FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md` bölmə 2) — bütün lazımi sahələr onsuz da var idi: `organizationName`, `originalFilename`, `status`, `periodYear`/`periodQuarter`, `uploadedByName`, `processedByName`, `processedDate`, `reviewComment`, `createdAt`.

### Ekran

Mövcud `DocumentsAdminTable`-ı (mərkəzi review ekranı) "Hesabatlar" siyahısına əlavə edin (və ya mövcud ekrana "Excel-ə çıxar" düyməsi qoyun, ikisi də məqbuldur — hazırkı sənədlər ekranınızın strukturuna görə seçin):

- Filtrlər: Təşkilat (`organizationId`), Status, **İl+Rüb** (yeni — `periodYear`/`periodQuarter`).
- Sütunlar: Təşkilat, Fayl adı, Status (mətnə çevirin: UPLOADED/IN_PROGRESS/COMPLETED/REJECTED — dəqiq enum adları üçün mövcud `DocumentsAdminTable` status-mapping kodunuza baxın, təkrar yazmırıq), Rüb (`"{periodYear} Q{periodQuarter}"`, `null`-dursa "—"), Yükləyən, Yüklənmə tarixi, Emal edən, Emal tarixi, Rəy (`reviewComment`, boşdursa "—").
- Nəticə boşdursa "Seçilmiş filtrlərə uyğun sənəd yoxdur".
- Export: bütün səhifələri yığ, `exportToExcel(rows, "Senedidxal_Hesabati.xlsx")`.

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `GET /api/resource-prices/averages` params | `productId,regionId,name` | + **`categoryId`** |
| `ResourcePriceAverageResponse` sahələri | ID-lər + `resourceName` | + **`productCode`, `categoryName`, `unitName`, `regionName`** |
| `GET /api/documents` params | `organizationId,status` | + **`periodYear`, `periodQuarter`** |
| `DocumentResponse` | — | dəyişmədi (onsuz da hazır idi) |
