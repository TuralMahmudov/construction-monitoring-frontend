# CCMS — Frontend Dizayn Sistemi (qısa versiya, v0.1)

> Məqsəd: Material UI v7 üzərində, dövlət/tikinti sektoru üçün ciddi, "enterprise"
> hiss verən, amma ötəri trend-lərə uymayan sabit bir vizual dil. ChatGPT ilə
> aparılan müzakirənin (2026-08-04) konkret dəyərlərə çevrilmiş versiyasıdır.
> Tətbiq etməzdən əvvəl nəzərdən keçirilib təsdiqlənməlidir — hələ koda
> tətbiq edilməyib.

## 1. Rəng palitrası

| Ad | Dəyər | İstifadə |
|---|---|---|
| `background.default` | `#F7F8FA` | Səhifə fonu (ağ deyil, çox açıq boz) |
| `background.paper` | `#FFFFFF` | Kartlar, dialoqlar, cədvəl |
| `primary.main` | `#1E5EFF` (mövcud mavi saxlanıla bilər) | Əsas hərəkətlər, aktiv naviqasiya |
| `divider` | `#E4E7EC` | Nazik border-lar (kölgə əvəzinə/əlavə) |
| `success` / `warning` / `error` | MUI defolt | Status çipləri (Aktiv/Gözləmədə/Kənar dəyər) |
| `text.secondary` | `#667085` | Label-lar, köməkçi mətn |

Qayda: rəngli fon/gradient yox. Rəng yalnız status və əsas hərəkət düymələrində.

## 2. Boşluq (8px grid)

Bütün `padding`/`margin`/`gap` 8-in mislərində: 8, 16, 24, 32. `sx={{ p: 1.5 }}`
kimi qeyri-standart dəyərlərdən qaçılsın (MUI-də `1 = 8px`).

## 3. Kart (Card)

- `borderRadius: 12`
- `border: 1px solid divider` (kölgə minimal, `elevation={0}` + border üstünlükdür)
- Daxili padding: `24px` (masaüstü), `16px` (mobil)
- Səhifə strukturu: **filter paneli ayrı Card**, **cədvəl ayrı Card** — indiki kimi birləşik səhifə-səviyyəli tablo yox.

## 4. Cədvəl (DataGrid) konvensiyası

- Başlıq sətri: `background: background.default`, qalın (600) mətn
- Sətir hündürlüyü: 52px (indiki defoltdan bir az açıq)
- Hover: `background: rgba(30,94,255,0.04)`
- Status sütunu həmişə ilk sütun (bu artıq Resurslar-da tətbiq olundu)
- Boş nəticə: sadə mətn yox, kiçik ikon + "Nəticə tapılmadı, filtrləri dəyişin" tərzi

## 5. Tipoqrafiya

- Font: `Inter` (hazırda MUI defolt Roboto — dəyişmək kiçik, aşağı-riskli addımdır)
- Başlıq (`h4`, səhifə adı): 24px/600
- Kart başlığı (`subtitle1`): 16px/600
- Bədən mətni: 14px/400
- Label-lar: 13px/500, `text.secondary`

## 6. Vəziyyətlər (states)

- **Loading:** Skeleton sətirlər (indiki `CircularProgress` spinner əvəzinə, cədvəllərdə)
- **Empty:** İkon + 1 cümləlik izah + (varsa) "Əlavə et" düyməsi
- **Error:** İndiki `Alert severity="error"` konvensiyası saxlanılır — dəyişməyə ehtiyac yoxdur

## 7. İkonlar

Nav-da artıq var (`@mui/icons-material`, "Rounded" variant) — bu konvensiya
davam etdirilsin, kart başlıqlarına və boş-vəziyyət mesajlarına da əlavə oluna bilər.

## 8. Referanslar (ton üçün, kopyalamaq üçün yox)

Stripe Dashboard, Linear, Azure Portal — sadə, boz-ağ, minimal rəng, aydın
ierarxiya. Dribbble/Behance-dəki "rəngarəng SaaS dashboard" tərzindən **yox**
— dövlət/tikinti monitorinq sistemi üçün uyğun deyil.

## 9. Tətbiq strategiyası

Bir dəfəyə bütün səhifələri yenidən qurmuruq. Qayda: bundan sonra
yaradılan/toxunulan hər səhifə bu sənədə uyğun olsun; köhnə səhifələr
təbii axarda (növbəti dəfə həmin səhifəyə iş düşəndə) yenilənsin.
