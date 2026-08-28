# CCMS Frontend — Status-dizaynı təmizliyi: Uyğunlaşdırma Baxışı ləğvi, ən azı 1 atribut, Kənar Dəyər zənginləşdirilməsi (2026-08-25)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`**, **`FRONTEND_AI_PROMPT_PRODUCTS.md`** və **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`**-nin **davamıdır** — konvensiyalar təkrarlanmır. **Diqqət:** bu sənəd `FRONTEND_AI_PROMPT_PRODUCTS.md` § 7-ni və `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` § 5-i **köhnəldir** (aşağıda izah olunub) — onları artıq tətbiq etməyin/istinad etməyin.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Kontekst

Backend araşdırması göstərdi ki, `Product.reviewStatus` ("Baxış gözləyir"/`PENDING_REVIEW`) heç bir hesablamaya (bazar/rüblük statistika, heç bir report) təsir etmirdi — sırf görüntü xarakterli bir bayraq idi, üstəlik onu "rədd et" və ya "tamamla" edəcək heç bir yol yox idi (yalnız "Confirm" var idi). İstifadəçi ilə razılaşaraq bu axın **söndürüldü**, əvəzinə kök səbəbi (kifayət qədər atribut doldurulmadan məhsul yaradılması) qabaqcadan bloklayan bir validasiya əlavə olundu. Bu, 3 konkret frontend təsiri deməkdir (aşağıda).

---

## 1. "Uyğunlaşdırma Baxışı" / Product Review ekranını ÇIXARIN

- Sidebar-dan bu ekranı (`FRONTEND_AI_PROMPT_PRODUCTS.md` § 7-də "Uyğunlaşdırma Baxışı"/"Məhsul Baxışı" adlandırılmışdı) **silin**.
- Backend endpoint-ləri (`GET /api/products/pending-review`, `PATCH /api/products/{id}/confirm`) **hələ mövcuddur, silinməyib** — sadəcə artıq yeni məhsul yaradılanda bir daha `PENDING_REVIEW` sətri yaranmayacaq (bax § 2). Əgər bu ekranı saxlamaq istəsəniz belə işləməyə davam edər (köhnə bir neçə sətir hələ görünə bilər), amma **faydası yoxdur** — buna görə silinməsi tövsiyə olunur.
- Product Detail ekranında "Baxış gözləyir" nişanı göstərirsinizsə, saxlaya da bilərsiniz (zərərsizdir, YENİ məhsullarda bir daha görünməyəcək), çıxara da bilərsiniz — bu, sırf UX qərarıdır, backend-ə heç bir təsiri yoxdur.

---

## 2. `POST /api/products` (və `POST /api/resources/mine` üzərindən eyni `resolve()`) — YENİ mümkün xəta + `reviewStatus` artıq həmişə 1

`FRONTEND_AI_PROMPT_PRODUCTS.md` § 2-dəki bu cümlə **artıq düzgün deyil**:

> ~~"attributes boş buraxıla bilər ([]) — o zaman matchKey boş olur və yaradılan product reviewStatus=2 (PENDING_REVIEW) alır"~~

**Yeni davranış:**

- **`reviewStatus` HƏMİŞƏ `1` (CONFIRMED)** — nə göndərsəniz göndərin, `2` bir daha qayıtmayacaq (yeni yaranan product-lar üçün).
- Seçilmiş kateqoriyanın **ən azı 1 uyğunlaşdırıcı atributu VARSA** (adətən belədir) VƏ `attributes:[]` (boş) göndərilibsə → **`400 Bad Request`**:
  ```json
  { "message": "At least one attribute affecting product identity is required to create a product" }
  ```
- Kateqoriyanın **HEÇ BİR** uyğunlaşdırıcı atributu YOXDURSA (bəzi sadə/differensiallaşdırılmamış kateqoriyalarda belədir — məs. işçi qüvvəsi kimi xidmət tipli kateqoriyalar) → `attributes:[]` YENƏ İCAZƏLİDİR, `400` atılmır (heç nə dəyişməyib).

**Client-side tövsiyə (məcburi deyil, UX üçün):** kateqoriya seçilib onun atribut sahələri (`GET /api/resource-categories/{categoryId}/attributes`) göstərilirsə — əgər bu siyahı **boş deyilsə**, "Yarat" düyməsini yalnız ən azı 1 atribut sahəsi doldurulanda aktiv edin (backend-in 400-ünü gözləmədən, daha yaxşı UX). Siyahı boşdursa (kateqoriyanın heç bir atributu yoxdursa), heç bir əlavə məhdudiyyət qoymayın — bu halda backend də sərbəst buraxır.

---

## 3. `GET /api/resource-prices/flagged` — cavab zənginləşdi, köhnə workaround artıq LAZIM DEYİL

`FRONTEND_AI_PROMPT_ADMIN_PANEL.md` § 4-də təsvir olunan **klient-tərəfli workaround (hər sətir üçün ayrıca `GET /api/resources/{id}` çağırıb kod/ad tapmaq) artıq lazım deyil** — cavab indi birbaşa bunları verir:

```json
{
  "id": "uuid", "resourceId": "uuid",
  "productCode": "MAT-000009", "productName": "Qaz-su xətləri üçün qara, yivli, qaynaq edilmiş polad borular",
  "regionId": "uuid", "regionName": "Bakı",
  "organizationId": "uuid", "organizationName": "...",
  "price": 9999.0000, "vat": 18.0000, "currency": "AZN",
  "effectiveDate": "2026-07-27", "expireDate": null, "status": 4,
  "createdBy": "uuid", "createdByName": "...", "createdDate": "2026-07-27T14:39:35.78",
  "currentMedianPrice": 100.0000, "deviationPercent": 2400.0000, "sampleCount": 3
}
```

- **Yeni sahələr:** `productCode`, `productName`, `regionName` — DataGrid-in "Resurs (kod+ad)" və "Region" sütunlarını artıq birbaşa bunlardan doldurun, əlavə lookup/sorğuya ehtiyac yoxdur.
- Əgər səhifə açılışında hər sətir üçün ayrı-ayrı `GET /api/resources/{id}`/`GET /api/regions` çağırırdınızsa (əvvəlki spesifikasiyanın tövsiyəsi), bu kodu **silə bilərsiniz** — performans baxımından da faydalıdır.
- `organizationName` dəyişməyib (onsuz da var idi).
- **Bonus imkan:** `resourceId` onsuz da cavabda idi — indi yanında oxunaqlı `productCode`/`productName` da olduğu üçün, əgər Resurs Detal ekranınız varsa, "Resursa bax" keçidi əlavə edə bilərsiniz (istəyə bağlı, məcburi deyil).

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| "Uyğunlaşdırma Baxışı" ekranı | Aktiv, `PATCH .../confirm` ilə idarə olunurdu | **Çıxarın** — heç bir funksional əhəmiyyəti qalmayıb |
| `POST /api/products` `attributes:[]` (boş) | Həmişə icazəli, `reviewStatus=2` alırdı | Kateqoriyadan asılı: ya icazəli (`reviewStatus=1`), ya **`400`** |
| `reviewStatus` yeni product-da | `1` və ya `2` ola bilərdi | **Həmişə `1`** |
| `GET /api/resource-prices/flagged` sahələri | `resourceId`/`regionId`/`organizationId` (yalnız `organizationName` ad idi) | + **`productCode`, `productName`, `regionName`** |
| Flagged-ekranında ad üçün per-sətir `GET /api/resources/{id}` | Lazım idi (workaround) | **Lazım deyil**, cavabda birbaşa var |
