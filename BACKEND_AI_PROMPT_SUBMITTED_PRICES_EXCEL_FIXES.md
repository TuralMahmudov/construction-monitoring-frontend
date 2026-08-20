# CCMS Backend — "Təqdim Edilmiş Qiymətlər" Excel hesabatına düzəlişlər

> Bu faylı olduğu kimi kopyalayıb backend-i yazan AI alətinə verin. Bu, **`FRONTEND_AI_PROMPT_SUBMITTED_PRICES.md`**-nin **davamıdır** — `GET /api/reports/submitted-prices` endpoint-i artıq mövcuddur və işləyir (canlı yoxlanıldı, 200 + düzgün `.xlsx` gəlir). Bu sənəd YENİ endpoint/parametr istəmir, yalnız həmin endpoint-in ürətdiyi faylın sütunlarında 4 kiçik dəyişiklik tələb edir.

**Dəyişməyən:** endpoint URL-i, query parametrləri (`periodYear`/`periodQuarter` məcburi, `organizationId`/`productId`/`regionId`/`status` opsional), icazə (`COST_READ`+`VIEW_ALL_ORGANIZATION_RESOURCES`), fayl formatı (`.xlsx`, `Content-Disposition: attachment`).

---

## Kontekst

Frontend faylı canlı test edərkən Tural 4 düzəliş istədi — hamısı yalnız sütun məzmunu/adı ilə bağlıdır, sxem/endpoint dəyişmir.

Hazırkı sütun sırası: Təşkilat, Məhsul kodu, **Məhsul adı**, **Kateqoriya**, Ölçü vahidi, Region, İl, **Rüb**, Qiymət, ƏDV, Valyuta, Effektiv tarix, **Status**.

---

## 1. "Kateqoriya" sütunu silinsin

Artıq lazım deyil, sütun tamamilə çıxarılsın.

## 2. "Məhsul adı" sütunu → `product.description` göstərsin

Hazırda bu sütun məhsulun bare `name` sahəsini göstərir. Bunun əvəzinə `product.description` (server-generated, kateqoriya adı + atribut dəyərləri birləşməsi — bax `FRONTEND_AI_PROMPT_PRODUCTS.md`) göstərilsin. Sütun başlığı "Məhsul adı" qala bilər (sadəcə məzmun dəyişir) — istəsəniz "Təsvir" də adlandıra bilərsiniz, seçim sizindir.

## 3. "Rüb" sütununun formatı dəyişsin — `Q1`/`Q2`/`Q3`/`Q4` YOX, Roma rəqəmi

Hazırda "2026 Q3" kimi göstərilir. Tətbiqin hər yerində rüb Roma rəqəmi ilə göstərilir (frontend `quarterToRoman()`: `1→I, 2→II, 3→III, 4→IV` — bax `FRONTEND_AI_PROMPT_PERIOD_AND_SUPERSEDED.md`, Tural əvvəlcədən "Q" formatını rədd edib: "Q nədir ki yazmışıq ora"). Excel-də də eyni konvensiya: `"{il} {Roma rəqəmi}"`, yəni **"2026 III"** ("2026 Q3" yox).

## 4. Status mətnində 4-cü dəyər sadələşdirilsin

Hazırkı 4 status mətni: Gözləyir / Təsdiqlənib / Rədd edilib / **"Bayraqlanıb (kənar dəyər)"**. Sonuncu sadəcə **"Kənar dəyər"** olsun (frontend-in özündəki terminologiya ilə eyni — bax `resourcePrice.types.ts`-dəki `PRICE_STATUS_LABELS`).

---

## Xülasə cədvəl

| Sütun | Əvvəl | İndi |
|---|---|---|
| Kateqoriya | var | **silinsin** |
| Məhsul adı | `name` | `description` |
| Rüb | `"2026 Q3"` | `"2026 III"` |
| Status (4-cü dəyər) | `"Bayraqlanıb (kənar dəyər)"` | `"Kənar dəyər"` |

Digər hər şey (sütun sırası, digər 3 status mətni, fayl adı konvensiyası, boş nəticə davranışı) olduğu kimi qalır.
