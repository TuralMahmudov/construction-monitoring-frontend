# Backend Təhlükəsizlik Tapıntısı — Admin Endpoint-lərdə Rol/İcazə Yoxlaması Yoxdur

**Tarix:** 2026-08-10
**Aşkar edən:** Frontend tərəfi, canlı test (dev environment, `http://localhost:8181`)
**Ciddiyyət:** Yüksək — icazəsiz hesab admin-only məlumatlara tam giriş əldə edir

---

## 1. Problem

Frontend-də admin-only səhifələr (Atribut Lüğəti, Vahidlər/Regionlar, Sənədlərin İdarəsi və s.)
yalnız **naviqasiya menyusunda** gizlədilirdi — səhifənin özü və arxasındakı API sorğuları heç
bir rol/icazə yoxlaması etmirdi. Nəticədə:

- İstənilən autentifikasiya olunmuş istifadəçi (o cümlədən **təşkilat (vendor) hesabı**, heç bir
  admin rolu olmadan) URL-i birbaşa yazaraq bu səhifələrə keçə bilirdi.
- Daha vacibi: **backend özü də bu sorğuları rədd etmir** — frontend nə edirsə etsin, API
  səviyyəsində qorunma yoxdur.

Frontend tərəfində bunu bağladıq (səhifələr indi rola görə gizlədilir və arxa sorğular
göndərilmir), amma bu, yalnız **UI səviyyəsində** bir tədbirdir. Real qorunma backend-də
olmalıdır — hər hansı bir istifadəçi brauzeri keçib API-ni birbaşa çağırsa (Postman, curl və s.),
indi də tam giriş əldə edəcək.

---

## 2. Canlı təsdiqlənmiş (network trace ilə)

Test hesabı: adi bir **təşkilat (vendor) hesabı**, heç bir mərkəzi/admin rolu yoxdur.

| Endpoint | Metod | Nəticə |
|---|---|---|
| `GET /api/attribute-definitions?page=0&size=10&sort=name,asc` | GET | **200**, tam siyahı qaytarıldı |
| `GET /api/units?active=true&size=200` | GET | **200**, tam siyahı qaytarıldı |

Hər iki halda cavab **tam data** idi — 401/403 yox, sadəcə uğurlu cavab. Bu sənədlər (Atribut
Lüğəti, Vahidlər) mərkəzi admin-only olmalıdır (frontend naviqasiyasında belə işarələnib), amma
backend bunu tələb etmir.

---

## 3. Kodda eyni naxışla, amma bu sessiyada ayrıca live-test edilməyən (yoxlanmalı)

Aşağıdakı endpoint-lər frontend-də **eyni səbəbdən** (yalnız UI-da gizlədilirdi, backend
yoxlaması bilinmir) risk altındadır — yuxarıdakı 2 nümunə ilə eyni metodla (icazəsiz hesabla
sorğu göndərib cavabı yoxlamaq) təsdiqlənməlidir:

- `GET /api/organizations` — Təşkilatlar admin siyahısı
- `GET /api/users` (central users) — İstifadəçi idarəsi
- `GET /api/documents` — **Ən həssas** — bütün təşkilatların idxal etdiyi sənədlərin siyahısı
  (fayl adları, təsvirlər, endirmə girişi) — cross-tenant data
- `GET /api/documents/{id}/download` — sənəd faylının özü
- `PATCH /api/documents/{id}/process`, `PATCH /api/documents/{id}/status`,
  `POST /api/documents/{id}/resources` — sənəd emalı/rədd/resurs-yaratma **yazma** əməliyyatları
- `GET /api/resource-prices/flagged`, `PATCH /api/resource-prices/{id}/approve|reject` —
  Kənar Dəyər Qiymətlər
- `GET /api/products/pending-review`, `POST /api/products/{id}/confirm` — Uyğunlaşdırma Baxışı
- `GET /api/resource-prices/averages` (və ya bu modulun istifadə etdiyi ekvivalent) — Bazar
  Qiymətləri Analitikası

**Xüsusi qeyd — yazma əməliyyatları:** Yuxarıdakı 2 canlı test yalnız **oxuma (GET)**
əməliyyatları idi (məlumat sızması). Bu sessiyada **yazma (POST/PATCH/DELETE)** əməliyyatlarını
qəsdən sınamadıq (real data yaratmaq/dəyişmək riski olduğu üçün) — amma eyni səbəbdən (heç bir
authz middleware görünmür) yazma əməliyyatlarının da qorunmadığını ehtimal edirik. Bu, sızmadan
da təhlükəlidir (kimsə başqa təşkilatın sənədini rədd edə, admin konfiqurasiyasını dəyişə bilər).

---

## 4. Tələb olunan düzəliş

Hər bir endpoint üçün server-side rol/icazə yoxlaması (məs. Spring Security
`@PreAuthorize`/eqivalent) əlavə olunmalıdır, frontend-in gating qaydaları ilə uyğun:

| Endpoint qrupu | Tələb olunan |
|---|---|
| `/api/organizations`, `/api/users`, `/api/attribute-definitions`, `/api/resource-prices/flagged*`, `/api/products/pending-review*`, `/api/*/averages` | `SUPER_ADMIN` / `ADMIN` |
| `/api/units`, `/api/regions` (yazma əməliyyatları) | `SUPER_ADMIN` / `ADMIN` (oxuma daha geniş ola bilər) |
| `/api/documents*` (mərkəzi baxış, emal, status) | `DOCUMENT_REVIEW` icazəsi |

Frontend artıq bu qaydalara uyğun UI-nı hazırlayıb (§0-dakı icazə cədvəli,
`FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_5.md`-dəki icazə adları ilə eynidir) — backend-in yalnız
bunu **özü də tələb etməsi** lazımdır, UI-nın gizlətməsinə etibar etmədən.

---

## 5. Təkrarlama addımları (nümunə)

1. Adi təşkilat (vendor) hesabı ilə daxil ol.
2. Brauzerdə birbaşa `http://localhost:5173/admin/attribute-definitions` ünvanına keç (naviqasiya
   menyusunda bu link yoxdur, amma URL işləyir).
3. Şəbəkə tab-ında `GET /api/attribute-definitions` sorğusuna bax — cavab `200` və tam data
   qaytarır, gözlənilən `403` əvəzinə.
