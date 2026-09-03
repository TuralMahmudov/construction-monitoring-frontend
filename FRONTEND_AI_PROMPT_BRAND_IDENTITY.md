# CCMS Frontend — Brend Product-Kimliyinə Keçdi

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas modullar) və **`FRONTEND_AI_PROMPT_PRODUCTS.md`**-nin (product yaratma/tapma axını) **davamıdır** — konvensiyalar (unified response envelope, `PageResponse<T>`, auth axını) təkrarlanmır. Bu fayl **BREAKING CHANGE**-dir: `resource.brand` sahəsi və `/api/resources/brands` endpoint-i tamamilə silinib.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst (qısa)

İndiyə qədər brend (`brand`) `resource`-un (elanın) üzərində sərbəst mətn idi — hər təşkilat eyni product-u istədiyi brend adı ilə təsvir edə bilirdi, `manufacturer`/`model` kimi. **Bu dəyişdi:** brend indi (istəyə bağlı, kateqoriya-kateqoriya) **product-un öz kimliyinin** bir hissəsi ola bilər, digər texniki atributlar (Diametr, Material sinfi və s.) kimi. `manufacturer`/`model`/`specification` köhnə yerində qalır (resource-a, per-listing) — YALNIZ brend köçdü.

**Niyə:** eyni texniki spesifikasiyalı, amma fərqli brendli məhsullar artıq **ayrı product** sayılır (ayrı `code`, ayrı bazar orta/median statistikası). Əvvəllər brend "cross-vendor" müqayisəni pozmasın deyə bilərəkdən kənarda saxlanılırdı — indi bu, biznes tələbi olaraq tərsinə çevrildi.

---

## 0. Admin tərəfi: "Brend" haradan gəlir, necə bağlanır (ƏN ƏVVƏL BUNU OXUYUN)

Bu bölmə əvvəlki versiyada yox idi və real qarışıqlığa səbəb oldu — diqqətlə oxuyun.

Sistemdə iki AYRI, əlaqəli admin konsepti var, qarışdırmayın:

1. **Xüsusiyyət Tərifləri** (`attribute_definitions`, `AttributeDefinitionFormDialog` və s.) — "Diametr", "Material sinfi" kimi xüsusiyyət **NÖVLƏRİNİN** siyahısı, admin buradan tamam **yeni** bir növ yaradır (Rəqəm/Mətn/Sabit siyahı/Bəli-Xeyr/Tarix seçib).
2. **Kateqoriyaya xüsusiyyət bağlama** (`category_attribute_definitions`, `POST /api/resource-categories/{id}/attributes`) — "hansı kateqoriya, hansı MÖVCUD xüsusiyyəti istifadə edir" seçimi.

**"Brend" artıq #1-də, sistem tərəfindən AVTOMATIK yaradılıb** (backend migrasiyası, admin heç nə klikləmədən) — `dataType: 6`, `name: "Brend"`. Bunu `GET /api/attribute-definitions?name=Brend` ilə yoxlaya bilərsiniz, dərhal tapılacaq.

**Buna görə admin formasına (`AttributeDefinitionFormDialog`) BRAND-ı 6-cı seçim kimi ƏLAVƏ ETMƏYİN — bu, bilərəkdən belədir, boşluq deyil.** Səbəb: "Brend" konseptual olaraq **tək, təkrarlanmayan** bir sistem sətridir — bütün BRAND-tipli atributlar EYNİ, tək `brands` kataloq cədvəlini paylaşacaq (ENUM-dan fərqli olaraq, orada hər definition öz `attribute_enum_values` dəyərlərinə malikdir). Admin ikinci bir BRAND-tipli atribut yaratsaydı, o da eyni brend siyahısını (Norm, AzTexnika və s.) göstərəcəkdi — mənasız təkrar, potensial qarışıqlıq mənbəyi. Ona görə "Brend"in yaradılması admin-in əlində DEYİL, bilərəkdən bağlanıb.

**Admin-in ETMƏLİ OLDUĞU YEGANƏ ŞEY:** #2-yə gedib, mövcud "Brend"i (siyahıdan seçərək, necə ki "Diametr"i seçirsiniz) istədiyi kateqoriyaya bağlamaq — dəqiq **eyni ekran, eyni axın**, heç bir yeni UI lazım deyil. Əgər sizin "kateqoriyaya bağla" ekranınız atribut seçimini `GET /api/attribute-definitions` siyahısından dolduran bir dropdown/autocomplete-dirsə (adətən belə olur), "Brend" artıq orada görünəcək — sınayın, əlavə iş lazım olmaya bilər.

**Bir kiçik render nüansı:** "Xüsusiyyət Tərifləri"nin READ-ONLY siyahı görünüşündə (yaratma formu deyil, mövcud definition-ları göstərən cədvəl/list) `dataType: 6` sətri (yəni "Brend") də görünəcək, çünki o, ümumi siyahılama sorğusunda (`GET /api/attribute-definitions`) digər definition-larla bir yerdə qayıdır. Bu sətir üçün "Rəqəm/Mətn/Sabit siyahı/Bəli-Xeyr/Tarix" etiketlərindən heç biri uyğun gəlmir — `dataType: 6` üçün "Brend (sistem)" kimi ayrıca bir etiket göstərin ki, cədvəl "naməlum tip" kimi boş/xarab görünməsin. Bu sətri REDAKTƏ/SİL düymələri ilə göstərməyə ehtiyac yoxdur (bir dənədir, sistem idarə edir), amma texniki olaraq bloklamaq da vacib deyil — sadəcə UI-da səliqəli göstərilməsi kifayətdir.

**"Necə bağlanır" tam axını (iki addım, hər ikisi artıq işləkdir, canlı test edilib):**
1. **Admin, bir dəfə, əvvəlcədən:** "kateqoriyaya xüsusiyyət bağla" ekranından "Brend"i seçib istədiyi kateqoriyaya bağlayır (məs. "Polad borular"a bağlayır, "Qum"a bağlamır). Bu qərar kateqoriya-səviyyəlidir, sabit qalır.
2. **İstifadəçi, hər dəfə, resurs/product yaradarkən:** əgər seçdiyi kateqoriyada Brend bağlıdırsa, forma "Brend" sahəsini göstərir (aşağıda bölmə 3 — sərbəst yazı + təklif). Bağlı deyilsə, sahə heç görünmür.

**Diqqət:** bu, "yazsan iştirak edir, yazmasan yox" kimi HƏR DƏFƏ dəyişən bir qayda DEYİL — kateqoriyanın Brend-i istifadə edib-etməməsi əvvəlcədən (addım 1-də) sabitlənir, hər istifadəçinin doldurub-doldurmamasından asılı olaraq DƏYİŞMİR. Bu, eyni kateqoriyadakı bütün məhsulların eyni qayda ilə müqayisə olunmasını təmin edir (bəziləri brend-əsaslı, bəziləri yox — bela qarışıqlıq olmasın deyə).

---

## 1. SİLİNDİ: `resource.brand` + `GET /api/resources/brands`

Aşağıdakılar backend-də artıq **mövcud deyil**, frontend-dən də çıxarılmalıdır:

- `ResourceResponse`/`MyResourceResponse`/`MyResourceDetailResponse`-da `brand` sahəsi
- `CreateResourceRequest`/`UpdateResourceRequest`/`CreateMyResourceRequest`/`BulkResourceRowRequest` body-lərində `brand` sahəsi
- `GET /api/resources/brands?search=` autocomplete endpoint-i

Resurs yaratma/redaktə formalarında (vendor "Mənim Resurslarım", mərkəzi "Sənəd emalı" ekranları) **"Brend" input-unu bu formalardan tamamilə çıxarın** — `manufacturer`/`model`/`specification` inputları olduğu kimi qalır.

---

## 2. YENİ: Brend product yaratma/tapma axınına keçdi

`POST /api/products` (və onu daxildən çağıran `POST /api/resources/mine` ilə `productId` göndərilmədən, `categoryId`+`attributes` yolu, həmçinin `POST /api/documents/{id}/resources`-un `newProduct` sahəsi) artıq brendi **digər strukturlaşdırılmış atributlar kimi** `attributes[]` massivində qəbul edir:

```json
POST /api/products
{
  "categoryId": "uuid",
  "name": "Test boru",
  "unitId": "uuid",
  "attributes": [
    { "categoryAttributeDefinitionId": "<Diametr-in link id-si>", "value": "100" },
    { "categoryAttributeDefinitionId": "<Brend-in link id-si>", "value": "Norm" }
  ]
}
```

**Vacib:** "Brend"in `categoryAttributeDefinitionId`-si hər kateqoriyada FƏRQLİDİR (hətta eyni "Brend" `attributeDefinitionId`-nə işarə etsə belə) — `GET /api/resource-categories/{leafCategoryId}/attributes` çağırıb, `attributeName == "Brend"` olan sətri tapıb onun öz `id`-sini (link id) istifadə edin, tıpkı digər atributlar üçün etdiyiniz kimi. **Brend hər kateqoriyada olmaya bilər** — əgər siyahıda yoxdursa, o kateqoriyada brend soruşulmur, formadan tamamilə çıxarın (statik/hardcoded eyni sahə deyil, dinamik siyahının bir hissəsidir).

---

## 3. YENİ: Brend inputu — sərbəst yazı + typeahead (dropdown DEYİL)

Digər ENUM-tipli atributlardan (bunlar bağlı siyahıdan seçilir) **fərqli olaraq**, Brend sərbəst mətn inputu olmalıdır, təklif siyahısı ilə:

```
GET /api/brands?search=nor
→ { "data": ["Norm", "Norma Tex"] }
```

**UX axını:**
1. İstifadəçi Brend sahəsinə yazmağa başlayır.
2. Hər hərfdə (debounce ilə, məs. 300ms) `GET /api/brands?search=<yazılan mətn>` çağırılır, nəticələr açılan siyahıda göstərilir (Autocomplete/Combobox komponenti, `freeSolo` rejimində — MUI-də `Autocomplete freeSolo`).
3. İstifadəçi siyahıdan birini seçə bilər, YA DA siyahıda olmayan tamam yeni bir mətn yaza bilər — hər ikisi keçərlidir, **əlavə təsdiq addımı YOXDUR**.
4. Formanı submit edəndə, yazılan mətn (seçilmiş və ya yeni fərq etməz) birbaşa `attributes[]`-də `{ categoryAttributeDefinitionId: <Brend-in link id-si>, value: "<yazılan mətn>" }` kimi göndərilir.
5. Backend arxa planda tapır (mövcuddursa) və ya yaradır (yoxdursa) — frontend-in bunun üçün ayrıca bir "brend yarat" çağırışı etməsinə **ehtiyac yoxdur**, `POST /api/products` (və ya `.../mine`) bir addımda hər ikisini edir.

**Case/boşluq həssaslığı:** `" norm "` və `"Norm"` backend tərəfindən eyni brend kimi tanınır (avtomatik normallaşdırılır) — frontend-də bunun üçün əlavə təmizləmə etməyə ehtiyac yoxdur, olduğu kimi göndərin.

---

## 4. Product ekranlarında görünüş

- Product-un `description`/`name`-i artıq (o kateqoriyada Brend bağlıdırsa) brendi öz içində göstərəcək, məs. `"Polad borular — Brend: Norm, Diametr: 100mm"` — ayrıca bir "Brend" sütunu/etiketi əlavə etməyə **ehtiyac yoxdur**, `GET /api/products/{id}/attributes` çağırıb Brend-in öz sırasını (digər atributlar kimi) göstərsəniz kifayətdir.
- `GET /api/products?attributeName=Brend&attributeValue=Norm` — brend üzrə filtrasiya üçün istifadə edin (mövcud, `products` axtarış filtrlərinin bir hissəsi).
- Bazar Analitikası (`GET /api/resource-prices/averages`) cavabında ayrıca `brand` sütunu **yoxdur, olmayacaq** — brend indi `product_id`-nin özünə "bişirilib" (fərqli brend = fərqli sətir), `resourceName`/`productCode` sütunlarında dolayı görünür.
