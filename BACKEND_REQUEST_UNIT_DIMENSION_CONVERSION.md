# Backend üçün sorğu — Vahidlər arası çevrilmə (1m = 100sm problemi)

Bu fayl frontend tərəfindən 2026-08-11-də hazırlanıb, backend-ə göndərmək üçündür.

---

## 1. Problem

Hazırda `Unit` yalnız `name`/`symbol`/`decimalPrecision`/`active` daşıyır — vahidlər arasında heç bir
riyazi əlaqə yoxdur. `AttributeDefinition` isə (NUMBER tipli olanda) **tək bir konkret vahidə**
(`defaultUnitId`) bağlanır və resurs yaradılanda istifadəçi bu vahidi dəyişə bilmir (sadəcə rəqəmi
yazır, vahid sabit son-şəkilçi kimi göstərilir).

Nəticə: sistem "1 metr" ilə "100 santimetr"in eyni fiziki uzunluq olduğunu heç vaxt bilə bilmir —
çünki bu iki dəyər yalnız **iki fərqli atribut** olaraq mövcud ola bilər (məs. kimsə "Uzunluq" (vahid:
m) yaradıb, başqa biri sabah "Uzunluq (sm)" adında ayrı bir atribut yaratsa). Bu, uyğunlaşdırmanı
(`matchKey`/find-or-create) və qiymət analitikasını (`GET /api/resource-prices/averages`) korlayır —
eyni fiziki resurs fərqli "product" kimi qeydə alınır, qiymət müqayisəsi bölünür.

## 2. Təklif olunan sxem dəyişikliyi

### `Unit`-ə əlavələr

- **`dimension`** (enum/string, opsional — yalnız fiziki ölçülə bilən vahidlər üçün mənalıdır: `LENGTH`,
  `MASS`, `AREA`, `VOLUME`, `COUNT`, ...). `null` = ölçüşünəbilən fiziki kəmiyyət deyil (məs. "ədəd"
  özü də əslində COUNT ola bilər, amma "dəst" kimi sərbəst vahidlər üçün boş qala bilər).
- **`conversionFactor`** (decimal) — həmin `dimension`-ın baza vahidinə çevirmə əmsalı. Təklif olunan
  baza vahidlər (SI): LENGTH→metr, MASS→kiloqram, VOLUME→kub metr, AREA→kvadrat metr. Baza vahidin
  özündə `conversionFactor = 1`.

Nümunə (hazırkı seed data ilə):

| Ad | Simvol | dimension | conversionFactor |
|---|---|---|---|
| Metr | m | LENGTH | 1 |
| Millimetr | mm | LENGTH | 0.001 |
| Kub metr | m³ | VOLUME | 1 |
| Ton | T | MASS | 1000 |

### `AttributeDefinition`-a əlavə

- **`dimension`** (yuxarıdakı enum, opsional, yalnız `dataType = NUMBER` olanda mənalıdır) —
  `defaultUnitId` seçimi bundan sonra **yalnız eyni `dimension`-a aid vahidlərlə** məhdudlaşdırılmalıdır
  (məs. `dimension = LENGTH` seçilibsə, `defaultUnitId` siyahısında yalnız Metr/Millimetr/Kilometr və s.
  görünsün).

## 3. Açıq qalan dizayn sualları (qərar backend-dədir, sadəcə variantları qeyd edirik)

Bu, əslində iki fərqli yanaşmadan biri seçilməli olan bir məsələdir:

**A) Yalnız müqayisə/analitika səviyyəsində çevirmə** — `defaultUnitId` konsepti olduğu kimi qalır (bir
atribut = bir sabit vahid), dəyərlər indiki kimi həmin vahiddə saxlanılır. `dimension`/`conversionFactor`
yalnız **matching** (`matchKey` qurularkən) və **qiymət analitikası/filtrasiyası** zamanı arxa planda
istifadə olunur ki, fərqli-vahidli-amma-eyni-dimensiyalı iki atribut (məs. gələcəkdə səhvən yaranmış
"Uzunluq"+"Uzunluq (sm)") server tərəfində "eyni fiziki kəmiyyət" kimi tanınsın. **Kiçik dəyişiklik,
frontend-ə demək olar toxunmur.**

**B) Dəyər səviyyəsində sərbəst vahid seçimi** — atribut `dimension`-a bağlanır (tək vahidə yox),
resurs yaradılarkən istifadəçi hər dəyər üçün **dimension-a uyğun istənilən vahidi** seçə bilir (məs.
Uzunluq dəyərini istəyən "m", istəyən "sm" yaza bilər), backend dəyəri baza vahidə çevirib saxlayır
(və ya `value` + `unitId` cütü kimi saxlayıb hər sorğuda çevirir). **Daha güclü UX, amma `ProductAttribute`
sxeminə yeni sahə (`unitId` per-value) və mövcud dəyərlərin miqrasiyası lazımdır.**

Bizim tövsiyəmiz: əgər qısamüddətdə əsas məqsəd sadəcə "matching/analitika səhv nəticə verməsin"dirsə,
(A) kifayətdir və daha az riskdir. (B) daha tam həlldir, amma UI+miqrasiya işi çoxdur — ehtiyac aydın
olanda ayrıca mərhələ kimi ediləsi.

## 4. Nəyə görə indi

Atribut Lüğətini yalnız mərkəzi admin yarada bilir (frontend-də təsdiqlədik — kateqoriyaya bağlama
ekranı da sadəcə mövcud atributlar arasından seçim təklif edir, yeni ad yazmaq yolu yoxdur), ona görə
risk hələ kiçikdir. Amma kataloq böyüdükcə (yeni kateqoriyalar, yeni admin istifadəçilər) bu, "Diametr"
/ "Diametr2" kimi adi ad-dublikatından daha çətin aşkarlanan bir problemə çevriləcək — çünki fərqli
vahidli iki atribut adları tamam fərqli ola bilər (məs. "Uzunluq" və "Boy (sm)"), sadə ad-oxşarlığı
yoxlaması bunu tutmayacaq.

---
