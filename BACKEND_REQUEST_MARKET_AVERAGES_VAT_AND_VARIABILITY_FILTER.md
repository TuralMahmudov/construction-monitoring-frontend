# Backend üçün sorğu — Bazar Qiymətləri Analitikası: ƏDV/valyuta və dəyişkənlik filtri

Bu fayl frontend tərəfindən 2026-08-20-də hazırlanıb, backend-ə göndərmək üçündür.

> Toxunulan endpoint: `GET /api/resource-prices/averages` (mövcud, bax `MARKET_ANALYTICS_BACKEND_CONTRACT.md`).
> Heç bir yeni endpoint tələb olunmur (2-ci bölmədəki opsional stats endpoint istisna olmaqla), yalnız
> mövcud olan genişlənir.

---

## 1. ƏDV/valyuta normallaşdırılması

### Problem

Hər `ResourcePrice` sətrində ayrı-ayrı `price`, `vat` (%) və `currency` sahələri var — hər təşkilat
öz qiymətini istədiyi ƏDV rejimində (daxil/xaric) göndərə bilər, bunu məhdudlaşdıran heç bir qayda
yoxdur. `GET /api/resource-prices/averages` isə bu xam `price` dəyərlərindən birbaşa median/orta
hesablayır və cavabda `vat`/`currency` heç göstərilmir.

Nəticədə: əgər eyni (`productId`, `regionId`) qrupuna bəzi təşkilatlar ƏDV-siz, bəziləri ƏDV-li
qiymət göndəribsə, median/aralıq statistik cəhətdən mənasızlaşır — admin panelində gördüyümüz
qeyri-adi böyük "dəyişkənlik" (məs. min–max arasında 1000%-ə yaxın fərq) hissəsinin məhz bu səbəbdən
qaynaqlana biləcəyini düşünürük, real qiymət dəyişkənliyi ilə qarışıq.

### Sorğu

1. **Aydınlaşdırma:** hazırda `averages` hesablanarkən `price` xam (ƏDV-siz/ƏDV-li qarışıq ola bilən)
   dəyərmi işlədilir, yoxsa hesablamadan əvvəl vahid əsasa (məs. həmişə ƏDV-siz) gətirilirmi?
2. Əgər normallaşdırma **edilmirsə** — xahiş edirik median/orta/min/max hesablanmadan əvvəl bütün
   qiymətlər eyni əsasa (tövsiyə: ƏDV-siz xalis qiymət) gətirilsin.
3. `ResourcePriceAverageResponse`-a **`currency`** sahəsi əlavə olunsun (indi hamısı `"AZN"`-dirsə də,
   frontend bunu fərz etməsin, sərt yoxlama və gələcək çoxvalyutalı hal üçün):

```json
{
  "productId": "uuid",
  "regionId": "uuid",
  "currency": "AZN",
  "avgPrice": 210.0,
  "medianPrice": 210.0,
  "minPrice": 200.0,
  "maxPrice": 220.0,
  "sampleCount": 2,
  "resourceCount": 4,
  "calculatedAt": "2026-08-20T10:00:00Z"
}
```

(ƏDV üçün ayrıca sahə tələb olunmur — əgər 2-ci maddədəki normallaşdırma tətbiq olunursa, göstərilən
rəqəm artıq vahid əsasda olacaq və ayrıca `vat` sahəsinin mənası qalmır.)

### Nəyə görə lazımdır

Admin panelindəki "Bazar Qiymətləri Analitikası" səhifəsində böyük dəyişkənlik göstərən sətirlərin
əsl səbəbini (real bazar fərqimi, yoxsa ƏDV/vahid qarışıqlığımı) ayırd etmək üçün. Hazırda bunu ayırd
etməyin heç bir yolu yoxdur.

---

## 2. Dəyişkənlik (`variability`) filtri + qlobal say

### Problem

Admin panelindəki KPI kartları (Stabil/Orta dəyişkənlik/Böyük fərq) və planlaşdırılan "Dəyişkənlik"
filtri `(max-min)/median*100` düsturuna əsaslanır:

- `< 10%` → Stabil
- `10–30%` → Orta
- `> 30%` → Böyük fərq

Bu hesablama hazırda **yalnız frontend-də**, o an ekrana yüklənmiş səhifədəki sətirlərdən aparılır —
backend-də bu sahə/filtr yoxdur. Nəticədə say və gələcək filtr yalnız "bu səhifə" üçün doğru ola
bilir, bütün (pagination-a görə bölünmüş) nəticə üzrə deyil.

### Sorğu

1. `GET /api/resource-prices/averages` sorğusuna opsional **`variabilityLevel`**
   (`STABLE`|`MODERATE`|`HIGH`) filtr parametri əlavə olunsun — server tərəfdə yuxarıdakı eyni
   düsturla hesablanıb `WHERE` şərtinə tətbiq edilsin (mövcud `regionId`/`categoryId`/`name` filtrləri
   ilə eyni səviyyədə, AND məntiqi ilə birləşə bilməlidir).
2. Cari filtrlərə (categoryId/regionId/name — `variabilityLevel` istisna) uyğun **ümumi say
   breakdown-u** lazımdır, pagination-dan asılı olmayaraq bütün nəticə üzrə:

```json
{ "stableCount": 8, "moderateCount": 3, "highCount": 1 }
```

   Bunu ya mövcud `PageResponse<ResourcePriceAverageResponse>` cavabına əlavə bir `summary` obyekti
   kimi, ya da ayrıca yüngül bir `GET /api/resource-prices/averages/stats` endpoint-i (eyni filtr
   parametrlərini qəbul edən) kimi qaytarmaq — hansı daha rahatdırsa, backend qərar verə bilər.

### Nəyə görə lazımdır

Admin panelindəki KPI kartlarını (Stabil/Orta/Böyük) klikləndikdə **həqiqi, bütün nəticə üzrə** filtrə
çevirmək istəyirik (indiki "yalnız bu səhifədə düzgündür" məhdudiyyətini aradan qaldırmaq). Bu, yeni
bir arxitektura patterni deyil — `regionId`/`categoryId` filtrlərinin artıq işlədiyi server-side
modelin sadəcə bir sahə ilə genişlənməsidir.

---
