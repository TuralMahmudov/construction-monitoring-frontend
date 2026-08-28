# Backend üçün sorğu — "Təqdim Edilmiş Qiymətlər" hesabatına `categoryId` filtri

Bu fayl frontend tərəfindən 2026-08-24-də hazırlanıb, backend-ə göndərmək üçündür.

> Toxunulan endpoint: `GET /api/reports/submitted-prices` (mövcud, canlıda işləyir — bax
> `FRONTEND_AI_PROMPT_SUBMITTED_PRICES.md` və `BACKEND_AI_PROMPT_SUBMITTED_PRICES_EXCEL_FIXES.md`).
> Heç bir yeni endpoint tələb olunmur, yalnız mövcud olan **bir opsional parametrlə** genişlənir.

**Dəyişməyən:** endpoint URL-i, mövcud parametrlər (`periodYear`/`periodQuarter` məcburi,
`organizationId`/`productId`/`regionId`/`status` opsional — heç biri silinmir, adı dəyişmir), icazə
(`COST_READ`+`VIEW_ALL_ORGANIZATION_RESOURCES`), fayl formatı (`.xlsx`, sütunlar,
`Content-Disposition`). Bu sorğu yalnız **əlavə** edir, mövcud davranışa toxunmur.

---

## Problem

Hesabatın filter formasında məhsulu tapmaq üçün "Məhsul (kod/ad)" axtarışı var (`ProductAutocomplete`,
mətnlə axtarır). Kataloqdakı bir çox məhsul demək olar eyni adla başlayır və yalnız son atributlarla
(Marka/Diametr/Qalınlıq və s.) fərqlənir — məs. "Polad zolaqdan adi keyfiyyətli, karbonlu, çeşidli və
fasonlu qaynaryayılmış prokat — En: 3, Marka: stk, Qalınlıq: 1" kimi onlarla oxşar sətir. Mətn
axtarışında bunları ayırd etmək çətindir.

Frontend-də bunu, digər səhifələrdə (Resurs Kataloqu, Bazar Qiymətləri Analitikası) artıq işlədilən
kateqoriya ağacı naviqasiyasına keçirmək istəyirik: istifadəçi əvvəlcə kateqoriyaya görə daraldır,
sonra ya konkret bir məhsul seçir, ya da (məhsulu dəqiq bilmirsə) birbaşa kateqoriyanın özünü seçib
o kateqoriyadakı **bütün məhsulların** təqdim edilmiş qiymətlərini bir Excel-də görmək istəyir.

## Sorğu

`GET /api/reports/submitted-prices`-a opsional **`categoryId`** (UUID) parametri əlavə olunsun:

- Verildikdə, nəticəyə `product.categoryId = categoryId` olan **bütün məhsulların** təqdimatları
  daxil edilsin (digər filtrlər — `organizationId`/`regionId`/`status`/dövr — olduğu kimi AND ilə
  tətbiq olunur).
- Bu, eyni `categoryId` parametrinin `GET /api/resource-prices/averages`-də artıq işlədiyi məntiqin
  eynisidir (canlıda yoxladıq, `/v3/api-docs`-da mövcuddur) — yeni bir pattern deyil, mövcud olanın
  bu endpoint-ə köçürülməsidir.
- Frontend `categoryId` və `productId`-ni **eyni vaxtda göndərməyəcək** (UI-da tək seçim sahəsi —
  ya məhsul, ya kateqoriya). Hər ehtimala qarşı hər ikisi gəlsə, `productId`-nin üstünlük təşkil
  etməsi (daha dəqiq filtr) məntiqlidir — qərar sizindir, sadəcə sənədləşdirin.
- Kateqoriya həmişə **leaf** (ən altdakı, alt-kateqoriyası olmayan) kateqoriya olacaq — frontend
  ağacda yalnız leaf kateqoriyaları seçdirir. Alt ağac gəzintisi/iyerarxik genişlətmə lazım deyil,
  sadə bərabərlik yoxlaması (`product.categoryId = :categoryId`) kifayətdir.

## Nəyə görə lazımdır

Hazırda istifadəçi ya dəqiq bir məhsulu tapmalıdır (mətn axtarışı ilə çətin), ya da filtrsiz bütün
rübü yükləməlidir (böyük, lazımsız məlumatla). Kateqoriya səviyyəsində filtr bu ikisinin arasını —
"bu qrup material üzrə hamısını göstər" ehtiyacını — qarşılayır.

---
