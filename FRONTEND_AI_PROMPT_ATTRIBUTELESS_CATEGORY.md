# CCMS Frontend — Atributsuz kateqoriyada məhsul yaratma bloku YANLIŞDIR, çıxarın (2026-09-07)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT_PRODUCTS.md`** və **`FRONTEND_AI_PROMPT_STATUS_CLEANUP.md`**-nin davamıdır — konvensiyalar təkrarlanmır.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## 1. "Bu kateqoriyaya heç bir xüsusiyyət növü bağlanmayıb..." bloku — SİLİN

Frontend-də hazırda görülür ki, seçilən kateqoriyanın heç bir xüsusiyyəti (atributu) yoxdursa, UI belə bir mesajla məhsul yaratmağı tamamilə bloklayır:

> *"Bu kateqoriyaya heç bir xüsusiyyət növü bağlanmayıb, ona görə yeni məhsul yaradıla bilməz. Əvvəlcə 'Resurs Kataloqu'nda kateqoriyaya ən azı bir xüsusiyyət növü bağlayın, ya da yuxarıdakı mövcud məhsullardan istifadə edin."*

**Bu, backend-in real davranışına zidddir və heç vaxt düzgün olmayıb** — `FRONTEND_AI_PROMPT_STATUS_CLEANUP.md` § 2-də artıq açıq yazılmışdı:

> "Kateqoriyanın HEÇ BİR uyğunlaşdırıcı atributu YOXDURSA → `attributes:[]` YENƏ İCAZƏLİDİR, `400` atılmır."

Yəni backend həmişə atributsuz kateqoriyada `attributes: []` ilə `POST /api/products` çağırışına icazə verib. Üstəlik 2026-09-04-də bir bug da düzəldilib (əvvəllər belə kateqoriyalarda BÜTÜN fərqli-adlı məhsullar səhvən eyni boş `matchKey`-ə düşüb bir-birinə "matched" olurdu — indi hər fərqli ad öz ayrıca məhsuluna uyğunlaşır, eyni ad təkrar göndəriləndə isə düzgün `matched:true` qayıdır). Bu backend-in özündə artıq etibarlı və canlı test edilmiş bir yoldur (bu qayda ilə 736 real məhsul yaradılıb) — frontend-in blokladığı ssenari əslində tam funksionaldır.

### Konkret dəyişiklik

- Kateqoriya seçildikdən sonra `GET /api/resource-categories/{categoryId}/attributes` **boş massiv** qaytarırsa:
  - Yuxarıdakı blok mesajını **göstərməyin**.
  - Formu normal davam etdirin: yalnız **Ad** (və Vahid, əgər formda varsa) sahələrini göstərin, heç bir atribut inputu qurmayın.
  - "Yarat" düyməsini yalnız Ad boş olmadıqda aktivləşdirin (əvəlki "ən azı 1 atribut doldurulmalıdır" qaydası **yalnız kateqoriyanın atributu OLDUĞU** halda tətbiq olunur — bax `STATUS_CLEANUP.md` § 2, dəyişməyib).
  - `POST /api/products` çağırışını `attributes: []` ilə göndərin — adi cavab formatı (`matched: true/false`, `product: {...}`) eynidir, heç bir yeni sahə yoxdur.
- Kateqoriyanın atributu VARSA, mövcud davranış (§ 2, `STATUS_CLEANUP.md`) **dəyişməyib** — heç nəyə toxunmayın.

---

## 2. Kiçik əlavə qeyd — `resource.status` artıq həmişə dolu gəlir

`POST /api/resources` (və resurs cavabı olan digər endpoint-lər) `status` sahəsini əvvəllər bəzən `null` qaytarırdı (mərkəzi/sənəd-emalı yolu ilə yaradılan resurslarda). İndi bu sahə həmişə bir dəyərlə (defolt `2` = "Təqdim edilib") gəlir. Əgər UI-də `resource.status`-u haradasa şərtlə göstərirsinizsə (məs. `status && ...`), bu artıq həmişə true olacaq — funksional təsiri yoxdur, sadəcə əvvəllər boş görünən yerdə indi "Təqdim edilib" nişanı görünə bilər. Xüsusi bir hərəkət tələb olunmur, sadəcə gözlənilməz görünsə deyə qeyd edirik.

---

## Xülasə cədvəl

| Nə | Əvvəl (frontend) | İndi |
|---|---|---|
| Kateqoriyada atribut yoxdursa | Bloklanır, xəbərdarlıq mesajı göstərilir | **Sərbəst buraxılır**, ada görə yaradılır/uyğunlaşdırılır |
| `POST /api/products` (atributsuz kateqoriya, `attributes:[]`) | Frontend heç göndərmirdi (bloklanmışdı) | Göndərilməli — backend dəstəkləyir, `400` atmır |
| `resource.status` | Bəzən `null` | Həmişə dolu (defolt `2`/"Təqdim edilib") |
