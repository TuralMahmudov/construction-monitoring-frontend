# "Bazar Qiymətləri Analitikası" — Backend Contract (əlavələr)

> Mövcud `GET /api/resource-prices/averages` endpoint-i artıq var və işləyir (bax `PROJECT_STATUS.md` bölmə 4j). Bu fayl həmin endpoint-ə **3 əlavəni** təsvir edir — frontend (`src/features/admin/market-averages/`) artıq bunlara uyğun tikilib, backend tətbiq edən kimi bağlanacaq. Heç bir yeni endpoint YARADILMIR, yalnız mövcud olan genişlənir.

## 1. Cavaba 4 yeni sahə

`ResourcePriceAverageResponse`-ə (hər sətir `matchGroupId` + `regionId` üzrə) əlavə olunmalıdır:

```json
{
  "matchGroupId": "uuid",
  "categoryId": "uuid",
  "resourceName": "Armatur Ø12",
  "manufacturer": "Baku Steel",
  "brand": "...",
  "model": "A500C",
  "regionId": "uuid",
  "avgPrice": 1.42,
  "medianPrice": 1.41,
  "minPrice": 1.39,
  "maxPrice": 1.46,
  "sampleCount": 28,
  "calculatedAt": "2026-07-29T10:00:00Z"
}
```

`resourceName`/`manufacturer`/`brand`/`model`/`categoryId` — bu match qrupuna daxil olan **istənilən bir resursdan** götürülə bilər (təyinatına görə eyni məhsulun fərqli təchizatçılardan gələn nüsxələridir, ona görə hər hansı üzvün adı/markası/modeli təmsil edici sayılır). `avgPrice` cavabda qalsın (frontend onu artıq göstərmir, amma silməyə ehtiyac yoxdur — geriyə uyğunluq üçün saxlanıla bilər).

## 2. `regionId` filtri artıq MƏCBURİ deyil

İndiyə qədər frontend `regionId` olmadan sorğu göndərmirdi. İndi **regionId olmadan da** sorğulanır (bütün regionlar üzrə, səhifələnmiş) — backend bunu artıq dəstəkləməlidir (yəni `regionId` `null`/boş olanda WHERE şərtindən çıxarılır, bütün nəticələr qaytarılır).

## 3. Yeni `name` axtarış parametri

```
GET /api/resource-prices/averages?name=Armatur&page=0&size=25
```

`name` — resurs adına (case-insensitive, qismən uyğunluq, `LIKE %name%`) görə filtr, match qrupundakı resurslardan HƏR HANGİ birinin adı uyğun gəlirsə həmin qrup nəticəyə düşür. `regionId` ilə birlikdə də işləməlidir (hər ikisi verilsə AND).

## 4. Ümumi qeydlər

- `PageResponse<T>` formatı dəyişmir.
- Sıralama (`sort`) tələb olunmur (frontend server-side sort göndərmir, sadəcə pagination).
- Yeni permission lazım deyil, mövcud `COST_READ`.
