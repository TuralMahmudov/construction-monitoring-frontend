# CCMS Frontend — Hesabatlar Modulu (1-ci hesabat: Rüblük Bazar Qiyməti, Excel export)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas modullar), **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`** və **`FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md`**-nin **davamıdır** — konvensiyalar (unified response envelope, `PageResponse<T>`, auth axını, MUI stack) təkrarlanmır, birbaşa istinad edilir.
>
> **Qeyd (2026-08-25, kod dəyişikliyi tələb ETMİR):** `GET /api/resource-prices/period-averages`-in özündə (bu sənədin əsas mövzusu) backend-də sırf DAXİLİ bir dublikat-hesablama bug-ı düzəldildi — bir təşkilat eyni rübdə qiymətini bir neçə dəfə düzəltmişdisə, əvvəllər hamısı ayrı-ayrı sətir kimi median-a qatılırdı (rəqəm süni şəkildə şişirdi/azalırdı), indi yalnız sonuncu sayılır. Cavabın **strukturu/sahələri dəyişməyib** — sadəcə bəzi məhsul/region/rüb kombinasiyalarının `avgPrice`/`medianPrice`/`previousAvgPrice`/`periodOverPeriodChangePct` dəyərləri (və bunlara bağlı "Dəyişmə %" sütunu) sözügedən pattern-ə uyğun gələn hallarda əvvəlki ekran görüntülərinizdən fərqli ola bilər — bu, real düzəlişdir, reqressiya deyil.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst

Excel export mövzusu müzakirə edildi və bir neçə əsaslı qərar verildi:

1. **Ayrıca "Hesabatlar" menyusu** yaradılır — bu, "Resurslar" ekranındakı ad-hoc filtr-export-dan (hələ speclənməyib, ayrıca sənəddə gələcək) **fərqlidir**: Hesabatlar sabit, əvvəlcədən müəyyən edilmiş biznes formatlarıdır, filtr-export isə istifadəçinin həmin an ekranda gördüyü məlumatın sərbəst köçürülməsidir. İkisini qarışdırmayın.
2. Hesabatlar menyusunda bir neçə hesabat planlaşdırılıb, bu sənəd yalnız **birincisini** (ən dəyərli, infrastruktur artıq hazır olan) təsvir edir: **Rüblük Bazar Qiyməti (çox-məhsullu)**. Gələcək hesabatlar (Canlı Bazar Müqayisəsi export-u, Sənəd/İdxal Hesabatı, xam qiymət audit-i, kənar-dəyər audit-i) ayrı-ayrı sənədlərlə gələcək — menyunu **bu birinin üçün deyil, gələcəkdə böyüyəcək bir bölmə üçün** dizayn edin (aşağıya, "Naviqasiya" bölməsinə baxın).
3. Bu hesabat **client-side** generasiya olunur (backend-də export endpoint-i YOXDUR və lazım deyil) — çünki nəticə sətir sayı (məhsul × region × rüb kombinasiyaları) sərhədlidir, minlərlə sətrlik xam qiymət cədvəllərindən fərqli olaraq. Gələcəkdə xam/audit hesabatlar üçün bu fərqli olacaq (backend-generasiya) — o, bu sənədin əhatəsində deyil.

---

## 1. Yeni asılılıq: `xlsx` (SheetJS)

`package.json`-a əlavə edin: `xlsx` (SheetJS Community Edition). Paylaşılan bir utility yazın (`shared/lib/exportToExcel.ts` və ya oxşar yer):

```ts
function exportToExcel(rows: Record<string, string | number>[], filename: string): void
```

- `XLSX.utils.json_to_sheet(rows)` → `XLSX.utils.book_new()` + `XLSX.utils.book_append_sheet()` → `XLSX.writeFile(workbook, filename)`.
- Sütun başlıqları `rows`-dakı obyekt açarlarından avtomatik gəlir — çağıran tərəf massivi **artıq Azərbaycan dilində sütun adları olan açarlarla** hazırlamalıdır (aşağıdakı bölmə 3-ə baxın), utility özü tərcümə/formatlaşdırma etmir, sadəcə fayl yaradır.
- Bu utility gələcək bütün "Excel-ə çıxar" düymələri üçün təkrar istifadə olunacaq — indi düzgün, ümumi yazın (sütun siyahısı hardcode olunmasın, çağıran tərəfdən gəlsin).

---

## 2. `GET /api/resource-prices/period-averages` — dəyişikliklər (bu sessiyada backend-də edildi)

Bu endpoint artıq var idi (bax `FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md` bölmə 3) — **iki dəyişiklik** oldu:

### 2.1 Yeni query param: `categoryId`

Mövcud param-lara (`productId`, `regionId`, `periodYear`, `periodQuarter`, `name`, hamısı opsional) **`categoryId`** (opsional) əlavə olundu — kateqoriyaya görə filtrləmək üçün.

### 2.2 Cavaba 4 yeni **ad** sahəsi əlavə olundu

Əvvəllər cavabda yalnız ID-lər var idi (`categoryId`, `regionId`) — indi adları da birbaşa gəlir, ayrıca lookup lazım deyil:

```json
{
  "productId": "uuid", "categoryId": "uuid", "resourceName": "Portland Cement",
  "productCode": "MAT-000010",
  "categoryName": "Sement və beton məhsulları",
  "unitName": "Ton",
  "regionId": "uuid", "regionName": "Bakı",
  "periodYear": 2026, "periodQuarter": 3,
  "avgPrice": 130.0000, "medianPrice": 130.0000, "minPrice": 100.0000, "maxPrice": 200.0000,
  "sampleCount": 2, "resourceCount": 2,
  "previousAvgPrice": 100.0000, "previousMedianPrice": 100.0000,
  "periodOverPeriodChangePct": 30.0000,
  "calculatedAt": "2026-08-18T14:30:00Z"
}
```

Digər sahələrin mənası dəyişməyib (bax `FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md` bölmə 3 — `sampleCount` vs `resourceCount`, `previousAvgPrice`/`periodOverPeriodChangePct` izahı orada var, təkrarlanmır).

**Diqqət:** bu sahələr yalnız `period-averages`-ə əlavə olundu. Canlı `GET /api/resource-prices/averages` (bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 6) **DƏYİŞMƏYİB** — o hələ də yalnız ID qaytarır, region adı üçün ayrıca `/api/regions` lookup lazımdır (mövcud "Bazar Qiymətləri" admin ekranındakı kimi). Bunu qarışdırmayın.

---

## 3. Yeni ekran: Hesabatlar → "Rüblük Bazar Qiyməti"

**İcazə:** `COST_READ` (mövcud averages/period-averages ilə eyni).

### Filtrlər

- **Kateqoriya** — mövcud kateqoriya seçici komponentini (resurs yaratma axınında istifadə olunan) reuse edin, `GET /api/resource-categories/tree`-dən. Opsional.
- **Region** — `GET /api/regions`-dan dropdown. Opsional (boş buraxılsa bütün regionlar).
- **İl + Rüb** — say seçici (il) + Q1-Q4 dropdown. **Defolt: hazırkı təqvim rübü** (məs. bu gün 2026-08-18-dirsə, defolt `2026`/`Q3`), istifadəçi dəyişə bilər. Opsional saxlayın (boş buraxılsa bütün rüblər gələr), amma UX üçün defolt dolu başlasın.
- **Axtarış** (`name`) — resurs adına görə, opsional mətn sahəsi.

### Cədvəl

Filtrlər tətbiq olunanda `GET /api/resource-prices/period-averages` çağırılır (`size=50` kifayətdir ekran üçün, aşağıdakı export fərqli işləyir), sütunlar:

| Sütun | Sahə |
|---|---|
| Kod | `productCode` |
| Resurs | `resourceName` |
| Kateqoriya | `categoryName` |
| Ölçü vahidi | `unitName` |
| Region | `regionName` |
| Rüb | `"{periodYear} Q{periodQuarter}"` |
| Orta | `avgPrice` |
| Median | `medianPrice` |
| Min / Max | `minPrice` / `maxPrice` |
| Nümunə | `"{sampleCount} təşkilat ({resourceCount} resurs)"` (bax `ADMIN_PANEL` bölmə 6-dakı izah — eyni məntiq) |
| Əvvəlki dövr | `previousAvgPrice` (`null`-dursa "—") |
| Dəyişmə % | `periodOverPeriodChangePct` (`+30.00%` yaşıl ↑ / `-15.00%` qırmızı ↓ / `null` isə "—") |

Nəticə boş ola bilər (`totalElements: 0`) — "Seçilmiş filtrlərə uyğun məlumat yoxdur" mesajı göstərin, xəta deyil.

### "Excel-ə çıxar" düyməsi

1. Cari filtrlərlə (kateqoriya/region/il/rüb/axtarış) **bütün səhifələri** ardıcıl çağırın (`page=0,1,2,...`, `size=200` məsələn) `last: true` gələnə qədər — ekrandakı `size=50` cədvəldən **asılı olmayaraq**, export tam nəticəni əhatə etməlidir.
2. Hər sətri Azərbaycan dilində açarlı obyektə çevirin (yuxarıdakı cədvəldəki sütun adları ilə eyni, məs. `{"Kod": row.productCode, "Resurs": row.resourceName, "Kateqoriya": row.categoryName, ...}`).
3. `exportToExcel(rows, filename)` çağırın. Fayl adı: `Rublük_Bazar_Qiymeti_{periodYear}_{periodQuarter ? "Q"+periodQuarter : "Butun"}.xlsx` (kateqoriya/region filtri fayl adına əlavə etməyə ehtiyac yoxdur, sadə saxlayın).
4. Nəticə boşdursa (`totalElements: 0`) düyməni deaktiv edin və ya kliklənəndə "İxrac ediləcək məlumat yoxdur" mesajı göstərin — boş `.xlsx` yaratmayın.
5. Çoxlu səhifə yığılarkən (böyük nəticələr üçün) düymədə qısa bir loading göstəricisi olsun — bu, bir neçə ardıcıl HTTP çağırışı tələb edir, ani deyil.

---

## Naviqasiya — yeni "Hesabatlar" menyu bölməsi

```
Hesabatlar   ← YENİ top-level menyu item
└── Rüblük Bazar Qiyməti   ← bu sənəddə təsvir olunan, YEGANƏ hazırkı hesabat
    (gələcəkdə: Canlı Bazar Müqayisəsi, Sənəd/İdxal Hesabatı, Audit hesabatları — hələ speclənməyib, ayrı sənədlərlə gələcək)
```

Menyunu tək bir hesabat üçün deyil, bu strukturu dəstəkləyəcək şəkildə qurun (sol menyuda bir "Hesabatlar" qrupu, altında hesabat siyahısı — yeni hesabat əlavə olunanda sadəcə siyahıya bir sətir əlavə olunsun, menyu arxitekturası dəyişməsin).

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `GET /api/resource-prices/period-averages` query params | `productId,regionId,periodYear,periodQuarter,name` | + **`categoryId`** |
| Cavab sahələri | ID-lər + `resourceName` | + **`productCode`, `categoryName`, `unitName`, `regionName`** |
| `xlsx` asılılığı | yox idi | əlavə olunmalı |
| "Hesabatlar" menyusu | yox idi | YENİ, 1 hesabatla başlayır, genişlənə bilən struktur |
