# CCMS Backend — Layihə Statusu

> Bu fayl layihənin hazırkı vəziyyətini izləmək üçündür: nə hazırdır, nə test olunub, nə hələ yoxdur.
> Son yenilənmə: **2026-08-18**

## 0. İŞ QAYDASI (hər dəyişiklikdən sonra tətbiq olunur)

Layihədə hər kod dəyişikliyindən sonra aşağıdakı ardıcıllıq **standart** olaraq izlənilir, "hazırdır" deyilmədən əvvəl:

1. `./gradlew build` — kompilyasiya + testlər.
2. Backend-i yenidən qaldırmadan əvvəl **əvvəlki instance-ı öldür**: bəzən köhnə `bootRun` prosesi arxa planda "orphan" qalır (background tapşırıq dayandırılsa belə, alt java.exe prosesi bəzən yaşamağa davam edir) və portu tutur (`Port XXXX was already in use`). Yoxlama: `Get-NetTCPConnection -LocalPort <port>` → tapılan `OwningProcess`-i `Stop-Process -Force` ilə bağla, sonra yenidən başlat.
3. `./gradlew bootRun` (dev profili) — real HTTP sorğuları ilə (login → əlaqəli endpoint) test et, sadəcə compile uğuru kifayət deyil.
4. Bu md faylını yenilə: yeni modul/endpoint/qərar, tapılan bug (əgər varsa), test nəticələri.

Bu, istifadəçinin explisit tələbidir (2026-07-20) — gələcək bütün dəyişikliklərdə eyni şəkildə davam olunacaq.

---

## 1. Ümumi vəziyyət

| | |
|---|---|
| Kompilyasiya | ✅ `./gradlew build` uğurlu (bütün testlər keçir) |
| Docker (Postgres + pgAdmin) | ✅ İşləyir, Postgres `healthy` |
| Backend runtime | ✅ `./gradlew bootRun` ilə test edilib, `/actuator/health` → `UP` (port **8181**) |
| Auth axını (login/refresh/logout/me) | ✅ Uçdan-uca test edilib |
| Resource Categories modulu (hierarxik kataloq) | ✅ Uçdan-uca test edilib (aşağıda bax, bölmə 4b) |
| Resource modulu (konkret resurslar) | ⚠️ **2026-07-30: `resources` artıq "listing"-dir** — özündə `code`/`name`/atribut saxlamır, yalnız `productId`+`organizationId`+`status`. Köhnəlmiş test nəticələri (bölmə 4c) tarixi qeyd kimi saxlanılıb, yeni davranış bölmə 4t-də. **2026-08-11: `GET /api/resources` (həm `ResourceResponse`, həm `?hasPrice=true\|false` filtri) `MyResource`-dəki eyni server-hesablanan `hasPrice` məntiqini aldı** — "Resurslar (Elanlar)" səhifəsi və "Sənədlərin İdarəsi → Bax" audit dialoqu üçün, N+1 sorğunun qarşısını almaq məqsədilə batched lookup ilə. Canlı HTTP-lə test edilib, yol üstü 1 real bug tapılıb düzəldilib (bax bölmə 5, #15). **Həmin gün: `?createdFrom=YYYY-MM-DD&createdTo=YYYY-MM-DD` filtri əlavə olundu** (hər ikisi müstəqil opsional, `createdDate`-ə görə daxilolan aralıq) — canlı HTTP-lə 6 ssenari (hər iki uc, təkcə biri, tarixdən kənar, filtrsiz) test edilib |
| Products modulu (kataloq — kateqoriya+atributlara görə unikal məhsul, öz `code`-u) | ✅ Yeni (2026-07-30) — `resources`-un `resource_match_groups`+identity sahələrinin ayrılması, `POST /api/products` find-or-create axını, uçdan-uca canlı HTTP-lə test edilib (aşağıda bax, bölmə 4t) |
| Resource Attribute modulu (EAV — dinamik xüsusiyyətlər) | ⚠️ **Köhnəlib** — 2026-07-28-də struktur atribut lüğəti (bölmə 4o) ilə, 2026-07-30-da isə **product-level `product_attributes`** ilə əvəz olundu (bölmə 4t), `resource_attributes`/`ResourceAttribute*` artıq mövcud deyil |
| Unit (ölçü vahidi) modulu | ✅ Uçdan-uca test edilib, əvvəlki `unitId` gap-i də bağlandı (aşağıda bax, bölmə 4e). **2026-07-30: `unit_id` `resources`-dan `products`-a köçdü** (bölmə 4t) |
| Resource Price modulu (temporal qiymət + approval workflow) | ✅ Uçdan-uca test edilib, 1 real bug tapılıb düzəldilib (aşağıda bax, bölmə 4f və 5). **2026-07-28: hibrid model** — normal qiymət avtomatik `APPROVED`, yalnız kənar dəyərlər (`FLAGGED`) admin təsdiqi gözləyir (bölmə 4p) |
| Region modulu | ✅ Uçdan-uca test edilib, `ResourcePrice`-in `regionId` gap-i bağlandı (aşağıda bax, bölmə 4g) |
| Supplier modulu | ⚠️ **2026-08-04: tamamilə silindi** — `resource_prices.supplier_id` → `organization_id`-yə keçdi, `Organization` birbaşa istifadə olunur, ayrıca `Supplier`/`suppliers` cədvəli yoxdur (bölmə 4x). Aşağıdakı 4g-dəki Supplier-ə aid nəticələr tarixi qeyddir |
| `organizations` — DB sxemi (multi-vendor kataloq üçün) | ✅ Migrasiyalar (`018`-`019`, `022`-`023`) real Postgres-ə tətbiq edilib, entity-lər yaradılıb (aşağıda bax, bölmə 4h). **`resource_match_groups` 2026-07-30-da `products` ilə əvəz olundu** (bölmə 4t) |
| Resource Matching Engine (indi `products`-un `resolve()`-i, əvvəllər `match_group_id` recompute) | ✅ Uçdan-uca test edilib (real HTTP + DB yoxlaması) — **2026-07-30: `ResourceMatchingServiceImpl`/`ResourceMatchGroupWriter` silindi, məntiq `ProductServiceImpl.resolve()`+`ProductWriter`-ə köçdü** (bölmə 4t), eyni `MatchKeyCalculator` alqoritmi saxlanılıb |
| `resource_price_averages` view + kənar dəyər (outlier) auto-flag mexanizmi | ✅ Uçdan-uca test edilib. **2026-07-30: `match_group_id` → `product_id` üzrə qruplaşdırma** (bölmə 4t), əvvəlki `categoryId`/`resourceName`/`manufacturer`/`brand`/`model` + `name` axtarışı (bölmə 4s) saxlanılıb. **2026-08-13: real bug tapılıb düzəldildi** — view `resource.active`/`resource.deleted`/`product.active` heç birini yoxlamırdı, yəni kataloqdan gizlədilmiş/silinmiş resurs və ya deaktiv məhsul yenə bazar orta/median-a qatılırdı; üç filtr də CTE mərhələsinə əlavə olundu, canlı DB-də təsdiqləndi (bax bölmə 5, #16). **2026-08-13 (2-ci dəyişiklik): təşkilat-səviyyəli birləşdirmə əlavə olundu** — əvvəllər eyni təşkilatın eyni məhsulda çoxlu resursu bazar median/ortasında hər biri ayrı səs sayılırdı; indi əvvəlcə hər təşkilatın öz resursları (məhsul+region üzrə) öz medianına yığılır, bazar statistikası yalnız bu təşkilat-səviyyəli rəqəmlər üzərində hesablanır — `sample_count` artıq "neçə resurs" yox, "neçə təşkilat" deməkdir. Canlı DB-də real seed-data ilə təsdiqləndi (bax bölmə 5, #17). **2026-08-13 (3-cü dəyişiklik): `min_price`/`max_price` xam qiymətlərə qaytarıldı** — istifadəçi canlıda tapdı: `MAT-000011`-in özünün yazdığı 92 qiyməti var idi, amma `max_price` 87 (təşkilatın öz median-ı) göstərirdi, real 92-ni gizlədirdi. `min_price`/`max_price` indi ayrıca `raw_range` CTE-si ilə bütün fərdi (xam) qiymətlər üzərindən hesablanır, `avg_price`/`median_price`/`sample_count` isə təşkilat-səviyyəli qalır. Canlı DB-də təsdiqləndi (bax bölmə 5, #18). **2026-08-13 (4-cü dəyişiklik): eyni gün əvəzlənən qiymətin "kölgəsi" bağlandı** — `MMC524` təşkilatının canlıda tapdığı hal: eyni gün əlavə edilən yeni qiymət (92) ilə bir az əvvəl bağlanmış köhnə qiymət (82, `expire_date`=bu gün) EYNİ ANDA "aktiv" sayılırdı (hər ikisi `effective_date ≤ bu gün ≤ expire_date` şərtini keçirdi), `getCurrentPrice()` hansının qayıdacağını təyin etmirdi (tarixlər eyni olduğu üçün sıralama qeyri-müəyyən idi), view-də isə hər ikisi eyni təşkilatın median hesablamasına qatılırdı. Düzəliş: view-də yeni de-duplikasiya addımı (bir resurs/təşkilat/region üçün yalnız "həqiqi cari" 1 sətir saxlanılır — əvvəlcə açıq (`expire_date IS NULL`), sonra ən son `effective_date`, sonra ən son `created_date`), və `ResourcePriceRepository.findCurrentCandidates()`-ə eyni sıralama qaydası. Canlı DB-də təsdiqləndi (bax bölmə 5, #19). **2026-08-17: dublikat-resurs bug-ı düzəldildi** — `resources.superseded` bayrağı əlavə olundu (sibling qiymətin `expireDate`-i bağlanır, view onsuz da bunu tutur; `superseded`-in özü yalnız informativ, view-in WHERE bəndinə **daxil deyil** — region-scoping bug-ı üçün bax bölmə 4ee) |
| `GET /api/resource-prices/flagged` — admin review endpoint | ✅ Uçdan-uca test edilib (aşağıda bax, bölmə 4k) |
| `organization_id` sahiblik/görünürlük modeli — API səviyyəsində tətbiq (resources/resource_prices) | ✅ Uçdan-uca test edilib (2 real org ilə canlı HTTP, real JWT), 20 authorization unit test yaşıl (aşağıda bax, bölmə 4l) |
| Mərkəzi admin funksionallığı: aşağı-əminlikli **product** review + approve/reject axınının averages-ə canlı təsiri | ✅ Uçdan-uca test edilib. **2026-07-30: `/api/resource-match-groups` → `/api/products/pending-review`+`/{id}/confirm`-ə köçdü** (bölmə 4t) |
| `FRONTEND_AI_PROMPT.md` | ✅ Yalnız auth-u əhatə edirdi, indi **bütün 8 modulu** (auth + 7 business modul) əhatə edir — dəqiq endpoint/sahə adları, query param uyğunsuzluqları (məs. `category` vs `categoryId`), `ResourceType` kodları (1-6) sənədləşdirilib. ⚠️ **products/resources ayrılmasından sonra yenilənməyib** (bölmə 4t) |
| Struktur Atribut Lüğəti (`attribute_definitions`/`attribute_enum_values`/`category_attribute_definitions`) | ✅ Uçdan-uca test edilib (real HTTP+DB) — aşağıda bax, bölmə 4o. Bu lüğətdən istifadə edən sahə 2026-07-30-da `resource_attributes`-dan `product_attributes`-a köçdü (bölmə 4t) |
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` | ✅ Yeni (2026-07-28) — struktur atribut lüğəti (breaking change), avtomatik resurs kodu, autocomplete, hibrid qiymət təsdiqi + istifadəçinin tələb etdiyi UX düzəlişləri (rəqəm input-ları, UUID göstərilməməsi, dialoq bağlama) frontend AI alətinə ötürmək üçün. ⚠️ **products/resources ayrılmasından sonra yenilənməyib** (bölmə 4t) |
| "Mənim Resurslarım" modulu (`/api/resources/mine*`) | ✅ Yeni (2026-07-29) — implicit org-scope, status iş axını (`SUBMITTED`/`CLARIFICATION_NEEDED`), sadələşdirilmiş qiymət forması, supplier auto-provisioning — uçdan-uca canlı HTTP-lə test edilib (aşağıda bax, bölmə 4r). **2026-07-30: `POST /mine` indi əvvəlcə `ProductService.resolve()` çağırır, sonra `productId` ilə listing yaradır** (bölmə 4t). **2026-08-06: `GET /mine` filtrləri `code`/`regionId`/`minPrice`/`maxPrice`/`hasPrice` ilə genişləndirildi** (bölmə 4aa) |
| Production-a hazırlıq | ⚠️ Yalnız **local development** üçün nəzərdə tutulub (tapşırıqda da belə göstərilib) |
| Admin panel: `/api/organizations` (vendor onboarding, giriş hesabı bundle), `/api/users` (mərkəzi heyət), `/api/roles` (lookup) | ✅ Yeni (2026-08-03) — uçdan-uca canlı HTTP-lə test edilib (aşağıda bax, bölmə 4w). Əvvəlki "yoxdur" qeydi (köhnə bölmə 6) artıq etibarsızdır. **2026-08-11: `POST /api/organizations` üçün rol-təyinatı boşluğu bağlandı** — bax bölmə 5, #14. **2026-08-12: `email` login credential-dan ayrıldı, təşkilat yaradanda opsional oldu, `PUT`-la redaktə oluna bilir** — bax bölmə 4cc |
| Sənəd idxalı (`/api/documents*`) + toplu resurs yaratma (`/api/documents/{id}/resources`) + bildirişlər (`/api/notifications*`) | ✅ Yeni (2026-08-10) — MinIO fayl saxlama, kilid+timeout-lu "Emal et" axını, kateqoriya-əsaslı toplu resurs/qiymət yaratma (mövcud `ResourceService`/`ResourcePriceService`/`ProductService.resolve()`-i təkrar istifadə edir), `DOCUMENT_REVIEW` bildiriş fan-out-u — uçdan-uca canlı HTTP-lə test edilib (aşağıda bax, bölmə 4bb) |

---

## 2. Texnologiya stack-i (hazır)

- Java 17, Spring Boot 3.3.5, Gradle (wrapper: Gradle 9.6.1)
- PostgreSQL 16 (Docker), pgAdmin 4
- Spring Security 6 + JWT (jjwt 0.12.6)
- Spring Data JPA + Hibernate 6
- Liquibase (XML changelog-lar)
- Lombok, MapStruct 1.6.2
- Bean Validation (Jakarta Validation)
- springdoc-openapi 2.6.0 (Swagger UI, JWT bearer dəstəyi ilə)
- Spring Boot Actuator

---

## 3. Nə var (fayl-fayl)

### Docker / infra
- `docker-compose.yml` — Postgres (healthcheck + volume) + pgAdmin
- `.env` — dev credentials (`ccms_user` / `ccms_password`, db `ccms_db`)

### Verilənlər bazası (Liquibase — `src/main/resources/db/changelog/`)
- `001` roles, `002` permissions, `003` users, `004` user_roles, `005` role_permissions,
  `006` refresh_tokens, `007` audit_logs, `008` seed data (6 rol + 12 permission + mapping),
  `009` resource_categories (hierarxik kataloq, self-referential FK), `010` resources (2026-07-30-da yenidən yazıldı — indi yalnız `id/active/deleted/audit sahələri`, bax aşağı),
  `012` units,
  `014` resource_prices (resource_id FK RESTRICT, region_id/supplier_id FK-sız, partial unique index "bir açıq aktiv qiymət" qaydası üçün),
  `015` regions, `016` suppliers, `017` resource_prices.region_id/supplier_id-ə FK əlavəsi (RESTRICT),
  `018` **organizations** (BaseEntity pattern, `type`/`status` enum-backed INTEGER, `tax_id` unikal), `019` `users`-ə `organization_id` (FK RESTRICT) + `actor_type` (default `INDIVIDUAL`) əlavəsi,
  `020` **products** (2026-07-30-da yenidən yazıldı, əvvəllər `resource_match_groups` idi — bax aşağı), `021` `resources`-ə `organization_id` (FK RESTRICT) + `product_id` (FK RESTRICT, **NOT NULL**) əlavəsi (2026-07-30-da yenidən yazıldı, əvvəllər `match_group_id` idi),
  `022` `suppliers`-ə `organization_id` (FK **SET NULL**, nullable "körpü") əlavəsi, `023` `VIEW_ALL_ORGANIZATION_RESOURCES` permission seed,
  `024` **`resource_price_averages` VIEW** (`createView`, `runOnChange="true"` — cədvəllərdən fərqli olaraq view-lar üçün qəbul edilən praktika; 2026-07-30-da `match_group_id` → `product_id` üzrə qruplaşdırmaya keçdi),
  `025` `VIEW_ALL_ORGANIZATION_RESOURCES`-in `SUPER_ADMIN`/`ADMIN`-ə verilməsi,
  `027` attribute_definitions, `028` attribute_enum_values, `029` category_attribute_definitions,
  `030` **product_attributes** (2026-07-30-da yenidən yazıldı, əvvəllər `resource_attributes` idi — bax aşağı), `031` **`product_code_seq`** (2026-07-30-da yenidən adlandırıldı, əvvəllər `resource_code_seq` idi),
  `032` `resources.status`, `033` `resource_prices.comment`, `034` `supplier_code_seq`
- **2026-07-30 dəyişikliyi:** `011` (köhnə `resource_attributes`) və `013` (köhnə `resources.unit_id` FK-si) faylları **silindi**, `026` (`resource_match_groups.review_status`) `020`-nin yenidən yazılmasına daxil edildi. Bu, hələ heç bir production data-sı olmayan (yalnız local dev) bir layihə üçün qərar idi — köhnə migrasiyaları ALTER-lərlə üst-üstə yığmaq əvəzinə, düzgün son formanı birbaşa öz changeset-lərinə yazmaq seçildi (bax bölmə 4t). `docker compose down -v` ilə local Postgres volume-u sıfırlanıb, dəyişdirilmiş changelog-lar təmiz bazaya tətbiq edilib.
- **Qeyd:** XSD referansı `dbchangelog-latest.xsd`-dir (versiya uyğunsuzluğu problemi buna görə həll olundu — aşağı hissəyə bax)

### Cədvəllər
`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`, `audit_logs` — hamısı `BaseEntity` pattern-i ilə (UUID id, created/updated_at, created/updated_by, `deleted` soft-delete, `version` optimistic lock). `user_roles`/`role_permissions` sadə join cədvəlləridir (BaseEntity sahələri yoxdur — bu normaldır, JPA `@JoinTable`-dır).

`resource_categories`, `products` və `resources` — **BaseEntity-dən istifadə ETMİR** (tapşırıqda fərqli auditing sahələri istənilib: `UUID createdBy/modifiedBy` + `LocalDateTime createdDate/modifiedDate`, `version` yoxdur). Bu sahələr servis səviyyəsində əl ilə doldurulur (`CurrentUserUtil`), qlobal JPA auditing-ə (o, `String` işlədir) qarışmır. `resources`-da **soft-delete var** (`deleted` sütunu + `@SQLDelete`/`@SQLRestriction`, spesifikasiyada açıq tələb olunub) — `resource_categories`/`products`-da isə YOXDUR (hard delete, tələb olunmayıb; `products` üçün silmə əvəzinə `active` bayrağı ilə deaktivasiya var).

**2026-07-30: `products`/`product_attributes`/`resources` üçlüyü — bax bölmə 4t tam izah üçün.** Qısaca:
- `products` — kataloq: kateqoriya + unikal atribut kombinasiyası = bir `product`, öz `code`-u (`product_code_seq`-dən), `name`/`description`/`specification`/`manufacturer`/`brand`/`model`/`unit_id` bunun üzərindədir. `match_key`/`review_status` köhnə `resource_match_groups`-un yerini tutur (eyni `(category_id, match_key)` unikallığı).
- `product_attributes` — `product_id` FK **CASCADE**, `category_attribute_definition_id` FK **RESTRICT** (köhnə `resource_attributes` ilə eyni struktur, sadəcə `resource_id` yerinə `product_id`).
- `resources` — artıq təşkilatın **elanı/listing-i**: `id, product_id (FK RESTRICT, NOT NULL), organization_id, status, active, deleted, audit sahələri`. Özündə `code`/`name`/atribut/unit saxlamır — hamısı `product_id` vasitəsilə oxunur.

`units` — audit sahələri yoxdur (spesifikasiya tələb etməyib), soft-delete yoxdur (hard delete, spesifikasiya tələb etməyib). `code` qlobal unikaldir (DB `UNIQUE` constraint + app-level yoxlama). `unit_id` indi `resources`-da deyil, `products`-dadır (RESTRICT FK).

`resource_prices` — temporal (zaman üzrə versiyalı) qiymət modeli + approval workflow. Əsas dizayn qərarları:
- **"Heç vaxt tarixi qiyməti üzərinə yazma"** belə tətbiq olunub: yeni qiymət yaradıldıqda `status=PENDING`-dir; `PUT` yalnız `PENDING` statusda icazəlidir (`APPROVED`/`REJECTED` olduqdan sonra 409 — dəyişiklik lazımdırsa YENİ qiymət yaradılmalıdır).
- **"Yalnız bir aktiv qiymət (resurs+təşkilat+region üzrə)"**: `approve()` zamanı eyni üçlük üçün əvvəlki açıq (`expireDate IS NULL` və ya üst-üstə düşən) `APPROVED` qiymət avtomatik "təqaüdə göndərilir" — onun **`expireDate`-i** yeni qiymətin `effectiveDate`-indən 1 gün əvvələ kəsilir, amma **`price`/`vat` dəyəri heç vaxt dəyişdirilmir** (yalnız etibarlılıq pəncərəsi bağlanır). **2026-08-04:** eyni gün üçün təkrar göndərmədə (`existing.effectiveDate == new.effectiveDate`) əvvəllər bu şərt köhnəni bağlamırdı və `uk_resource_prices_active_open`-ə çırpılırdı — düzəldildi (bölmə 5, #12).
- `regionId`/`organizationId` (əvvəllər `supplierId` — **2026-08-04-dən etibarən `Supplier` tamamilə silinib**, bölmə 4x) — FK-ları var (`regions.id`/`organizations.id`-ə, RESTRICT), və `ResourcePriceServiceImpl.create()` çağıranın öz `organizationId`-sini server-side həll edir (heç vaxt request-dən götürmür).
- `approvedBy`/`approvedDate` — həm approve, həm reject qərarında doldurulur (ayrıca "rejectedBy" sahəsi spesifikasiyada yoxdur, bu cüt "kim qərar verdi" mənasında işlədilir).
- `modifiedBy`/`modifiedDate` yoxdur (spesifikasiyada tələb olunmayıb) — dizayna uyğundur, çünki `PENDING` xaricində heç nə dəyişmir.

`regions` və `suppliers` — istifadəçinin seçimi ilə **Unit modulu ilə eyni strukturda** (`id, code, name, active`, audit sahələri yoxdur, hard delete, qlobal unikal `code`). `ResourcePrice`-də istifadə olunan region/supplier silinə bilməz (`RegionInUseException`/`SupplierInUseException`, 409) — `ResourcePrice`-in özündə soft-delete olmadığı üçün (heç bir DELETE endpoint-i belə yoxdur), bu yoxlama sadə `existsByRegionId`/`existsBySupplierId` ilə edilir, `Resource`/`Unit` modullarındakı soft-delete-aware native sorğu workaround-una ehtiyac yoxdur.

### Java paketləri (`src/main/java/com/ccms/`)
| Paket | Fayllar |
|---|---|
| `entity` | BaseEntity, User, Role, Permission, RefreshToken, AuditLog, RoleName (enum), ResourceCategory, ResourceType (enum), **Resource (2026-07-30 minimuma endirildi — `id/productId/organizationId/status/active/deleted/audit`)**, Unit, ResourcePrice, PriceStatus (enum), Region, Supplier, Organization, OrganizationType (enum), OrganizationStatus (enum), ActorType (enum), AttributeDefinition, AttributeDataType (enum), AttributeEnumValue, CategoryAttributeDefinition, **Product, ProductAttribute, ProductReviewStatus (enum) — yeni, 2026-07-30, bölmə 4t** (`ResourceAttribute`/`ResourceMatchGroup`/`MatchGroupReviewStatus` silindi) |
| `repository` | UserRepository, RoleRepository, PermissionRepository, RefreshTokenRepository, AuditLogRepository, ResourceCategoryRepository, ResourceCategorySpecifications, **ResourceRepository (2026-07-30 minimuma endirildi — yalnız `findByProductId`)**, **ResourceSpecifications (2026-07-30 yenidən yazıldı — `productId/organizationId/status/active`)**, UnitRepository, UnitSpecifications, ResourcePriceRepository, ResourcePriceSpecifications, RegionRepository, RegionSpecifications, SupplierRepository, SupplierSpecifications, AttributeDefinitionRepository, AttributeDefinitionSpecifications, AttributeEnumValueRepository, CategoryAttributeDefinitionRepository, **ProductRepository, ProductSpecifications, ProductAttributeRepository — yeni, 2026-07-30, bölmə 4t** (`ResourceAttributeRepository`/`ResourceMatchGroupRepository` silindi) |
| `matching` | MatchingProperties (`ccms.matching.*` config, yalnız `minSignalsForConfidentMatch` qalıb), MatchKeyCalculator (dəyişməyib, indi `ProductServiceImpl.resolve()`-dən çağırılır), AttributeMatchSignal (record) |
| `pricing` | PriceOutlierProperties (`ccms.pricing.outlier.*` config), PriceOutlierDetector (**2026-07-30: parametr adı `matchGroupId`→`productId`, məntiq dəyişməyib**) |
| `security` | JwtProperties, JwtTokenProvider, TokenType, UserPrincipal, CustomUserDetailsService, JwtAuthenticationFilter, JwtAuthenticationEntryPoint |
| `config` | SecurityConfig, OpenApiConfig, JpaAuditingConfig, AdminAccountInitializer |
| `dto/request` | LoginRequest, RefreshTokenRequest, CreateResourceCategoryRequest, UpdateResourceCategoryRequest, MoveCategoryRequest, ResourceCategorySearchCriteria, **CreateResourceRequest/UpdateResourceRequest/ResourceSearchCriteria (2026-07-30 minimuma endirildi — `productId`(+`organizationId`)/`active` yalnız)**, CreateUnitRequest, UpdateUnitRequest, UnitSearchCriteria, CreateResourcePriceRequest, UpdateResourcePriceRequest, ResourcePriceSearchCriteria, CreateRegionRequest, UpdateRegionRequest, RegionSearchCriteria, CreateAttributeDefinitionRequest, UpdateAttributeDefinitionRequest, AttributeDefinitionSearchCriteria, CreateAttributeEnumValueRequest, UpdateAttributeEnumValueRequest, LinkAttributeToCategoryRequest, UpdateCategoryAttributeDefinitionRequest, **CreateProductRequest, UpdateProductRequest, ProductSearchCriteria, ProductAttributeValueRequest — yeni, 2026-07-30, bölmə 4t** (`CreateResourceAttributeRequest`/`UpdateResourceAttributeRequest` silindi; `CreateMyResourceRequest`-ə `attributes` sahəsi əlavə olundu). **2026-08-04: `CreateSupplierRequest`/`UpdateSupplierRequest`/`SupplierSearchCriteria` silindi (bölmə 4x), `CreateResourcePriceRequest`/`UpdateResourcePriceRequest`-dən `supplierId` çıxarıldı, `ResourcePriceSearchCriteria.supplierId` → `organizationId`, `Create/UpdateOrganizationRequest`-ə `type` əlavə olundu** |
| `dto/response` | ApiResponse, ApiErrorResponse, JwtAuthResponse, UserResponse, ResourceCategoryResponse, ResourceCategoryTreeNode, PageResponse\<T\>, **ResourceResponse (2026-07-30 minimuma endirildi, daxilində tam `ProductResponse` `product` sahəsi)**, UnitResponse, ResourcePriceResponse (**2026-08-04: `supplierId` → `organizationId`**), RegionResponse, AttributeDefinitionResponse, AttributeEnumValueResponse, CategoryAttributeDefinitionResponse, **ProductResponse, ProductResolveResponse, ProductAttributeResponse, ProductReviewResponse — yeni, 2026-07-30, bölmə 4t** (`ResourceAttributeResponse`/`MatchGroupReviewResponse` silindi) |
| `mapper` | UserMapper, ResourceCategoryMapper, UnitMapper, ResourcePriceMapper, RegionMapper (hamısı MapStruct), AttributeEnumValueMapper (`ResourceMapper` **2026-07-30 silindi** — `ResourceResponse` indi `product`-la birgə servisdə əl ilə qurulur, `ResourceAttributeMapper` presedentinə uyğun; `SupplierMapper` **2026-08-04 silindi**, bölmə 4x) |
| `exception` | GlobalExceptionHandler (**2026-08-04: `NoResourceFoundException` handler əlavə olundu — bax bölmə 5, #13**), ResourceNotFoundException, BadRequestException, InvalidTokenException, DuplicateCategoryCodeException, CircularHierarchyException, CategoryHasChildrenException, CategoryInUseException, DuplicateAttributeNameException, DuplicateUnitCodeException, UnitInUseException, InvalidPriceStateException, DuplicateRegionCodeException, RegionInUseException, DuplicateAttributeDefinitionNameException, AttributeDefinitionInUseException, CategoryAttributeDefinitionInUseException (`DuplicateResourceCodeException` artıq yoxdur — 2026-07-28-dən bəri, bax bölmə 4q; `DuplicateSupplierCodeException`/`SupplierInUseException` **2026-08-04 silindi**, bölmə 4x) |
| `audit` | AuditAction, AuditorAwareImpl, AuditLogService |
| `util` | HashUtil (SHA-256), IpAddressUtil, CurrentUserUtil |
| `validation` | ValidUsername, UsernameValidator |
| `service` (+`impl`) | AuthService/AuthServiceImpl, UserService/UserServiceImpl, ResourceCategoryService/ResourceCategoryServiceImpl (**indi `ProductRepository`-dən istifadə edir "in-use" yoxlamasında**), **ResourceService/ResourceServiceImpl (2026-07-30 minimuma endirildi, `ProductService`-dən asılıdır)**, UnitService/UnitServiceImpl (**indi `ProductRepository`-dən istifadə edir**), ResourcePriceService/ResourcePriceServiceImpl (indi RegionRepository-dən asılıdır; **2026-08-04: `SupplierRepository` asılılığı silindi, `organizationId` çağıranın öz hesabından həll olunur — bölmə 4x**), RegionService/RegionServiceImpl, AttributeDefinitionService/AttributeDefinitionServiceImpl, CategoryAttributeDefinitionService/CategoryAttributeDefinitionServiceImpl (**indi `ProductAttributeRepository`-dən istifadə edir**), **ProductService/ProductServiceImpl, ProductWriter — yeni, 2026-07-30, bölmə 4t** (`ResourceAttributeService`/`Impl`, `ResourceMatchingService`/`Impl`, `ResourceMatchGroupService`/`Impl`, `ResourceMatchGroupWriter` silindi) |
| `controller` | AuthController, ResourceCategoryController, **ResourceController (2026-07-30 minimuma endirildi)**, UnitController, ResourcePriceController, RegionController, AttributeDefinitionController, CategoryAttributeDefinitionController, MyResourceController (indi `ProductService.resolve()` çağırır), **ProductController — yeni, 2026-07-30, bölmə 4t** (`ResourceAttributeController`/`ResourceMatchGroupController` silindi; `SupplierController` **2026-08-04 silindi**, bölmə 4x) |

### Endpoint-lər — Auth
| Endpoint | Auth tələb olunur? | Status |
|---|---|---|
| `POST /api/auth/login` | Xeyr | ✅ test edilib |
| `POST /api/auth/refresh` | Xeyr (refresh token body-də) | ✅ test edilib (rotasiya + reuse rədd edilməsi) |
| `POST /api/auth/logout` | **Bəli** (Bearer access token) | ✅ test edilib |
| `GET /api/auth/me` | Bəli | ✅ test edilib |

### Endpoint-lər — Resource Categories (`/api/resource-categories`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib |
| `PUT /{id}` | `COST_WRITE` | (kompilyasiya səviyyəsində doğrulanıb) |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (uşaqlı kateqoriya 409 ilə bloklanır) |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /tree` | `COST_READ` | ✅ test edilib (rekursiv, `?type=` filtri dəstəklənir) |
| `GET /{id}/children` | `COST_READ` | ✅ test edilib (sortOrder-ə görə sıralı) |
| `GET /search` | `COST_READ` | ✅ test edilib (`name/code/active/type` + pagination) |
| `PATCH /{id}/move` | `COST_WRITE` | ✅ test edilib (dairəvi keçid və fərqli-type keçid bloklanır) |
| `PATCH /{id}/enable` \| `/disable` | `COST_WRITE` | ✅ test edilib |

### Endpoint-lər — Resources (`/api/resources`) — ⚠️ 2026-07-30-da `product`/`listing` ayrılmasına uyğun tam yenidən yazıldı, bax bölmə 4t
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib — body indi yalnız `productId`(+`organizationId`); mövcud product üzərinə listing yaradır |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib — yalnız `active` dəyişir, `productId` dəyişməzdir |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (soft-delete) |
| `GET /{id}` | `COST_READ` | ✅ test edilib (soft-deleted → 404), cavabda tam `product` obyekti gömülüdür |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib — filtr indi `product/organization/status/active` (əvvəlki `name/code/category/manufacturer/brand/unit/attributeName/attributeValue` `products`-a köçdü) |

**Qeyd (2026-07-27):** `organization_id` görünürlük/sahiblik modeli dəyişməyib — bölmə 4l-ə bax (başqa təşkilatın listing-i = 404, ümumi (`NULL`) listing hamıya görünür amma yalnız mərkəz redaktə edir, `VIEW_ALL_ORGANIZATION_RESOURCES` hər şeyi görür/redaktə edir).

**Silindi (2026-07-30):** `GET /{resourceId}/attributes` (→ `GET /api/products/{id}/attributes`), `GET /manufacturers|/brands|/models` (→ eyni adla `/api/products/...`), bütün `/api/resource-attributes` endpoint-ləri (aşağı bax).

### Endpoint-lər — Products (`/api/products`) — yeni, 2026-07-30, bölmə 4t
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib — find-or-create: `categoryId`+`attributes[]` ilə mövcud product tapılırsa `matched:true`+200 qaytarır, tapılmırsa yeni `code` ilə yaradır (`matched:false`+201) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib — yalnız kosmetik sahələr (`name/description/specification/manufacturer/brand/model/active`), kateqoriya/atribut/kod dəyişməzdir |
| `PATCH /{id}/enable` \| `/disable` | `COST_WRITE` | ✅ test edilib |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /{id}/attributes` | `COST_READ` | ✅ test edilib — sortOrder-ə görə sıralı, dəyərlər avtomatik dolu (auto-fill) |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib (`name/code/category/manufacturer/brand/unit/active` + `attributeName`/`attributeValue`) — kateqoriya altındakı product-ları siyahılamaq üçün istifadə olunur (kateqoriya ağacı + product tree UI-si) |
| `GET /manufacturers`, `/brands`, `/models` (`?search=`) | `COST_READ` | ✅ test edilib — autocomplete (köhnə `/api/resources/...`-dan köçürüldü) |
| `GET /pending-review` | `COST_APPROVE` | ✅ test edilib — aşağı-siqnallı yeni product-lar (köhnə `/api/resource-match-groups/pending-review`-un yerini tutur) |
| `PATCH /{id}/confirm` | `COST_APPROVE` | ✅ test edilib — `reviewStatus` `CONFIRMED`-ə keçir |

**Silindi (2026-07-30):** `/api/resource-attributes` (bütün endpoint-lər — atributlar indi product yaradılanda/tapılanda bir dəfə, toplu şəkildə göndərilir, sonradan tək-tək redaktə olunmur), `/api/resource-match-groups` (→ `/api/products/pending-review`+`/{id}/confirm`).

### Endpoint-lər — Attribute Definitions (`/api/attribute-definitions`) — yeni, 2026-07-28 (bölmə 4o)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /`, `PUT /{id}`, `DELETE /{id}`, `GET /{id}`, `GET /` (pagination+filtr `name/dataType/active`) | `COST_WRITE`/`COST_READ` | ✅ test edilib (unikal `name`, keçərsiz `dataType` 400, istifadədə olan definition silinə bilmir 409) |
| `POST/PUT/DELETE/GET /{id}/enum-values` | `COST_WRITE`/`COST_READ` | ✅ test edilib (yalnız `ENUM` tipli definition-larda, unikal dəyər) |

### Endpoint-lər — Category Attribute Links — yeni, 2026-07-28 (bölmə 4o)
| Endpoint | Permission | Status |
|---|---|---|
| `POST/GET /api/resource-categories/{id}/attributes` | `COST_WRITE`/`COST_READ` | ✅ test edilib (kateqoriyaya atribut bağlamaq/siyahı — vendor-un "atribut əlavə et" formasının mənbəyi) |
| `PUT/DELETE /api/category-attribute-definitions/{id}` | `COST_WRITE` | ✅ test edilib (istifadədə olan əlaqə silinə bilmir 409) |

### Endpoint-lər — Units (`/api/units`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (unikal `code`, `decimalPrecision` defolt=2) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (istifadədə olan unit 409 ilə bloklanır — soft-deleted resurslar daxil) |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib (`code/name/status`) |

### Endpoint-lər — Resource Prices (`/api/resource-prices`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (status=PENDING başlayır) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib (yalnız PENDING-də icazəli, əks halda 409) |
| `PATCH /{id}/approve` | **`COST_APPROVE`** | ✅ test edilib (əvvəlki aktiv qiyməti avtomatik "təqaüdə göndərir"; `FLAGGED` sətirlər üçün də icazəlidir) |
| `PATCH /{id}/reject` | **`COST_APPROVE`** | ✅ test edilib (`FLAGGED` sətirlər üçün də icazəlidir) |
| `GET /flagged` (pagination) | **`COST_APPROVE`** | ✅ test edilib — `FLAGGED` qiymətlərin admin review növbəsi, hər sətirdə `currentMedianPrice`/`deviationPercent`/`sampleCount` (2026-07-27, bax bölmə 4k) |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /current` (resourceId+supplierId+regionId) | `COST_READ` | ✅ test edilib (tarix məntiqinə görə düzgün qiyməti tapır) |
| `GET /history` (resourceId məcburi) | `COST_READ` | ✅ test edilib (bütün statuslar, effectiveDate desc) |
| `GET /search` (pagination+filtering) | `COST_READ` | ✅ test edilib (`resourceId/supplierId/regionId/status/currency`) |
| `GET /averages` (`productId`/`regionId` opsional, 2026-07-30-da `matchGroupId`-dən adı dəyişdi) | `COST_READ` | ✅ test edilib — `resource_price_averages` sorğusu, **organization-görünürlük filtrsiz** (yalnız aqreqat, bax bölmə 4l) |

**Qeyd:** Bu, `COST_APPROVE` permission-ının layihədə **ilk real istifadəsidir** — ilk auth modulunda seed edilib, indiyə qədər heç bir endpoint istifadə etməmişdi.

**Qeyd (2026-07-27):** `POST /`, `PUT /{id}`, `GET /{id}`, `GET /current`, `GET /history`, `GET /search` indi `organization_id` görünürlük/sahiblik modelinə tabedir (bölmə 4l) — `resources.organization_id` vasitəsilə.

### Endpoint-lər — Regions (`/api/regions`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (unikal `code`, case-insensitive) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (istifadədə olan region 409 ilə bloklanır, istifadədə olmayan uğurla silinir) |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib (`code/name/status`) |

### Endpoint-lər — Suppliers (`/api/suppliers`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (unikal `code`, case-insensitive) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (istifadədə olan supplier 409 ilə bloklanır) |
| `GET /{id}` | `COST_READ` | ✅ test edilib |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib (`code/name/status`) |

### RBAC (seed data)
Rollar: `SUPER_ADMIN`, `ADMIN`, `EXPERT`, `ANALYST`, `OPERATOR`, `VIEWER`
Permission-lar: `USER_READ/WRITE/DELETE`, `ROLE_READ/WRITE`, `COST_READ/WRITE/APPROVE`, `REPORT_READ/EXPORT`, `AUDIT_READ`, `SYSTEM_ADMIN` — construction-cost domenini əks etdirən permission dəsti. `resource-categories`, `resources`, `products`, `units`, `regions` və `suppliers` modulları üçün **yeni permission yaradılmayıb**, mövcud `COST_READ`/`COST_WRITE`-dan istifadə olunur. `resource-prices` və `products` (`pending-review`/`confirm`) isə əlavə olaraq `COST_APPROVE`-dan da istifadə edir.

### İlk admin
İlk startup-da avtomatik yaradılır: `admin` / `Admin123!` / rol `SUPER_ADMIN`. Mövcuddursa yenidən yaradılmır (`AdminAccountInitializer`).

---

## 4. Uçdan-uca test nəticələri (2026-07-17)

| Test | Nəticə |
|---|---|
| Login (admin/Admin123!) | ✅ access+refresh token |
| `/me` (token ilə) | ✅ `SUPER_ADMIN` rolu düzgün göstərilir |
| `/me` (tokensiz) | ✅ 401 |
| Refresh | ✅ yeni cüt, köhnə refresh token rotasiya olunub etibarsızlaşır |
| Refresh token təkrar istifadəsi | ✅ 401 (rədd edilir) |
| Logout (Bearer header ilə) | ✅ refresh token bazada revoke olunur |
| Revoke olunmuş refresh token ilə refresh | ✅ 401 |
| Yanlış şifrə | ✅ 401 |
| Validation (boş `password`) | ✅ 400 + sahə xətaları |
| Swagger UI (`/swagger-ui/index.html`) | ✅ 200 |
| `audit_logs` yazılması | ✅ LOGIN_SUCCESS/FAILURE, TOKEN_REFRESH, LOGOUT hamısı düzgün qeydə alınıb |
| Docker: Postgres | ✅ healthy |
| Docker: pgAdmin | ✅ up |

---

## 4b. Resource Categories — uçdan-uca test nəticələri (2026-07-20)

| Test | Nəticə |
|---|---|
| Root kateqoriya yaratmaq (`type` ilə) | ✅ level=0, leaf=true |
| Uşaq kateqoriya yaratmaq (parentId ilə, type miras) | ✅ level=1, `type` avtomatik parent-dən götürülür |
| Parent-in `leaf` bayrağı uşaq yaradılanda `false` olur | ✅ |
| `GET /tree` | ✅ tam rekursiv, nested `children` |
| `GET /{id}/children` | ✅ sortOrder-ə görə sıralı |
| Eyni parent altında duplicate `code` | ✅ 409 (`DuplicateCategoryCodeException`) |
| Root kateqoriya `type`-sız yaradılması | ✅ 400 (`BadRequestException`) |
| Dairəvi keçid (root-u öz uşağının altına köçürmək) | ✅ 409 (`CircularHierarchyException`) |
| Uşaqlı kateqoriyanı silmək | ✅ 409 (`CategoryHasChildrenException`) |
| `GET /search?name=...` (pagination ilə) | ✅ düzgün `PageResponse` |
| `enable`/`disable` | ✅ hər ikisi işləyir |
| Fərqli `type`-lı parent altına `move` | ✅ 400 (bloklanır) |
| `move` ilə root-a köçürmək (`newParentId=null`) | ✅ `level` yenidən 0 olur |
| Uşaq köçürüləndən sonra köhnə parent-in `leaf` yenidən `true` olur | ✅ |
| Təmizləmə (test data silinməsi) | ✅ |

---

## 4c. Resources — uçdan-uca test nəticələri (2026-07-20)

| Test | Nəticə |
|---|---|
| Resurs yaratmaq (mövcud kateqoriya ilə) | ✅ |
| Qlobal duplicate `code` (kateqoriyadan asılı olmayaraq) | ✅ 409 (`DuplicateResourceCodeException`) |
| Resurslu kateqoriyanı silmək | ✅ 409 (`CategoryInUseException`) |
| Mövcud olmayan `categoryId` ilə yaratmaq | ✅ 404 |
| `GET /{id}` | ✅ |
| `GET /` filtr (`manufacturer`, `brand`) + pagination | ✅ |
| `GET /` filtr (`category`) | ✅ |
| `GET /` sorting (`sort=code,desc`) | ✅ |
| `PUT /{id}` (code/name/active dəyişikliyi) | ✅ |
| `GET /?status=false` yenilənmiş resursu tapır | ✅ |
| `DELETE /{id}` (soft-delete) → sonra `GET /{id}` | ✅ 404 (gizlədilib, DB-də hələ var) |
| Soft-deleted resursdan sonra kateqoriyanı silmək | ⚠️ ilk cəhddə **500 bug tapıldı**, düzəldildi → indi təmiz 409 (bax bölmə 5, #5) |
| Validation (boş body) | ✅ 400 |
| Unauthenticated `GET /` | ✅ 401 |

---

## 4d. Resource Attributes — uçdan-uca test nəticələri (2026-07-21)

> ⚠️ **Tarixi qeyd (2026-07-28):** Bu bölmədə təsvir olunan sərbəst-mətn EAV dizaynı (`attributeName`/`attributeValue`/`unit`/`searchable`/`required` sütunları) artıq **mövcud deyil** — struktur atribut lüğəti ilə əvəz olundu, bax bölmə 4o. Aşağıdakı test nəticələri yalnız tarixi kontekst üçün saxlanılıb.

EAV (entity-attribute-value) dinamik xüsusiyyət sistemi — resurs tipindən asılı fərqli xarakteristikalar (voltaj, rəng, çəki və s.) üçün sabit sütun əvəzinə sərbəst ad/dəyər cütləri.

| Test | Nəticə |
|---|---|
| Atribut yaratmaq (`searchable=true`) | ✅ |
| İkinci atribut yaratmaq (`searchable=false`, defolt) | ✅ |
| Eyni resursda duplicate `attributeName` | ✅ 409 (`DuplicateAttributeNameException`, case-insensitive) |
| Mövcud olmayan `resourceId` ilə yaratmaq | ✅ 404 |
| `GET /api/resources/{resourceId}/attributes` | ✅ sortOrder-ə görə sıralı |
| **Resursu `searchable=true` atributla axtarmaq** (`GET /api/resources?attributeName=..&attributeValue=..`) | ✅ tapır (subquery-based Specification) |
| **`searchable=false` atributla axtarmaq** | ✅ tapmır (qəsdən — `searchable` bayrağının bütün mənası budur) |
| Axtarış case-insensitive-dir (`VOLTAGE` = `voltage`) | ✅ |
| Atributu yeniləyib `searchable=true` etmək | ✅ sonra axtarışda dərhal görünür |
| Atributu silmək | ✅ hard delete (spesifikasiyada soft-delete tələb olunmayıb), resurs siyahısından yoxa çıxır |
| Mövcud olmayan resurs üçün `GET .../attributes` | ✅ 404 |
| Təmizləmə (test data silinməsi) | ✅ |

---

## 4e. Units — uçdan-uca test nəticələri (2026-07-21)

| Test | Nəticə |
|---|---|
| Unit yaratmaq | ✅ |
| Duplicate `code` (case-insensitive, `KG` = `kg`) | ✅ 409 (`DuplicateUnitCodeException`) |
| `decimalPrecision` göndərilməyəndə defolt `2` | ✅ |
| `GET /{id}` | ✅ |
| `GET /` axtarış (`name=Kilo`) + pagination | ✅ |
| `PUT /{id}` | ✅ |
| **Mövcud olmayan `unitId` ilə resurs yaratmaq** | ✅ 404 (əvvəllər heç yoxlanmırdı — indi bağlandı) |
| Mövcud `unitId` ilə resurs yaratmaq | ✅ |
| İstifadədə olan unit-i silmək | ✅ 409 (`UnitInUseException`) |
| **Resurs soft-delete edildikdən SONRA unit-i silmək** (bug #5-in eyni pattern-i) | ✅ yenə təmiz 409 — bu dəfə ilk növbədə düzgün yazıldığı üçün 500 baş vermədi |
| İstifadədə olmayan unit-i silmək | ✅ uğurlu |
| Validation (boş body) | ✅ 400 |
| Təmizləmə (test data silinməsi) | ✅ |

---

## 4f. Resource Prices — uçdan-uca test nəticələri (2026-07-21)

Temporal qiymət modeli: hər resurs vaxt üzrə limitsiz qiymətə malik ola bilər, tarixi qiymətlər heç vaxt üzərinə yazılmır, approval workflow ilə idarə olunur.

| Test | Nəticə |
|---|---|
| Qiymət yaratmaq | ✅ `status=PENDING(1)` ilə başlayır |
| `PENDING` qiyməti yeniləmək | ✅ icazəli |
| Approve | ✅ `status=APPROVED(2)`, `approvedBy`/`approvedDate` doldurulur |
| **Approve-dan SONRA current price** | ✅ düzgün qiyməti qaytarır |
| **`APPROVED` qiyməti yeniləmək** | ✅ 409 (`InvalidPriceStateException`) — "heç vaxt tarixi qiyməti üzərinə yazma" qaydası |
| **Eyni üçlük üçün ikinci qiymət approve etmək** (gələcək effectiveDate ilə) | ⚠️ ilk cəhddə **bug tapıldı** (409, flush-ordering) → düzəldildi (bax bölmə 5, #6) |
| Düzəlişdən sonra: 2-ci qiymət approve olunur, 1-ci qiymətin `expireDate`-i avtomatik kəsilir | ✅ **`price` dəyəri toxunulmadan qalır** (105.0000 → 105.0000), yalnız `expireDate` təyin olunur |
| Bugünkü current price hələ 1-ci qiymət (2-ci hələ effektiv olmayıb) | ✅ tarix məntiqi düzgün işləyir |
| Tam tarixçə (`GET /history`) | ✅ 3 qiymət, bütün statuslar, effectiveDate desc sıralı |
| Reject workflow | ✅ `status=REJECTED(3)` |
| Rədd edilmiş qiyməti approve etmək | ✅ 409 (yalnız PENDING approve/reject oluna bilər) |
| `GET /search?status=2` | ✅ yalnız approved qiymətləri qaytarır |
| Validation: `expireDate < effectiveDate` | ✅ 400 |
| Validation: mənfi `price` | ✅ 400 |
| Unauthenticated `GET /history` | ✅ 401 |
| Təmizləmə (test data silinməsi) | ✅ |

---

## 4g. Regions və Suppliers — uçdan-uca test nəticələri (2026-07-21)

Hər ikisi istifadəçinin seçimi ilə Unit modulu ilə eyni sadə strukturda (`id, code, name, active`).

| Test | Nəticə |
|---|---|
| Region yaratmaq | ✅ |
| Duplicate region `code` (case-insensitive) | ✅ 409 (`DuplicateRegionCodeException`) |
| Supplier yaratmaq | ✅ |
| Duplicate supplier `code` (case-insensitive) | ✅ 409 (`DuplicateSupplierCodeException`) |
| `GET /` axtarış (`name=`) hər ikisində | ✅ |
| **Mövcud olmayan `regionId` ilə qiymət yaratmaq** | ✅ 404 (əvvəllər heç yoxlanmırdı — indi bağlandı) |
| Mövcud region+supplier ilə qiymət yaratmaq | ✅ |
| İstifadədə olan region-u silmək | ✅ 409 (`RegionInUseException`) |
| İstifadədə olan supplier-i silmək | ✅ 409 (`SupplierInUseException`) |
| İstifadədə olmayan region-u silmək | ✅ uğurlu |
| `PUT /{id}` hər ikisində | ✅ |
| Validation (boş body) hər ikisində | ✅ 400 |
| Unauthenticated `GET /` hər ikisində | ✅ 401 |
| Təmizləmə (test data silinməsi) | ✅ |

Bu modulda yeni bug tapılmadı — əvvəlki modullarda öyrənilmiş dərslər (soft-delete/FK uyğunluğu, mövcudluq yoxlaması) əvvəlcədən tətbiq edildiyi üçün.

---

## 4h. Organizations / actor_type / resource_match_groups — DB + entity fazası (2026-07-27)

Multi-vendor kataloq üçün ilk faza: yalnız **DB sxemi + JPA entity-lər**. Service/repository/controller/DTO/mapper hələ yazılmayıb (növbəti fazada).

**Tapşırığa uyğun yaradılan:**
- `organizations` (`018`) — `BaseEntity` pattern (`User`/`Permission`/`Role` ilə eyni: audit sahələri, soft-delete `@SQLDelete`/`@SQLRestriction`, `@Version`). `type` (`OrganizationType`: `CENTRAL=1`/`VENDOR=2`) və `status` (`OrganizationStatus`: `ACTIVE=1`/`INACTIVE=2`/`SUSPENDED=3`) — layihədəki `ResourceType`/`PriceStatus` konvensiyasına uyğun enum-backed `INTEGER`, tapşırıqda konkret dəyərlər verilmədiyi üçün məntiqi defolt set seçilib (istəsə dəyişdirilə bilər). `tax_id` unikal, nullable (`CENTRAL` təşkilat üçün tax_id olmaya bilər).
- `users.organization_id` (FK → `organizations`, `RESTRICT`) + `users.actor_type` (`ActorType`: `INDIVIDUAL=1`/`ORGANIZATION=2`, defolt `INDIVIDUAL` — mövcud istifadəçilər üçün geriyə uyğun) (`019`).
- `resource_match_groups` (`020`) — tapşırıqda göstərildiyi kimi minimal (`id, category_id, match_key, created_at`), audit sahəsi yoxdur (spesifikasiyada tələb olunmayıb, `resource_attributes` kimi). `(category_id, match_key)` üzərində unikal constraint əlavə edilib (eyni kateqoriyada təkrar qrup yaranmasın deyə).
- `resources.organization_id` (FK → `organizations`, `RESTRICT` — sahiblik münasibəti, `category_id`/`unit_id` ilə eyni məntiq) + `resources.match_group_id` (FK → `resource_match_groups`, **`SET NULL`** — sadəcə qruplaşdırma etiketidir, qrup silinsə resurs bloklanmamalıdır) (`021`).
- `permissions`-ə `VIEW_ALL_ORGANIZATION_RESOURCES` sətri (`023`) — heç bir rola təyin edilməyib (tapşırıqda deyilmədi, hansı rol(lar)a veriləcəyi sonra qərarlaşdırılmalıdır).

**`suppliers` ↔ `organizations` qərarı (istifadəçi ilə müzakirə edildi):** Tam birləşdirmə (rename/miqrasiya) YOX — çünki `Supplier` modulu artıq tam qurulub və test edilib (bölmə 4g), risk çox olardı. Əvəzinə **"körpü" FK**: `suppliers.organization_id` (nullable, FK → `organizations`, `SET NULL`) (`022`) — mövcud 13 fayl (`SupplierController`/`Service`/`Repository`/DTO/`Mapper`/exception-lar) toxunulmayıb, heç bir data miqrasiyası edilməyib. Gələcəkdə bir vendor-un `Supplier` qeydi onun `Organization` qeydinə əlaqələndirilə bilər, məcburi deyil ("hər supplier bir organization olmaya bilər" — istifadəçinin qərarı).

**Yeni fayllar:** `entity/Organization.java`, `entity/OrganizationType.java`, `entity/OrganizationStatus.java`, `entity/ActorType.java`, `entity/ResourceMatchGroup.java`. **Dəyişdirilən:** `entity/User.java` (`organizationId`, `actorType`), `entity/Resource.java` (`organizationId`, `matchGroupId`), `entity/Supplier.java` (`organizationId`). Bütün cross-entity referanslar layihənin mövcud konvensiyasına uyğun **sadə UUID sütun** kimi yazılıb (`@ManyToOne` YOX) — `categoryId`/`unitId`/`resourceId`/`supplierId` nümunəsi ilə eynidir.

**Doğrulama (2026-07-27):**

| Test | Nəticə |
|---|---|
| `./gradlew build` | ✅ uğurlu |
| `bootRun` — Liquibase `018`-`023` real Postgres-ə tətbiq | ✅ 6/6 changeset uğurlu, "Rows affected: 7" |
| `/actuator/health` | ✅ `UP` |
| Login (`admin`/`Admin123!`) + `/api/auth/me` | ✅ işləyir (yeni sütunlar mövcud auth axınını pozmayıb) |
| Mövcud `GET /api/suppliers`, `GET /api/resources` | ✅ dəyişməz cavab formatı, yeni nullable sütunlar mövcud data-ya `NULL` kimi əlavə olunub, heç nə sınmayıb |
| DB-də `organizations`/`resource_match_groups` strukturu + FK istiqamətləri (`\d` ilə) | ✅ təsdiqləndi |
| Yeni permission sətri DB-də | ✅ `VIEW_ALL_ORGANIZATION_RESOURCES` mövcuddur |

**Hələ edilməyib (növbəti faza):** `OrganizationRepository/Service/Controller`, DTO-lar, `OrganizationMapper`, `Resource`/`User` DTO-larına yeni sahələrin əlavəsi (hazırda `ResourceResponse`/`UserResponse`-də `organizationId`/`actorType`/`matchGroupId` göstərilmir — yalnız entity səviyyəsindədir), `VIEW_ALL_ORGANIZATION_RESOURCES`-in hansı rol(lar)a veriləcəyi, `actor_type=ORGANIZATION` olduqda `organization_id`-nin məcburi olması qaydasının service-səviyyəli tətbiqi. (`ResourceMatchGroupRepository`/`ResourceMatchingService` bu fazada — bölmə 4i — artıq yazılıb.)

---

## 4i. Resource Matching Engine — `match_group_id`-in avtomatik hesablanması (2026-07-27)

**Məqsəd:** fərqli təşkilatların bir-birindən asılı olmadan daxil etdiyi eyni real məhsul (fərqli mətn formatında olsa belə) avtomatik eyni `resource_match_groups` sətrinə bağlansın — admin/vendor heç bir kod görmədən.

**Yeni fayllar:**
- `matching/MatchingProperties.java` — `@ConfigurationProperties(prefix="ccms.matching")`, `application.yml`-də `ccms.matching.default-numeric-band` və `ccms.matching.attribute-bands` (atribut adı → band ölçüsü map-i) ilə **konfiqurasiya edilə bilər** (`JwtProperties` ilə eyni qeydiyyat üsulu — `CcmsApplication`-da `@EnableConfigurationProperties`).
- `matching/MatchKeyCalculator.java` — normalizasiya məntiqi (aşağıda), Spring-dən asılı olmayan, təmiz `compute(Resource, List<ResourceAttribute>)` metodu — asan unit-test üçün qəsdən belə dizayn edilib.
- `repository/ResourceMatchGroupRepository.java` — `findByCategoryIdAndMatchKey`.
- `service/ResourceMatchingService.java` + `service/impl/ResourceMatchingServiceImpl.java` — `recompute(resourceId)`: resursu + onun `resource_attributes`-ini yükləyir, `match_key` hesablayır, `(category_id, match_key)` üzrə mövcud qrupu tapır, yoxdursa yaradır, `resources.match_group_id`-i yeniləyir.
- `service/impl/ResourceMatchGroupWriter.java` — qrup yaratma addımı **ayrıca bean**-dir (`@Transactional(REQUIRES_NEW)`), çünki Spring-in proxy-based `@Transactional`-ı eyni class daxilində self-invocation zamanı işləmir — iki paralel sorğu eyni `(category_id, match_key)` üçün eyni anda qrup yaratmağa çalışsa, unique constraint pozulan tərəf öz nested tranzaksiyasını itirir, xarici tranzaksiyaya toxunmadan yenidən sorğu ilə "qalib" qrupu tapıb ona bağlanır (`DataIntegrityViolationException` catch + re-read, `GlobalExceptionHandler`-dəki mövcud pattern-lə eyni fəlsəfə).

**Normalizasiya məntiqi (`MatchKeyCalculator`):**
1. Bütün `resource_attributes` sətirləri (hamısı, yalnız `searchable=true` olanlar yox) daxil edilir. **(2026-07-28-dən etibarən dəyişib — bax aşağıda "4n".)**
2. Atribut adları: trim + lowercase (mövcud `DuplicateAttributeNameException` case-insensitive konvensiyası ilə eyni məntiq).
3. Dəyərlər: əvvəlcə **rəqəm olub-olmadığı** yoxlanılır (`attribute_value` sütunu birbaşa, ya da dəyər daxilində "Ø8mm" kimi simvol-prefiks+rəqəm+hərf-suffiks nümunəsi ilə) — **YALNız** rəqəmsə banding tətbiq olunur: `bandedValue = floor(dəyər / bandSize) * bandSize` (band ölçüsü atribut adına görə `application.yml`-dən, yoxdursa defolt `1`). "20mm" və "20.9mm" (band=1) eyni bin-ə düşür, "21.0mm" ayrı bin-dir.
   - **Kəşf edilən incəlik:** sadə "prefiks hərflərlə başlayan rəqəm, suffiks yoxdur" formatlı kodlar (`S235`, `A36` kimi real polad markası təyinatları) səhvən "ölçü" kimi banding-ə düşməsin deyə, rəqəmdən ƏVVƏLKİ prefiks yalnız **simvol** ola bilər (`Ø`, `°` və s.), **hərf** ola bilməz — "S235" hərflə başladığı üçün rəqəm kimi deyil, mətn kodu kimi normallaşdırılır (unit test `categoricalCodeWithTrailingDigitsAndNoUnit_isNotMistakenForAMeasurement` bunu doğrulayır).
   - Rəqəm deyilsə: trim + lowercase + çoxlu boşluqların bir boşluğa endirilməsi (mətn kimi normallaşdırma).
4. Cütlər (`ad=dəyər`) əlifba sırası ilə sıralanır (giriş sırasından asılı olmasın deyə) və `|` ilə birləşdirilir → `match_key`.
5. Kateqoriya ayrıca ölçüdür (`resource_match_groups.category_id`, `020` migrasiyadakı unikal constraint-in bir hissəsi) — `match_key`-in özündə təkrarlanmır.

**Tətikləyici nöqtələr (tam avtomatik, admin/vendor heç nə etmir):**
- `ResourceServiceImpl.create()` və `.update()` — resurs saxlanandan sonra `recompute()` çağırılır.
- `ResourceAttributeServiceImpl.create()`/`update()`/`delete()` — atribut dəyişəndən sonra `recompute()` çağırılır (əsas tətikləyici, çünki resurs yaradılanda çox vaxt atributlar hələ yoxdur).

**Unit testlər (8 test, hamısı yaşıl):**
- `matching/MatchKeyCalculatorTest` (5 test) — eyni məhsulun fərqli mətn formatında (`8`/`8.3` + `mm`/`MM`, `VSt3ps5-1`/`  vst3ps5-1  `) eyni `match_key` verdiyini, fərqli diametr/grade-in fərqli açar verdiyini, band sərhədinin düzgün kəsildiyini (`20.9` eyni bin, `21.0` ayrı bin) və `S235`/`S238` kimi kodların səhvən birləşmədiyini yoxlayır.
- `service/impl/ResourceMatchingServiceImplTest` (3 test, Mockito) — qrup yoxdursa yaradıldığını, **iki fərqli resurs eyni `match_key`-lə eyni qrupa düşdüyünü** (tapşırığın əsas tələbi), və race-recovery-nin işlədiyini doğrulayır.

**Uçdan-uca canlı test (2026-07-27, real Postgres + HTTP):** Kateqoriya + 3 resurs yaradıldı: A (`diameter=8mm`, `grade=VSt3ps5-1`), B (eyni real məhsul, fərqli format: `diameter=8.3` + `unit=MM`, boşluqlu/böyük hərfli `GRADE`/`  vst3ps5-1  `), C (fərqli məhsul, `diameter=12mm`). Nəticə DB-də təsdiqləndi: **A və B eyni `match_group_id`-ə** (`match_key = "diameter=8mm|grade=vst3ps5-1"`), **C fərqli `match_group_id`-ə** düşdü. Test data təmizləndi (resurslar soft-delete edildi).

**Bilinən məhdudiyyət (qəsdən həll edilməyib, tapşırıqda deyilməyib):** hər atribut əlavəsi ayrı `recompute()` çağırışıdır — bir resursa ardıcıl 2 atribut əlavə ediləndə aralıq (natamam siqnatura ilə) `resource_match_groups` sətri yaranıb sonra "yetim" qalır (heç bir resurs ona işarə etmir), canlı testdə də müşahidə olundu. Funksional təsiri yoxdur (son vəziyyət düzgündür), amma vaxtla istifadə olunmayan sətirlər yığıla bilər — lazım olsa gələcəkdə "əgər köhnə qrupun başqa istinadı qalmayıbsa sil" təmizləmə addımı əlavə oluna bilər.

---

## 4j. `resource_price_averages` view + qiymət kənar dəyər (outlier) auto-flag (2026-07-27)

**Məqsəd:** `resource_prices` üzərində, `match_group_id` (Faza 2) sayəsində fərqli təşkilat/təchizatçıların eyni real məhsul üçün verdiyi qiymətləri müqayisə edən orta qiymət hesablaması + yeni sətir əlavə olunanda avtomatik kənar dəyər yoxlaması.

**Yeni fayllar/dəyişikliklər:**
- `024-create-resource-price-averages-view.xml` — **PostgreSQL VIEW** (materialized YOX — layihə "yalnız local development" statusunda olduğu üçün, `REFRESH` orkestrasiyası (kim, nə vaxt) əlavə mürəkkəblik olardı; adi VIEW həmişə real-time düzgündür). Yalnız **`status=APPROVED(2)`** VƏ **cari aktiv** (`effective_date <= bugün`, `expire_date IS NULL və ya >= bugün`) sətirləri daxil edir — tarixi/vaxtı keçmiş approved qiymətlər "cari bazar qiymətinə" qarışdırılmır (mövcud `findCurrentCandidates` məntiqi ilə eyni tarix fəlsəfəsi). Qruplaşdırma **`(match_group_id, region_id)`** cütü üzrədir (tapşırıqda "hər ikisi üzrə ayrıca" — regionlar qarışdırılmır).
- `PriceStatus.FLAGGED(4)` — yeni status (DB-də `status` sadəcə `INTEGER`-dir, `CHECK` constraint yoxdur, ona görə ayrıca miqrasiya lazım olmadı).
- `pricing/PriceOutlierProperties.java` — `ccms.pricing.outlier.*` (`median-deviation-threshold`=0.5, `iqr-multiplier`=1.5, `iqr-minimum-sample-count`=5), `JwtProperties`/`MatchingProperties` ilə eyni qeydiyyat üsulu.
- `pricing/PriceOutlierDetector.java` — `resource_price_averages`-dən cari `median_price`/`sample_count`-u oxuyur; ±50%-dən çox kənaraçıxma varsa **həmişə** flag edir; `sample_count >= 5` olduqda **əlavə olaraq** IQR (Tukey fences, `Q1-1.5×IQR` / `Q3+1.5×IQR`) yoxlaması da aparılır (Q1/Q3 ayrıca native sorğu ilə, yalnız lazım olanda).
- `ResourcePriceRepository` — `findAverageStats` (view-dan median+sample_count) və `findQuartiles` (Q1/Q3) native sorğuları, `PriceAverageStats`/`PriceQuartiles` iç-içə projection interfeysləri.
- `ResourcePriceServiceImpl.create()` — indi `Resource`-u tam yükləyir (əvvəllər yalnız `existsById`), `outlierDetector.isOutlier(...)` nəticəsinə görə status `PENDING` yerinə `FLAGGED` təyin edir.
- **Zəruri əlavə düzəliş:** `assertPending` → `assertNotDecided`-ə çevrildi (indi `PENDING` VƏ `FLAGGED` hər ikisini "hələ qərar verilməyib" sayır) — əks halda `FLAGGED` qiymətlər `approve`/`reject`/`update` üçün əbədi bloklanmış "ölü uc" olardı, "admin təsdiqini gözləsin" tələbi mənasız qalardı. Bu, tapşırığın öz tələbinin məntiqi nəticəsidir, əlavə funksionallıq deyil.

**avg_price = trimmed mean, median_price = əsl median:** İlk versiyada trim faizi (`PERCENT_RANK`) yalnız `grp_count >= ~10`-da real təsir edirdi, kiçik qruplarda (`<5`) heç trim edilmirdi (naiv `AVG`-ə enirdi). **Canlı testdə** bu, real problem kimi üzə çıxdı: 4 nümunəli qrupda (98/100/102 + 9999 kənar dəyər) `avg_price` = **2574.75** çıxdı (median isə 101 olaraq qaldı — dəyişməz). Düzəliş: `ROW_NUMBER`-əsaslı simmetrik trim (`grp_count>=4` olanda hər tərəfdən minimum 1 sətir, əks halda trim yoxdur) — eyni ssenari indi `avg_price=101.0000`, `median_price=101.0000` verir (aşağıdakı canlı test cədvəlinə bax). Migrasiya `runOnChange="true"` ilə yazılıb ki, view-un SQL-i təkmilləşəndə yeni nömrəli migrasiya lazım olmasın (cədvəllərdən fərqli olaraq view-lar üçün bu, Liquibase-in qəbul edilən praktikasıdır).

**Unit testlər (9 test, hamısı yaşıl):**
- `pricing/PriceOutlierDetectorTest` (7 test) — match_group yoxdursa/ilk qiymətdirsə flag olunmur, median həddi daxilində flag olunmur, median həddini keçəndə flag olunur, `sample_count<5`-də IQR sorğusunun heç çağırılmadığı (`verify(never())`), IQR-in median-check-i keçən amma Tukey fences-dən kənar qiyməti tutduğu, hər iki yoxlamanı keçən qiymətin flag olunmadığı.
- `service/impl/ResourcePriceServiceImplTest` (2 test) — `create()`-də normal qiymətin `PENDING`, kənar dəyərin `FLAGGED` statusu ilə saxlandığı (Mockito, `ArgumentCaptor` ilə real entity-nin statusu yoxlanılır).
- **Qeyd (dizayn qərarı):** median-ın "kənar dəyərdən demək olar təsirlənməməsi" xassəsi əsl SQL-də (`PERCENTILE_CONT`) baş verir, layihədə isə DB tələb edən test infrastrukturu yoxdur (bilərəkcə — bölmə 6-da qeyd olunub, `./gradlew build`-in Docker-siz işləməsi üçün). Ona görə bu xassə **JUnit-də deyil, real Postgres-ə qarşı canlı testlə** doğrulanıb (aşağıda), mövcud layihə konvensiyasına uyğun.

**Uçdan-uca canlı test (2026-07-27, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| 4 fərqli resurs (fərqli kod, eyni `Grade` atributu) → eyni `match_group_id`-ə düşdü (Faza 2 mühərriki) | ✅ |
| 3 normal qiymət (98, 100, 102) yaradılıb təsdiqləndi (`status=2`) | ✅ |
| View: `avg_price=100.0000, median_price=100.0000, sample_count=3` | ✅ |
| 4-cü qiymət (9999, median 100-dən 9900% kənar) yaradıldı | ✅ **avtomatik `status=4 (FLAGGED)`** — heç bir admin/vendor müdaxiləsi olmadan |
| Admin flag-lənmiş qiyməti `approve` edə bildi (əvvəllər mümkün olmazdı) | ✅ `status=2`-yə keçdi |
| Approve-dan sonra view (4 nümunə, biri absurd): `median_price=101.0000` (100-dən **cəmi 1% dəyişdi**), ilk versiyada `avg_price=2574.75` idi → düzəlişdən sonra `avg_price=101.0000` | ✅ (bax yuxarıdakı dizayn qərarı) |
| Test data təmizləndi (resurslar soft-delete) | ✅ |

---

## 4k. `GET /api/resource-prices/flagged` — admin review endpoint (2026-07-27)

**Məqsəd:** 4j-də `FLAGGED` statusuna avtomatik düşən qiymətlər üçün admin-in "review növbəsi" görə biləcəyi xüsusi endpoint (əvvəllər yalnız `GET /search?status=4` ilə mümkün idi, amma o, niyə flag olunduğuna dair heç bir kontekst vermirdi).

- **Endpoint:** `GET /api/resource-prices/flagged`, icazə **`COST_APPROVE`** (sadəcə baxış deyil, təsdiq axınının bir hissəsi olduğu üçün `COST_READ` yox, `approve`/`reject` ilə eyni icazə). Pagination dəstəklənir, defolt sıralama `createdDate` (ən əvvəl flag olunan əvvəl).
- **Yeni DTO:** `FlaggedPriceReviewResponse` — `ResourcePriceResponse`-un sahələrinə əlavə olaraq **`currentMedianPrice`**, **`deviationPercent`** (işarəli — müsbət = median-dan yuxarı) və **`sampleCount`** əlavə edir (bunlar `resource_price_averages` view-dan canlı oxunur, ayrıca saxlanmır). Digər response DTO-lardan fərqli olaraq ad-resolve etmir (resource/supplier adı yoxdur) — layihənin bütün DTO-larının xam UUID saxlama konvensiyasına uyğun qalıb.
- **Qərar verməyə davam:** bu endpoint yalnız "gör" hissəsidir — qərar (`approve`/`reject`) mövcud endpoint-lərlə verilir, çünki `FLAGGED` artıq (4j-də) onları qəbul edir. Ayrıca "review" fəaliyyəti yaradılmadı ki, iki paralel qərar yolu olmasın.
- **Canlı test:** median=200 olan qrupda 5000 qiymətli flag-lənmiş sətir yaradıldı → `GET /flagged` `currentMedianPrice=200.0000, deviationPercent=2400.0000, sampleCount=1` qaytardı → `PATCH /{id}/reject` ilə qərar verildi (`status=3`) → `GET /flagged` `totalElements=0`, sətir növbədən düşdü. ✅
- **Testlər:** `./gradlew build` ✅ (yeni JUnit test əlavə olunmayıb — bu, sırf DTO+repository+controller cilalamasıdır, yeni qərar məntiqi yoxdur ki test lazım olsun; mövcud 9 pricing testi də yaşıl qalır).

---

## 4l. `organization_id` sahiblik/görünürlük modeli — API səviyyəsi (2026-07-27)

**Məqsəd:** Faza 1-də DB-yə əlavə olunan `resources.organization_id`/`users.organization_id`/`actor_type` sütunlarının real access-control kimi tətbiqi: bir təşkilat yalnız öz (+ ümumi/mərkəzi) sətirlərini görsün, mərkəz (`VIEW_ALL_ORGANIZATION_RESOURCES`) hamısını görsün.

### Auth axını (JWT/session)
`JwtAuthenticationFilter` hər sorğuda `CustomUserDetailsService.loadUserByUsername` ilə `User`-i **yenidən DB-dən yükləyir** (mövcud `roles`/`permissions` konvensiyası ilə eyni) — deməli JWT-yə əlavə claim lazım olmadı, `UserPrincipal`-a sadəcə `organizationId`/`actorType` sahələri əlavə edildi, hər sorğuda təzədir. `GET /api/auth/me` (`UserResponse`) indi `organizationId`/`actorType`-ı da qaytarır (əvvəllər Faza 1-də "hələ göstərilmir" kimi qeyd olunmuşdu — bağlandı).

### Görünürlük qaydası (`CurrentUserUtil`, yeni statik metodlar)
- `isOrganizationVisible(ownerOrgId)`: `ownerOrgId == null` (ümumi/mərkəzi) **və ya** çağıranın öz `organizationId`-si **və ya** çağıranda `VIEW_ALL_ORGANIZATION_RESOURCES` var — **oxuma** üçün.
- Bu, `ResourceSpecifications.build()`/`ResourcePriceSpecifications.build()`-a **avtomatik** əlavə olunub (hər `search`/`list` çağırışı unutmadan qorunsun deyə) — `resource_prices`-də sütun olmadığı üçün subquery ilə `resources.organization_id`-ə bağlanır ("əlaqəli resource_prices" tapşırıq ifadəsinə uyğun). `getById`/`getCurrentPrice`/`getHistory` isə birbaşa `repository.findById` istifadə etdiyi üçün eyni yoxlama servis səviyyəsində əl ilə təkrarlanıb (tapılmasa/görünməsə eyni 404 — mövcudluq sızdırılmır).
- **Redaktə** (`update`/`delete`) görünürlükdən **sərtdir**: `resources` üçün — ümumi (`organizationId=NULL`) resurs hamıya görünür, amma yalnız mərkəz redaktə edə bilər; öz resursu isə yalnız öz təşkilatı (və ya mərkəz). `resource_prices` üçün isə **fərqli** qayda seçildi: redaktə `createdBy`-a əsaslanır (kim göndəribsə, ya da mərkəz), resursun təşkilatına yox — çünki ümumi resursa qiymət göndərən vendor öz PENDING sətrini redaktə edə bilməlidir, resurs ümumi olduğu üçün "yalnız mərkəz" qaydası buraya səhv uyğun gələrdi (bu nüans qəsdən sənədləşdirilib, kod şərhində də var).
- `approve`/`reject` **toxunulmayıb** — `COST_APPROVE` artıq "mərkəzi qərar" səlahiyyətidir, sahiblik məhdudiyyəti əlavə etmək təsdiq axınının məqsədini pozardı.

### Yaradılma zamanı sahiblik (`resources` POST)
`CreateResourceRequest.organizationId` yeni, **opsional** sahə: adi təşkilat istifadəçisi üçün **tamamilə nəzərə alınmır** (server öz `organizationId`-sini məcburi yazır — spoofing cəhdi canlı testdə təsdiqləndi, aşağıya bax); `VIEW_ALL_ORGANIZATION_RESOURCES`-i olan mərkəz isə istənilən təşkilata təyin edə bilər; nə öz təşkilatı, nə bu icazə olmayan (adi `individual` heyət) istifadəçi isə yalnız ümumi (`NULL`) resurs yarada bilər.

### Yeni endpoint: `GET /api/resource-prices/averages`
Tapşırıqda tələb olunan "resource_price_averages sorğu endpoint-i" — əvvəlki fazalarda view yalnız daxili istifadə olunurdu (`PriceOutlierDetector`, flagged review), heç bir açıq sorğu endpoint-i yox idi. `resource_price_averages` **`@Immutable` JPA entity** kimi map edildi (`ResourcePriceAverage` + `ResourcePriceAverageId` composite key), `JpaSpecificationExecutor` ilə opsional `matchGroupId`/`regionId` filtri + pagination. **Qəsdən organization-görünürlük filtrsizdir** — yalnız aqreqat statistika (heç bir təşkilat/təchizatçı kimliyi) göstərir, cross-vendor müqayisə funksionallığının bütün mənası elə budur (`ResourcePriceAverageSpecifications`-da izah olunub).

### Yeni migrasiya: `025-grant-view-all-organization-resources`
Faza 1-də `VIEW_ALL_ORGANIZATION_RESOURCES` seed edilmişdi, amma heç bir rola verilməmişdi ("hansı rola veriləcəyi sonra qərarlaşdırılsın" qeyd edilmişdi) — bu fazada "mərkəz hamısını görə bilməlidir" tələbinin real sistemdə işləməsi üçün **`SUPER_ADMIN` və `ADMIN`**-ə verildi (SUPER_ADMIN-in 008-də aldığı "bütün icazələr" `SELECT`-i bir dəfəlik idi, sonra əlavə olunan permission-ları avtomatik almır — buna görə ayrıca migrasiya lazım oldu).

### Testlər
**20 yeni authorization unit test** (Mockito, `SecurityContextHolder`-ə real `UserPrincipal` yerləşdirən paylaşılan `TestSecurityContext` köməkçisi ilə — yeni Spring/MockMvc infrastrukturu əlavə olunmayıb, layihənin mövcud "sadə JUnit+Mockito" konvensiyasına uyğun):
- `ResourceServiceImplTest` (10) — öz/ümumi/başqa təşkilat üçün `getById` görünürlüyü, `VIEW_ALL` ilə keçid, `delete`-in ümumi resursda mərkəz-yalnız qaydası, `create`-də sahiblik təyini (adi istifadəçi override edə bilmir, mərkəz edə bilir, `individual` həmişə ümumi yaradır).
- `ResourcePriceServiceImplTest`-ə əlavə (10 yeni, cəmi 10) — başqa təşkilatın resursuna qiymət göndərə bilməmək, ümumi resursa göndərə bilmək, başqa təşkilatın qiymətini `getById`/`getCurrentPrice`/`getHistory`-də görə bilməmək, **eyni təşkilatdaki həmkarın (özü göndərməyib) redaktə edə bilməməsi**, göndərənin öz sətrini redaktə edə bilməsi.

**Canlı uçdan-uca test (2026-07-27, real Postgres + real HTTP + real JWT, 2 həqiqi təşkilat/istifadəçi):**
| Addım | Nəticə |
|---|---|
| SQL ilə 2 `organizations` (Alpha, Beta) + 2 `users` (`user-alpha`→Alpha, `user-beta`→Beta, hər ikisi `OPERATOR` rolu) yaradıldı | ✅ |
| `user-alpha` login + `/me` → `organizationId`/`actorType=2` düzgün göstərilir | ✅ |
| `user-alpha` resurs yaradır, body-də `organizationId=Beta` göndərməyə cəhd edir (spoofing) | ✅ server bunu görməzdən gəlib öz `organizationId`-sini (Alpha) yazdı |
| `user-beta` Alpha-nın resursunu `GET`/`PUT`/`DELETE` edir | ✅ hamısı **404** |
| `user-beta` `GET /api/resources?code=ALPHA-RES-1` axtarır | ✅ **0 nəticə** (search-də də gizli) |
| admin (`VIEW_ALL`, bu fazada verilib) Alpha-nın resursunu `GET` edir | ✅ **200** |
| `user-beta` Alpha-nın resursuna qiymət göndərməyə cəhd edir | ✅ **404** (resursu görə bilmədiyi üçün) |
| `user-alpha` öz resursuna qiymət göndərir | ✅ **201**, `status=PENDING` |
| `user-beta` Alpha-nın qiymətini `GET` edir | ✅ **404** |
| admin Alpha-nın qiymətini `GET` edir | ✅ **200** |
| `user-alpha` öz **PENDING** qiymətini `PUT` ilə redaktə edir | ✅ **200** |
| `GET /api/resource-prices/averages` (yeni endpoint) | ✅ işləyir |
| `GET /api/resource-prices/flagged`, `GET /api/resource-prices/search` (mövcud, admin) | ✅ toxunulmadan işləyir |
| Test data təmizləndi (resurs soft-delete edildi; SQL ilə yaradılan `organizations`/`users` isə — digər modullarda dəfələrlə qeyd olunan "istinad edilən sətir silinməz" qaydasına görə, FK-lar (`resources.organization_id` RESTRICT) buna imkan vermir — informativ test data olaraq DB-də qalır) | ✅ |

**Build/test:** `./gradlew build` ✅, **42 unit test, 0 uğursuz** (bütün fazaların cəmi).

---

## 4m. Mərkəzi (central) admin funksionallığı (2026-07-27)

Tapşırığın 4 bəndindən **2-si artıq mövcud idi** (yeni kod yazılmadı, istifadəçiyə göstərildi ki, dublikat işə vaxt getməsin):
- **Bənd 1** (`flagged` siyahısı) → `GET /api/resource-prices/flagged`, bölmə 4k-da (Faza 3) tikilib.
- **Bənd 2** (təsdiq/rədd, `approved_by`/`approved_date`) → `PATCH /api/resource-prices/{id}/approve` / `/reject`, bölmə 4f-də (ilkin) tikilib, bölmə 4j-də (Faza 3) `FLAGGED` statusunu da qəbul edəcək şəkildə genişləndirilib.

**Bənd 3 — aşağı-əminlikli yeni match group review (əsl yeni iş):**
- **Problem:** `MatchKeyCalculator` əvvəllər yalnız normallaşdırılmış `match_key` (String) qaytarırdı — heç bir "bu qruplaşdırma nə qədər etibarlıdır" siqnalı yox idi. Boş/az-atributlu resurslar (məs. yalnız kateqoriya, brend/istehsalçı/atribut yoxdur) boş `match_key=""` alır və eyni "heç nə bilinmir" qrupuna düşür — bu, səhv birləşmələr üçün ən risqli ssenaridir.
- **Həll:** `MatchKeyCalculator.compute()` indi `MatchComputation(matchKey, signalCount)` record-u qaytarır (`signalCount` = `match_key`-ə töhfə verən qeyri-boş `ad=dəyər` cütlərinin sayı). `ResourceMatchingServiceImpl` YALNIZ **yeni qrup yaradılanda** (mövcuda uyğunlaşanda YOX) `signalCount < ccms.matching.min-signals-for-confident-match` (defolt **2**) olduqda qrupu `review_status=PENDING_REVIEW` ilə yaradır, əks halda `CONFIRMED`.
- **Yeni sütun:** `resource_match_groups.review_status` (migrasiya `026`, defolt `CONFIRMED` — mövcud qruplar geriyə uyğun).
- **Endpoint-lər (`/api/resource-match-groups`, icazə **`COST_APPROVE`**, `flagged`/`approve` ilə eyni "mərkəzi qərar" səlahiyyəti):**
  - `GET /pending-review` — hər sətirdə qrupun içindəki resurs(lar)ın (`id/code/name`) siyahısı da var ki, admin bir başqa sorğuya ehtiyac olmadan nəyin qruplaşdığını görsün.
  - `PATCH /{id}/confirm` — `review_status`-u `CONFIRMED`-ə keçirir. (Yalnız "təsdiq" əməliyyatı əlavə edildi — "böl/ayır" kimi daha böyük bir əməliyyat tapşırıqda tələb olunmayıb və mövcud sadə `resource_match_groups` modelini əhəmiyyətli dərəcədə genişləndirərdi.)
- **Faza 2-nin "yetim aralıq qrup" məhdudiyyəti ilə qarşılıqlı təsir:** hər atribut əlavəsi ayrı `recompute()` olduğu üçün, aralıq (natamam) siqnatura ilə yaranan "yetim" qruplar da aşağı-siqnallıdırsa, `PENDING_REVIEW` kimi işarələnib review növbəsinə düşə bilər — bu, əvvəlcədən qeyd olunan məhdudiyyətin təbii davamıdır, canlı testdə bu konkret halda baş vermədi (aşağıya bax) çünki test ssenarisində 2-ci resurs birbaşa kifayət qədər siqnalla (brend+istehsalçı) yaradılmışdı.

**Bənd 4 — approve → `resource_price_averages` "tetiklənməsi":**
- **Tapılan:** heç bir əlavə koda ehtiyac yoxdur. Faza 3-də `resource_price_averages` **adi VIEW** kimi (MATERIALIZED yox) yaradılmışdı, məhz bu səbəbdən: `REFRESH` orkestrasiyası olmadığı üçün view HƏR sorğuda canlı hesablanır. `approve()` sadəcə `resource_prices.status`-u `APPROVED`-ə dəyişən adi bir `UPDATE`-dir; view-un `WHERE status = 2` şərti bunu avtomatik "görür" — əlavə event/listener/cache-invalidation mexanizmi qəsdən yazılmadı, çünki memarlıq artıq bunu təmin edir. Bu, canlı testlə sübut olundu (aşağıya bax).

**Yeni fayllar/dəyişikliklər:** `entity/MatchGroupReviewStatus.java`, `dto/response/MatchGroupReviewResponse.java` (+ iç-içə `MatchedResourceSummary`), `service/ResourceMatchGroupService.java` + `impl`, `controller/ResourceMatchGroupController.java`, `repository/ResourceMatchGroupRepository.findByReviewStatus`, `repository/ResourceRepository.findByMatchGroupId`. Dəyişdirilən: `matching/MatchKeyCalculator` (`MatchComputation` qaytarır), `matching/MatchingProperties` (`minSignalsForConfidentMatch`), `service/impl/ResourceMatchingServiceImpl`, `service/impl/ResourceMatchGroupWriter` (`reviewStatus` parametri).

**Unit testlər (7 yeni, cəmi 49 test layihədə):**
- `MatchKeyCalculatorTest` — `signalCount_countsOnlyNonBlankContributingPairs` (boş resurs=0, brend=1, brend+istehsalçı=2, +atribut=3, boş dəyərli atribut heç nəyə töhfə vermir).
- `ResourceMatchingServiceImplTest` — yeni qrup aşağı siqnalla `PENDING_REVIEW`, yeni qrup kifayət siqnalla `CONFIRMED`, **mövcud qrupa uyğunlaşanda `review_status`-un toxunulmaması**.
- `ResourceMatchGroupServiceImplTest` — `listPendingReview` içindəki resursları düzgün toplayır, `confirm` statusu dəyişir, mövcud olmayan id 404.

**Uçdan-uca canlı test (2026-07-27):**
| Addım | Nəticə |
|---|---|
| Heç bir brend/istehsalçı/atributu olmayan resurs yaradıldı | ✅ öz qrupu `match_key=""`, **`review_status=PENDING_REVIEW`** ilə yarandı |
| Brend+istehsalçı+atributlu resurs yaradıldı | ✅ öz qrupu birbaşa `CONFIRMED` (2 siqnal ≥ hədd) |
| `GET /pending-review` | ✅ yalnız aşağı-siqnallı qrup göründü, içində düzgün resurs |
| `PATCH /{id}/confirm` | ✅ `review_status=CONFIRMED`-ə keçdi, növbədən düşdü |
| 2 resurs eyni match group-a bağlandı, 1-ci qiymət (200) approve edildi | ✅ `avg_price=median_price=200, sample_count=1` |
| 2-ci qiymət (220) yaradıldı, **hələ PENDING** | ✅ averages **dəyişmədi** (200/1) |
| 2-ci qiymət approve edildi | ✅ averages **dərhal** `avg=median=210, sample_count=2`-yə yeniləndi — heç bir əlavə kod işə düşmədən |
| Test data təmizləndi (resurslar soft-delete) | ✅ |

**Build/test:** `./gradlew build` ✅, **49 unit test, 0 uğursuz** (bütün fazaların cəmi).

---

## 4n. `MatchKeyCalculator`-dan brand/manufacturer çıxarıldı (2026-07-28)

**Qərar (istifadəçi ilə müzakirə edildi):** Faza 2-də (bölmə 4i) `match_key` `resources.brand`/`manufacturer` sütunlarını da daxil edirdi. Bu, "eyni texniki spesifikasiyalı, amma fərqli brendli məhsullar" (məs. "Norm" markalı 15mm armatur və "AzTexnika" markalı 15mm armatur) üçün **ayrı-ayrı** `match_group`/median yaradırdı. İstifadəçi bunu araşdırdıqdan sonra qərar verdi ki, mərkəzin məqsədi konkret brendin qiymətini yox, **eyni texniki spesifikasiyalı məhsulun bazar (cross-vendor, cross-brand) median qiymətini** tapmaqdır — brend/istehsalçı artıq qruplaşdırma açarına daxil edilmir, **yalnız `resource_attributes`** (kateqoriya + strukturlaşdırılmış atributlar) iştirak edir.

**Dəyişikliklər:**
- `matching/MatchKeyCalculator.compute(Resource, List<ResourceAttribute>)` → `compute(List<ResourceAttribute>)` (brand/manufacturer oxunmur, `addTextPair` helper-i silindi, `Resource` parametri/importu artıq lazım deyil).
- `service/impl/ResourceMatchingServiceImpl.recompute()` — yeni bir-arqumentli `compute()` çağırışına uyğunlaşdırıldı (`Resource` obyekti hələ də `categoryId`/`matchGroupId` üçün yüklənir, sadəcə `MatchKeyCalculator`-a ötürülmür).
- Testlər: `MatchKeyCalculatorTest` (brand/manufacturer test-ləri silinib/əvəzlənib — yeni `brandAndManufacturerDoNotParticipateInTheMatchKey` testi fərqli brendlərin eyni açarı verdiyini doğrulayır), `ResourceMatchingServiceImplTest` (mock stub-ları `compute(any())`-a uyğunlaşdırıldı).
- **`resource.brand`/`resource.manufacturer` sütunları özləri silinmədi** — hələ də DB-də saxlanılır (informativ/filtrasiya məqsədli, `GET /api/resources?manufacturer=...` axtarışı toxunulmayıb), sadəcə **matching/median hesablanmasına təsir etmirlər**.

**Doğrulama (2026-07-28, real Postgres + HTTP, canlı test):**
| Addım | Nəticə |
|---|---|
| `./gradlew build` | ✅ uğurlu, bütün testlər yaşıl |
| Backend restart (`bootRun`, `/actuator/health`) | ✅ `UP` |
| Resource X (`brand=Norm`, `manufacturer=Norm`, atributsuz) yaradıldı | öz `match_group_id`-i aldı |
| Resource Y (`brand=AzTexnika`, `manufacturer=AzTexnika MMC`, atributsuz) yaradıldı | ✅ **X ilə EYNİ `match_group_id`** (əvvəllər fərqli brend fərqli qrup deməkdi) |
| Hər ikisinə `Diametr=15mm` atributu əlavə edildi | ✅ hər ikisi **eyni** yeni `match_group_id`-ə köçdü (atribut dəyişəndə `recompute()` yenidən işə düşür) |
| Test data təmizləndi (hər iki resurs soft-delete) | ✅ |

**Qeyd:** Bu, `resources.brand`/`manufacturer`-in **istifadəçi tərəfindən qərarlaşdırılan** bir "brend fərqləndirici olmasın" seçimidir — əks qərar (brend saxlanılsın) da mümkün idi, sadəcə fərqli median semantikası verərdi (bax istifadəçi ilə söhbətin bu hissəsi).

---

## 4o. Struktur Atribut Lüğəti — `resource_attributes`-in tam yenidən dizaynı (2026-07-28)

**Səbəb:** İstifadəçi ilə müzakirədə aşkarlandı ki, köhnə sərbəst-mətn EAV (`attribute_name`/`attribute_value`/`unit` — hamısı azad mətn) iki real problem yaradırdı: (1) fərqli vendor-ların eyni atributu fərqli yazması (`"Diametr"` / `"diametr"`, `"15mm"` / `"15 MM"`) matching-i çətinləşdirirdi — `MatchKeyCalculator`-un böyük hissəsi məhz bunu düzəltmək üçün heuristika idi (unit-regex, ədədi "banding", "ölçümü yoxsa kateqorik kod" təxmini); (2) heç bir qayda yox idi ki, vendor müəyyən kateqoriya üçün "tanınan" bir atribut seçsin, dəyər də düzgün formada olsun (rəqəm/mətn/sabit siyahıdan biri).

**İstifadəçinin tələb etdiyi yeni memarlıq:** Atributlar **qlobal lüğətdir** (Diametr, Marka, Material, Uzunluq, Çəki, Güc — hər biri BİR DƏFƏ yaradılır), kateqoriyalarla **many-to-many** əlaqəli (eyni "Diametr" Armatur-da da, Boru-da da istifadə oluna bilər), hər əlaqə sətri `required`/`visible`/`searchable`/`filterable`/`sort_order`/`affects_match_group` daşıyır. Hər atributun `data_type`-ı var (`NUMBER`/`TEXT`/`ENUM`/`BOOLEAN`/`DATE`) — dəyər bu tipə görə server-side doğrulanır. `NUMBER` atributların vahidi (`default_unit_id`) sabitdir, vendor yalnız rəqəmi yazır (məs. Diametr=12 → sistem "12 mm" göstərir) — vahidin özü heç vaxt əl ilə yazılmır.

**Yeni cədvəllər (Liquibase `027`-`030`):**
- `attribute_definitions` (`027`) — `id, name (qlobal unikal), data_type, default_unit_id (FK→units, RESTRICT), active`. Audit sahəsi/soft-delete yoxdur (`Unit`/`Region`/`Supplier` konvensiyası).
- `attribute_enum_values` (`028`) — `ENUM` tipli definition-ların icazə verilən dəyər siyahısı, `attribute_definition_id` FK **CASCADE** (definition silinəndə enum dəyərləri də silinir).
- `category_attribute_definitions` (`029`) — many-to-many körpü, `(category_id, attribute_definition_id)` unikal, `category_id` FK **CASCADE**, `attribute_definition_id` FK **RESTRICT** (istifadədə olan definition silinə bilməz).
- `resource_attributes` yenidən quruldu (`030`) — köhnə `attribute_name`/`attribute_value`/`unit`/`sort_order`/`searchable`/`required` sütunları silindi (**mövcud sətirlər də silindi** — istifadəçi ilə razılaşdırıldı: sərbəst-mətn test datası idi, backfill lazım deyildi). Yeni: `category_attribute_definition_id` (FK→`category_attribute_definitions`, **RESTRICT**, NOT NULL) + `value` (VARCHAR, NOT NULL). Unikal indeks `(resource_id, category_attribute_definition_id)` — "bir resursda eyni atribut iki dəfə ola bilməz" qaydası indi FK-əsaslı, `LOWER(attribute_name)` yerinə.

**Yeni entity-lər:** `AttributeDefinition`, `AttributeDataType` (enum, `PriceStatus`/`ResourceType` konvensiyası ilə), `AttributeEnumValue`, `CategoryAttributeDefinition`. `ResourceAttribute` yenidən yazıldı: `id, resourceId, categoryAttributeDefinitionId, value, active`.

**`MatchKeyCalculator` sadələşdirildi:** artıq `List<AttributeMatchSignal>` (yeni `matching/AttributeMatchSignal` record) qəbul edir — `resource_attributes → category_attribute_definitions → attribute_definitions` join-undan `ResourceAttributeRepository.findMatchSignatureRows()` JPQL sorğusu ilə doldurulur. Yalnız `affects_match_group=true` siqnallar iştirak edir. **Silinən köhnə heuristikalar:** `MEASUREMENT_PATTERN` regex, ədədi "banding" (`applyBand`/`bandFor`/`MatchingProperties.attributeBands`/`defaultNumericBand`), "ölçümü yoxsa kateqorik kod" təxmini — **hamısı artıq lazım deyil**, çünki `NUMBER` dəyərlər indi strukturlaşdırılıb (server-side doğrulanıb, vahid sabitdir), **dəqiq (exact) `BigDecimal` müqayisəsi** kifayətdir (istifadəçinin qərarı — "tolerantlıq/band lazım deyil").

**`ResourceAttributeServiceImpl` yeni validasiya axını:** `create()`/`update()` indi (1) seçilmiş `category_attribute_definition_id`-nin resursun öz kateqoriyasına aid olduğunu yoxlayır (əks halda 400 — başqa kateqoriyanın atributu bağlana bilməz), (2) dəyəri `data_type`-a görə doğrulayır: `NUMBER`→`BigDecimal` parse, `ENUM`→`attribute_enum_values`-də aktiv dəyərlə uyğunluq, `BOOLEAN`→`true`/`false`, `DATE`→ISO-8601, `TEXT`→sərbəst.

**Yeni endpoint-lər:**
- `/api/attribute-definitions` (CRUD) + `/{id}/enum-values` (CRUD) — `COST_WRITE`/`COST_READ`.
- `POST`/`GET /api/resource-categories/{id}/attributes` — kateqoriyaya atribut bağlamaq/siyahı (vendor-un "atribut əlavə et" formasının mənbəyi).
- `/api/category-attribute-definitions/{id}` (`PUT`/`DELETE`) — əlaqənin konfiqurasiyasını yeniləmək/silmək (istifadədə olan əlaqə silinə bilməz, `CategoryAttributeDefinitionInUseException`, 409).
- `POST/PUT/DELETE /api/resource-attributes` — eyni şəkildə qalır, amma indi `categoryAttributeDefinitionId`+`value` qəbul edir (əvvəlki `attributeName`/`attributeValue`/`unit` yerinə).

**`ResourceSpecifications.hasAttribute()`** (resurs axtarışı `?attributeName=&attributeValue=`) yenidən yazıldı — indi `resource_attributes → category_attribute_definitions → attribute_definitions` 3-root subquery join-u ilə işləyir (bu cədvəllər arasında `@ManyToOne` yoxdur, layihənin "sadə UUID sütun" konvensiyasına uyğun, ona görə cross-root subquery istifadə olundu).

**Silinən:** `mapper/ResourceAttributeMapper.java` (artıq lazım deyil — cavab çoxlu cədvəldən yığıldığı üçün servisdə əl ilə qurulur, `FlaggedPriceReviewResponse` presedentinə uyğun). `ccms.matching.default-numeric-band`/`ccms.matching.attribute-bands` konfiqurasiyası `application.yml`-dən silindi.

**Testlər:** `MatchKeyCalculatorTest` tam yenidən yazıldı (siqnal-əsaslı, band-siz dəqiq ədədi uyğunluq, `affectsMatchGroup=false` filtri), `ResourceMatchingServiceImplTest` yeni `findMatchSignatureRows`/`compute(List<AttributeMatchSignal>)`-a uyğunlaşdırıldı, 3 yeni test faylı əlavə olundu: `AttributeDefinitionServiceImplTest`, `CategoryAttributeDefinitionServiceImplTest`, `ResourceAttributeServiceImplTest`. **Cəmi 63 unit test, 0 uğursuz.**

**Uçdan-uca canlı test (2026-07-28, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| Migrasiyalar `027`-`030` real Postgres-ə tətbiq | ✅ 4/4 changeset uğurlu |
| `Diametr` (NUMBER, vahid=mm) + `Marka` (ENUM, dəyərlər A400/A500) yaradıldı, ortaq kateqoriyaya bağlandı | ✅ |
| Resource X (`brand=Norm`) və Y (`brand=AzTexnika`) — Diametr=15, Marka=A400 əlavə edildi | ✅ hər ikisi **eyni `match_group_id`**-ə düşdü (fərqli brend qruplaşdırmaya təsir etmədi) |
| Yeni resursda etibarsız `NUMBER` dəyər (`"abc"`) | ✅ 400 |
| İcazə verilməyən `ENUM` dəyər (`"Z999-NOT-ALLOWED"`) | ✅ 400 |
| Eyni atributun eyni resursa 2-ci dəfə əlavəsi | ✅ 409 |
| Başqa kateqoriyanın `category_attribute_definition_id`-si ilə resurs-a atribut bağlamaq cəhdi | ✅ 400 ("bu atribut resursun kateqoriyası üçün konfiqurasiya olunmayıb") |
| Test resursları silindi (soft-delete) | ✅ |
| Test üçün yaradılan `attribute_definitions`/`category_attribute_definitions`/kateqoriya/unit | ⚠️ DB-də qalır — soft-delete edilmiş resurslar hələ də onlara `resource_attributes` vasitəsilə istinad etdiyi üçün RESTRICT FK-lar silinməyə imkan vermir (bölmə 5, #5-dəki "istinad edilən sətir silinməz" presedenti ilə eyni, qəsdən belədir) |

**Build/test:** `./gradlew build` ✅, **63 unit test, 0 uğursuz**.

---

## 4p. Qiymət təsdiqi — hibrid model (2026-07-28)

**Qərar (istifadəçi ilə müzakirə edildi):** Yeni "resurs yarat" menyusu üçün ChatGPT-nin təklifləri müzakirə edilərkən istifadəçi bildirdi ki, təşkilat qiymət göndərəndə admin təsdiqini gözləməsin — "orta qiymət avtomatik çıxmalıdır". Bu, bölmə 4f/4j-də qurulmuş tam `PENDING→APPROVED` təsdiq axını ilə birbaşa ziddiyyət təşkil etdiyi üçün istifadəçiyə aydın göstərildi və üç variant təklif edildi (təsdiq tam qalsın / tam ləğv olsun / **hibrid**). İstifadəçi **hibrid**i seçdi: *"Qiymətləri təşkilatlar yerləşdirsinlər approved kimi qalsın. Lakin fərq çox olanda flagged-lərə baxış olsun."*

**Dəyişiklik:** `ResourcePriceServiceImpl.create()` — əvvəllər HƏR yeni qiymət `PENDING` (kənar dəyərdirsə `FLAGGED`) statusu ilə yaranırdı və admin `COST_APPROVE` ilə təsdiqləməli idi. İndi:
- **Normal qiymət** (outlier deyil) → birbaşa **`APPROVED`** statusu ilə yaranır, `resource_price_averages`-ə **dərhal** qatılır. `approvedBy`/`approvedDate` **boş qalır** (heç kim qərar verməyib — bu, "avtomatik təsdiqlənib" ilə "insan baxıb təsdiqləyib" fərqini audit-də saxlamaq üçün qəsdən belədir).
- **Kənar dəyər (outlier)** → dəyişməyib, hələ də `FLAGGED` ilə yaranır, `COST_APPROVE` icazəli admin `GET /flagged` növbəsində görüb `approve`/`reject` edir (bölmə 4j/4k-dəki bütün mexanizm **toxunulmadan qalıb**, sadəcə indi "hər qiymət" yerinə "yalnız kənar dəyərlər" üçün işləyir).

**Tapılan və düzəldilən əlavə problem:** Qiymət birbaşa `APPROVED` kimi insert edildiyi üçün (əvvəllər `approve()` metodunda UPDATE olurdu), eyni (resurs+təchizatçı+region) üçün artıq açıq bir `APPROVED` qiymət varsa, yeni INSERT `uk_resource_prices_active_open` partial unique indeksini pozacaqdı (409). Həll: `ResourcePriceRepository.findOverlappingActiveForNewPrice()` (yeni, `id` istisnası olmadan — çünki yeni sətrin hələ `id`-si yoxdur) əlavə edildi, `create()` indi `APPROVED` insert-dən ƏVVƏL köhnə açıq qiyməti "təqaüdə göndərir" (`expireDate` kəsir, `saveAndFlush`) — `approve()`-dəki mövcud flush-ordering məntiqi (bax bölmə 5, #6) `retireOverlapping()` adlı ortaq private metoda çıxarıldı, hər iki yerdə istifadə olunur.

**Doğrulama (2026-07-28, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| Normal qiymət (100, bugünkü tarix) göndərildi | ✅ dərhal `status=2 (APPROVED)`, `approvedBy=null` |
| Averages sorğusu | ✅ `avg=median=100, sampleCount=1` — heç bir approve çağırışı olmadan |
| Eyni resurs/təchizatçı/region üçün 2-ci qiymət (105, sabahkı tarix) göndərildi | ✅ **409 YOX** — 1-ci qiymətin `expireDate`-i avtomatik bugünə kəsildi, 2-ci dərhal `APPROVED` |
| Ekstremal kənar dəyər (999999) göndərildi | ✅ hələ də `status=4 (FLAGGED)`, averages-ə qatılmadı |
| `GET /flagged` | ✅ kənar dəyər növbədə göründü (`deviationPercent≈999899%`) |
| `PATCH /{id}/reject` | ✅ işlədi, `status=3 (REJECTED)` |
| Test data təmizləndi | ✅ |

**Testlər:** `ResourcePriceServiceImplTest` — `create_normalPrice_staysPending` → `create_normalPrice_isAutoApproved`-ə çevrildi (`APPROVED` + `approvedBy=null` doğrulanır), `create_onSharedResource_isAllowedForAnyOrganization`-a yeni `findOverlappingActiveForNewPrice` stub-u əlavə olundu. **Cəmi 63 unit test, 0 uğursuz** (say dəyişmədi, mövcud testlər uyğunlaşdırıldı).

**Build/test:** `./gradlew build` ✅, **63 unit test, 0 uğursuz**.

---

## 4q. Resurs kodunun avtomatik generasiyası + İstehsalçı/Brend/Model autocomplete (2026-07-28)

**Səbəb:** Yeni "bir pəncərədə resurs yarat" menyusu üçün ChatGPT-feedback müzakirəsində razılaşdırılan iki hazırlıq işi: (1) vendor heç vaxt `code` yazmamalıdır — backend avtomatik generasiya etməlidir; (2) İstehsalçı/Brend/Model sahələri autocomplete olmalıdır (mövcud dəyər seçilsin, yoxdursa yeni yazılsın).

**1. Kod generasiyası:**
- Yeni migrasiya `031` — `resource_code_seq` adlı **qlobal** Postgres ardıcıllığı (`createSequence`). Tip üzrə ayrıca ardıcıllıq YOX — say özü mənasız, yalnız unikallıq üçündür, prefiks kateqoriyanın `type`-ından gəlir.
- `ResourceType` enum-una `codePrefix` əlavə olundu: `MATERIAL→"MAT"`, `MACHINERY→"MCH"`, `LABOR→"LAB"`, `TRANSPORTATION→"TRN"`, `SERVICE→"SRV"`, `OTHER→"OTH"`.
- `ResourceServiceImpl.create()` — indi `categoryRepository.findById()` ilə **tam** `ResourceCategory` yüklənir (əvvəllər yalnız `existsById`), `generateCode(category.getType())` çağırılır → `"{PREFIX}-{6 rəqəmli, sıfırla doldurulmuş ardıcıllıq dəyəri}"` (məs. `MAT-000001`). `CreateResourceRequest`-dən `code` sahəsi **tamamilə silindi** — göndərilsə belə Jackson tərəfindən sükutla nəzərə alınmır (canlı testlə təsdiqləndi).
- **`active` də eyni zamanda silindi** `CreateResourceRequest`-dən (əvvəlki ChatGPT-analiz qərarı) — yeni resurs həmişə `active=true`, deaktivasiya yalnız sonradan `PUT` ilə.
- `UpdateResourceRequest`-dən yalnız `code` silindi (`active` qalır — bu, deaktivasiya mexanizmidir). Kod artıq **dəyişməzdir** — yaradıldıqdan sonra heç vaxt yenilənmir.
- `assertCodeNotDuplicate`/`existsByCodeIgnoreCase(AndIdNot)`/`DuplicateResourceCodeException` **silindi** — ardıcıllıqla kolliziya mümkün olmadığı üçün artıq lazım deyil (DB-dəki `uk_resources_code` unikal indeksi təhlükəsizlik toru kimi qalır).

**2. Autocomplete (`manufacturer`/`brand`/`model`):**
- Yeni cədvəl YOXDUR — bu sahələr hələ də sərbəst mətndir. 3 yeni "fərqli mövcud dəyərləri qaytar" endpoint-i əlavə olundu: `GET /api/resources/manufacturers|brands|models?search=`, `COST_READ` icazəsi ilə. Nəticə maksimum 20-yə məhdudlaşdırılıb (`AUTOCOMPLETE_LIMIT`).
- **Qəsdən təşkilat-görünürlüyündən asılı deyil** — bu, `resource_price_averages`-in də görünürlükdən asılı olmaması ilə eyni məntiqdir: brend/istehsalçı adları paylaşılan lüğətdir (kimsə "Bosch" yazıbsa, hamı görüb təkrar seçə bilməlidir), məxfi data deyil.
- "Yeni əlavə et" ayrıca endpoint tələb etmir — sadəcə yeni dəyər yazılıb resurs yaradılanda/yenilənəndə saxlanılır.

**Doğrulama (2026-07-28, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| MATERIAL-tipli kateqoriyada, `code` göndərmədən resurs yaradıldı | ✅ `code="MAT-000001"` |
| MACHINERY-tipli kateqoriyada resurs yaradıldı | ✅ `code="MCH-000002"` — say qlobal ardıcıllıqdan davam etdi (tip üzrə sıfırlanmadı) |
| Body-də `"code":"HACKED-001"` göndərilməyə cəhd edildi | ✅ sükutla nəzərə alınmadı, yenə avtomatik `MAT-000003` |
| `active` heç göndərilmədi | ✅ bütün resurslar `active=true` |
| `GET /manufacturers?search=nor` | ✅ mövcud "Norm"/"Norm1" dəyərlərini qaytardı |
| `GET /manufacturers` (boş axtarış) | ✅ maks. 20 fərqli dəyər qaytardı |
| Test resursları silindi (soft-delete) | ✅ |

**Testlər:** `ResourceServiceImplTest` — `stubCreateHappyPath()` yeniləndi (`findById`+`nextResourceCodeSequenceValue` stub-ları), yeni testlər: `create_generatesCodeFromCategoryType_withCorrectPrefixAndPadding`, `searchManufacturers_blankSearch_queriesWithWildcardPatternAndCappedLimit`, `searchBrands_withSearchTerm_buildsLowercaseWildcardPattern`. **Cəmi 66 unit test, 0 uğursuz.**

**Build/test:** `./gradlew build` ✅, **66 unit test, 0 uğursuz**.

---

## 4r. "Mənim Resurslarım" modulu — `/api/resources/mine*` (2026-07-29)

**Səbəb:** Frontend AI-nin göndərdiyi backend kontraktı — istehsalçı/təchizatçı təşkilat istifadəçilərinin (`actorType=ORGANIZATION`) öz məhsullarını sistemə təqdim etməsi üçün ayrı ekran. Konseptual olaraq adi `resources` sətirləridir, yalnız (1) status iş axını, (2) implicit "mənim" (öz `organizationId`) filtri, (3) sadələşdirilmiş (təchizatçısız) qiymət forması ilə fərqlənir.

**DB:**
- `032` — `resources.status` (`SMALLINT`, nullable — yalnız bu modul doldurur, adi `POST /api/resources` yolu toxunmur).
- `033` — `resource_prices.comment` (`VARCHAR(500)`, nullable).
- `034` — `supplier_code_seq` ardıcıllığı (aşağı bax, "Tapılıb düzəldilən problemlər").
- Yeni enum `ResourceStatus`: `DRAFT(1)`/`SUBMITTED(2)`/`CLARIFICATION_NEEDED(3)`/`APPROVED(4)`/`REJECTED(5)`. Admin review (`approve`/`reject`/`clarify` endpoint-ləri) **bilərəkdən tikilmədi** — tapşırığın əhatəsindən kənar idi, gələcək üçün ayrılıb.

**Endpoint-lər (`MyResourceController`, hamısı `COST_READ`/`COST_WRITE`, əlavə permission yoxdur):**
| Endpoint | Nə edir |
|---|---|
| `GET /api/resources/mine` | Səhifələnmiş siyahı, implicit `organizationId` scope (`MyResourceSpecifications` — **strict equality**, `ResourceSpecifications`-dan fərqli olaraq `organization_id IS NULL` paylaşılan resursları DAXİL ETMİR). `hasPrice` bir sorğuda batch hesablanır (`findResourceIdsWithAnyPrice`, N+1 yox). |
| `GET /api/resources/mine/{id}` | Detal + `prices[]`. Başqa təşkilatın/paylaşılan resursu → 404 (eyni "mövcud deyilmiş kimi" məntiqi). |
| `POST /api/resources/mine` | `manufacturer` məcburi (400 boşdursa), `organizationId`/`status=SUBMITTED` server-side, kod avtomatik (`ResourceServiceImpl` ilə eyni ardıcıllıq sxemi). `ResourceMatchingService.recompute()` çağırılır — **istifadəçi qərarı**: bu modulun resursları da dərhal match qrupuna qoşulur ki, kənar dəyər aşkarlama/`resource_price_averages` işləsin (əvəzinə: heç bir moderasiya olmadan). |
| `GET`/`POST /api/resources/mine/{id}/prices` | `supplierId` göndərilmir — `suppliers.organization_id`-ə görə tapılır, yoxdursa **avtomatik yaradılır** (aşağı bax). `vat` göndərilmir → `0` yazılır (frontend formu bunu almır — **istifadəçi qərarı**). Daxildə mövcud `ResourcePriceService.create()` çağırılır (Seçim A) — hibrid təsdiq modeli (bölmə 4p) olduğu kimi işləyir: normal qiymət avtomatik `APPROVED`, kənar dəyər `FLAGGED`. **İstifadəçi qərarı:** kənar dəyər aşkarlananda (`FLAGGED`) `resources.status` da avtomatik `CLARIFICATION_NEEDED(3)`-ə keçir (geri qaytarma yoxdur — yalnız gələcək admin review endpoint-i edə biləcək). |

**Supplier avtomatik yaradılması:** `SupplierRepository.findByOrganizationId` tapmasa, yeni sətir yaradılır (`name`=təşkilatın adı, `organizationId` bağlantısı ilə). Bunun üçün yeni `OrganizationRepository` əlavə olundu (əvvəllər YOX idi).

**Doğrulama (2026-07-29, real Postgres + HTTP, 2 test təşkilat/istifadəçi ilə):**
| Addım | Nəticə |
|---|---|
| `manufacturer` olmadan `POST /mine` | ✅ 400, `"Manufacturer is required"` |
| `manufacturer` ilə `POST /mine` | ✅ `status=2/"Təqdim edilib"`, kod avtomatik (`MCH-000009`), `organizationId` request-dən deyil, token-dən |
| İlk qiymət (kənar dəyər deyil) | ✅ `APPROVED`, supplier avtomatik yaradıldı (`SUP-000001`), `hasPrice=true` oldu |
| Kənar dəyər qiymət (median-dan 50 dəfə yuxarı) | ✅ qiymət `FLAGGED`, `resources.status` avtomatik `3`/`"Dəqiqləşdirmə tələb olunur"`-a keçdi |
| `vendor2` (başqa təşkilat) `vendor1`-in resursunu `GET /mine/{id}` ilə açmağa cəhd etdi | ✅ 404 |
| `vendor2` `GET /mine` siyahısı | ✅ boş (vendor1-in resursu görünmür) |
| `organizationId`-i olmayan istifadəçi (admin) `POST /mine` | ✅ 400, `"This action requires an organization account"` |

**Testlər/Build:** `./gradlew build` ✅ (mövcud unit testlər pozulmadı, bu modul üçün ayrıca unit test yazılmadı — yalnız canlı HTTP ilə doğrulandı).

---

## 4s. Bazar Qiymətləri Analitikası — `GET /api/resource-prices/averages` genişlənməsi (2026-07-29)

**Səbəb:** Admin panelin "Bazar Qiymətləri Analitikası" ekranı (`src/features/admin/market-averages/`) `resourceName`/`manufacturer`/`brand`/`model` sahələrini gözləyirdi, amma bölmə 4j-də tikilən orijinal endpoint yalnız `matchGroupId`/`regionId`/qiymət statistikası qaytarırdı — nəticədə həmin sütunlar UI-da boş görünürdü.

- **View (`024`, `runOnChange=true`, yerində redaktə edildi — bölmə 3-də qeyd olunan qayda):** `categoryId`/`resourceName`/`manufacturer`/`brand`/`model` əlavə olundu, hər `match_group_id` üçün **bir təmsilçi resurs**dan (`DISTINCT ON (match_group_id) ... ORDER BY created_date, id`) `LEFT JOIN` ilə. Diqqət: Postgres `CREATE OR REPLACE VIEW` mövcud sütunların sırasını dəyişməyə icazə vermir — yeni sütunlar mütləq SONA əlavə olunmalıdır (bax aşağı, tapılan problem).
- **`name` axtarış parametri:** `ResourcePriceAverageSpecifications.hasName` — **təmsilçi resursun adına görə YOX**, EXISTS alt-sorğusu ilə həmin `match_group_id`-ə aid **istənilən** resursun adına görə (case-insensitive, `LIKE %name%`). Fərq vacibdir: təmsilçi uyğun gəlməsə də, qrupun başqa üzvü uyğun gələ bilər.
- **`regionId` artıq məcburi deyil** — `ResourcePriceAverageSpecifications.hasRegion` onsuz da `null`-da filtriötürürdü (bölmə 4j-dən bəri belə idi), controller-də `@RequestParam(required=false)` da onsuz da var idi. Yəni bu tərəf üçün əlavə iş lazım olmadı.

**Doğrulama (2026-07-29, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| `?size=5` (heç bir filtr yoxdur) | ✅ hər sətirdə `resourceName`/`manufacturer`/`brand`/`model`/`categoryId` dolu (əgər match qrupunda silinməmiş üzv varsa) |
| `?name=Sablon` (regionId göndərilmədən) | ✅ yalnız uyğun resursu olan qrup qaytarıldı |
| `?name=zzzznomatchzzzz` | ✅ boş nəticə |
| Kənar dəyər (`FLAGGED`) qiymət `avgPrice`-ə təsir etmədi | ✅ (view yalnız `status=2 APPROVED` sətirləri aqreqasiya edir — dəyişməyib) |

**Testlər/Build:** `./gradlew build` ✅.

---

## 4t. Products modulu — `resources`-un "nədir" (product) və "kim satır" (listing) hissələrinə ayrılması (2026-07-30)

**Səbəb (istifadəçi ilə müzakirə):** İstifadəçi izah etdi ki, `resources` cədvəli iki fərqli şeyi qarışdırırdı: (1) bir məhsulun **identiteti** (kateqoriya, atributlar, spesifikasiya, istehsalçı/brend/model, ölçü vahidi) və (2) bir təşkilatın həmin məhsulu **konkret qiymətə elan etməsi**. Hər təşkilat "eyni" məhsulu yerləşdirəndə öz `resources` sətrini yaradırdı, sistem isə bunları sonradan (`resource_match_groups` vasitəsilə) səssizcə qruplaşdırırdı — istifadəçinin öz sözləri ilə: *"resource cədvəli təşkilatların yerləşdirdiyi məhsullardır. bir də product var onun öz kodu olmalıdır... Əgər məhsul yaradanda xüsusiyyətləri seçib baxırıq ki bu xüsusiyyətdə product yoxdur o zaman product yaradıb yeni kod veririk"*. Bu, həm istifadəçi görməli olduğu bir kataloq konsepti (product + öz kodu) yaradır, həm də **qiymət analitikası məntiqini (resource_match_groups) məhsul identitetindən ayırır** — sabah qiymət çıxarma tezliyi/alqoritmi dəyişsə belə, əsas kataloqa (product) toxunulmur.

**Qərarlar (istifadəçi ilə birlikdə):**
- Local dev-only olduğu üçün (heç bir production data yoxdur) **sıfırdan yenidən qurma** seçildi — köhnə migrasiyalar ALTER-lərlə üst-üstə yığılmadı, düzgün son forma birbaşa öz changeset-lərinə yazıldı, `docker compose down -v` ilə local Postgres sıfırlandı.
- Yalnız `products` insan-oxunaqlı `code` daşıyır — `resources.code`/`resource_code_seq` tamamilə silindi, listing `product_id`+`organization_id` ilə tanınır.
- `unit_id`/`specification`/`manufacturer`/`brand`/`model`/`name`/`description` — hamısı `products`-a köçdü (bunlar məhsulun "nə olduğunu" təyin edir, elanın yox).

**Yeni sxem:** bax bölmə 3 ("Cədvəllər" və migrasiya siyahısı) tam DB detalları üçün. Qısaca: `products` (kateqoriya+unikal atribut kombinasiyası=bir sətir, öz `code`-u, `match_key`/`review_status` köhnə `resource_match_groups`-un yerini tutur) + `product_attributes` (köhnə `resource_attributes`-in eyni strukturu, `product_id`-yə bağlı) + `resources` (indi sadəcə `id/product_id/organization_id/status/active/deleted/audit`).

**Matching mühərriki köçürüldü, silinmədi:** `MatchKeyCalculator` alqoritmi (atribut siqnallarını sort edib normallaşdırıb `ad=dəyər|ad=dəyər` sətrinə çevirmək) **olduğu kimi saxlanıldı** — sadəcə çağırış nöqtəsi dəyişdi. Əvvəllər: resurs yaradılır → sonra async `recompute()` çağırılır → `match_group_id` tapılır/yaranır. İndi: `ProductServiceImpl.resolve()` (`POST /api/products`) kateqoriya+atributlardan `match_key` hesablayır → `(category_id, match_key)` üzrə mövcud product axtarır → varsa elə onu qaytarır (`matched:true`), yoxdursa yeni `code`-lu product + onun `product_attributes` sətirlərini **eyni tranzaksiyada** yaradır (`matched:false`). Race-safe insert (`REQUIRES_NEW` + `DataIntegrityViolationException` tutulub yenidən oxumaq) məntiqi `ResourceMatchGroupWriter`-dən `ProductWriter`-ə eyni şəkildə köçürüldü. `resources` yaradılması artıq **heç bir recompute tələb etmir** — `product_id` yaradılış anında bəllidir.

**Aşağı-əminlikli review axını da köçdü:** köhnə `/api/resource-match-groups/pending-review`+`/{id}/confirm` (bölmə 4m) indi `/api/products/pending-review`+`/{id}/confirm`-dir, eyni məntiqlə (`signalCount < ccms.matching.min-signals-for-confident-match` olan yeni product `PENDING_REVIEW` yaranır).

**"Mənim Resurslarım" (bölmə 4r) uyğunlaşdırıldı:** `MyResourceServiceImpl.create()` indi əvvəlcə `ProductService.resolve(...)` çağırır (eyni `manufacturer` məcburiliyi + yeni `attributes[]` sahəsi ilə), aldığı `productId` ilə `SUBMITTED` statuslu listing yaradır. `MyResourceResponse`/`MyResourceDetailResponse` görüntü sahələri (`code/name/...`) indi əlaqəli product-dan doldurulur.

**Qiymət analitikası (`resource_price_averages`, bölmə 4j/4s) `product_id` üzrə qruplaşdırır:** view-un `WITH` zənciri `resources.match_group_id` yerinə `resources.product_id`-dən oxuyur, "təmsilçi resurs" (`DISTINCT ON`) məntiqinə artıq ehtiyac yoxdur — product özü birbaşa `name`/`manufacturer`/`brand`/`model`/`category_id` daşıyır. `PriceOutlierDetector`/`ResourcePriceRepository.findAverageStats`/`findQuartiles` parametr adı `matchGroupId`→`productId` (məntiq dəyişməyib).

**Silinən fayllar:** `entity/ResourceMatchGroup.java`, `MatchGroupReviewStatus.java`, `ResourceAttribute.java`; `repository/ResourceMatchGroupRepository.java`, `ResourceAttributeRepository.java`; `service/ResourceMatchingService(+Impl).java`, `ResourceMatchGroupService(+Impl).java`, `ResourceAttributeService(+Impl).java`, `impl/ResourceMatchGroupWriter.java`; `controller/ResourceMatchGroupController.java`, `ResourceAttributeController.java`; DTO-lar `CreateResourceAttributeRequest`, `UpdateResourceAttributeRequest`, `ResourceAttributeResponse`, `MatchGroupReviewResponse`; `mapper/ResourceMapper.java` (`ResourceResponse` indi servisdə əl ilə, `product`-la birgə qurulur — `ResourceAttributeMapper` presedentinə uyğun).

**Yeni fayllar:** `entity/Product.java`, `ProductAttribute.java`, `ProductReviewStatus.java`; `repository/ProductRepository.java`, `ProductSpecifications.java`, `ProductAttributeRepository.java`; `service/ProductService(+Impl).java`, `impl/ProductWriter.java`; `controller/ProductController.java`; DTO-lar `CreateProductRequest`, `UpdateProductRequest`, `ProductSearchCriteria`, `ProductAttributeValueRequest`, `ProductResponse`, `ProductResolveResponse`, `ProductAttributeResponse`, `ProductReviewResponse`.

**Yan-təsir düzəlişləri (asanlıqla gözdən qaça biləcək bağlantılar):** `ResourceCategoryServiceImpl`/`UnitServiceImpl`-dəki "kateqoriya/unit istifadədədirmi" yoxlamaları (`CategoryInUseException`/`UnitInUseException`) əvvəllər `ResourceRepository.existsByCategoryId/UnitIdIncludingDeleted` çağırırdı — bu FK-lar indi `products`-da olduğu üçün `ProductRepository.existsByCategoryId/UnitId`-ə köçürüldü (əks halda istifadədə olan kateqoriya/unit sükutla silinə bilərdi). Eynilə `CategoryAttributeDefinitionServiceImpl.unlink()` indi `ProductAttributeRepository.existsByCategoryAttributeDefinitionId` yoxlayır.

**Testlər:** `ResourceMatchingServiceImplTest`, `ResourceMatchGroupServiceImplTest`, `ResourceAttributeServiceImplTest` silindi (köhnə siniflərlə birlikdə), yerinə **`ProductServiceImplTest`** yazıldı (resolve — yeni yaradır/mövcudu tapır/race bərpası/aşağı-siqnal `PENDING_REVIEW`/kifayət siqnal `CONFIRMED`/review confirm) — köhnə iki test faylının bütün ssenariləri buraya köçürüldü. `ResourceServiceImplTest`, `ResourcePriceServiceImplTest`, `PriceOutlierDetectorTest`, `CategoryAttributeDefinitionServiceImplTest` mövcud ssenarilər saxlanılaraq yeni model-ə uyğunlaşdırıldı. **Cəmi 57 unit test, 0 uğursuz** (say azaldı, çünki attribute-CRUD-a xas testlər artıq mövcud olmayan bir axını yoxlayırdı).

**Uçdan-uca canlı test (2026-07-30, real Postgres + HTTP, sıfırdan yaradılmış DB):**
| Addım | Nəticə |
|---|---|
| Kateqoriya (`STEEL-PIPE`) + `Diametr` (NUMBER) atribut tərifi yaradıldı, kateqoriyaya bağlandı (`affectsMatchGroup=true`) | ✅ |
| `POST /api/products` (`Diametr=100`, `manufacturer=AzPipe`) | ✅ yeni product, `code=MAT-000001`, `matched=false`, `reviewStatus=2 (PENDING_REVIEW — yalnız 1 siqnal)` |
| Eyni body ilə **ikinci** `POST /api/products` | ✅ **eyni product qaytarıldı**, `matched=true` |
| `GET /api/products/{id}/attributes` | ✅ `Diametr=100` avtomatik dolu qayıdır (auto-fill) |
| `POST /api/resources` (`productId` ilə, orqanizasiyasız/paylaşılan) | ✅ listing yaradıldı, cavabda tam `product` obyekti gömülü |
| `GET /api/products/pending-review` | ✅ yaradılan product göründü, `listings[]` içində yeni resurs id-si |
| `PATCH /api/products/{id}/confirm` | ✅ `reviewStatus` `1 (CONFIRMED)`-ə keçdi |
| Unit/Region/Supplier yaradıldı, listing üçün qiymət (100 AZN) göndərildi | ✅ `status=APPROVED` (outlier deyil) |
| `GET /api/resource-prices/averages?productId=...` | ✅ `avgPrice=medianPrice=100`, `sampleCount=1`, `resourceName`/`manufacturer`/`categoryId` product-dan düzgün dolu |

**Build/test:** `./gradlew build` ✅, **57 unit test, 0 uğursuz**. Backend restart edildi (`docker compose down -v` + `up -d`, orphan `bootRun` prosesi öldürüldü — bölmə 0), `/actuator/health` → `UP`.

**Qeyd — yenilənməmiş sənədlər:** `FRONTEND_AI_PROMPT.md` və `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` hələ köhnə (`resources`-un özündə `code`/atribut olduğu) modeli təsvir edir. **2026-07-30 (sonra):** frontend üçün yeni `FRONTEND_AI_PROMPT_PRODUCTS.md` yazıldı (bu ayrılmanı tam əhatə edir) + köhnə 3 sənəddə (`FRONTEND_AI_PROMPT.md`, `_ADMIN_PANEL.md`, `_RESOURCE_CREATION.md`) köhnəlmiş bölmələrin üstünə ⚠️ bannerlər qoyuldu ki, frontend AI-nin qarışıq/ziddiyyətli məlumat oxumasının qarşısı alınsın.

**Əlavə düzəliş (2026-07-30, istifadəçi ilə müzakirədən sonra):** `POST /api/resources/mine` yalnız `{categoryId, name, ..., attributes}` formatını qəbul edirdi — istifadəçi artıq mövcud bir product seçmişdisə belə, yenidən ad/istehsalçı/atribut göndərməli və hər dəfə `resolve()`-dən keçməli idi (nəticə düzgün idi — dublikat yaranmırdı, çünki atributlar üst-üstə düşürdü — amma memarlıq təmiz deyildi, `POST /api/resources`-un (mərkəzi) birbaşa `productId` qəbul etməsi ilə uyğunsuz idi). Düzəliş: `CreateMyResourceRequest`-ə opsional `productId` əlavə olundu, `categoryId`/`name`/`unitId`/`manufacturer` artıq bean-validation annotasiyaları ilə deyil, `MyResourceServiceImpl.resolveNewProduct()`-da **yalnız `productId` göndərilmədiyi halda** məcburi yoxlanılır. Nəticə: `productId` göndərilibsə birbaşa həmin product-a bağlanır (heç bir `resolve()` çağırışı olmadan), göndərilməyibsə köhnə find-or-create axını işləyir. İki canlı test (vendor1 → `categoryId+attributes` ilə yeni product yaratdı, vendor2 → eyni product-a birbaşa `productId` ilə bağlandı, hər ikisi eyni `code`) və boş body-nin `400 "Category is required"` qaytarması ilə doğrulandı. `./gradlew build` ✅ (57 unit test, dəyişməyib — bu düzəliş üçün ayrıca unit test yazılmadı, yalnız canlı HTTP ilə yoxlanıldı). `FRONTEND_AI_PROMPT_PRODUCTS.md` § 4 uyğun olaraq yeniləndi.

---

## 4u. `manufacturer`/`brand`/`model`/`specification` `products`-dan `resources`-a geri köçürüldü (2026-07-31)

**Səbəb (bölmə 4t-də pauza qalmış qərarın davamı + genişlənməsi):** 4t-də bu 4 sahə `products`-a köçürülmüşdü, amma istifadəçi elə həmin gün bunun səhv olduğunu gördü: bunlar artıq bilərəkdən `MatchKeyCalculator`-un siqnallarından kənarda saxlanılır (bax bölmə 4n) ki, fərqli brend altında satılan eyni texniki spesifikasiya eyni product sayılsın. Amma `products`-da qaldıqca, bir product-u yerləşdirən HƏR təşkilat eyni `manufacturer`/`brand`/`model` göstərməyə məcbur olurdu — Vendor A "Norm" adı ilə, Vendor B "AzTexnika" adı ilə satdığı eyni boru artıq eyni product-a bağlana bilmirdi effektiv şəkildə. Bu sessiyada istifadəçi memarlığı bir addım da irəli apardı: `specification` də eyni səbəbdən `resources`-a keçdi, üstəlik `description`/`name` üçün yeni bir qayda təsbit olundu.

**Yekun sxem:**
- **`products`-da qalır** (paylaşılan kataloq identiteti): `categoryId`, `code`, `name`, `description`, `unitId`, `matchKey`, `reviewStatus`, `active`, `product_attributes`.
- **`resources`-a köçdü** (elana xas, hər təşkilat özününkini yaza bilər): `specification`, `manufacturer` (**məcburi**, digər üçü optional), `brand`, `model`.
- **`description` artıq client-dən qəbul edilmir — server tərəfindən avtomatik qurulur:** `ProductServiceImpl.buildDescription()` = kateqoriyanın adı + (varsa) `", attributeName: value"` cütləri, məs. `"Qaynar deformasiya olunmuş... — Diametr: 100"`. `CreateProductRequest`/`UpdateProductRequest`-dən `description` sahəsi tamamilə silindi (attributlar məhsul yarandıqdan sonra dəyişmədiyi üçün update-də də redaktə olunmur).

**Dəyişən fayllar (qısaca):**
- Migrasiyalar: `020-create-products-table.xml` (4 sütun + 2 index silindi), `010-create-resources-table.xml` (4 sütun + 2 index əlavə olundu), `024-create-resource-price-averages-view.xml` (aşağıda izah).
- Entity-lər: `Product.java`, `Resource.java`, `ResourcePriceAverage.java`.
- DTO-lar: `CreateProductRequest`/`UpdateProductRequest`/`ProductResponse`/`ProductSearchCriteria` (4 sahə + `description` create/update-dən silindi); `CreateResourceRequest`/`UpdateResourceRequest`/`ResourceResponse` (4 sahə əlavə olundu, `manufacturer` `@NotBlank`); `CreateMyResourceRequest` (`manufacturer` indi qeydsiz-şərtsiz `@NotBlank`, `description` sahəsi silindi).
- Repository/Specification: manufacturer/brand/model autocomplete sorğuları (`findDistinctManufacturers/Brands/Models`) `ProductRepository`-dən `ResourceRepository`-yə köçdü; `ProductSpecifications`-dan `hasManufacturer/hasBrand` silindi.
- Endpoint-lər: `GET /api/products/manufacturers|brands|models` silindi, **`GET /api/resources/manufacturers|brands|models`** olaraq yaradıldı. `GET /api/products` siyahı filtrindən `manufacturer`/`brand` query param-ları çıxarıldı.
- `MyResourceServiceImpl`: `resolveNewProduct()` artıq bu 4 sahəni `CreateProductRequest`-ə köçürmür (Product-da yoxdur); `create()` bunları birbaşa yaradılan `Resource`-a yazır; `toResponse`/`toDetailResponse` bu sahələri `Resource`-dan oxuyur (əvvəllər `ProductResponse`-dan oxuyurdu).

**`resource_price_averages` view-dan `manufacturer`/`brand`/`model` tamamilə çıxarıldı (istifadəçi ilə birlikdə qərar verildi):** bu view `(product_id, region_id)` üzrə **bir neçə təşkilatın qiymətini birlikdə** ortalayır, indi isə hər təşkilatın öz brendi ola bilər — ortalanan qrupu düzgün təsvir edən TƏK bir manufacturer/brand/model dəyəri yoxdur (məhz eyni səbəbdən brand/manufacturer əvvəlcədən `MatchKeyCalculator`-dan kənarda saxlanılıb). `region_id`/`resource_name` (product-un öz adı)/`description` kimi sahələr toxunulmadı — bunlar problemsiz qalır. `ResourcePriceAverageResponse`-dan da bu 3 sahə silindi.

**Yeni "Resurs yarat" axını (frontend üçün, `FRONTEND_AI_PROMPT_PRODUCTS.md`-də detallı):** istifadəçi ya `resource_categories` son (leaf) sətrini seçib yeni product yaradır (ad avtomatik kateqoriya adından dolur, `description` server-də qurulur), ya da mövcud bir `product` seçir (bu halda `description`/attributlar/`unitId` həmin product-dan avtomatik gəlir). Hər iki halda `manufacturer`/`brand`/`model`/`specification` HƏMİŞə istifadəçidən soruşulur və `resources`-a yazılır (product-un identitetinə deyil).

**Canlı test (2026-07-31, sıfırdan yaradılmış DB, real Postgres + HTTP):**
| Addım | Nəticə |
|---|---|
| `POST /api/products` (atributsuz) | ✅ `description` = kateqoriya adı |
| `POST /api/products` (`Diametr=100` atributu ilə) | ✅ `description` = `"...polad borular — Diametr: 100"` |
| `POST /api/resources` (`manufacturer` göndərilmədən) | ✅ `400`, `"Manufacturer is required"` |
| Eyni product-a **iki fərqli** `POST /api/resources` (AzPipe/Norm və AzTexnika/AzTexnika) | ✅ hər ikisi öz brendini saxlayır, product toxunulmayıb |
| `GET /api/resources/manufacturers?search=Az` | ✅ `["AzPipe","AzTexnika"]` |
| Hər iki resource-a eyni region-da qiymət (100/110 AZN) | ✅ |
| `GET /api/resource-prices/averages` | ✅ `avgPrice=105`, `sampleCount=2`, cavabda **manufacturer/brand/model yoxdur** |
| `POST /api/resources/mine` (vendor1, `productId` olmadan, `manufacturer`-siz) | ✅ `400` |
| `POST /api/resources/mine` (vendor1, `productId` ilə mövcud product seçib, öz brendini göndərib) | ✅ resource öz brendini göstərir, product-un `description`/`name`-i toxunulmayıb |

**Build/test:** `./gradlew build` ✅, **57 unit test, 0 uğursuz** (mövcud testlər bu sahələrə assert etmirdi, dəyişiklik tələb olunmadı). Backend restart edildi (`docker compose down -v` + `up -d` — migrasiyalar yerində redaktə olunduğu üçün, bölmə 4t-dəki eyni səbəbdən; orphan `bootRun` prosesi 2 dəfə tapılıb öldürüldü, bölmə 0). `FRONTEND_AI_PROMPT_PRODUCTS.md` uyğun olaraq yeniləndi (bax faylın özü).

---

## 4v. `code` sahəsi `resource_categories`/`regions`/`units`-dən tamamilə silindi (2026-07-31)

**Səbəb:** istifadəçi bu üç cədvəldə `code` sütununun nəyə lazım olduğunu soruşdu; araşdırma göstərdi ki, bu sahə heç bir biznes məntiqinə (matching, product-un öz kod generasiyası və s.) təsir etmir — yalnız (parent-scoped/global) unikallıq açarı və axtarış filtri kimi işlədilirdi. `units.code` isə əlavə olaraq API cavablarında (`unitCode`/`defaultUnitCode`) görünürdü, amma yanında artıq `unitSymbol`/`defaultUnitSymbol` var idi — istifadəçi "ad və simvol kifayət etmirmi?" sualı ilə üçünü də silməyi seçdi.

**Dəyişikliklər:**
- Migrasiyalar yerində redaktə edildi: `012-create-units-table.xml`, `015-create-regions-table.xml` (`code` sütunu + `uk_units_code`/`uk_regions_code` unique constraint-ləri silindi), `009-create-resource-categories-table.xml` (`code` sütunu + `uk_resource_categories_root_code`/`uk_resource_categories_child_code` partial unique index-ləri silindi).
- Entity-lər: `Unit`, `Region`, `ResourceCategory` — `code` field-i silindi.
- DTO-lar: hər üçünün Create/Update/Response/SearchCriteria-sından `code` çıxarıldı.
- `ProductAttributeResponse.unitCode`, `AttributeDefinitionResponse.defaultUnitCode`, `CategoryAttributeDefinitionResponse.defaultUnitCode` silindi (yanlarındakı `unitSymbol`/`defaultUnitSymbol` qalır) — mənbə: `ProductServiceImpl`/`AttributeDefinitionServiceImpl`/`CategoryAttributeDefinitionServiceImpl`-dəki `.unitCode(unit.getCode())`/`.defaultUnitCode(...)` sətirləri silindi.
- Repository-lər: `UnitRepository`/`RegionRepository`-dən `existsByCodeIgnoreCase(AndIdNot)`, `ResourceCategoryRepository`-dən 4 `existsByParentId...Code...` metodu silindi. `*Specifications.hasCode()` predikatları silindi (üçü də).
- Service impl-lərdə `assertCodeNotDuplicate` metodları və çağırışları (`create`/`update`, `ResourceCategoryServiceImpl.moveCategory()` daxil) silindi. `DuplicateUnitCodeException`, `DuplicateRegionCodeException`, `DuplicateCategoryCodeException` fayl olaraq silindi, `GlobalExceptionHandler`-in exception massivindən çıxarıldı.
- Controller-lərdə `code` query-param filtri silindi (`UnitController`/`RegionController`/`ResourceCategoryController`), `@Operation` təsvirləri yeniləndi.
- **Toxunulmayıb:** `products.code` (`MAT-000001` kimi, məhsulun öz kodu), `suppliers.code` — bunlar tamam ayrı konsepdir, əhatə xaricindədir.

**Canlı test (2026-07-31, sıfırdan yaradılmış DB):** unit/region/root-kateqoriya/leaf-kateqoriya `code`-suz yaradıldı ✅; `defaultUnitId`-li atribut + kateqoriyaya bağlama + `code`-suz product yaradılması ✅ (`description` avtomatik "Polad borular — Diametr: 50" kimi qaldı, `code`-un yoxluğu bunu pozmadı); `GET /api/products/{id}/attributes` cavabında `unitSymbol` var, `unitCode` yoxdur ✅; product-un öz `code`-u (`MAT-000001`) toxunulmadan işləməyə davam edir ✅.

**Build/test:** `./gradlew build` ✅, **57 unit test, 0 uğursuz** (bu üç cədvəl üçün xüsusi test faylı heç vaxt olmayıb). Backend restart (`docker compose down -v` + `up -d`, orphan `bootRun` prosesi öldürüldü, bölmə 0). `FRONTEND_AI_PROMPT.md` (§2 Resource Categories, §5 Units, §7 Regions) və `FRONTEND_AI_PROMPT_PRODUCTS.md` (§2.1 `unitCode` nümunəsi) uyğun yeniləndi.

---

## 4w. Admin panel: Organization (vendor) + User (mərkəzi heyət) + Role lookup API-ları (2026-08-03)

**Səbəb:** istifadəçi admin panelə "Təşkilat yarat" + "İstifadəçi yarat" UI-ı istədi. Araşdırma göstərdi ki, `organizations` yalnız DB sxemi/entity səviyyəsində var idi (heç bir controller/service/DTO), `/api/users` ümumiyyətlə yox idi (yalnız `AuthController#me` → `UserService.getCurrentUser`), `/api/roles` də yox idi. Domen aydınlaşdırıldı (istifadəçi ilə): "mərkəz" `organizationId=NULL` ilə təmsil olunur (heç bir `CENTRAL` tipli sətir DB-də yaranmır), yalnız `VENDOR` tipli təşkilat sətirləri yaranır və hər biri **bir** giriş hesabı ilə (`actorType=ORGANIZATION`) sistemə daxil olur. İstifadəçi yaratma (`/api/users`) yalnız mərkəzi fərdi heyət üçündür (`actorType=INDIVIDUAL`, `organizationId=NULL`) — vendor təşkilatlar üçün ayrıca "istifadəçi əlavə et" axını yoxdur.

**Qərarlar (istifadəçi ilə təsdiqlənib):**
- `POST /api/organizations` yalnız `VENDOR` yaradır (`type` sahəsi request-də yoxdur, server sərt kodlanıb) — `CENTRAL`-a hazırda heç bir mövcud məntiq baxmır, spekulyativ olardı.
- Vendor təşkilat yaradılanda onun tək giriş hesabı (`username`/`email`/`password`/`roleNames`) **eyni sorğuda, eyni tranzaksiyada** yaranır (iki addım yox).
- Rollar `GET /api/roles`-dan seçilir (frontend-də hardcode yox) — mövcud `roles` cədvəli/`RoleRepository` üzərindən.

**Icazə tapıntısı:** `USER_READ`/`USER_WRITE`/`USER_DELETE`/`ROLE_READ`/`ROLE_WRITE` permission-ları artıq **008** migrasiyasında seed olunmuşdu və **artıq** `SUPER_ADMIN`/`ADMIN`-ə verilmişdi — heç bir yeni permission/grant lazım olmadı. Yalnız `ORGANIZATION_READ`/`ORGANIZATION_WRITE` yeni idi (migrasiya `035`, `023`+`025`-dəki eyni seed+grant pattern-i ilə).

**Yeni backend:**
- `POST /api/organizations` (`ORGANIZATION_WRITE`): `name`/`taxId`/`contactInfo` + bundle giriş hesabı (`username`/`email`/`password`/`roleNames`). Username/email təkrarlanarsa → 400. `roleNames`-dən naməlum rol → 400. `PUT /{id}` (`ORGANIZATION_WRITE`): `name`/`taxId`/`contactInfo`/`status` (1=ACTIVE/2=INACTIVE/3=SUSPENDED). `GET /{id}`, `GET` (paginated, `name`/`status` filtri) — hər ikisi `ORGANIZATION_READ`. Cavab (`OrganizationResponse`): `type`/`status` **raw Integer kod** kimi (mövcud `UserResponse.actorType` konvensiyası ilə eyni).
- `POST /api/users` (`USER_WRITE`): `username`/`email`/`password`/`firstName`/`lastName`/`roleNames` — `organizationId`/`actorType` request-də YOXDUR, server `organizationId=NULL`/`actorType=INDIVIDUAL` təyin edir (`CreateResourceRequest.organizationId`-dəki eyni anti-spoofing məntiqi, bölmə 4l). `PUT /{id}` (`USER_WRITE`): `firstName`/`lastName`/`enabled`/`accountNonLocked`/`roleNames` (parol dəyişmə YOXDUR, scope-dan kənar). `GET /{id}`/`GET` (paginated, `username`/`email`/`enabled` filtri) — `USER_READ`. **Bütün 4 endpoint yalnız `organizationId IS NULL` istifadəçiləri görür/redaktə edir** (`UserSpecifications.isCentralStaff()`) — vendor giriş hesabları bu endpoint-lərdə görünmür, `GET /{id}` ilə birbaşa UUID ilə cəhd etsə belə 404 qaytarır.
- `GET /api/roles` (`ROLE_READ`): sadə siyahı (paginasiya yoxdur, 6 sabit rol).
- Yeni fayllar: `Create/UpdateOrganizationRequest`, `OrganizationSearchCriteria`, `OrganizationResponse`, `OrganizationMapper`, `OrganizationSpecifications`, `OrganizationService(Impl)`, `OrganizationController`; `Create/UpdateUserRequest`, `UserSearchCriteria`, `UserSpecifications`, genişləndirilmiş `UserService(Impl)`, `UserController`; `RoleResponse`, `RoleMapper`, `RoleService(Impl)`, `RoleController`. `OrganizationRepository`/`UserRepository`-ə `JpaSpecificationExecutor` əlavə olundu.

**Canlı test (2026-08-03, real Postgres, real JWT):**

| Ssenari | Nəticə |
|---|---|
| `GET /api/roles` (admin) | ✅ 6 rol |
| `POST /api/organizations` (yeni vendor, bundle giriş hesabı) | ✅ 201, `type=2`, `status=1` |
| Yeni vendor username/password ilə login + `/me` | ✅ `organizationId`=yeni org id, `actorType=2` |
| Eyni username ilə təkrar `POST /api/organizations` | ✅ 400 "Username is already taken" |
| Vendor hesabı özü `POST /api/organizations` çağırır | ✅ 403 (icazəsi yoxdur) |
| `POST /api/users` (mərkəzi heyət, `organizationId` göndərilmədən) | ✅ 201, `organizationId` cavabda yoxdur (`null`), `actorType=1` |
| Yeni mərkəzi istifadəçi login + `/me` | ✅ düzgün profil |
| `GET /api/organizations?name=...`, `GET /api/users?username=...` (paginated) | ✅ `PageResponse` formatı düzgün |
| `GET /api/users/{vendor-giriş-hesabının-id-si}` (admin, birbaşa UUID) | ✅ 404 (mərkəzi-heyət scope-undan kənar) |
| `PUT /api/organizations/{id}` (`status=3`, suspend) | ✅ 200, `status=3` |

**Build/test:** `./gradlew build` ✅ (kompilyasiya + bütün mövcud unit testlər yaşıl). Backend restart edildi (`bootRun`, orphan `java.exe` port 8181-də tapılıb öldürüldü, bölmə 0). Test data (`Acme Construction Supplies` vendor təşkilatı + `acme-vendor` giriş hesabı + `jane-central` mərkəzi istifadəçi) DB-də qalır — digər modullarda dəfələrlə qeyd olunan "istinad edilən sətir silinməz" (`FK RESTRICT`) qaydasına görə, informativ test data kimi.

**Frontend üçün:** `FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` yeni yazıldı (bax faylın özü) — tam request/response JSON, validasiya/xəta halları, icazə gating (mövcud `isCentralAdmin` yoxlaması kifayətdir, çünki bu 5 icazə də yalnız `SUPER_ADMIN`/`ADMIN`-ə verilib).

---

## 4x. `OrganizationType` genişləndirilməsi + `Supplier`-in ləğvi + qiymət-yaratma icazə boşluğunun bağlanması (2026-08-04)

**Səbəb:** Rəhbərlik istəyir ki, üç növ təşkilat (istehsalçı, satış müəssisəsi/distribyutor, satınalıb-satan/reseller) sistemə öz məhsullarını yerləşdirə bilsin. Müzakirə zamanı üç əlaqəli problem üzə çıxdı: (1) `OrganizationType` yalnız `CENTRAL`/`VENDOR` idi və heç bir biznes məntiqində oxunmurdu; (2) `Supplier` `Organization`-ın nazik, faktiki 1:1 "kölgəsi" idi (`MyResourceServiceImpl` artıq hər VENDOR üçün avtomatik yaradırdı); (3) **real bug**: `POST /api/resource-prices` istənilən `supplierId`-ni istənilən resursa bağlamağa icazə verirdi — yoxlama yox idi ki, təchizatçı resursun sahibi olan təşkilatla və ya göndərənin öz təşkilatı ilə uyğun gəlsin, yəni CENTRAL (və ya istənilən `COST_WRITE` sahibi) başqa təşkilatın adına qiymət "uydura" bilərdi.

**Qərarlar (istifadəçi ilə addım-addım təsdiqlənib):**
- `OrganizationType`: `CENTRAL(1), VENDOR(2)` → `CENTRAL(1), MANUFACTURER(2), DISTRIBUTOR(3), RESELLER(4), GOVERNMENT(5), OTHER(6)`. Migrasiya `036` mövcud `type=2` (köhnə VENDOR) təşkilatları **açıq şəkildə `OTHER(6)`-ya köçürür** — kod-2-nin yeni mənası (MANUFACTURER) ilə səssizcə səhv təsnif olunmasınlar deyə.
- `Supplier`/`suppliers` tamamilə silindi. `resource_prices.supplier_id` → `organization_id`. Migrasiya `037`: bağsız (`organization_id IS NULL`) amma istifadədə olan 2 supplier (`test4545`, `MMCtest001`) üçün placeholder `Organization` (`type=OTHER`) yaradılır, sonra bütün 25 qiymət sətri `organization_id`-yə köçürülür, `uk_resource_prices_active_open` yeni sütunla yenidən qurulur.
- `ResourcePriceServiceImpl.create()`: `organizationId` artıq **həmişə `CurrentUserUtil.currentOrganizationId()`-dən** həll olunur, heç vaxt request-dən götürülmür. Mərkəzi heyət (`organizationId=NULL`) → `400 BadRequestException`. Resurs ya paylaşılan (`organizationId IS NULL`) ya da çağıranın öz təşkilatına aid olmalıdır, əks halda `404` (`VIEW_ALL_ORGANIZATION_RESOURCES` bura tətbiq olunmur — görmək başqasının adına yaratmaq demək deyil). `update()`: `organizationId` yaradılışdan sonra dəyişməz.
- `Create/UpdateOrganizationRequest`-ə `type` sahəsi əlavə olundu (əvvəllər `OrganizationServiceImpl.create()` sərt `VENDOR` kodlayırdı).

**Silinən fayllar:** `entity/Supplier`, `repository/SupplierRepository`+`SupplierSpecifications`, `service/SupplierService`+`Impl`, `controller/SupplierController`, `mapper/SupplierMapper`, `dto/request/{Create,Update}SupplierRequest`+`SupplierSearchCriteria`, `dto/response/SupplierResponse`, `exception/{DuplicateSupplierCodeException,SupplierInUseException}`.

**Canlı test (2026-08-04, real Postgres, real JWT, 2 yeni test təşkilatı — Test Manufacturer Co/`test-mfg-01`, Test Distributor Co/`test-dist-01`):**

| Ssenari | Nəticə |
|---|---|
| `POST /api/organizations` `type=2/3` (MANUFACTURER/DISTRIBUTOR) | ✅ 201 |
| `POST /api/organizations` `type=1` (CENTRAL) | ✅ 400 "CENTRAL is not a valid organization type here" |
| `PUT /api/organizations/{id}` `type=4`-ə dəyişmə | ✅ 200, əks olunur |
| `test-mfg-01` öz resursuna qiymət göndərir | ✅ 201, `organizationId` avtomatik düzgün |
| `test-dist-01` (başqa təşkilat) `test-mfg-01`-in resursuna cəhd | ✅ 404 |
| `admin` (mərkəzi, `organizationId=NULL`) qiymət göndərməyə cəhd | ✅ 400 |
| Paylaşılan resursa (`organizationId=NULL`) 2 fərqli təşkilat öz qiymətini göndərir | ✅ hər ikisi 201 (fərqli `organizationId`) |
| `GET /api/suppliers` | ✅ 404 (əvvəllər 500 idi — yan-tapıntı, bax bölmə 5, #13) |
| `GET /api/resource-prices/search?organizationId=...` (köhnə bağsız supplier-in yeni placeholder org-u) | ✅ 3 tarixi qiymət sətri düzgün tapılır |
| Eyni-gün təkrar göndərmə düzəlişi (bölmə 5, #12) refaktordan sonra | ✅ hələ işləyir |

**Build/test:** `./gradlew build` + `./gradlew test` ✅ (63 unit test — `ResourcePriceServiceImplTest` yenidən yazıldı: `SupplierRepository` mock-u silindi, `TestSecurityContext.authenticateAs(...)` ilə təşkilat kontekstinin bütün happy-path testlərinə əlavə olundu, yeni `create_withoutAnOrganizationAccount_isBadRequest` testi əlavə olundu). Backend restart edildi (bölmə 0-dakı orphan-process yoxlaması ilə).

---

## 4y. `ResourcePrice.createdBy`/`approvedBy` üçün ad göstərilməsi — `createdByName`/`approvedByName` (2026-08-04)

**Səbəb:** bölmə 4x-in frontend sənədində (`FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md` § 4) açıq boşluq kimi qeyd olunmuşdu: `GET /api/users/{id}` yalnız mərkəzi heyəti tapır (`organizationId IS NULL` filtri), vendor giriş hesabının UUID-i ilə çağırılsa 404 qaytarır — vendor tərəfindən göndərilən qiymətin `createdBy`-ı üçün ad göstərmək mümkün deyildi. Əlavə olaraq, `approvedBy` (həmişə mərkəzi istifadəçi) texniki cəhətdən `/api/users/{id}`-dən tapıla bilsə də, adi (mərkəzi olmayan) istifadəçinin bu endpoint-ə `USER_READ` icazəsi yoxdur — vendor öz qiymətinin kim tərəfindən təsdiqləndiyini görə bilmirdi.

**Həll:** yeni ümumi lookup endpoint AÇILMADI (təhlükəsizlik səthini genişləndirməmək üçün) — əvəzinə ad birbaşa `ResourcePriceResponse`/`FlaggedPriceReviewResponse`-a **denormalize edilir** (mövcud `ResourceResponse.product` konvensiyasına uyğun, server-side servisdə). Yeni sahələr: `createdByName`, `approvedByName` (hər ikisi `User.username`-dan, nullable). `UserRepository`-ə batch-lookup əlavə olundu (`findUsernamesByIdIn`, `UsernameProjection` — N+1-in qarşısını almaq üçün, paginasiyalı endpoint-lərdə (`getHistory`/`search`/`listFlagged`) bir səhifə üçün bütün fərqli `createdBy`/`approvedBy` ID-ləri tək sorğuda toplanır, tək-sətir endpoint-lərdə (`create`/`update`/`approve`/`reject`/`getById`/`getCurrentPrice`) 1 kiçik sorğu kifayətdir).

**Canlı test (2026-08-04):** `GET /api/resource-prices/{id}` (vendor-un göndərdiyi qiymət, admin baxır) → `createdByName: "test-mfg-01"` ✅. `GET /api/resource-prices/search?organizationId=...` (3 sətir) → hamısında `createdByName` düzgün, tək sorğu ilə (batch) ✅. `GET /api/resource-prices/flagged` → müxtəlif təşkilatların sətirlərində fərqli `createdByName`-lər düzgün ✅. `PATCH /{id}/approve` → `approvedByName: "admin"` cavabda dərhal görünür ✅.

**Build/test:** `./gradlew build` ✅ (63 unit test, dəyişməyib — mövcud testlər `mapper` mock-unun `null` qaytarmasına qarşı `enrichNames`-ə əlavə edilmiş null-check sayəsində sınmadı, yeni ayrıca test yazılmadı, canlı HTTP ilə yoxlanıldı).

**Qalan məhdudiyyət:** bu, YALNIZ `ResourcePrice`-a aiddir. Tətbiqin başqa yerlərində (məs. `Resource.createdBy`/`modifiedBy`, `Product.createdBy` və s.) eyni "vendor istifadəçisinin adı görünmür" problemi hələ də mövcuddur — bu sessiyada yalnız istifadəçinin konkret qeyd etdiyi qiymət ekranı həll olundu, ümumi bir "audit-user-name" mexanizmi tikilmədi (lazım olsa gələcək iş kimi qeyd edin).

**Frontend üçün:** `FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md` § 4-dəki "❌ Hələ də mümkün DEYİL" qeydi köhnəlib — yenilənməlidir (bax növbəti mesaj/tapşırıq).

---

## 4z. Resurs filtrləri (`name`/`code`/`regionId`/`minPrice`/`maxPrice`) + `organizationName`/`username` denormalizasiyası + data düzəlişi (2026-08-04)

**Səbəb:** frontend tərəfindən yazılmış strukturlaşdırılmış sorğu sənədi (`FRONTEND_AI_PROMPT_ORG_TYPE_AND_PRICE_OWNERSHIP.md`-nin davamı kimi) 4 bənd təqdim etdi. Hər biri kodla/canlı DB ilə yoxlanıldı, hamısı doğru çıxdı:

1. **`GET /api/resources` yeni filtrlər**: `name`/`code` (bağlı `Product`-un adına/koduna görə, `ProductSpecifications` ilə eyni contains-pattern), `regionId` (yalnız bu regionda cari `APPROVED` qiyməti olan resurslar), `minPrice`/`maxPrice` (eyni cari qiymətə görə aralıq). **Qərar** (frontend-in özünün təklif etdiyi kompromis qəbul edildi): `minPrice`/`maxPrice` `regionId` olmadan göndərilsə `400` — valyuta konversiyası bu tətbiqdə heç yerdə yoxdur (bütün sistem faktiki tək-valyutalıdır), region-suz müqayisə mənasız olardı.
2. **`organizationName`/`organizationType`** `ResourceResponse`-a, **`organizationName`** `ResourcePriceResponse`/`FlaggedPriceReviewResponse`-a əlavə olundu (server-side, batch-lookup, `bölmə 4y`-dəki `createdByName` konvensiyası ilə eyni — `ORGANIZATION_READ` icazəsi genişləndirilmədi, ad birbaşa cavaba yapışdırıldı).
3. **`username`** `OrganizationResponse`-a əlavə olundu (yalnız oxumaq üçün) — `UserRepository.findByOrganizationId`/`findUsernamesByOrganizationIdIn` (bir vendor təşkilatın tək bundle giriş hesabı).
4. **Data anomaliyası təsdiqləndi və düzəldildi**: "Vendor Alpha MMC" (`aaaaaaaa-...`) canlı DB-də `type=1` (CENTRAL) idi — bu, migrasiya `036`-dan qaynaqlanmır (o yalnız `type=2`-ni hədəflədi), sessiyadan əvvəlki seed-data xətası idi. Yeni migrasiya `038`: `UPDATE organizations SET type = 6 WHERE type = 1;` (eyni "CENTRAL heç vaxt real sətir olmasın" prinsipi, `036` ilə eyni forma).

**Yeni fayllar/dəyişikliklər:** `UserRepository.findByOrganizationId`/`findUsernamesByOrganizationIdIn`, `OrganizationRepository.findNameTypeByIdIn` (yeni batch-lookup query-lər), `ResourceSearchCriteria`/`ResourceController`/`ResourceSpecifications` (yeni filtrlər), `OrganizationServiceImpl`/`ResourceServiceImpl`/`ResourcePriceServiceImpl` (enrichment məntiqi).

**Canlı test (2026-08-04):**

| Ssenari | Nəticə |
|---|---|
| `GET /api/organizations/{id}` / list | ✅ `username` dolu (məs. `"vendor1"`, `"acme-vendor"`), login hesabı olmayan (placeholder) təşkilatlarda `null` |
| `GET /api/resources/{id}` | ✅ `organizationName`/`organizationType` dolu |
| Vendor (COST_READ, `ORGANIZATION_READ` YOXDUR) `GET /api/resource-prices/{id}` | ✅ `organizationName` görünür, heç bir 403 |
| `GET /api/resources?name=Polad` / `?code=MAT-000002` | ✅ düzgün nəticələr |
| `GET /api/resources?minPrice=10` (regionId-siz) | ✅ `400 "regionId is required..."` |
| `GET /api/resources?regionId=...&minPrice=40&maxPrice=46` | ✅ yalnız uyğun cari qiyməti olan resurslar |
| `aaaaaaaa-...` (Vendor Alpha MMC) `type` | ✅ `6` (əvvəl `1` idi) |

**Build/test:** `./gradlew build` ✅ (58 test — mövcud `ResourceServiceImplTest`/`ResourcePriceServiceImplTest`-ə yeni `OrganizationRepository` mock-u əlavə olundu, `@InjectMocks`/constructor call-ları uyğunlaşdırıldı, yeni ayrıca test yazılmadı, canlı HTTP ilə yoxlanıldı). Backend restart edildi.

---

## 4aa. `GET /api/resources/mine` filtrləri `code`/`regionId`/`minPrice`/`maxPrice`/`hasPrice` ilə genişləndirildi (2026-08-06)

**Səbəb:** "Mənim Resurslarım" (`/mine`) ekranında `name`/`category`/`status`-dan başqa heç bir filter işləmirdi. Kök səbəb: bu 5 filter frontend tərəfindən `bölmə 4z`-dəki ümumi `GET /api/resources` filtrlərindən köçürülmüşdü, amma `/mine` endpoint-i onları heç vaxt qəbul etməmişdi — Spring naməlum query parametrlərini səssizcə atır, nəticədə UI-da sahə dolur, cədvəl dəyişmirdi. `hasPrice` isə əvvəllər yalnız cavab sahəsi idi (`MyResourceServiceImpl.hasPriceLookup`), filter kimi heç vaxt mövcud olmayıb.

**Dəyişiklik:** `bölmə 4z`-dəki `ResourceSpecifications` pattern-i `MyResourceSpecifications`-a köçürüldü (`hasProductCode`, `hasCurrentPriceInRegionRange` — eyni "regionId olmadan minPrice/maxPrice mənasızdır" qaydası), üstəlik yeni `hasAnyPrice` predikatı (`hasPrice=true/false`, cavabdakı `hasPrice` sahəsi ilə eyni məna — istənilən statusda/regionda olan istənilən qiymət). `MyResourceSearchCriteria`/`MyResourceController`/`MyResourceServiceImpl.search` (regionId-siz min/maxPrice → `400`, `bölmə 4z` ilə eyni) uyğunlaşdırıldı.

**Canlı test (2026-08-06, yeni `filtertest-vendor` təşkilatı, 2 resurs — biri qiymətli, biri qiymətsiz):**

| Ssenari | Nəticə |
|---|---|
| `?code=MCH-000013` (hər iki resursun kodu) | ✅ `totalElements=2` |
| `?code=NOPE-DOES-NOT-EXIST` | ✅ `totalElements=0` |
| `?hasPrice=true` | ✅ `totalElements=1`, yalnız qiyməti olan resurs |
| `?hasPrice=false` | ✅ `totalElements=1`, yalnız qiyməti olmayan resurs |
| `?regionId=Bakı&minPrice=50&maxPrice=150` (qiymət=100) | ✅ `totalElements=1` |
| `?regionId=Bakı&minPrice=200` (qiymət 100 aşağıdır) | ✅ `totalElements=0` |
| `?minPrice=50` (regionId-siz) | ✅ `400 "regionId is required when minPrice/maxPrice is given"` |
| Filtersiz baza sorğu | ✅ `totalElements=2` |

**Build/test:** `./gradlew build` ✅ (bu modul üçün ayrıca unit test yoxdur, yalnız canlı HTTP ilə doğrulandı — `bölmə 4r` ilə eyni yanaşma). Köhnə orphan `bootRun` prosesi (PID 25800, köhnə kodla) tapılıb öldürüldü, yenidən başladıldı, `/actuator/health` → `UP`.

---

## 4bb. Sənəd idxalı + kateqoriya-əsaslı toplu resurs yaratma + bildirişlər (2026-08-10)

**Səbəb:** `FRONTEND_AI_PROMPT_DOCUMENT_IMPORT_4.md` (4 iterasiyada frontend AI ilə razılaşdırılmış v2 dizayn) — vendor artıq "Mənim Resurslarım"da əl ilə doldurmur, sənəd (Excel/PDF/Word/şəkil) yükləyir; mərkəz işçisi sənədi kilidləyib kateqoriya-əsaslı toplu formada resurs+qiymət yaradır.

**Arxitektur tapıntısı (icraya başlamazdan əvvəl):** `ResourcePriceServiceImpl.create()` `organizationId`-ni HƏMİŞƏ çağıranın öz hesabından götürürdü (`CurrentUserUtil.currentOrganizationId()`) — mərkəz işçisinin isə bu sahəsi `null`-dur, ona görə mərkəz işçisi vendor adından qiymət göndərə bilmirdi. `Resource` tərəfində bu artıq həll olunmuşdu (`CreateResourceRequest.organizationId`, yalnız `VIEW_ALL_ORGANIZATION_RESOURCES` ilə). Eyni pattern `ResourcePrice`-a da köçürüldü (`resolveOwningOrganization`) — yeni məntiq yox, mövcud, sınanmış konvensiyanın təkrarı.

**Yeni:**
- `documents`/`notifications` cədvəlləri (`039`-`041`), `resources.document_id` (`041`), `DOCUMENT_UPLOAD`/`DOCUMENT_REVIEW` icazələri + `VIEW_ALL_ORGANIZATION_RESOURCES`-in `ANALYST`-a genişlənməsi (`042`-`043`).
- MinIO inteqrasiyası (`io.minio:minio`, `docker-compose.yml`-də yeni servis, backend-proksi upload/download — birbaşa MinIO girişi yoxdur).
- `POST /api/documents` (whitelist: xlsx/xls/pdf/doc/docx/jpg/jpeg/png, `.docm` ört-basdır edilmir — sadəcə whitelist-də yoxdur), `GET /mine`, `GET/{id}`, `GET/{id}/download`, `GET` (mərkəzi siyahı), `PATCH /{id}/process` (kilid), `PATCH /{id}/status` (COMPLETED/REJECTED).
- **Kilid:** `PATCH /process` sənədi `IN_PROGRESS`-a keçirir, `processedBy`/`processedDate` yazır. Eyni işçi üçün idempotent, başqası üçün `409`. `ccms.documents.lock-timeout-hours` (defolt 24) keçəndə istənilən `DOCUMENT_REVIEW` sahibi kiliddi öz üzərinə götürə bilir — `CLARIFICATION_NEEDED`-dəki əbədi-ilişmə bug-unun (bax `[[project_ccms_resource_review_status_design]]`) təkrarlanmaması üçün əvvəlcədən qərar verildi.
- `POST /api/documents/{id}/resources` (yeni bulk endpoint, `DOCUMENT_REVIEW`+`COST_WRITE`+`VIEW_ALL_ORGANIZATION_RESOURCES`, yalnız kilid sahibi + `IN_PROGRESS`): hər sətir `productId` (mövcud) və ya `newProduct` (mövcud `ProductService.resolve()` find-or-create yolu, `MyResourceServiceImpl.resolveNewProduct()` pattern-i) qəbul edir, opsional qiymət (`CreateMyResourcePriceRequest` formu təkrar istifadə olunur). Hər sətir **ayrı `REQUIRES_NEW` tranzaksiyada** (`DocumentResourceRowProcessor`, `ProductWriter`-dəki təcrid pattern-i ilə eyni) — bir sətrin xətası digərlərini geri qaytarmır, cavab hər sətir üçün `success`/`error` göstərir.
- Bulk-yaradılan resurslar **review-statussuz** (birbaşa `POST /api/resources` semantikası, sadəcə `documentId` əlavə olunur) — kənar qiymətlər isə mövcud `ResourcePrice` `FLAGGED`→`approve/reject` axınından keçir, ikinci bir nəzarət qatı qurulmadı.
- `GET /api/resources?documentId=` — "Bax" audit görünüşü, mövcud endpoint-ə əlavə filtrdir.
- `UserResponse.permissions` (`Set<String>`, istifadəçinin bütün rollarındakı icazələrin birləşməsi) — frontend-in `DOCUMENT_UPLOAD`/`DOCUMENT_REVIEW`/`COST_WRITE` kimi icazələri UI-də göstərmək üçün heç vaxt görə bilmədiyi köhnə boşluq (bax `PLAN_DOCUMENT_IMPORT_AND_NOTIFICATIONS.md` §12.4) bağlandı.
- `GET /api/notifications/mine` (`{content, unreadCount}` bir sorğuda), `PATCH /{id}/read`, `PATCH /read-all`. Fan-out: sənəd yüklənəndə `DOCUMENT_REVIEW` icazəsi olan hər istifadəçiyə (`UserRepository.findAllWithPermission`) bir sətir.

**Canlı test (2026-08-10, yeni `doctest-vendor`/`doctest-central`/`doctest-central2` hesabları):**

| Ssenari | Nəticə |
|---|---|
| Vendor sənəd yükləyir (`.xlsx`) | ✅ `201`, status=`NEW` |
| Mərkəz olmayan (central, `organizationId=NULL`) yükləməyə cəhd | ✅ `400 "This action requires an organization account"` |
| `.docm` yükləmə cəhdi | ✅ `400`, whitelist mesajı |
| Vendor mərkəzi siyahıya (`GET /api/documents`) baxmağa cəhd | ✅ `403` |
| Central1 `PATCH /process` | ✅ `IN_PROGRESS`, `processedByName` dolu |
| Central1 təkrar `/process` (özü) | ✅ `200`, idempotent |
| Central2 `/process` (kiliddə) | ✅ `409`, "...doctest-central tərəfindən emal olunur" |
| Central2 (kilid sahibi deyil) bulk-create/complete cəhdi | ✅ hər ikisi `409` |
| Bulk-create: mövcud `productId` + qiymət | ✅ resurs+qiymət yarandı, `organizationId`=vendor-un (mərkəz işçisinin yox), qiymət `APPROVED` |
| Bulk-create: `newProduct` (find-or-create) | ✅ yeni product + resurs yarandı |
| Bulk-create: səhv `regionId` olan 3-cü sətir | ✅ yalnız o sətir uğursuz oldu (`success:false`+`error`), digər 2 sətir qaldı — `GET ?documentId=` `totalElements=2` təsdiqlədi (rollback təcridi işləyir) |
| `PATCH /status {COMPLETED}` (kilid sahibi) | ✅ `status=COMPLETED` |
| `COMPLETED`-i rədd etmə cəhdi | ✅ `400 "A completed document cannot be rejected"` |
| `COMPLETED`-i yenidən `/process` | ✅ `409` |
| Yeni sənəd, emala başlamazdan əvvəl `REJECTED` | ✅ işlədi (§2.1-ə uyğun) |
| Kilid timeout (DB-də `processed_date` 30 saat geri çəkildi, limit 24 saat) | ✅ central2 `/process` ilə kiliddi öz üzərinə götürdü |
| Upload → MinIO → download | ✅ bayt-bə-bayt eyni fayl |
| `GET /api/notifications/mine` (central1) | ✅ 1 bildiriş, `unreadCount=1`, düzgün mesaj/orqanizasiya adı |
| `PATCH /read` | ✅ `unreadCount` `0`-a düşdü |
| `GET /api/auth/me` | ✅ `permissions` sahəsi dolu (məs. `ANALYST` → `DOCUMENT_UPLOAD`, `DOCUMENT_REVIEW`, `COST_WRITE`, `VIEW_ALL_ORGANIZATION_RESOURCES` daxil) |

**Build/test:** `./gradlew build` ✅, `./gradlew test` ✅ (bütün mövcud unit testlər yaşıl, bu modul üçün ayrıca unit test yazılmadı — canlı HTTP ilə doğrulandı, `bölmə 4r`/`4aa` ilə eyni yanaşma). Backend restart edildi (`bootRun`), `docker compose up -d` ilə MinIO konteyneri əlavə olundu.

**Qalan məhdudiyyətlər (bilərəkdən, §9-dakı bəzi suallar hələ açıqdır):**
- `COMPLETED`-dən geri (`IN_PROGRESS`-a reopen) yolu yoxdur — istifadəçinin özü bu formada saxlamağı seçdi.
- Bildiriş yalnız `DOCUMENT_UPLOADED` üçündür (`COMPLETED`/`REJECTED` üçün vendor-a bildiriş getmir) — istifadəçinin qərarı.
- "X" (sətri sessiyada çıxar) frontend-only konsept, backend-ə heç nə göndərilmir/saxlanmır — bulk endpoint-ə göndərilməyən sətir sadəcə yoxdur.
- Excel-in avtomatik oxunması (Apache POI ilə sətirlərin ön-doldurulması) yoxdur — mərkəz işçisi əl ilə doldurur (Faza 2 fikri, `PLAN_DOCUMENT_IMPORT_AND_NOTIFICATIONS.md` §9).
- Antivirus skan yoxdur.

---

## 4cc. `users.email` login credential-dan ayrıldı — təşkilat yaratmada opsional əlaqə məlumatına çevrildi (2026-08-12)

**Kontekst:** Frontend `email` sahəsini "Yeni Təşkilat" formunda `İstifadəçi adı`/`Şifrə` arasında göstərirdi ki, bu, operatorlara sanki ayrıca bir email+parol login üsulu varmış kimi görünürdü (belə bir mexanizm heç vaxt olmayıb — login həmişə yalnız `username`+`password`-dur, `CustomUserDetailsService.loadUserByUsername()` yalnız `findByUsername` çağırır). Bundan əlavə, brauzerin auto-fill-i email-tipli input-u login sahəsi kimi tanıyıb admin-in öz saxlanmış məlumatlarını səhvən doldururdu.

**Əhəmiyyətli aydınlıq:** `email` `Organization` entity-sinin sahəsi deyil, tamamilə `User` (bundled login hesabı) cədvəlindədir (`users.email`), `taxId`/`contactInfo` kimi `Organization`-un öz sütunu yoxdur. Bu sütun **mərkəzi heyət** (`/api/users`) ilə **paylaşılır**, ona görə DB/entity səviyyəli dəyişiklik hər iki axına təsir edir, amma "məcburidirmi" qərarı hər DTO-nun öz validasiyasında qalır.

**Dəyişikliklər:**
- Migrasiya `044-make-users-email-nullable.xml` — `users.email`-dən `NOT NULL` silindi (`dropNotNullConstraint`), `UNIQUE` (`uk_users_email`) saxlanıldı. Postgres NULL-ları unique constraint daxilində bərabər saymadığı üçün istənilən sayda sətir email-siz qala bilər, yalnız DOLU email-lər arasında unikallıq yoxlanılır.
- `User.email` (`entity`) — `nullable=false` silindi, `unique=true` qalır.
- `CreateOrganizationRequest.email` — `@NotBlank` silindi, `@Email`+`@Size` qalır → **təşkilat yaradanda email opsionaldır**.
- `CreateUserRequest.email` (mərkəzi heyət) — **dəyişməyib**, `@NotBlank` qalır → mərkəzi hesab yaradanda email hələ də **məcburidir** (istifadəçinin qərarı).
- `OrganizationServiceImpl.create()`/`update()` — boş/whitespace email `""` əvəzinə `null`-a normalizasiya olunur (əks halda iki boş `""` unikallığı pozardı), unikallıq yoxlaması yalnız email dolu olanda işə düşür.
- `UpdateOrganizationRequest`-ə `email` (opsional) əlavə olundu; `PUT /api/organizations/{id}` indi bundled login-in email-ini redaktə edə bilir (əvvəllər heç bir yolla mümkün deyildi).
- `OrganizationResponse`-a `email` əlavə olundu (`GET /api/organizations`, `GET /api/organizations/{id}` — `findByOrganizationId`/`findLoginInfoByOrganizationIdIn` ilə bundled user-dən resolve olunur, `username` ilə eyni pattern).
- Login (`POST /api/auth/login`) — **toxunulmayıb**, artıq `username`+`password`-dur.

**Canlı HTTP test (2026-08-12):** email-siz iki təşkilat ardıcıl yaradıldı (unikallıq pozulmadı) → email ilə təşkilat yaradıldı → eyni email ilə ikinci cəhd `400 "Email is already taken"` verdi → `GET` siyahı/tək-obyekt cavablarında `email` göründü → `PUT` ilə boş təşkilata email əlavə edildi, sonra artıq-tutulmuş email-ə dəyişməyə cəhd `400` verdi, sonra email yenidən boşaldıldı (hamısı gözlənildiyi kimi) → `POST /api/users` email-siz göndərildi, gözlənildiyi kimi `400 "Email is required"` aldı (mərkəzi heyət üçün məcburilik qorunur) → vendor hesabı ilə `username`+`password` login əvvəlki kimi işlədi.

**Qeyd (əlaqəsiz, sadəcə müşahidə):** Test zamanı serverin öz loqlarında (canlı frontend trafikindən) eyni kateqoriyalı, əvvəldən mövcud bir bug aşkar edildi — `organizations.tax_id` da boş `""` dəyərlərlə `uk_organizations_tax_id`-i pozur (`update organizations ... tax_id=?` → `duplicate key value violates unique constraint`). Bu, indiki dəyişikliklə **əlaqəsizdir** və düzəldilməyib, sadəcə qeyd olunur — `taxId` üçün də eyni "boşu `null`-a çevir" həlli tələb oluna bilər.

---

## 4dd. Rüb (period) etiketləmə + tarixi/trend bazar analitikası — `resource_price_period_averages` (2026-08-14)

**Kontekst:** Excel export planlaşdırılarkən ("Əvvəlki dövrlə fərq (%)" sütunu) üzə çıxdı ki, `resource_price_averages` (bölmə 4j/#16-#19) **yalnız canlı/hazırkı snapshot**-dır — tarixi dövrlər (rüblər) üzrə ayrılma yoxdur. Daha dərin araşdırma zamanı istifadəçi ikinci, daha ciddi bir boşluq tapdı: sənəd idxalı (bölmə 4bb) hər emal edilən sətir üçün **qeyd-şərtsiz yeni `resources` sətri yaradır** (`DocumentResourceRowProcessor.processRow()` → `ResourceServiceImpl.create()`, heç bir dublikat axtarışı yoxdur) — yəni eyni təşkilat eyni məhsul üçün 3 ay sonra yenidən sənəd göndərsə, köhnə resursun qiyməti heç vaxt bağlanmadığı üçün yeni qiymətlə **əbədi qarışır** (`org_prices` median-ında). Bu, ayrıca bir problem olaraq qalır (aşağıdakı "Hələ həll olunmayıb" bəndinə bax) — bu gün görülən iş yalnız **rüb etiketləməsi**dir, istifadəçi ilə uzun müzakirədən sonra qərarlaşdırılan dizayn.

**Dizayn qərarı (istifadəçi ilə müzakirə, tətbiqdən əvvəl):** `period_year`/`period_quarter` **qiymətin özünə** yapışdırılır (resursa yox — bir resurs zaman içində bir çox qiymət ala bilər, rüb "bu qiymət nə vaxta aiddir" sualının cavabıdır). Bu, `effective_date`/`expire_date`-in "hazırda etibarlıdır" pəncərəsindən **tamamilə müstəqildir** — bir qiymət eyni anda həm "bu gün aktiv" (canlı view-də), həm də "keçən rübün etiketi" ola bilər, ziddiyyət deyil. Default sənədin/qiymətin tarixindən avtomatik hesablanır, amma **redaktə oluna bilər** (gecikmiş sənədlər üçün — məs. Mart qiymət siyahısı Aprel-də yüklənsə, rüb Mart-da qalmalıdır).

**Yeni:**
- Migrasiya `045` — `resource_prices.period_year`/`period_quarter` (`SMALLINT NOT NULL`, `CHECK period_quarter BETWEEN 1 AND 4`), mövcud sətirlər `effective_date`-dən backfill edildi (`EXTRACT(YEAR...)`, `CEIL(EXTRACT(MONTH...)/3.0)`).
- Migrasiya `046` — `documents.period_year`/`period_quarter` (nullable — köhnə sənədlər üçün backfill yoxdur, yenidən emal olunmurlar).
- `PeriodUtil` (`com.ccms.util`) — `quarterOf`/`yearOf(LocalDate)`, `ResourcePriceServiceImpl.create()` və `DocumentServiceImpl.upload()` tərəfindən paylaşılır.
- `CreateResourcePriceRequest.periodYear`/`periodQuarter` — opsional override (defolt `effectiveDate`-dən hesablanır, boş buraxıla bilər).
- `PATCH /api/documents/{id}/period` (`DOCUMENT_REVIEW`, `COMPLETED`-dən sonra bloklanır) — sənədin rübünü düzəltmək üçün.
- `DocumentResourceRowProcessor.createPrice()` — sənədin rübünü hər yaradılan qiymətə ötürür (bir sənədin bütün sətirləri defolt olaraq eyni rübü paylaşır, sətir-səviyyəli override yoxdur — v1 sadələşdirməsi).
- Migrasiya `047` — yeni **`resource_price_period_averages`** view: `resource_price_averages`-in (bölmə 4j/#16-#19) org-collapse + trimmed-mean məntiqini demək olar eynilə təkrarlayır, fərqlər: (1) `effective_date`/`expire_date` pəncərəsi yox, sadəcə `status=2`; (2) de-duplikasiya "eyni gün" yox, **"eyni rüb"** səviyyəsindədir (bir resurs eyni rübdə 2 dəfə qiymətləndirilsə, 1 dəfə sayılır — #19-un ümumiləşdirilməsi); (3) `LAG()` pəncərə funksiyası ilə `previous_avg_price`/`previous_median_price`/`period_over_period_change_pct` əlavə olundu ("əvvəlki" — təqvim rübü yox, məlumatı olan **ən yaxın əvvəlki** rüb). `r.active`/`r.deleted`/`p.active` filtrləri **saxlanıldı** (canlı view ilə eyni fəlsəfə — kataloqdan gizlədilmiş data heç bir hesabata düşməsin), bu, bilərəkdən edilən, gələcəkdə nəzərdən keçirilə bilən qərardır (görün view-in SQL şərhi).
- Yeni entity/repository/specifications/mapper/DTO/servis metodu (`ResourcePriceAverage`-in tam güzgüsü) + `GET /api/resource-prices/period-averages` (`COST_READ`, filtrlər: `productId`/`regionId`/`periodYear`/`periodQuarter`/`name`).

**Canlı DB test (2026-08-14):**
- Backfill təsdiqləndi: `MAT-000015`-in mövcud qiymətləri (`effective_date` 2026-08-10/11/14) → `period_year=2026, period_quarter=3` (avqust → Q3, düzgün).
- Yeni view mövcud canlı view ilə eyni nəticəni verdi (yalnız 1 rüb data olduğu üçün gözlənilən): `sample_count=2, resource_count=4, avg=median=55, min=50, max=75`, `previous_avg_price=NULL` (əvvəlki rüb yoxdur).
- Trend testi: sintetik Q2-2026 qiymət sətri (40 AZN, eyni resurs/org/region) əlavə edildi → Q3 sətri artıq `previous_avg_price=40.0000, previous_median_price=40.0000, period_over_period_change_pct=37.5000` göstərdi (`(55-40)/40*100`, dəqiq gözlənilən) → test sətri silindi, view orijinal 1-rüblük vəziyyətə qayıtdı.
- `GET /api/resource-prices/period-averages` HTTP səviyyəsində `401` (login yox idi, gözlənilən) — endpoint düzgün qeydiyyatdan keçib, `404` yox.
- `PATCH /api/documents/{id}/period` HTTP test edilmədi (sənəd/login lazımdır) — kod oxunuşu ilə təsdiqləndi (`updateStatus`-un eyni lock/`COMPLETED` qoruma pattern-i).

**Hələ həll olunmayıb (bilərəkdən, bu sessiyanın əhatəsindən kənarda):**
- **Dublikat-resurs problemi (yuxarıdakı "Kontekst"də təsvir olunan)** — 2026-08-17-də həll edildi, bax bölmə 4ee.
- Sətir-səviyyəli rüb override-i (BulkResourceRowRequest-də) yoxdur — bütün sənəd bir rübü paylaşır.
- Frontend tərəfi toxunulmayıb — nə `FRONTEND_AI_PROMPT_*.md`-yə əlavə edildi, nə də UI-da rüb seçimi/trend qrafiki üçün nəyisə planlaşdırıldı.
- Excel export-un özü (bu bütün müzakirənin başlanğıc səbəbi) hələ tətbiq edilməyib — bu, təməl infrastrukturdur.

---

## 4ee. Dublikat-resurs bug-ının həlli — `resources.superseded` bayrağı (2026-08-17)

**Kontekst:** bölmə 4dd-də təsvir olunan, həll edilməmiş qalan problem — sənəd yenidən emal edildikdə (`DocumentResourceRowProcessor`) və ya təşkilat eyni məhsul üçün əl ilə yeni resurs yaratdıqda, sistem heç vaxt mövcud resursu axtarmır, hər dəfə yeni `Resource` sətri yaradır (manual sahələri itirməmək üçün şüurlu qərar). Nəticədə köhnə və yeni resurs paralel "aktiv" qalır, `resource_price_averages`-in `org_prices` median addımında qarışır. İstifadəçi ilə uzun müzakirədən sonra "kobud yanaşma" qərarlaşdırıldı: yeni resurs/qiymət yaradılanda, eyni **təşkilat+məhsul+region** üzrə digər bütün açıq qiymətli resursları ayrıca bayraqla ("superseded") işarələ və qiymətini bağla — brend fərqinə baxmadan (diametr/uzunluq kimi fiziki fərqlər artıq struktur atributlar vasitəsilə `product_id` səviyyəsində ayrıldığı üçün, bu, fərqli fiziki variantlara toxunmur).

**Dizayn qərarları (müzakirə, tətbiqdən əvvəl):**
- Yeni, ayrıca `resources.superseded` sütunu (nə `status` review-workflow-u, nə `active`/`deleted` ilə qarışdırılmır — hər ikisi `resource_price_period_averages`-də də filtrləndiyi üçün tarixi rəqəmləri korlayardı).
- Region `resources`-da deyil, yalnız `resource_prices`-da olduğu üçün (təsdiqləndi: yeni resurs yaradılan an region hələ bilinmir), supersede-məntiqi `ResourcePriceServiceImpl`-də (qiymət təqdim edilən anda) yaşayır — bu, həm sənəd emalı, həm `MyResourceController`, həm `ResourceController` yollarının **hamısını** avtomatik əhatə edir (üçü də sonda eyni `ResourcePriceServiceImpl.create()`-ə gəlib çıxır).
- Yeni resursun `createdDate`-i (qiymətin `effectiveDate`-i yox) tarixi kəsim nöqtəsi kimi istifadə olunur, `retireOverlapping()`-in floor-məntiqi ilə eyni cür (öz `effectiveDate`-indən əvvələ düşmür).
- **Bilinən, qəbul edilmiş limit:** əgər supersede edən və edilən resursların qiymətləri **eyni rübə** düşürsə, `resource_price_period_averages` bu bayraqdan xəbərsiz qaldığı üçün (tarixi immutability üçün şüurlu qərar) hələ də o rübün öz sətrində median-blend edəcək. Fərqli rüblərdə bu problem yoxdur.

**Yeni:**
- Migrasiya `048` — `resources.superseded` (`BOOLEAN NOT NULL DEFAULT false`) + `idx_resources_org_product_superseded` indeksi. `db.changelog-master.xml`-də **024-dən əvvələ** yerləşdirilib (024 `runOnChange=true` olduğu üçün öz mövqeyində yenidən işə düşür — 048 ondan sonra olsaydı, `column r.superseded does not exist` xətası verirdi, canlı aşkarlandı və düzəldildi).
- `ResourcePriceRepository.findSiblingOpenPricesForSupersede()` — eyni org+product+region üzrə, sorğulanan resursdan başqa, hazırda açıq (`expireDate IS NULL OR >= bu gün`) APPROVED qiymətləri tapır.
- `ResourcePriceServiceImpl.supersedeSiblingResources()` — tapılan sibling qiymətləri bağlayır (`expireDate` = yeni resursun `createdDate`-i - 1 gün, floor edilib), müvafiq resursları `superseded=true` edir. `create()` (auto-approve yolu) və `approve()` (flag-lənmiş qiymət təsdiqi) hər ikisindən çağırılır — `retireOverlapping()`-dən fərqli olaraq exception atmır (avtomatik sistem hərəkətidir).
- `resource_price_averages` (024) — **DÜZƏLİŞ:** ilk versiyada WHERE bəndinə `AND r.superseded = false` əlavə edilmişdi, sonra (aşağıdakı DÜZƏLİŞ qeydinə bax) çıxarıldı, region-scoping bug-ı səbəbindən. Sibling qiymətin `expireDate`-inin bağlanması təkbaşına kifayətdir.
- `resource_price_period_averages` (047) — **toxunulmadı**, yalnız şərh əlavə olundu (niyə bilərəkdən belədir + yuxarıdakı bilinən limit).
- `ResourceResponse.superseded` — API-də görünən edildi (`ResourceServiceImpl.toResponse()`).

**Canlı DB test (2026-08-17, transaction + ROLLBACK, real seed data ilə birgə):** mövcud product+region üzərində R1 (yaranma tarixi Q2, qiymət 100, `expireDate=NULL`) və R2 (yaranma tarixi Q3, qiymət 200, `expireDate=NULL`) sintetik olaraq əlavə edildi. Sibling sorğusu R1-in qiymət sətrini düzgün tapdı. Supersede-dən **əvvəl** canlı view-də bu təşkilatın (median(100,200)=150 ilə çarpılmış) bazar ortası **105.0000** idi; supersede tətbiq ediləndən (R1 → `superseded=true`, `expireDate='2026-08-16'`) **sonra** düzgün **130.0000**-a düzəldi (yalnız R2-in real qiyməti sayıldı). Tarixi view-də isə Q2 sətri **toxunulmadan 100.0000** olaraq qaldı, Q3 sətri 130.0000 göstərdi — iki rüb arasında qarışma olmadığı təsdiqləndi. Migration sırası (`048` → `024`) `databasechangelog`-da təsdiqləndi.

**Test edilməyib:** Java metodunun (`supersedeSiblingResources`) özü HTTP vasitəsilə (login credential olmadığı üçün) — yuxarıdakı test SQL səviyyəsində metodun **məntiqini** simulyasiya edir, birbaşa Java kodunu deyil. Kompilyasiya təmizdir, tətbiq uğurla başladı.

**DÜZƏLİŞ (2026-08-17, frontend hazırlığı zamanı tapıldı):** frontend prompt-u yazarkən üzə çıxdı ki, `resource_price_averages`-ə (024) əlavə edilmiş `AND r.superseded = false` filtri **real bir bug** idi — `superseded` bayrağı resurs-səviyyəlidir (`resources.superseded`), amma supersede-tetiklənməsi region-səviyyəlidir (`org+product+region`). `uk_resource_prices_active_open` indeksi (`resource_id, organization_id, region_id`) təsdiqləyir ki, **bir resurs eyni anda bir neçə regionda açıq qiymətə malik ola bilər** — bu, nadir hal deyil, dizaynın dəstəklədiyi normal haldır. Yalnız BİR region üçün supersede tetiklənəndə bütün resurs `superseded=true` olurdu, nəticədə həmin resursun DİGƏR regionlardakı hələ də keçərli qiymətləri də canlı hesablamadan yanlışlıqla çıxarılırdı.

**Düzəliş:** `AND r.superseded = false` view-dən (024) çıxarıldı. Səbəb: sibling qiymətin `expireDate`-inin bağlanması (mövcud məntiq) TƏKBAŞINA kifayətdir — view onsuz da `expire_date >= bu gün` şərtini yoxlayır, bağlanmış qiymət avtomatik çıxır, region-a görə dəqiq işləyir. `superseded` bayrağı artıq yalnız **informativ/audit** məqsədlidir (frontend-də "Əvəzlənib" nişanı üçün `ResourceResponse`-da qalır), market-hesablamasına birbaşa girişi yoxdur.

**Canlı DB test (2026-08-17, multi-region ssenarisi, transaction+ROLLBACK):** R1 (Bakı=100, Şəki=999, hər ikisi açıq) + R2 (yalnız Bakı=200, yeni resurs). Supersede yalnız R1-in Bakı qiymətini bağladı (Şəki-yə toxunmadı), amma bütün R1 `superseded=true` oldu (dizayn belədir). Düzəlişdən sonra: **Bakı = 130** (R1-in bağlanmış 100-ü düzgün xaric, R2-in 200-ü + real datayla), **Şəki = 999** (R1-in hələ də keçərli qiyməti DÜZGÜN qaldı, itmədi) — köhnə (buglu) versiyada Şəki sətri tamamilə yox olardı. Fix təsdiqləndi.

---

## 4ee. Excel export — hazırlıq: `period-averages`-ə ad sahələri əlavə edildi (2026-08-18)

**Kontekst:** Excel export mövzusu yenidən müzakirə edildi (bölmə 4dd-nin başlanğıc səbəbi). Qərar: ayrıca **"Hesabatlar"** menyusu + `Resurslar`-da ayrıca **ad-hoc filtr-export** — ikisi qarışdırılmır. Aqreqat-səviyyəli hesabatlar (bu bölmə + canlı `/averages`) client-side (SheetJS, frontend-də) generasiya olunacaq, çünki sətir sayı (məhsul×region×rüb) sərhədlidir; xam qiymət/audit + filtrlənmiş resurs export-u isə backend-də (data sərhədsiz böyüyür) ediləcək — bu ikinci hissə hələ başlanmayıb.

İlk namizəd olaraq **rüblük çox-məhsullu hesabat** seçildi (`period-averages` endpoint-i onsuz da `productId`-siz sorğulana bilir — canlı test edildi, 15 sətir, müxtəlif məhsul/region qarışıq gəldi, əlavə backend sorğu işi lazım olmadı).

**Edilən:** `resource_price_period_averages` view-i (047, `runOnChange=true` olduğu üçün eyni changeset üzərində redaktə edildi, yeni migrasiya nömrəsi açılmadı) 4 yeni **ad** sütunu ilə zənginləşdirildi (yalnız LEFT JOIN, aqreqasiyaya təsiri yoxdur): `product_code` (`products.code`), `category_name` (`resource_categories.name`), `unit_name` (`units.name`), `region_name` (`regions.name`). Səbəb: cavabda əvvəllər yalnız ID-lər var idi (`categoryId`/`regionId`) — export üçün frontend-in hər sətirdə 3 ayrı lookup-a ehtiyacı olmasın deyə birbaşa adı qaytarırıq. `ResourcePricePeriodAverage` entity + `ResourcePricePeriodAverageResponse` DTO-ya uyğun sahələr əlavə olundu (mapper dəyişmədi, MapStruct ad-uyğunluğu ilə avtomatik map edir).

**Canlı test (2026-08-18):** `GET /api/resource-prices/period-averages?size=3` (admin login) — `productCode`/`categoryName`/`unitName`/`regionName` hamısı düzgün doldu (məs. `"productCode":"MAT-000010"`, `"unitName":"Metr"`, `"regionName":"Baki"`). `totalElements:15`, müxtəlif `productId`/`regionId` qarışıq — `productId` filtrsiz sorğunun artıq işlədiyi təsdiqləndi.

**Əlavə (2026-08-18, eyni sessiya):** `GET /api/resource-prices/period-averages`-ə yeni opsional `categoryId` query param əlavə olundu (`ResourcePricePeriodAverageSpecifications.hasCategory()`, `ResourcePriceService`/`ResourcePriceServiceImpl`/`ResourcePriceController` imzaları uyğun yeniləndi) — hesabat ekranının "Kateqoriya" filtri üçün, əvvəllər yalnız `productId`/`regionId`/`periodYear`/`periodQuarter`/`name` var idi. Canlı test edildi: filtrsiz `totalElements=15`, mövcud bir `categoryId` ilə filtrlənəndə `totalElements=1`, düzgün sətir qayıtdı.

**Hələ edilməyib:** faktiki Excel export (frontend, SheetJS) — bu, backend-də görüləsi başqa iş deyil, frontend tərəfdə spec yazılıb (`FRONTEND_AI_PROMPT_REPORTS.md`, hesabat #2 üçün, artıq frontend AI ilə ayrıca müzakirə olunur, bu repo-nun işi deyil).

**Əlavə (2026-08-18, eyni sessiya, hesabat #1 və #3 üçün hazırlıq):**
- `resource_price_averages` (024) view-i **eyni pattern ilə** (047-nin eynisi) zənginləşdirildi: `product_code`/`category_name`/`unit_name`/`region_name` (LEFT JOIN, aqreqasiyaya təsiri yoxdur). `ResourcePriceAverage` entity + `ResourcePriceAverageResponse` DTO uyğunlaşdırıldı. `GET /api/resource-prices/averages`-ə yeni opsional `categoryId` filtri əlavə olundu (`ResourcePriceAverageSpecifications.hasCategory()`). Canlı test: cavabda `productCode`/`categoryName`/`unitName`/`regionName` doludur.
- `GET /api/documents`-ə yeni opsional `periodYear`/`periodQuarter` filtrləri əlavə olundu (`DocumentSearchCriteria` 2 sahə → 4 sahə, `DocumentSpecifications.hasPeriodYear/hasPeriodQuarter`). **Diqqət:** `DocumentSearchCriteria` `@AllArgsConstructor` istifadə etdiyi üçün mövcud 2-arg çağırış yerləri (`DocumentController.list()`, `DocumentServiceImpl.getMine()`) 4-arg-a uyğunlaşdırıldı. Canlı test: `?periodYear=2026&periodQuarter=3` → 3 sənəd, hamısı doğru dövrdə.
- Bu iki dəyişiklik namizəd #1 (Canlı Bazar Qiymət Müqayisəsi export) və #3 (Sənəd/İdxal Hesabatı) üçün backend tərəfini tamamlayır — frontend spec-i yazıldı (`FRONTEND_AI_PROMPT_REPORTS_LIVE_AND_DOCUMENTS.md`).

**Namizəd #4 — "Təqdim Edilmiş Qiymətlər" (xam qiymət hesabatı), backend tam edildi (2026-08-18):**

Bu hesabat digərlərindən fərqli olaraq **backend-generasiya**dır (JSON deyil, birbaşa `.xlsx` axını) — səbəb: `resource_prices` xam cədvəli hər təqdimatla böyüyür (silinmir, tarixçə saxlanılır), aqreqat view-lər kimi (məhsul×region×rüb) sərhədli deyil. Müzakirə zamanı ilkin "audit" adı və 17 sütunluq siyahı (Yaradan/Təsdiqləyən/Təsdiq tarixi/Bitmə tarixi/Şərh daxil) əhəmiyyətli dərəcədə sadələşdirildi:
- **Ad dəyişdi:** "Xam Qiymət/Audit" → **"Təqdim Edilmiş Qiymətlər"** (audit sözü yanlış təəssürat yaradırdı — bizdə formal təsdiq zənciri yoxdur).
- **Təsdiqləyən/Təsdiq tarixi çıxarıldı** — kodda təsdiqləndi ki, `ResourcePrice.approvedBy/approvedDate` yalnız kənar-dəyər kimi bayraqlanıb sonra əl ilə təsdiqlənən nadir hallarda dolur (`ResourcePriceServiceImpl` şərhi: normal təqdimatlar "approvedBy/approvedDate are deliberately left null... auto-approved"), demək olar bütün sətirlərdə boş olardı.
- **Bitmə tarixi/Şərh/Yaradan çıxarıldı** — DB-nin texniki/daxili detallarıdır, "bu rübdə nə təqdim edilib" sualına aid deyil (əsasən indi bütün qeydləri MƏRKƏZ daxil etdiyi üçün "Yaradan" təşkilatı deyil, mərkəz işçisini göstərirdi — çaşdırıcı olardı).
- **Ölçü vahidi və Status geri əlavə olundu** — Status (PENDING/APPROVED/REJECTED/FLAGGED) hər sətirdə doludur (approvedBy-dan fərqli), FLAGGED sətirləri görünməsi faydalıdır.

**Son sütunlar (13):** Təşkilat, Məhsul kodu, Məhsul adı, Kateqoriya, Ölçü vahidi, Region, İl, Rüb, Qiymət, ƏDV, Valyuta, Effektiv tarix, Status.

**Texniki tətbiq:**
- `build.gradle`-ə `org.apache.poi:poi-ooxml:5.3.0` əlavə olundu (yeni asılılıq).
- `ResourcePriceRepository.findSubmittedPricesReport()` — yeni native SQL sorğu (`resource_prices` → `resources`→`products`→`resource_categories`/`units`, `regions`, `organizations` join-ləri), `SubmittedPriceRow` proyeksiya interfeysi qaytarır. `periodYear`/`periodQuarter` MƏCBURİ filtr (export ölçüsünü məhdudlaşdırır), `organizationId`/`productId`/`regionId`/`status` opsional.
- `ReportService`/`ReportServiceImpl` (yeni) — `loadSubmittedPricesReport()` (validasiya + sorğu, sinxron) və `writeSubmittedPricesReport()` (təmiz Excel-yazma, `SXSSFWorkbook`) **bilərəkdən 2 ayrı metoddur**: validasiya `StreamingResponseBody` callback-i İÇİNDƏ olsaydı, HTTP başlıqları artıq göndərildikdən sonra işləyəcəkdi (`GlobalExceptionHandler` bunu 400-ə çevirə bilməzdi, cavab "200 OK" kimi başlayıb yarımçıq qalardı) — canlı yoxlanıb, düzəldilib.
- `ReportController` (yeni, `/api/reports`) — `GET /submitted-prices`, icazə `COST_READ + VIEW_ALL_ORGANIZATION_RESOURCES` (mərkəz-yalnız, mövcud DOCUMENT_REVIEW-ə bənzər qapı).
- **Yan tapıntı və düzəliş:** `GlobalExceptionHandler`-də `MissingServletRequestParameterException` üçün handler YOX idi (kodda əvvəllər HEÇ bir endpoint məcburi `@RequestParam` istifadə etməmişdi) — məcburi `periodYear` olmadan çağırış `500` qaytarırdı, gözlənilən `400` yerinə. Handler əlavə olundu, düzgün `400` + mesaj qaytarır indi.

**Canlı test (2026-08-18):** boş param → `400` ("Missing required parameter: periodYear"), `periodQuarter=5` → `400` ("periodQuarter 1-4 aralığında olmalıdır"), `?periodYear=2026&periodQuarter=3` → `200`, real `.xlsx` (54 sətir, Azərbaycan başlıqlar, qalın+dondurulmuş başlıq sətri, rəqəm formatı, `FLAGGED` statusu düzgün "Bayraqlanıb (kənar dəyər)" kimi göründü), `status=4` filtri nəticəni düzgün daraltdı (54→az sətir). Fayl strukturu birbaşa `unzip`+XML yoxlaması ilə təsdiqləndi.

Frontend spec-i yazıldı (`FRONTEND_AI_PROMPT_SUBMITTED_PRICES.md`) və frontend AI tərəfindən tətbiq edildi.

**DÜZƏLİŞ (2026-08-18, frontend real istifadəçi ilə test edərkən tapıldı) — canlı brauzerdə hər dəfə `503` (backend bug-ı idi, frontend problemi deyil):**

Frontend AI real brauzerdə "Yüklə" düyməsini basanda hər dəfə `503 Service Unavailable` alırdı, halbuki mənim `curl` testlərim (auth başlığı, `Origin` başlığı, CORS preflight daxil) hamısı təmiz `200` verirdi. Diaqnoz üçün Chrome-u özüm işə salıb (`claude-in-chrome`) real login+klik axınını təkrarladım — `503` dərhal reproduksiya oldu. Backend logunda kök səbəb tapıldı:

- Kontroller `ResponseEntity<StreamingResponseBody>` qaytarırdı — bu, Servlet 3 **async dispatch** işə salır (fərqli thread-də davam edir).
- Spring Security-nin `AuthorizationFilter`-i bu async dispatch-i DE yenidən filtrləyir (bilərəkdən, async davamında da təhlükəsizlik təmin olunsun deyə) — AMMA `SecurityContext` (ThreadLocal-əsaslı) bu ikinci keçidə ötürülmür, ona görə "autentifikasiya yoxdur" görüb `AccessDeniedException` atır.
- Bu, HTTP cavabı artıq `200` kimi başlayıb (headers göndərilib) OLANDAN SONRA baş verir → Tomcat statusu düzəldə bilmir → "Unable to handle the Spring Security Exception because the response is already committed" → nəticədə brauzerə xam `503` gedir, **CORS başlıqları da yoxdur** (error-page dispatch adi cavab pipeline-ından kənara çıxır) — məhz frontend-in müşahidə etdiyi `error.response undefined` effekti.

**Düzəliş:** `ReportController.submittedPrices()` `ResponseEntity<StreamingResponseBody>` yerinə birbaşa `HttpServletResponse`-a **sinxron** yazır (`void` metod, `response.getOutputStream()`) — async dispatch tamamilə aradan qaldırıldı. Bu hesabatın sətir sayı onsuz da `periodYear`/`periodQuarter` ilə məhdudlaşdırıldığı üçün əsl async streaming-ə heç ehtiyac yox idi.

**Canlı brauzer testi ilə təsdiqləndi (2026-08-18, `claude-in-chrome`):** düzəlişdən əvvəl `503` (real login → "Hesabatlar" → "Təqdim Edilmiş Qiymətlər" → "Yüklə" axını ilə, Network tab-da görünüb), düzəlişdən sonra eyni axın `200`, xəta toast-ı yoxdur.

**Dərs:** `StreamingResponseBody`/hər hansı async servlet mexanizmi + method-security (`@PreAuthorize`) birlikdə diqqətlə yoxlanmalıdır — `curl` ilə test kifayət deyil (curl-də bu problem heç görünmürdü, yalnız real brauzer axınında/Network tab-da aşkarlandı). Gələcəkdə oxşar fayl-axını endpoint-ləri lazım olsa, defolt olaraq sinxron yazım seçilməlidir, əks halda hər dəfə eyni problem təkrarlanar.

**Kiçik sütun düzəlişləri (2026-08-18, frontend real istifadə zamanı istədi, endpoint/sxem dəyişmədi):**
1. **"Kateqoriya" sütunu silindi** — nə sorğuda (`resource_categories` join çıxarıldı), nə `SubmittedPriceRow`-da, nə Excel-də qalmadı.
2. **"Məhsul adı" indi `products.description` göstərir**, `products.name` yox (server-generated, kateqoriya+atribut dəyərləri birləşməsi — bax `FRONTEND_AI_PROMPT_PRODUCTS.md`).
3. **"Rüb" sütunu Roma rəqəmi ilə** (`I`/`II`/`III`/`IV`), `"Q3"` yox — frontend-in `quarterToRoman()` konvensiyası ilə üst-üstə düşür.
4. **`FLAGGED` statusunun mətni** `"Bayraqlanıb (kənar dəyər)"` → **`"Kənar dəyər"`** sadələşdi (frontend terminologiyası ilə eyniləşdi).

Canlı test edildi (`curl` + xam XML yoxlaması, `status=4` filtri ilə): bütün 4 dəyişiklik düzgün əks olunur, sütun sayı 13-dən 12-yə düşdü.

---

## 4ff. `GET /api/resource-prices/averages` — `currency` sahəsi + `variabilityLevel` filtri + `/averages/stats` (2026-08-20)

**Səbəb:** Frontend `BACKEND_REQUEST_MARKET_AVERAGES_VAT_AND_VARIABILITY_FILTER.md` faylı ilə iki şey soruşdu: (1) admin paneldəki bəzi sətirlərin böyük "dəyişkənlik" göstərməsinin ƏDV/valyuta qarışıqlığından qaynaqlana biləcəyini, (2) hazırda yalnız frontend-də (yüklənmiş səhifə üzrə) hesablanan `(max-min)/median*100` dəyişkənlik bucket-ini (STABLE/MODERATE/HIGH) server-side filtrə və bütün-nəticə-üzrə say-a çevirmək.

**1) ƏDV/valyuta araşdırması — istifadəçi ilə (məhsul sahibi) təsdiqləndi:** `resource_prices.price` HƏMİŞƏ ƏDV-siz (xalis) məbləğ kimi qəbul olunur — `vat` sahəsi sırf informativdir, heç vaxt `price`-a tətbiq olunmayıb. Yəni normalizasiya artıq lazımsız idi (böyük dəyişkənliyin səbəbi ƏDV deyil) — `vat` bilərəkdən view-ə əlavə olunmadı. `currency` isə əlavə olundu, amma sırf göstəriş məqsədilə: `raw_range` CTE-sinə `MIN(currency) AS currency` (product_id/region_id qruplaşdırmasına TOXUNULMADAN — bax aşağı, niyə).

**Niyə `currency` qruplaşdırma açarına ƏLAVƏ EDİLMƏDİ (bilərəkdən):** heç nə eyni (product, region) üçün bütün təşkilatların eyni valyutada qiymət göndərdiyini məcburi etmir (validasiya yoxdur), ona görə nəzəri olaraq bir qrup qarışıq valyuta ola bilər — bu, mövcud/köhnə bir problemdir (avg/median/min/max onsuz da xam rəqəmləri valyutadan asılı olmadan qarışdırır), bu tapşırığın hədəfi deyil. `currency`-ni qruplaşdırma açarına əlavə etmək (hər valyuta üçün ayrı sətir) daha "düzgün" olardı, AMMA `ResourcePriceRepository.findAverageStats()`/`findQuartiles()` (outlier detection, `PriceOutlierDetector`) `(product_id, region_id)` üzrə DƏQİQ 1 sətir gözləyir — 2-ci valyuta 2-ci sətir yaratsaydı, bu, `IncorrectResultSizeDataAccessException` atardı. Ona görə `currency` sadəcə `MIN()` ilə göstəriş sütunu kimi əlavə olundu (real vəziyyətdə bütün data AZN-dir).

**2) `variabilityLevel` filtri + `/averages/stats`:**
- Yeni paylaşılan `pricing/VariabilityCalculator` — `(maxPrice-minPrice)/medianPrice*100` düsturunu bucket-ə çevirir (`STABLE < 10%`, `MODERATE 10-30%`, `HIGH > 30%`), frontend-in mövcud client-side məntiqi ilə eyni həddlər.
- `ResourcePriceAverageSpecifications`-a `hasVariabilityLevel()` — eyni düsturu `CriteriaBuilder` ifadəsi kimi (`cb.diff`/`cb.quot`/`cb.prod`) təkrarlayır ki, `/averages` DB səviyyəsində filtrləyib səhifələyə bilsin (yaddaşa bütün nəticəni yükləmədən). **Qeyd:** iki yer (Java `VariabilityCalculator` və SQL-ə tərcümə olunan `CriteriaBuilder` ifadəsi) eyni 10/30 həddini əl ilə sinxron saxlamalıdır — kod şərhində qeyd olunub.
- Yeni `GET /api/resource-prices/averages/stats` (`COST_READ`, eyni `productId`/`categoryId`/`regionId`/`name` filtrləri, `variabilityLevel` İSTİSNA) — bütün uyğun nəticəni (səhifələmədən) yaddaşda `VariabilityCalculator` ilə bucket-ləyib `{stableCount, moderateCount, highCount}` qaytarır (ayrı endpoint seçildi, ümumi `PageResponse<T>`-ə hər endpoint üçün xüsusi `summary` sahəsi əlavə etməkdənsə).

**Canlı HTTP test (2026-08-20, admin login):**
| Sorğu | Nəticə |
|---|---|
| `GET /averages?size=3` | ✅ hər sətirdə `"currency":"AZN"` doldu, `totalElements=12` |
| `GET /averages/stats` | ✅ `{"stableCount":4,"moderateCount":2,"highCount":6}` — cəmi 12, `/averages`-in `totalElements`-i ilə üst-üstə düşür |
| `GET /averages?variabilityLevel=STABLE` | ✅ `totalElements=4` — stats-dakı `stableCount`-a bərabər |
| `GET /averages?variabilityLevel=HIGH` | ✅ `totalElements=6` — stats-dakı `highCount`-a bərabər |
| `GET /averages?variabilityLevel=BOGUS` | ✅ `400` (Spring-in enum type-mismatch handler-i, `GlobalExceptionHandler`-dəki mövcud `MethodArgumentTypeMismatchException` handler-i işlədi) |
| `GET /averages?categoryId=...` + `GET /averages/stats?regionId=...` | ✅ mövcud filtrlər yeni parametrlərlə birgə problemsiz işləyir |
| `GET /flagged` | ✅ `200` — `PriceOutlierDetector`-in `findAverageStats()`-i (view-ə edilən dəyişiklikdən sonra) hələ də tək sətir qaytarır, reqressiya yoxdur |

Unit testlər: `VariabilityCalculatorTest` (hədd sərhədləri: 10%/30% dəqiq harada MODERATE-ə düşür, `median=0` qorunması) + `ResourcePriceServiceImplTest`-ə `getAveragesSummary_bucketsEveryRowByVariability`/`listAverages_passesVariabilityLevelThroughAndMapsResults` əlavə olundu. `./gradlew build` — hamısı yaşıl.

**Frontend tərəfi hələ toxunulmayıb** — API hazırdır, admin panelin "Bazar Qiymətləri Analitikası" ekranında KPI kartlarının bu yeni `/averages/stats` + `variabilityLevel`-ə bağlanması frontend-in işidir.

---

## 5. Verifikasiya zamanı tapılıb düzəldilən buglar

1. **`logback-spring.xml`** — `TimeBasedRollingPolicy` ilə `%i` token-i (`maxFileSize`) uyğun deyildi → tətbiq açılışda çökürdü. Düzəliş: `SizeAndTimeBasedRollingPolicy`.
2. **Liquibase XSD versiyası** — changelog-larda `dbchangelog-4.29.xsd` göstərilmişdi, amma quraşdırılmış Liquibase versiyası bunu lokal bundle etmirdi və offline mühitdə (`secureParsing=true`) uzaqdan çəkilməsinə icazə verilmirdi. Düzəliş: bütün 9 fayında `dbchangelog-latest.xsd`.
3. **pgAdmin email** — `admin@ccms.local` pgAdmin-in daxili email validator-u tərəfindən rədd edilirdi (`.local` etibarsız TLD). Düzəliş: `.env`-də `admin@ccms.dev`.

Bu üçü də koda edilib (fayllar yenilənib), sadəcə build/run zamanı üzə çıxdığı üçün burada qeyd olunur.

4. **Orphan `bootRun` prosesi (2026-07-20)** — arxa planda başladılan `bootRun` tapşırığı "dayandırılsa" belə, alt `java.exe` prosesi bəzən öldürülmür (yalnız izləyici wrapper dayanır) və portu (8181) tutmağa davam edir. Nəticədə yeni kod ilə başlatma cəhdi "Port XXXX was already in use" xətası ilə uğursuz olur, amma köhnə (bir neçə gün əvvəlki) kod hələ cavab verməyə davam edir — bu, yeni endpoint-lərin/dəyişikliklərin "yoxdur" kimi görünməsinə səbəb ola bilər. Həll: hər restart-dan əvvəl `Get-NetTCPConnection -LocalPort <port>` ilə yoxla, tapılan prosesi `Stop-Process -Force` ilə bağla, sonra yenidən başlat. Bax bölmə 0.

5. **Soft-delete ↔ FK uyğunsuzluğu (2026-07-20)** — `ResourceCategoryServiceImpl.delete()`-də "kateqoriyanın resursu var-yoxdur" yoxlaması (`existsByCategoryId`) `Resource`-un `@SQLRestriction("deleted = false")`-u səbəbindən yalnız **aktiv** (silinməmiş) resursları görürdü. Amma bir resurs soft-delete edildikdən sonra da fiziki sətir `resources` cədvəlində qalır və `resource_categories`-ə FK ilə bağlıdır. Nəticədə: son resursu soft-delete edilmiş kateqoriyanı silməyə çalışanda app-səviyyəli yoxlama "OK" deyirdi, amma real DB DELETE əməliyyatı FK constraint-ini pozurdu → tutulmamış `ConstraintViolationException` → **500 Internal Server Error** (əvəzinə gözlənilən təmiz 409). Düzəliş: (1) `ResourceRepository`-ə native SQL sorğusu ilə `existsByCategoryIdIncludingDeleted` əlavə edildi (soft-delete filtrini bilərəkdən bypass edir, çünki FK-nın özü də bunu bilmir); (2) `GlobalExceptionHandler`-ə ümumi `DataIntegrityViolationException` → 409 handler-i əlavə edildi (gələcəkdə bənzər uyğunsuzluqların 500 yerinə təmiz error qaytarması üçün təhlükəsizlik toru). Nəticə: bir kateqoriyaya heç vaxt resurs bağlanmışdısa (silinmiş olsa belə), o kateqoriya artıq həmişəlik silinməzdir — bu, qəsdən belədir (audit-trail qorunması).

6. **Hibernate flush-ordering ↔ partial unique index (2026-07-21)** — `ResourcePriceServiceImpl.approve()`-də əvvəlki aktiv qiyməti "təqaüdə göndərmək" (`expireDate`-i kəsmək) və yeni qiyməti `APPROVED` etmək eyni tranzaksiya daxilində iki ayrı `repository.save()` çağırışı idi. Hibernate defolt olaraq bu UPDATE-ləri tranzaksiya sonunda İSTƏNİLƏN sırada flush edə bilər (Java kodundakı çağırış sırasına zəmanət vermir). Nəticədə bəzən yeni qiymətin `status=APPROVED, expire_date=NULL` UPDATE-i əvvəlki qiymətin `expire_date`-i hələ kəsilməmişdən ƏVVƏL fiziki icra olunurdu — bu an üçün eyni (resource_id, supplier_id, region_id) üçlüyündə İKİ açıq `APPROVED` sətir mövcud olurdu, `uk_resource_prices_active_open` partial unique index-i pozulurdu → **409 Conflict ilə approve əməliyyatı uğursuz olurdu** (istisna tutulduğu üçün 500 yox, amma əməliyyatın özü baş tutmurdu — funksional bug). Düzəliş: təqaüdə göndərmə addımında `repository.save()` əvəzinə `repository.saveAndFlush()` istifadə edildi ki, köhnə sətrin `expire_date`-i DB-yə YENİ qiymətin statusu yazılmadan ƏVVƏL fiziki yazılsın. Canlı testlə təsdiqləndi: düzəlişdən sonra approve uğurla keçdi, köhnə qiymətin `price`/`vat` dəyəri toxunulmadan qaldı, yalnız `expireDate`-i düzgün kəsildi.

8. **Supplier avtomatik yaradılması — kod kolliziyası (2026-07-29)** — "Mənim Resurslarım" üçün supplier auto-provisioning ilk versiyasında kod `organizationId` UUID-inin ilk 12 hex simvolundan (`"ORG-" + ...`) generasiya olunurdu. Canlı testdə bu, `uk_suppliers_code` unikal indeksini pozdu — layihənin öz seed/test təşkilatları eyni UUID prefiksini paylaşdığı üçün (məs. `aaaaaaaa-0000-0000-0000-...`). Düzəliş: `resource_code_seq`-lə eyni sxem — yeni `supplier_code_seq` ardıcıllığı (migrasiya `034`), kod `"SUP-{6 rəqəm}"` formatında, UUID-dən asılı deyil, kolliziya riski yoxdur.
9. **`CreateResourcePriceRequest.comment` DTO-ya əlavə olundu, amma `ResourcePriceServiceImpl.create()`-də entity builder-ə köçürülmədi (2026-07-29)** — nəticədə "Mənim Resurslarım" üzərindən göndərilən şərh sükutla itirdi (cavabda `comment` sahəsi həmişə `null` idi). Canlı testlə tapıldı, `ResourcePrice.builder()`-ə `.comment(request.getComment())` əlavə edilməklə düzəldildi.
10. **`resource_price_averages` view genişlənməsi ilk cəhddə uğursuz oldu (2026-07-29)** — yeni sütunlar (`categoryId` və s.) mövcud sütunların (`avg_price` və s.) ARASINA yerləşdirilmişdi. Postgres `CREATE OR REPLACE VIEW` mövcud sütun sırasının dəyişməsinə icazə vermir (`ERROR: cannot change name of view column "avg_price" to "category_id"`) — `bootRun` Liquibase mərhələsində uğursuz oldu (DDL tranzaksiya daxilində olduğu üçün təhlükəsiz geri qaytarıldı, DB-yə zərər dəymədi). Düzəliş: yeni sütunlar SELECT siyahısının SONUNA köçürüldü.

11. **Səhv tipli sahə/parametr → 500 (əvəzinə 400) (2026-07-22)** — bu bug frontend tərəfini yazan başqa bir AI agent tərəfindən real istifadə zamanı tapıldı: `resource-categories`-ə `type: "MATERIAL"` (string, Integer sahəsinə) göndərəndə 500 alırdı (əvəzinə gözlənilən 400 validation xətası). Səbəb: `GlobalExceptionHandler`-də Jackson-un JSON body-ni deserializasiya edərkən atdığı `HttpMessageNotReadableException` (səhv tipli body sahəsi üçün) və Spring-in `MethodArgumentTypeMismatchException`-u (səhv tipli query param, məs. UUID gözlənilən yerə düzgün olmayan string üçün) heç bir xüsusi handler-ə uyğun gəlmirdi, ona görə ümumi `@ExceptionHandler(Exception.class)` catch-all-a düşüb 500 qaytarırdı. Düzəliş: hər iki exception tipi üçün ayrıca handler əlavə edildi, hər ikisi 400 + aydın mesaj (hansı sahə/parametr, hansı tip gözlənilirdi) qaytarır. Canlı testlə təsdiqləndi (həm body, həm query param üçün). Bu, `FRONTEND_AI_PROMPT.md`-də əvvəlcə "known rough edge" kimi qeyd olunmuşdu, sonra həqiqətən düzəldildi və sənəd bundan sonra yeniləndi.

12. **Eyni gün üçün ikinci qiymət göndərəndə "konflikt" xətası (2026-08-04)** — istifadəçi canlı istifadədə tapdı: MAT-000002 resursunda artıq bu gün (`effectiveDate`) üçün açıq (`expireDate=NULL`) `APPROVED` qiymət varkən eyni (resurs, təchizatçı, region) üçün YENƏ bu günün tarixi ilə qiymət göndərəndə `uk_resource_prices_active_open` unique-constraint pozulurdu (DB-dən `DataIntegrityViolationException`, istifadəçiyə ümumi "konflikt" mesajı kimi çıxırdı). Səbəb: `ResourcePriceServiceImpl.retireOverlapping()` köhnə sətri yalnız `existing.effectiveDate.isBefore(newEffectiveDate)` olanda bağlayırdı (sərt `<`) — eyni tarix üçün bu şərt `false` olur, köhnə sətir bağlanmır, yeni sətir insert olunanda constraint-ə çırpılırdı. Düzəliş: eyni tarix halında köhnə sətrin `expireDate`-i öz `effectiveDate`-inə bərabər qoyulur (bir günlük "keçmiş" sətir kimi qalır, invalid `expireDate < effectiveDate` intervalı yaranmır); əlavə olaraq, əgər overlap edən sətir YENİ tarixdən SONRAkı (gələcək) effectiveDate-lidirsə, indi bunu sükutla keçmək/DB-yə çırpılmaq əvəzinə aydın `400 Bad Request` (“A price already exists starting …”) qaytarılır. Canlı HTTP testlə hər iki hal təsdiqləndi (eyni-gün təkrar göndərmə artıq 201 qaytarır və köhnə sətri düzgün bağlayır; gələcək-tarixli sətirlə toqquşma artıq aydın 400 mesajı verir).

13. **Silinmiş/mövcud olmayan endpoint-lər 404 əvəzinə 500 qaytarırdı (2026-08-04, `Supplier` ləğvi zamanı tapıldı)** — `GET /api/suppliers` silindikdən sonra test edilərkən aşkarlandı: heç bir controller-ə uyğun gəlməyən `/api/**` yolu Spring-in statik-resurs axtarıcısına düşür, o da `NoResourceFoundException` atır — `GlobalExceptionHandler`-də bunun üçün xüsusi handler olmadığından ümumi `@ExceptionHandler(Exception.class)` catch-all-a düşüb `500 "An unexpected error occurred"` qaytarırdı (loglarda da yanıltıcı "Unhandled exception" xətası kimi görünürdü). Bu, `Supplier`-in ləğvi ilə əlaqəli deyil — istənilən səhv/silinmiş endpoint üçün əvvəldən mövcud olan ümumi bir boşluqdur. Düzəliş: `NoResourceFoundException` üçün ayrıca handler əlavə edildi, indi `404 "No endpoint found for {METHOD} {PATH}"` qaytarır. Canlı testlə təsdiqləndi (`GET /api/suppliers` → əvvəllər 500, indi 404).

14. **Vendor təşkilata mərkəzi-only rol təyin edilə bilirdi (2026-08-11, təhlükəsizlik sualı üzərində araşdırma zamanı tapıldı)** — `@PreAuthorize` yoxlamaları (URL/controller səviyyəsi) və JWT dizaynı (token-də rol/permission yoxdur, hər sorğuda DB-dən təzə oxunur) özlüyündə düzgün idi, amma `OrganizationServiceImpl.resolveRoles()` `POST /api/organizations`-a göndərilən `roleNames`-i heç bir filtrsiz `role_permissions`-a bağlayırdı. Rollar generic-dir (`SUPER_ADMIN/ADMIN/EXPERT/ANALYST/OPERATOR/VIEWER`) və "mərkəzi rol" deyə ayrıca sxem yoxdur — yalnız konvensiya (admin panelində vendor üçün adətən `EXPERT/OPERATOR/VIEWER` seçilməsi) qorunurdu. Nəticədə: `ORGANIZATION_WRITE` səlahiyyətli bir admin (məs. səhvən/diqqətsizcə) `roleNames:["ADMIN"]` və ya `["ANALYST"]` ilə vendor təşkilat yaratsaydı, o vendor-un login hesabı Postman-la birbaşa `POST /api/users`, `PUT /api/organizations/{id}` (ADMIN halında) və ya bütün təşkilatların qiymət/sənəd məlumatlarını (`VIEW_ALL_ORGANIZATION_RESOURCES`/`DOCUMENT_REVIEW`, ANALYST halında) görə bilərdi — frontend-i bypass edib. Qeyd: bu, "istənilən adi vendor hesabı Postman-la mərkəzi işləri edə bilər" demək DEYİL (buna ehtiyac yox idi/yoxdur — əvvəlcə mərkəzi admin-in səhv rol seçməsi lazımdır), amma bir belə səhv provisioning zamanı əlavə heç bir təhlükəsizlik toru olmadığı üçün Critical-a çevrilə bilərdi. Düzəliş: `OrganizationServiceImpl`-ə `CENTRAL_ONLY_PERMISSIONS` sabiti (`USER_*`, `ROLE_*`, `ORGANIZATION_*`, `AUDIT_READ`, `SYSTEM_ADMIN`, `VIEW_ALL_ORGANIZATION_RESOURCES`, `DOCUMENT_REVIEW`) və `assertVendorAssignableRoles()` əlavə edildi — `create()` indi bu icazələrdən hər hansını daşıyan rol təyin ediləndə `400 Bad Request` atır. Canlı HTTP testlə təsdiqləndi: `roleNames:["ADMIN"]` və `["ANALYST"]` indi rədd edilir (hər ikisi `DOCUMENT_REVIEW` daşıdığı üçün), `["OPERATOR"]`/`["EXPERT"]` (real vendor rolları) əvvəlki kimi normal işləyir. `/api/users` (mərkəzi heyət, `ActorType.INDIVIDUAL`) bu boşluğa məruz deyildi — orada təyin olunan rollar artıq yalnız mərkəzi hesablara aiddir.

15. **`GET /api/resources` yalnız "shared" (`organizationId IS NULL`) resurslardan ibarət bir səhifə qaytaranda 500 verirdi (2026-08-11, `hasPrice` filtri əlavə edilərkən tapıldı)** — `ResourceServiceImpl.resolveOrganizationsByIds()` boş `ids` siyahısı üçün `Map.of()` qaytarırdı; Java-nın immutable `Map.of()`-u `get(null)` çağırışını `Objects.requireNonNull`-la rədd edir (adi `HashMap`-dan fərqli olaraq). `toResponse()` isə hər sətir üçün `organizations.get(resource.getOrganizationId())` çağırır, və shared resurslarda bu `null`-dır. Nəticədə: nəticə səhifəsində ən azı bir "sahibli" (`organizationId` dolu) resurs olduqda `resolveOrganizationsByIds`-ə boş olmayan `ids` gedirdi və adi `HashMap` qayıdırdı (problemsiz), AMMA səhifə YALNIZ shared resurslardan ibarət olanda (`ids` boş) `Map.of()` qayıdırdı və `.get(null)` `NullPointerException` atırdı → `500 Internal Server Error`. Bu, `hasPrice=true` filtri ilə üzə çıxdı (test resursu yeganə nəticə idi və shared idi), amma köhnə koddan qaynaqlanır — `hasPrice`-dan asılı deyil, əvvəldən mövcud olan gizli bug idi (məs. `documentId` ilə də təkrarlana bilərdi, əgər həmin sənədin bütün resursları shared olsaydı). Düzəliş: `Map.of()` → `Collections.emptyMap()` (null-tolerant `get()`). Canlı HTTP testlə təsdiqləndi: `hasPrice=true` filtri (yalnız shared test resursu ilə uyğunlaşan) əvvəllər 500, indi düzgün nəticə qaytarır.

16. **`resource_price_averages` view deaktiv/silinmiş resursu və deaktiv məhsulu bazar hesablamasından çıxarmırdı (2026-08-13, arxitektura sənədləşdirməsi zamanı istifadəçinin sualı ilə tapıldı)** — `024-create-resource-price-averages-view.xml`-dəki `active_approved_prices` CTE-si yalnız `resource_prices.status`/`effective_date`/`expire_date`-ə baxırdı; `resources.active` (kataloqdan gizlət), `resources.deleted` (soft-delete — `Resource`-un `@SQLRestriction("deleted = false")`-u yalnız JPA entity sorğularını qoruyur, bu xam SQL view-ə tətbiq olunmur) və `products.active` (məhsulu deaktiv et) heç biri yoxlanılmırdı. Nəticədə: istifadəçi bir resursu "kataloqdan gizlətsə", silsə, və ya bütöv məhsulu deaktiv etsə belə, onun cari aktiv qiyməti bazar orta/median hesablamasına qatılmağa davam edirdi — istifadəçi gözləntisi ("bunu bazardan çıxartdım") ilə real davranış ziddiyyət təşkil edirdi. Düzəliş: CTE-yə `products`-a `JOIN` əlavə olundu, `WHERE`-ə `r.active = true`, `r.deleted = false`, `p.active = true` şərtləri əlavə edildi (ranking/trimming/percentile mərhələlərindən ƏVVƏL, ona görə bu resurslar `sample_count`-a da düşmür). Canlı DB-də (`docker exec ccms-postgres psql`) 3 ayrı ssenari ilə təsdiqləndi: (1) 3 qiymətli bir məhsulun (60/80/1000) bir resursunu `active=false` edəndə `sample_count` 3→2, `max_price` 1000→80 düşdü; (2) eyni resursu `deleted=true` edəndə eyni nəticə təkrarlandı; (3) bütöv məhsulu `active=false` edəndə view 0 sətir qaytardı. Hər üç halda test məlumatı orijinal vəziyyətinə (`active=true, deleted=false`) geri qaytarıldı, nəticə yenidən 3/380/80/60/1000-ə bərabər oldu.

17. **`resource_price_averages` eyni təşkilatın çoxlu resursunu bazar statistikasında ayrı-ayrı səs kimi sayırdı (2026-08-13, istifadəçi ilə əvvəlcədən müzakirə olunub razılaşılmış dizaynın tətbiqi)** — CTE zənciri (`ranked_prices`/`trimmed`) birbaşa hər `resource_prices` sətrini müstəqil məlumat nöqtəsi kimi işlədirdi, təşkilat ayrımı yox idi. Real seed-data ilə TƏSDİQLƏNDİ ki, bu, nəzəri deyil, faktiki mövcud vəziyyət idi: bir məhsulun (`60ce9b5e-...`) bazar view-də görünən 3 "müxtəlif" qiyməti (60/80/1000, `avg_price=380`) əslində eyni təşkilatın (`aaaaaaaa-...-001`) 3 ayrı resursu idi. Düzəliş: yeni `org_prices` CTE-si əlavə olundu — `active_approved_prices`-i əvvəlcə `(product_id, region_id, organization_id)` üzrə qruplaşdırıb hər təşkilatın öz qiymətlərinin medianını (`PERCENTILE_CONT(0.5)`, `NUMERIC(19,4)`-ə cast edilib) çıxarır, `ranked_prices` artıq bunun üzərində işləyir — mövcud trim/orta/median məntiqi toxunulmadan qalır, sadəcə girişi dəyişdi. Nəticədə `sample_count` indi "neçə resurs" yox, "neçə təşkilat" göstərir. **Ara xəta və düzəlişi:** ilk cəhddə Liquibase `"cannot change data type of view column min_price from numeric to double precision"` xətası ilə uğursuz oldu — səbəb `PERCENTILE_CONT`-un `double precision` qaytarması, bu da `MIN(t.price)`/`MAX(t.price)`-ın tipini dəyişdirirdi (`CREATE OR REPLACE VIEW` mövcud sütun tipini dəyişməyə icazə vermir); `org_prices.price`-ı `CAST(... AS NUMERIC(19,4))` etməklə düzəldildi. Canlı DB-də 2 ssenari ilə təsdiqləndi: (1) yuxarıdakı 3-resurslu (eyni təşkilat) hal artıq `avg_price=median_price=min_price=max_price=80.0000, sample_count=1` göstərir (təşkilatın öz medianı); (2) əlində saxlanılmaqla, resurslardan birinin (`price=1000`) `resource_prices.organization_id`-i başqa real təşkilata (`a64105ba-...`) müvəqqəti dəyişdirilərək 2-təşkilatlı ssenari simulyasiya edildi — nəticə `avg_price=median_price=535.0000, min_price=70.0000 (org A-nın öz medianı), max_price=1000.0000 (org B), sample_count=2` — riyazi olaraq gözlənilənlə tam üst-üstə düşdü. Hər iki testdən sonra məlumat orijinal vəziyyətinə geri qaytarıldı.

18. **#17-nin öz nəticəsi kimi ortaya çıxan yeni problem: `min_price`/`max_price` artıq real qiymətləri göstərmirdi (2026-08-13, istifadəçi canlı analitika səhifəsində tapdı)** — #17-dəki dəyişiklikdən sonra `min_price`/`max_price` də (əvvəlki kimi) `trimmed`/`org_prices` zəncirindən, yəni təşkilat-median-larından hesablanırdı. İstifadəçi canlıda konkret nümunə tapdı: `MAT-000011` kodlu resursun təşkilatı özü 92 qiymət yazmışdı, amma bazar analitikası səhifəsində `max_price` 87 göstərirdi — bu, o təşkilatın öz median-ı idi (92 daxil olan bir neçə qiymətin median-ı), real 92 dəyəri isə hesabatda görünmürdü, istifadəçini yanıldırdı. Kök səbəb: `avg_price`/`median_price` üçün təşkilat-səviyyəli birləşdirmə DÜZGÜNDÜR (bir təşkilatın çox səsini önləyir), amma `min_price`/`max_price` fərqli sualın (bazarda faktiki ən ucuz/ən baha nə tapmaq mümkündür) cavabıdır — bu sual üçün təşkilat-median-ına yığmaq real, mövcud qiymətləri gizlədir. Düzəliş: yeni `raw_range` CTE-si əlavə olundu — bütün fərdi (xam, filtrlənmiş, amma təşkilat üzrə YIĞILMAMIŞ) qiymətlərin `MIN`/`MAX`-ını (product_id+region_id üzrə) hesablayır, final `SELECT`-də `trimmed`-in (`avg_price`/`median_price`/`sample_count` üçün) yanında ayrıca `JOIN` ilə istifadə olunur. Canlı DB-də təsdiqləndi: test məhsulunda (60/80/1000, tək təşkilat) nəticə `avg_price=median_price=80.0000` (təşkilat-median-ı, dəyişmədi), `min_price=60.0000, max_price=1000.0000` (indi xam qiymətlər, əvvəlki kimi 80/80 əvəzinə) — 2-təşkilatlı simulyasiyada da (`avg_price=median_price=535`) `min_price`/`max_price` düzgün olaraq dəyişmədən `60/1000` qaldı (region/məhsul üzrə xam aralıq təşkilat sayından asılı deyil). Bütün 10 məhsulun view sətirləri yenidən yoxlanıldı, hamısında `min ≤ orta/median ≤ max` şərti qorunur.

19. **Eyni gün ərzində əvəzlənən qiymət — köhnə (bağlanmış) sətir "cari" kimi görünə bilirdi (2026-08-13, istifadəçi `MMC524` təşkilatında canlı tapdı: son qiymət 92 əlavə olunub, amma cari qiymət kimi bitmə tarixi olan 82 düşürdü)** — `ResourcePriceServiceImpl.retireOverlapping()` (sətir 361-375) yeni qiymət EYNİ GÜN effektiv olanda, köhnə sətrin `expire_date`-ini yalnız öz `effective_date`-inə (bu günə) bərabər qoya bilir (bundan əvvələ qoya bilməz — `effective_date > expire_date` səhv intervalı yaranar). Nəticədə köhnə sətir (`expire_date=bu gün`) VƏ yeni sətir (`expire_date=NULL`) EYNİ ANDA "aktiv" şərtini (`effective_date ≤ bu gün ≤ expire_date`) keçir — DB-də canlı yoxlanıldı, hər ikisi `f9821c7b-...` (`MMC524`) üçün eyni anda `true/true/true` qaytardı. Bunun iki nəticəsi var idi: (1) `ResourcePriceRepository.findCurrentCandidates()` yalnız `effectiveDate DESC`-ə görə sıralayırdı — hər iki sətrin tarixi eyni olduğu üçün sıra qeyri-müəyyən idi, nəticədə `getCurrentPrice()` təsadüfən köhnə (82) sətri qaytara bilirdi; (2) `resource_price_averages` view-də hər iki sətir eyni təşkilatın median hesablamasına qatılırdı (canlı DB-də dəqiq ölçüldü: `MMC524`-ün median-ı düzəlişdən əvvəl `[82,92]`-nin median-ı = 87 idi, düzəlişdən sonra düzgün olaraq 92 oldu; bunun bazara təsiri — 2-təşkilatlı bir məhsulda `avg_price/median_price` `73.5`-dən `76`-ya dəyişdi, dəqiq gözlənilən fərqlə). Düzəliş: (a) `findCurrentCandidates`-in `ORDER BY`-i `rp.expireDate NULLS FIRST, rp.effectiveDate DESC, rp.createdDate DESC`-ə dəyişdirildi (açıq/`NULL`-bitmə tarixli sətir həmişə birinci gəlir); (b) view-də `active_approved_prices` indi əvvəlcə hər (resurs, təşkilat, region) üçün YALNIZ 1 "həqiqi cari" sətir seçən de-duplikasiya addımından keçir (eyni prioritet sırası: açıq→ən son effective_date→ən son created_date), yalnız bundan sonra `raw_range`/`org_prices`-ə ötürülür. Canlı DB-də təsdiqləndi: yuxarıdakı `avg_price 73.5→76` dəyişikliyi məhz gözlənilən (60 və 92-nin ortası) rəqəmə uyğun gəldi. `findCurrentCandidates`-in Java tərəfi HTTP səviyyəsində test edilmədi (etibarlı login credential-ı yox idi) — SQL-dəki eyni prinsipin mexaniki əksi olduğu üçün kod oxunuşu ilə təsdiqləndi, amma canlı `POST /api/auth/login` + `GET`-lə əlavə yoxlama tövsiyə olunur.

20. **`sample_count` "neçə resurs" oxunurdu, amma #17-dən sonra "neçə təşkilat" mənasına gəlirdi — çaşdırıcı idi (2026-08-14, istifadəçi `MAT-000015`-i canlı yoxlayarkən tapdı: 1 org 3 resurs + 1 org 1 resurs = 4 resurs olduğu halda `sample_count=2` gördü, "məlumat itir" təəssüratı yarandı)** — #17-dəki `org_prices` düzəlişi riyazi olaraq düzgündür (bax yuxarı, bir təşkilat çox resurs yaradıb bazarı öz xeyrinə çəkə bilməsin deyə), amma `sample_count` adı bunu əks etdirmirdi — istifadəçi/admin bunu "bazarda neçə real qiymət təklifi var" kimi oxuyur, "neçə təşkilat iştirak edir" kimi yox. Bu, hesablama bug-ı deyil, şəffaflıq/adlandırma məsələsidir. Düzəliş: `024-create-resource-price-averages-view.xml`-də `raw_range` CTE-sinə `COUNT(*) AS resource_count` əlavə olundu (təşkilat-collapse-dan ƏVVƏLKİ, `min_price`/`max_price`-ın da oxuduğu eyni populyasiya) və final `SELECT`-ə ötürüldü; `ResourcePriceAverage` (entity) və `ResourcePriceAverageResponse` (DTO)-ya uyğun `resourceCount` sahəsi əlavə edildi (mapper `MapStruct` ad-uyğunluğu ilə avtomatik xəritələndirdi, əlavə kod lazım olmadı). **Ara xəta:** ilk cəhddə `resource_count`-u `max_price` ilə `sample_count` arasına (ortaya) yerləşdirdim — #10-dakı eyni səbəbdən Liquibase uğursuz oldu (`cannot change name of view column "sample_count" to "resource_count"`, Postgres `CREATE OR REPLACE VIEW`-da yeni sütun yalnız SONA əlavə oluna bilər); sütun `resource_name`-dən sonra sona köçürülərək düzəldildi. Canlı DB-də (`docker exec ccms-postgres psql`) `MAT-000015` üzərində təsdiqləndi: `sample_count=2, resource_count=4, avg_price=median_price=55.0000, min_price=50.0000, max_price=75.0000` — dəqiq əl hesablaması ilə üst-üstə düşdü (2 org: Vendor Alpha-nın 3 resursunun median-ı=50, MMC914-ün 1 resursu=60; 2 org < 4 trim həddi, trim yoxdur, AVG(50,60)=55). API-nin özü (`GET /api/resource-prices/averages`) HTTP səviyyəsində test edilmədi — `401 Unauthorized` (login credential-ı bu sessiyada yox idi); DB view nəticəsi `ResourcePriceAverageMapper`-in sadə ad-uyğun sahə keçidi olduğu üçün API cavabının eyni olacağı gözlənilir, amma canlı login ilə əlavə yoxlama tövsiyə olunur. **Frontend tərəfi hələ toxunulmayıb** — `resourceCount` API-də mövcuddur, amma `FRONTEND_AI_PROMPT_ADMIN_PANEL.md`-də göstərilmir, UI-da göstərilməsi üçün frontend tərəfin ayrıca yenilənməsi lazımdır.

21. **`resource_price_averages`-ə `currency` əlavə edərkən #10/#20-dəki EYNİ pozisiya-xətası TƏKRAR edildi (2026-08-20, bölmə 4ff-in ilk cəhdi, `bootRun`-un Liquibase mərhələsində tapıldı)** — yeni sütun (`currency`) final `SELECT`-də `resource_count`-dan SONRA, amma `product_code`-dan ƏVVƏL yerləşdirilmişdi (yəni yenə mövcud sütunların ARASINA). `CREATE OR REPLACE VIEW` sütunları AD yox, POZİSİYA üzrə tanıyır — bu, `product_code`/`category_name`/`unit_name`/`region_name`-in hər birini bir slot sağa itələdi, Postgres bunu "cannot change name of view column product_code to currency" kimi rədd etdi (`bootRun` DDL tranzaksiyası daxilində təhlükəsiz geri qaytarıldı, DB-yə zərər dəymədi — dəqiq #10-dakı kimi). Düzəliş: `currency` final `SELECT`-in ən sonuna (`region_name`-dən sonra) köçürüldü. Dərs (indi 024-ün öz şərhinə də yazıldı): bu view-ə HƏR yeni sütun əlavəsi mütləq siyahının SONUNA getməlidir, əvvəlki iki dəfə (#10, #20) sənədləşməsinə baxmayaraq eyni səhv üçüncü dəfə təkrarlandı — gələcəkdə bu view-ə toxunarkən əvvəlcə bu qeydi (və 024-ün öz şərhini) oxumaq tövsiyə olunur.

---

## 6. Nə YOXDUR / hələ edilməyib (bilərəkdən, tapşırıq bunu tələb etmirdi)

- **`PriceStatus`-da `EXPIRED` statusu yoxdur** — yalnız `PENDING/APPROVED/REJECTED`. Vaxtı keçmiş (`expireDate < today`) `APPROVED` qiymətlər status dəyişmədən qalır, "cari qiymət" sorğusu bunu tarix müqayisəsi ilə həll edir (scheduled job olmadan status-u sinxron saxlamaq daha kövrək olardığı üçün bilərəkdən belə edilib).
- **Digər business modulları** (construction cost qeydiyyatı, layihələr, smeta, qiymət/miqdar qeydləri və s.) — `resource-categories` (hierarxik kataloq), `products` (kataloq — kateqoriya+atributlar+öz kodu) və `resources` (təşkilatın konkret elanları) hazırdır, amma bunlara istinad edəcək qiymətləndirmə/smeta modulları **hələ yoxdur**.
- **Atribut şablonu/sxemi tam enforce olunmur** — `required` sahəsi saxlanılır (informativ bayraq), amma `POST /api/products` bir product yaradanda bütün `required=true` atributların göndərildiyini məcburi yoxlamır — spesifikasiya bunu tələb etməyib.
- `product_attributes`-in kütləvi (bulk) yeniləmə endpoint-i yoxdur — bir product-un atributları yalnız yaradılış anında (`POST /api/products`) toplu göndərilir, sonradan dəyişdirmək üçün ayrıca endpoint yoxdur (dizayn qərarı — bax bölmə 4t: atribut dəyişəndə əslində fərqli bir product-dur).
- `resource_categories`/`resources`-in avtomatik silinmə/cleanup job-u yoxdur (tapşırıqda tələb olunmayıb).
- Bir kateqoriyaya/unit-ə/region-a/supplier-ə bir dəfə belə resurs və ya qiymət bağlanıbsa (silinmiş olsa belə) o, **həmişəlik silinməzdir** (bax bölmə 5, #5) — bu, qəsdən belədir, amma production-da uzunmüddətli DB "şişməsinə" səbəb ola bilər; lazım olsa gələcəkdə `resource_categories`/`units`/`regions`/`suppliers`-ə də soft-delete əlavə etmək düşünülə bilər.
- ~~**User/Role idarəetmə endpoint-ləri** (`/api/users`, `/api/roles` CRUD) — tapşırıqda yalnız auth endpoint-ləri istənilmişdi, ona görə əlavə olunmayıb.~~ **2026-08-03-dən etibarən köhnəlib** — bax bölmə 4w, indi mövcuddur (mərkəzi heyət + vendor təşkilat onboarding-i üçün).
- `/api/users` yalnız mərkəzi heyəti (`organizationId=NULL`) idarə edir — vendor təşkilatın öz giriş hesabını redaktə etmək üçün ayrıca endpoint yoxdur (bilərəkdən, bax bölmə 4w — bu, istifadəçinin təsdiqlədiyi domen modelidir). **İstisna (2026-08-12, bölmə 4cc):** bundled login-in `email`-i indi `PUT /api/organizations/{id}` ilə redaktə oluna bilir — `username`/`password` isə hələ də heç bir yolla redaktə olunmur.
- `/api/users`-də parol dəyişmə (update zamanı) yoxdur — yalnız `firstName`/`lastName`/`enabled`/`accountNonLocked`/`roleNames` redaktə olunur (scope-dan kənar saxlanıldı).
- Organizations/Users üçün DELETE (hard-delete) yoxdur — `FK RESTRICT` səbəbindən (users→organizations), status/enabled ilə "söndürmə" istifadə olunur, digər modullarla eyni məntiq (bax bölmə 5, #5).
- Refresh token-lərin avtomatik təmizlənməsi (expired/revoked cleanup job) yoxdur — vaxtla `refresh_tokens` cədvəli böyüyəcək (production üçün lazım olacaq, local dev-də əhəmiyyətsizdir).
- Rate limiting / brute-force qorunması login endpoint-i üçün yoxdur.
- CI/CD pipeline yoxdur.
- Test coverage minimaldır — yalnız 2 unit test (`JwtTokenProviderTest`, `UsernameValidatorTest`), DB tələb edən inteqrasiya testi yoxdur (bilərəkdən — `./gradlew build`-in Docker olmadan işləməsi üçün).
- Production sirr idarəetməsi (Vault, AWS Secrets Manager və s.) yoxdur — `application-prod.yml` yalnız env dəyişənlərini gözləyir, defolt yoxdur (bilərəkdən fail-fast).

---

## 7. Necə işə salmaq olar

```powershell
docker compose up -d      # Postgres + pgAdmin + MinIO
./gradlew bootRun         # backend (dev profili defoltdur)
```

- Swagger: http://localhost:8181/swagger-ui.html
- Health: http://localhost:8181/actuator/health
- pgAdmin: http://localhost:5050 (admin@ccms.dev / admin123)
- MinIO console: http://localhost:9001 (ccms_minio / ccms_minio_password, dev defolt)
- Login: `admin` / `Admin123!`

Dayandırmaq üçün: backend prosesini dayandırın, sonra `docker compose down` (və ya `-v` ilə volume-ları da silmək üçün, amma bu Postgres data-sını silər). **Restart edərkən bölmə 0-dakı orphan-process yoxlamasını unutmayın.**
