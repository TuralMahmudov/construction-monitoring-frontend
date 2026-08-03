# CCMS Backend — "Mənim Resurslarım" modulu üçün tapşırıq

> Bu faylı olduğu kimi kopyalayıb backend-i yazan AI alətinə verin. Frontend artıq **tam hazırdır** (`src/features/my-resources/`) və bu fayldakı kontrakta uyğun tikilib — sizin işiniz yalnız aşağıdakı endpoint-ləri, sadəcə təsvir olunan formada, tətbiq etməkdir. Format dəyişsə frontend-i də dəyişmək lazım gələcək, ona görə dəqiq bu formaya uyğunlaşın.
>
> Mövcud konvensiyalar (`PROJECT_STATUS.md`-də tam detal var): unified response envelope `{ success, message, data, timestamp }`, xəta cavabı `{ timestamp, status, error, message, path, validationErrors }`, `PageResponse<T>` pagination, Liquibase XML changelog, BaseEntity pattern, `COST_READ`/`COST_WRITE` permission-ları (yeni permission YARADILMAYIB, mövcudlardan istifadə olunur — aşağı bax bölmə 6).

---

## 0. Kontekst — bu modul nədir

"Mənim Resurslarım" — istehsalçı/təchizatçı təşkilat istifadəçilərinin (`actorType = ORGANIZATION`) öz məhsullarını/resurslarını sistemə təqdim etdiyi ekran. Konseptual olaraq bunlar **adi `resources` cədvəlindəki sətirlərdir** (eyni `Resource` entity, eyni `organizations`/`resource_categories` münasibətləri) — yeganə fərq: (1) bir **status iş axını** daşıyırlar, (2) "mənim" filtri ilə (cari istifadəçinin `organizationId`-si) siyahılanırlar, (3) qiymətləri fərqli, sadələşdirilmiş formada verilir (təchizatçısız, çünki təchizatçı örtülüdür — öz təşkilatı).

**Yeni cədvəl YARADILMASINA ehtiyac yoxdur** `resources` üçün — mövcud cədvələ 1 sütun əlavə olunur (bölmə 1). Qiymət üçün isə seçim var (bölmə 4).

---

## 1. `resources` cədvəlinə `status` sütunu

Yeni Liquibase migrasiyası (nömrələmə: `PROJECT_STATUS.md`-də sonuncu görünən nömrədən davam edin):

```sql
ALTER TABLE resources ADD COLUMN status SMALLINT NULL;
```

- **Nullable** — mərkəzi/adi yolla (`POST /api/resources`) yaradılan resurslar bu sütunu heç vaxt doldurmur (NULL qalır), çünki onlar review axınına tabe deyil. Yalnız bu yeni `POST /api/resources/mine` ilə yaradılan sətirlər doldurur.
- Ümumi `ResourceResponse`/`GET /api/resources` DTO-suna **əlavə etməyin** — mövcud Resurslar modulunu pozmasın deyə, `status` yalnız `/api/resources/mine*` cavablarında görünür.
- Dəyərlər (kod → ad, tam olaraq bu ardıcıllıqla):

| Kod | Ad |
|---|---|
| 1 | `DRAFT` (Qaralama) — hazırda istifadə OLUNMUR, gələcək üçün ayrılıb |
| 2 | `SUBMITTED` (Təqdim edilib) |
| 3 | `CLARIFICATION_NEEDED` (Dəqiqləşdirmə tələb olunur) |
| 4 | `APPROVED` (Təsdiqlənib) |
| 5 | `REJECTED` (Rədd edilib) |

`POST /api/resources/mine` ilə yaradılan hər resurs **birbaşa `SUBMITTED` (2)** statusu ilə başlayır (frontend-də ayrıca "qaralama saxla" düyməsi yoxdur, "Yadda saxla" = təqdim etmək deməkdir).

**Bu tapşırığın əhatəsindən kənarda** (frontend hələ yoxdur, indi tikməyin): status-u `APPROVED`/`REJECTED`/`CLARIFICATION_NEEDED`-ə keçirən admin review endpoint-i. Gələcəkdə `flagged-prices`/`match-groups` admin review ekranlarına bənzər ayrıca bir "resurs review" admin ekranı olacaq — o zaman `PATCH /api/resources/mine/{id}/approve` və s. lazım olacaq. İndi YALNIZ aşağıdakı endpoint-lər lazımdır.

---

## 2. `GET /api/resources/mine`

Cari istifadəçinin **öz təşkilatının** (`resources.organization_id = current user-in organizationId-si`) resurslarının səhifələnmiş siyahısı. `organizationId` sorğu parametri YOXDUR — tamamilə implicit (auth token-dən).

Query: `name`, `category` (categoryId), `status` (1-5), `page`, `size`, `sort`

Cavab: `PageResponse<MyResourceResponse>`:
```json
{
  "content": [{
    "id": "uuid", "categoryId": "uuid", "code": "MAT-000123",
    "name": "Polad boru", "description": "...", "unitId": "uuid",
    "specification": "...",
    "manufacturer": "Bosch", "brand": "...", "model": "...",
    "status": 2, "statusLabel": "Təqdim edilib",
    "hasPrice": true,
    "createdDate": "2026-07-29T10:00:00Z"
  }],
  "page": 0, "size": 10, "totalElements": 1, "totalPages": 1, "last": true
}
```
`hasPrice` — server-computed boolean (aşağıdakı qiymət mənbəyinə görə `EXISTS` sorğusu, N+1-dən qaçmaq üçün).

---

## 3. `GET /api/resources/mine/{id}` və `POST /api/resources/mine`

### `POST /api/resources/mine`
Yalnız əsas sahələr (atributlar/qiymətlər BURADA YOXDUR — onlar ayrı sorğularla əlavə olunur, aşağı bax):
```json
{
  "categoryId": "uuid", "name": "...", "description": "...", "unitId": "uuid",
  "specification": "...", "manufacturer": "...", "brand": "...", "model": "..."
}
```
- `categoryId`/`name`/`unitId`/`manufacturer` məcburidir (`manufacturer` bu modulda — ümumi Resurslar-dan fərqli olaraq — **məcburidir**, 400 qaytarın boşdursa).
- `code` avtomatik generasiya olunur (mövcud `Resource` konvensiyası, dəyişməz).
- `organizationId` request body-də YOXDUR — server avtomatik cari istifadəçinin öz `organizationId`-sini yazır (mövcud spoofing-qoruması ilə eyni məntiq, bax `FRONTEND_AI_PROMPT_ADMIN_PANEL.md` bölmə 2).
- `status = SUBMITTED (2)` avtomatik təyin olunur.
- Cavab: `MyResourceDetail` (aşağı bax).

### `GET /api/resources/mine/{id}`
Cavab: `MyResourceResponse` sahələri + `"prices": [...]` (bölmə 4-dəki forma). Yalnız cari istifadəçinin öz təşkilatının resursuna baxa bilməsi təmin olunmalıdır (başqa təşkilatın resursu = 404, mövcud `organization_id` görünürlük modelindəki kimi).

**Diqqət:** bu cavabda `attributes` sahəsi YOXDUR — Xüsusiyyətlər üçün frontend artıq mövcud `GET /api/resources/{id}/attributes` endpoint-ini istifadə edir (bölmə 5-ə bax, heç nə dəyişməyin).

---

## 4. Qiymət alt-modulu

Frontend forması: `regionId`, `price`, `currency`, `effectiveDate`, `expireDate` (nullable — "Naməlum müddətə qədər"), `comment`. **`supplierId` YOXDUR** — təchizatçı örtülüdür (cari istifadəçinin öz təşkilatı).

Buranı tikməyin iki yolu var, seçim sizindir, amma **Seçim A tövsiyə olunur** (mövcud, artıq test edilmiş `resource_prices`/`ResourcePrice` infrastrukturunun tam təkrar istifadəsi):

### Seçim A (tövsiyə olunur): mövcud `resource_prices` cədvəlini genişləndirin
1. `resource_prices`-ə nullable `comment VARCHAR(500)` sütunu əlavə edin.
2. `POST /api/resources/mine/{id}/prices` handler-i daxildə **mövcud `ResourcePriceService.create()`-i çağırır**, `supplierId`-ni belə həll edir: `suppliers.organization_id = cari istifadəçinin organizationId-si` olan təchizatçı sətrini tapır (bu bağlantı artıq var, migrasiya `022`, bax `PROJECT_STATUS.md`). Tapılmasa — 409/422 + aydın mesaj ("Təşkilatınız üçün təchizatçı qeydi tapılmadı, əvvəlcə admin ilə əlaqə saxlayın") DEYİL, əvəzinə **avtomatik yaradın** (`suppliers` sətri, `organizationId` + təşkilat adı ilə) ki, istifadəçi bloklanmasın.
3. `status` avtomatik `APPROVED` (bu qiymətlər artıq öz məhsulunun elan etdiyi qiymətdir, `PENDING` review tələb etmir) — YA DA mövcud `PENDING` axınına buraxın, seçim sizindir; frontend bu statusu göstərmir (`MyResourcePrice` tipi status daşımır), ona görə hər iki halda problemsiz işləyəcək.
4. `GET /api/resources/mine/{id}/prices` — daxildə mövcud `ResourcePriceService`-dən bu resurs üçün qiymətləri çəkib sadələşdirilmiş formaya map edir.

### Seçim B: tam ayrı, sadə cədvəl
Əgər Seçim A-nın supplier-həll məntiqi çox mürəkkəb görünürsə, tamamilə yeni, sadə bir cədvəl/entity (`resource_mine_prices` və ya bənzər: `id, resource_id, region_id, price, currency, effective_date, expire_date, comment, created_by, created_date`) qəbul edilə bilər — mövcud qiymət workflow-una qarışmır, amma kod təkrarı yaranır.

Hansı seçim olursa olsun, API forması eynidir:

### `GET /api/resources/mine/{id}/prices`
Cavab: `MyResourcePrice[]`:
```json
[{
  "id": "uuid", "resourceId": "uuid", "regionId": "uuid",
  "price": 105.50, "currency": "AZN",
  "effectiveDate": "2026-07-29", "expireDate": null,
  "comment": "...", "createdDate": "2026-07-29T10:00:00Z"
}]
```

### `POST /api/resources/mine/{id}/prices`
Body — yuxarıdakı formanın `id`/`resourceId`/`createdDate` xaric hissəsi. Cavab: yaradılan `MyResourcePrice`.

---

## 5. Xüsusiyyətlər (attributes) — HEÇ NƏ ETMƏYİN

Bu, artıq tam işləyir, dəyişiklik tələb olunmur:
- `GET /api/resource-categories/{categoryId}/attributes`
- `POST /api/resource-attributes`
- `GET /api/resources/{id}/attributes`

Frontend bunları olduğu kimi istifadə edir (bax `PROJECT_STATUS.md` bölmə 4o — "Struktur Atribut Lüğəti"). Yeni "atribut sxemi" endpoint-i **YARATMAYIN** — əvvəlki tapşırıqda bu səhv edilmişdi, sonra düzəldildi.

---

## 6. İcazələr (permissions)

Yeni permission yaratmayın — mövcud `COST_READ` (GET-lər) / `COST_WRITE` (POST-lar) kifayətdir, ümumi Resurslar modulu ilə eyni konvensiya. Bu, `actorType = ORGANIZATION` istifadəçilərin adətən daşıdığı rollarla (`OPERATOR` və s.) uyğundur — əlavə yoxlama lazım deyil, sadəcə `organizationId`-yə görə scope kifayətdir.

---

## 7. Yoxlama siyahısı (tapşırıq bitəndə)

- [ ] `resources.status` sütunu (nullable, yalnız bu modul doldurur)
- [ ] `GET /api/resources/mine` (implicit org-scope, `hasPrice` düz hesablanır)
- [ ] `POST /api/resources/mine` (manufacturer məcburi, status=SUBMITTED avtomatik, organizationId server-side)
- [ ] `GET /api/resources/mine/{id}` (başqa təşkilatın resursu → 404)
- [ ] `GET`/`POST /api/resources/mine/{id}/prices` (supplierId frontend-dən gəlmir, server həll edir)
- [ ] Xüsusiyyətlər üçün heç nə toxunulmayıb (mövcud 3 endpoint dəyişməz qalır)
- [ ] `./gradlew bootRun` ilə real HTTP sorğuları test edilib (`PROJECT_STATUS.md` bölmə 0-dakı iş qaydası)
