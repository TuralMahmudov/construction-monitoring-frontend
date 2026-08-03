# "Mənim Resurslarım" — Backend Contract (frontend-first spec)

> Bu fayl **əksinə işləyir** — adətən `FRONTEND_AI_PROMPT*.md` faylları artıq test edilmiş backend-i frontend-ə izah edir, bu dəfə isə frontend əvvəlcədən (backend hazır olmadan) tikildiyi üçün bu fayl **backend-in tətbiq etməli olduğu kontraktı** təsvir edir. Heç bir endpoint hələ mövcud deyil (`PROJECT_STATUS.md`-də yoxdur) — frontend bu fayldakı formaya uyğun tikilib və backend hazır olan kimi bağlanmağa hazırdır.
>
> **2026-07-29 yenilənməsi:** Xüsusiyyətlər (attributes) artıq **ayrıca endpoint tələb etmir** — bu modul mövcud, artıq işləyən kateqoriya-atribut sistemini (`GET /api/resource-categories/{id}/attributes` + `POST /api/resource-attributes`, ümumi Resurslar modulunun istifadə etdiyi) birbaşa təkrar istifadə edir. Yeganə əsl backend boşluğu: (1) status iş axını, (2) `/api/resources/mine*` — "mənim resurslarım" filtri, (3) sadələşdirilmiş (təchizatçısız) qiymət alt-modulu.
>
> Frontend kodu: `src/features/my-resources/`. Sidebar-da "Mənim Resurslarım" yalnız `actorType === ORGANIZATION` (2) istifadəçilərə görünür (`src/shared/lib/permissions.ts` → `isOrganizationActor`), amma marşrut (`/my-resources`) rol məhdudiyyəti daşımır.

## 1. Əhatə/sahiblik modeli

Bütün `/api/resources/mine*` sorğuları **implicit olaraq cari istifadəçinin `organizationId`-sinə görə scope olunur** — `/api/auth/me` necə cari istifadəçini implicit göstərirsə, bura da elədir. Sorğuda `organizationId` parametri YOXDUR.

## 2. Status iş axını

Status **tamamilə backend tərəfindən təyin olunur** — frontend heç vaxt hesablamır və ya göndərmir, sadəcə `status`/`statusLabel`-ı göstərir.

| Kod | Ad | Frontend chip rəngi |
|---|---|---|
| 1 | `DRAFT` (Qaralama) | warning |
| 2 | `SUBMITTED` (Təqdim edilib) | primary |
| 3 | `CLARIFICATION_NEEDED` (Dəqiqləşdirmə tələb olunur) | xüsusi narıncı |
| 4 | `APPROVED` (Təsdiqlənib) | success |
| 5 | `REJECTED` (Rədd edilib) | error |

`POST /api/resources/mine`-dən sonra ilkin statusu backend özü təyin edir. `APPROVED`/`REJECTED` bu gün geri qayıtmasa belə frontend onları artıq dəstəkləyir.

## 3. Xüsusiyyətlər (attributes) — YENİ ENDPOINT LAZIM DEYİL

Yaratma dialoqundakı "Xüsusiyyətlər" bölməsi mövcud sistemi olduğu kimi istifadə edir:
- `GET /api/resource-categories/{categoryId}/attributes` — kateqoriyaya bağlı atribut siyahısı (artıq mövcud, `CategoryAttributeDefinition[]`).
- `POST /api/resource-attributes` (`{ resourceId, categoryAttributeDefinitionId, value, active }`) — resurs yaradıldıqdan sonra hər doldurulmuş atribut üçün ayrıca çağırılır (artıq mövcud).
- Baxış (View) dialoqu üçün: `GET /api/resources/{id}/attributes` (artıq mövcud, `ResourceAttribute[]`).

Bunların üçü də **backend-də artıq var və test edilib** (bax `PROJECT_STATUS.md` bölmə 4o) — heç bir dəyişiklik tələb olunmur.

## 4. Endpoint-lər (yeni tələb olunanlar)

### `GET /api/resources/mine`
Səhifələnmiş axtarış — cari istifadəçinin təşkilatının resursları.

Query: `name`, `category` (categoryId), `status` (1-5), `page`, `size`, `sort`

Cavab: `PageResponse<MyResource>`
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
`hasPrice` server-computed olmalıdır (cədvəldəki yaşıl/boz indikator üçün).

### `GET /api/resources/mine/{id}`
Tək resurs — Baxış (View) dialoqu üçün. Atributlar **bu cavabda yoxdur** — View dialoqu onları ayrıca `GET /api/resources/{id}/attributes`-dən çəkir (bax bölmə 3).

Cavab: `MyResourceDetail` = yuxarıdakı `MyResource` sahələri + :
```json
{
  "prices": [{
    "id": "uuid", "resourceId": "uuid", "regionId": "uuid",
    "price": 105.50, "currency": "AZN",
    "effectiveDate": "2026-07-29", "expireDate": null,
    "comment": "...", "createdDate": "2026-07-29T10:00:00Z"
  }]
}
```

### `POST /api/resources/mine`
Yalnız əsas resurs sahələrini yaradır (`MyResourceFormValues` — atributlar/qiymətlər BURADA YOXDUR, onlar ayrıca sorğularla əlavə olunur, bax bölmə 3 və aşağı):
```json
{
  "categoryId": "uuid", "name": "...", "description": "...", "unitId": "uuid",
  "specification": "...", "manufacturer": "...", "brand": "...", "model": "..."
}
```
Cavab: `MyResourceDetail` (yenicə yaradılan, `status` backend tərəfindən təyin olunmuş, `prices: []`).

`categoryId`/`name`/`unitId`/`manufacturer` məcburidir (`manufacturer` bu modulda ümumi Resurslar modulundan fərqli olaraq **məcburidir**). `code` mövcud `Resource` modulundakı kimi server-generated olmalıdır.

Frontend axını: `POST /api/resources/mine` → id alınır → hər doldurulmuş atribut üçün `POST /api/resource-attributes` → hər əlavə edilmiş qiymət sətri üçün `POST /api/resources/mine/{id}/prices` (aşağı bax). Hər addım öz sorğusudur — biri uğursuz olsa, resurs yenə mövcud qalır (rollback yoxdur), istifadəçi qalanını əl ilə tamamlaya bilər.

### `GET /api/resources/mine/{id}/prices`
Bir resursun bütün qiymətlərinin siyahısı (sətir əməliyyatındakı "Qiymət" ikonu açanda, həm də View dialoqunda istifadə olunur).

Cavab: `MyResourcePrice[]` (yuxarıdakı `prices` massivi ilə eyni forma).

### `POST /api/resources/mine/{id}/prices`
Mövcud resursa yeni qiymət əlavə et.

Body:
```json
{
  "regionId": "uuid", "price": 105.5, "currency": "AZN",
  "effectiveDate": "2026-07-29", "expireDate": null, "comment": ""
}
```
`expireDate: null` = "Naməlum müddətə qədər" (açıq müddət) — mövcud `ResourcePrice` modulundakı eyni konvensiya. Heç bir `supplierId`/`vat` yoxdur — təchizatçı örtülüdür (cari istifadəçinin öz təşkilatı).

Cavab: `MyResourcePrice` (yaradılan).

## 5. Ümumi qeydlər

- Bütün cavablar mövcud `{ success, message, data, timestamp }` envelope-una uyğun olmalıdır.
- Validasiya xətaları: `400` + `validationErrors: Record<field, message>` (mövcud konvensiya).
- Auth: `Authorization: Bearer <accessToken>`.
