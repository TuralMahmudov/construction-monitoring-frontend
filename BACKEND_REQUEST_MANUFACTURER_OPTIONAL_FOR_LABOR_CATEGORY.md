# Backend üçün sorğu — İşçi qüvvəsi kateqoriyasında `manufacturer` məcburi olmasın

Bu fayl frontend tərəfindən 2026-08-26-da hazırlanıb, backend-ə göndərmək üçündür.

**✅ HƏLL OLUNUB (2026-08-26).** Backend `type=3` (İşçi qüvvəsi) üçün `manufacturer`-i könüllü edib —
canlı təsdiqləndi (`LAB-000026`, İstehsalçısız yaradıldı). Frontend tərəfi də tamamlandı:
`BulkResourceFormDialog`/`BulkResourceRow` kateqoriya `type === 3` olduqda İstehsalçı/Brend/Model
sahələrini gizlədir və göndərmir.

---

## Kontekst

`FRONTEND_AI_PROMPT_PRODUCTS.md` (2026-07-31) qərarına görə `manufacturer`/`brand`/`model`/
`specification` `product`-dan `resource`-a köçürülüb — bunlar bir elanın (listing) öz sahələridir,
kataloq kimliyinin yox. `manufacturer` bütün resurs-yaratma axınlarında **məcburidir** (boşdursa
backend 400 "Manufacturer is required" qaytarır) — `ResourceCreateRequest` və
`MyResourceCreateRequest` hər ikisində, kateqoriyadan asılı olmadan.

Kateqoriyaların özündə isə artıq bir `type` sahəsi var (`ResourceCategory.type`, `1..5`):

| type | Ad |
|---|---|
| 1 | Material |
| 2 | Maşın-mexanizm |
| 3 | **İşçi qüvvəsi** |
| 4 | Nəqliyyat |
| 5 | Xidmət |

"İşçi qüvvəsi" (type 3) kateqoriyasında "İstehsalçı" konsepti mənasızdır — bir fəhləni/ustaını heç
kim "istehsal etmir". Üstəlik, bu sahə praktikada **artıqlıqdır**: material/texnika üçün İstehsalçı
(kim düzəldib) elanı yaradan Təşkilatdan (kim satır/təchiz edir) fərqli ola bilir, amma işçi qüvvəsi
üçün bu ayrım yoxdur — elanı yaradan Təşkilat elə işçini təchiz edən təşkilatın özüdür. Nəticədə
istifadəçi məcburən Təşkilat adının təkrarını və ya uydurma bir mətn yazmalı olur ki, forma
göndərilə bilsin.

## Sorğu

`manufacturer`-in məcburiliyini `İşçi qüvvəsi` (kateqoriya `type = 3`) üçün götürün — iki yoldan biri
ilə (seçim backend-dədir):

**A) Kateqoriya-tipinə bağlı şərti validasiya** — `POST /api/resources` və
`POST /api/resources/mine`-də, göndərilən `categoryId` (yeni məhsul yolunda) və ya seçilmiş
`productId`-in kateqoriyası `type = 3`-dürsə, `manufacturer` boş qala bilsin (`null`/boş sətir qəbul
edilsin, 400 atılmasın).

**B) Ümumi şəkildə könüllü et** — `manufacturer`-i bütün kateqoriya tipləri üçün könüllü sahəyə
çevirin, məcburiliyi frontend öz tərəfində (material/texnika/nəqliyyat üçün client-side validasiya
ilə) tətbiq etsin. Daha sadə backend dəyişikliyi, amma data-keyfiyyəti nəzarəti tamamilə frontend-ə
keçir.

Bizim tövsiyəmiz (A) — çünki `type` sahəsi onsuz da mövcuddur və "material/texnika üçün İstehsalçı
mütləq lazımdır" qaydasını backend səviyyəsində saxlamaq daha etibarlıdır (frontend-i bypass edən
hər hansı başqa client bu qaydanı yenə tətbiq edər).

`brand`/`model`/`specification` onsuz da könüllüdür, bunlarda dəyişiklik tələb olunmur.

## Açıq qalan sual

Eyni "istehsalçı mənasızdır" məsələsi `Xidmət` (type 5) kateqoriyası üçün də doğru ola bilər (məs.
layihələndirmə/konsaltinq xidməti — kim "istehsal edir"?). Bu sorğunu yalnız `type = 3` üçün
məhdudlaşdırmaq, yoxsa qaydanı ümumi şəkildə (məs. "yalnız Material və Maşın-mexanizm üçün
`manufacturer` məcburidir, qalan tiplər üçün könüllüdür") qurmaq — qərar sizindir, sadəcə variantı
qeyd edirik. Hazırda `Xidmət`/`Nəqliyyat` kateqoriyalarında real data yoxdur, ona görə bu sorğu ilk
növbədə `İşçi qüvvəsi`-yə fokuslanır.

## Nəyə görə indi

"İşçi qüvvəsi" kateqoriyası hazırda **boşdur** (heç bir xüsusiyyət növü/məhsul yoxdur) — bu, kataloqa
yeni xüsusiyyət növləri (İxtisas, İxtisas dərəcəsi) bağlanaraq indicə istifadəyə açılıb. Bu backend
dəyişikliyi olmadan, kateqoriya istifadəyə açıq olsa belə, hər elan yaratma cəhdi `manufacturer`
boş olduqda 400 ilə uğursuz olacaq — istifadəçiyə görünməyən bir sahəyə aid xəta kimi (frontend bu
sahəni İşçi qüvvəsi üçün tamamilə gizlədəcək).

---
