# CCMS Backend — Layihə Statusu

> Bu fayl layihənin hazırkı vəziyyətini izləmək üçündür: nə hazırdır, nə test olunub, nə hələ yoxdur.
> Son yenilənmə: **2026-07-28**

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
| Resource modulu (konkret resurslar) | ✅ Uçdan-uca test edilib, 1 real bug tapılıb düzəldilib (aşağıda bax, bölmə 4c və 5). **2026-07-28: `code` avtomatik generasiya olunur, `manufacturer`/`brand`/`model` autocomplete endpoint-ləri əlavə olundu** (bölmə 4q) |
| Resource Attribute modulu (EAV — dinamik xüsusiyyətlər) | ⚠️ **Köhnəlib** — 2026-07-28-də struktur atribut lüğəti (bölmə 4o) ilə əvəz olundu, sərbəst-mətn EAV artıq mövcud deyil (aşağıda bölmə 4d tarixi qeyd kimi saxlanılıb) |
| Unit (ölçü vahidi) modulu | ✅ Uçdan-uca test edilib, əvvəlki `unitId` gap-i də bağlandı (aşağıda bax, bölmə 4e) |
| Resource Price modulu (temporal qiymət + approval workflow) | ✅ Uçdan-uca test edilib, 1 real bug tapılıb düzəldilib (aşağıda bax, bölmə 4f və 5). **2026-07-28: hibrid model** — normal qiymət avtomatik `APPROVED`, yalnız kənar dəyərlər (`FLAGGED`) admin təsdiqi gözləyir (bölmə 4p) |
| Region və Supplier modulları | ✅ Uçdan-uca test edilib, `ResourcePrice`-in `regionId`/`supplierId` gap-i bağlandı (aşağıda bax, bölmə 4g) |
| `organizations` + `resource_match_groups` — DB sxemi (multi-vendor kataloq üçün) | ✅ Migrasiyalar (`018`-`023`) real Postgres-ə tətbiq edilib, entity-lər yaradılıb (aşağıda bax, bölmə 4h) |
| Resource Matching Engine (`match_group_id`-in avtomatik hesablanması) | ✅ Uçdan-uca test edilib (real HTTP + DB yoxlaması), 8 unit test yaşıl (aşağıda bax, bölmə 4i) |
| `resource_price_averages` view + kənar dəyər (outlier) auto-flag mexanizmi | ✅ Uçdan-uca test edilib (real HTTP+DB, canlı testdə 1 dizayn qüsuru tapılıb düzəldilib), 9 unit test yaşıl (aşağıda bax, bölmə 4j) |
| `GET /api/resource-prices/flagged` — admin review endpoint | ✅ Uçdan-uca test edilib (aşağıda bax, bölmə 4k) |
| `organization_id` sahiblik/görünürlük modeli — API səviyyəsində tətbiq (resources/resource_prices) | ✅ Uçdan-uca test edilib (2 real org ilə canlı HTTP, real JWT), 20 authorization unit test yaşıl (aşağıda bax, bölmə 4l) |
| Mərkəzi admin funksionallığı: aşağı-əminlikli match group review + approve/reject axınının averages-ə canlı təsiri | ✅ Uçdan-uca test edilib, 7 yeni unit test yaşıl (aşağıda bax, bölmə 4m) |
| `FRONTEND_AI_PROMPT.md` | ✅ Yalnız auth-u əhatə edirdi, indi **bütün 8 modulu** (auth + 7 business modul) əhatə edir — dəqiq endpoint/sahə adları, query param uyğunsuzluqları (məs. `category` vs `categoryId`), `ResourceType` kodları (1-6) sənədləşdirilib |
| Struktur Atribut Lüğəti (`attribute_definitions`/`attribute_enum_values`/`category_attribute_definitions`, `resource_attributes`-in yenidən qurulması) | ✅ Uçdan-uca test edilib (real HTTP+DB, 63 unit test yaşıl) — aşağıda bax, bölmə 4o |
| `FRONTEND_AI_PROMPT_RESOURCE_CREATION.md` | ✅ Yeni (2026-07-28) — struktur atribut lüğəti (breaking change), avtomatik resurs kodu, autocomplete, hibrid qiymət təsdiqi + istifadəçinin tələb etdiyi UX düzəlişləri (rəqəm input-ları, UUID göstərilməməsi, dialoq bağlama) frontend AI alətinə ötürmək üçün |
| Production-a hazırlıq | ⚠️ Yalnız **local development** üçün nəzərdə tutulub (tapşırıqda da belə göstərilib) |

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
  `009` resource_categories (hierarxik kataloq, self-referential FK), `010` resources (category_id FK RESTRICT, partial unique index kodu üçün),
  `011` resource_attributes (resource_id FK **CASCADE**, unique (resource_id, lower(attribute_name))),
  `012` units, `013` resources.unit_id-ə FK əlavəsi (`units.id`-ə, RESTRICT),
  `014` resource_prices (resource_id FK RESTRICT, region_id/supplier_id FK-sız, partial unique index "bir açıq aktiv qiymət" qaydası üçün),
  `015` regions, `016` suppliers, `017` resource_prices.region_id/supplier_id-ə FK əlavəsi (RESTRICT),
  `018` **organizations** (BaseEntity pattern, `type`/`status` enum-backed INTEGER, `tax_id` unikal), `019` `users`-ə `organization_id` (FK RESTRICT) + `actor_type` (default `INDIVIDUAL`) əlavəsi,
  `020` **resource_match_groups** (`category_id` FK RESTRICT, `(category_id, match_key)` unikal), `021` `resources`-ə `organization_id` (FK RESTRICT) + `match_group_id` (FK **SET NULL**) əlavəsi,
  `022` `suppliers`-ə `organization_id` (FK **SET NULL**, nullable "körpü") əlavəsi, `023` `VIEW_ALL_ORGANIZATION_RESOURCES` permission seed,
  `024` **`resource_price_averages` VIEW** (`createView`, `runOnChange="true"` — cədvəllərdən fərqli olaraq view-lar üçün qəbul edilən praktika),
  `025` `VIEW_ALL_ORGANIZATION_RESOURCES`-in `SUPER_ADMIN`/`ADMIN`-ə verilməsi, `026` `resource_match_groups`-a `review_status` sütunu (default `CONFIRMED`)
- **Qeyd:** XSD referansı `dbchangelog-latest.xsd`-dir (versiya uyğunsuzluğu problemi buna görə həll olundu — aşağı hissəyə bax)

### Cədvəllər
`users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `refresh_tokens`, `audit_logs` — hamısı `BaseEntity` pattern-i ilə (UUID id, created/updated_at, created/updated_by, `deleted` soft-delete, `version` optimistic lock). `user_roles`/`role_permissions` sadə join cədvəlləridir (BaseEntity sahələri yoxdur — bu normaldır, JPA `@JoinTable`-dır).

`resource_categories` və `resources` — **BaseEntity-dən istifadə ETMİR** (tapşırıqda fərqli auditing sahələri istənilib: `UUID createdBy/modifiedBy` + `LocalDateTime createdDate/modifiedDate`, `version` yoxdur). Bu sahələr servis səviyyəsində əl ilə doldurulur (`CurrentUserUtil`), qlobal JPA auditing-ə (o, `String` işlədir) qarışmır. `resources`-da **soft-delete var** (`deleted` sütunu + `@SQLDelete`/`@SQLRestriction`, spesifikasiyada açıq tələb olunub) — `resource_categories`-də isə YOXDUR (hard delete, tələb olunmayıb).

`resources.unit_id` — **2026-07-21-dən etibarən FK-sı var** (`units.id`-ə, RESTRICT, migration `013`), və `ResourceServiceImpl` create/update zamanı `unitId` verilibsə mövcudluğunu yoxlayır (`assertUnitExists`). Əvvəllər bu bölmədə "gələcəkdə ediləcək" kimi qeyd olunmuşdu — indi tamamlanıb.

`units` — audit sahələri yoxdur (spesifikasiya tələb etməyib), soft-delete yoxdur (hard delete, spesifikasiya tələb etməyib). `code` qlobal unikaldir (DB `UNIQUE` constraint + app-level yoxlama).

`resource_attributes` — EAV (entity-attribute-value) stili: resursun sabit sütun dəsti əvəzinə sərbəst `attributeName`/`attributeValue` cütləri saxlanılır (resurs tipindən asılı olaraq fərqli xüsusiyyətlər — voltaj, rəng, çəki və s. — üçün sütun artımının qarşısını alır). Spesifikasiyada audit sahələri (`createdBy` və s.) tələb olunmayıb, ona görə bu entity-də yoxdur. `resource_id → resources.id` FK-sı **CASCADE**-dir (kateqoriya/resurs münasibətindəki RESTRICT-dən fərqli olaraq — atributlar resursun "sahiblənmə" datası deyil, sadəcə uşaq datasıdır).

`resource_prices` — temporal (zaman üzrə versiyalı) qiymət modeli + approval workflow. Əsas dizayn qərarları:
- **"Heç vaxt tarixi qiyməti üzərinə yazma"** belə tətbiq olunub: yeni qiymət yaradıldıqda `status=PENDING`-dir; `PUT` yalnız `PENDING` statusda icazəlidir (`APPROVED`/`REJECTED` olduqdan sonra 409 — dəyişiklik lazımdırsa YENİ qiymət yaradılmalıdır).
- **"Yalnız bir aktiv qiymət (resurs+təchizatçı+region üzrə)"**: `approve()` zamanı eyni üçlük üçün əvvəlki açıq (`expireDate IS NULL` və ya üst-üstə düşən) `APPROVED` qiymət avtomatik "təqaüdə göndərilir" — onun **`expireDate`-i** yeni qiymətin `effectiveDate`-indən 1 gün əvvələ kəsilir, amma **`price`/`vat` dəyəri heç vaxt dəyişdirilmir** (yalnız etibarlılıq pəncərəsi bağlanır).
- `regionId`/`supplierId` — **2026-07-21-dən etibarən FK-ları var** (`regions.id`/`suppliers.id`-ə, RESTRICT, migration `017`), və `ResourcePriceServiceImpl` create/update zamanı hər ikisinin mövcudluğunu yoxlayır (`assertRegionExists`/`assertSupplierExists`). Əvvəllər bu bölmədə "gələcəkdə ediləcək" kimi qeyd olunmuşdu — indi tamamlanıb.
- `approvedBy`/`approvedDate` — həm approve, həm reject qərarında doldurulur (ayrıca "rejectedBy" sahəsi spesifikasiyada yoxdur, bu cüt "kim qərar verdi" mənasında işlədilir).
- `modifiedBy`/`modifiedDate` yoxdur (spesifikasiyada tələb olunmayıb) — dizayna uyğundur, çünki `PENDING` xaricində heç nə dəyişmir.

`regions` və `suppliers` — istifadəçinin seçimi ilə **Unit modulu ilə eyni strukturda** (`id, code, name, active`, audit sahələri yoxdur, hard delete, qlobal unikal `code`). `ResourcePrice`-də istifadə olunan region/supplier silinə bilməz (`RegionInUseException`/`SupplierInUseException`, 409) — `ResourcePrice`-in özündə soft-delete olmadığı üçün (heç bir DELETE endpoint-i belə yoxdur), bu yoxlama sadə `existsByRegionId`/`existsBySupplierId` ilə edilir, `Resource`/`Unit` modullarındakı soft-delete-aware native sorğu workaround-una ehtiyac yoxdur.

### Java paketləri (`src/main/java/com/ccms/`)
| Paket | Fayllar |
|---|---|
| `entity` | BaseEntity, User, Role, Permission, RefreshToken, AuditLog, RoleName (enum), ResourceCategory, ResourceType (enum), Resource, ResourceAttribute (2026-07-28 yenidən yazıldı, bölmə 4o), Unit, ResourcePrice, PriceStatus (enum), Region, Supplier, Organization, OrganizationType (enum), OrganizationStatus (enum), ActorType (enum), ResourceMatchGroup, **AttributeDefinition, AttributeDataType (enum), AttributeEnumValue, CategoryAttributeDefinition** |
| `repository` | UserRepository, RoleRepository, PermissionRepository, RefreshTokenRepository, AuditLogRepository, ResourceCategoryRepository, ResourceCategorySpecifications, ResourceRepository, ResourceSpecifications (`hasAttribute` 2026-07-28 yenidən yazıldı), ResourceAttributeRepository (2026-07-28 yenidən yazıldı), UnitRepository, UnitSpecifications, ResourcePriceRepository, ResourcePriceSpecifications, RegionRepository, RegionSpecifications, SupplierRepository, SupplierSpecifications, ResourceMatchGroupRepository, **AttributeDefinitionRepository, AttributeDefinitionSpecifications, AttributeEnumValueRepository, CategoryAttributeDefinitionRepository** |
| `matching` | MatchingProperties (`ccms.matching.*` config, yalnız `minSignalsForConfidentMatch` qalıb), MatchKeyCalculator (2026-07-28 sadələşdirildi, bölmə 4o), **AttributeMatchSignal (record)** |
| `pricing` | PriceOutlierProperties (`ccms.pricing.outlier.*` config), PriceOutlierDetector |
| `security` | JwtProperties, JwtTokenProvider, TokenType, UserPrincipal, CustomUserDetailsService, JwtAuthenticationFilter, JwtAuthenticationEntryPoint |
| `config` | SecurityConfig, OpenApiConfig, JpaAuditingConfig, AdminAccountInitializer |
| `dto/request` | LoginRequest, RefreshTokenRequest, CreateResourceCategoryRequest, UpdateResourceCategoryRequest, MoveCategoryRequest, ResourceCategorySearchCriteria, CreateResourceRequest, UpdateResourceRequest, ResourceSearchCriteria, CreateResourceAttributeRequest, UpdateResourceAttributeRequest (2026-07-28 yenidən yazıldı — `categoryAttributeDefinitionId`+`value`), CreateUnitRequest, UpdateUnitRequest, UnitSearchCriteria, CreateResourcePriceRequest, UpdateResourcePriceRequest, ResourcePriceSearchCriteria, CreateRegionRequest, UpdateRegionRequest, RegionSearchCriteria, CreateSupplierRequest, UpdateSupplierRequest, SupplierSearchCriteria, **CreateAttributeDefinitionRequest, UpdateAttributeDefinitionRequest, AttributeDefinitionSearchCriteria, CreateAttributeEnumValueRequest, UpdateAttributeEnumValueRequest, LinkAttributeToCategoryRequest, UpdateCategoryAttributeDefinitionRequest** |
| `dto/response` | ApiResponse, ApiErrorResponse, JwtAuthResponse, UserResponse, ResourceCategoryResponse, ResourceCategoryTreeNode, PageResponse\<T\>, ResourceResponse, ResourceAttributeResponse (2026-07-28 yenidən yazıldı — atribut ad/tip/vahid indi cavaba daxildir), UnitResponse, ResourcePriceResponse, RegionResponse, SupplierResponse, **AttributeDefinitionResponse, AttributeEnumValueResponse, CategoryAttributeDefinitionResponse** |
| `mapper` | UserMapper, ResourceCategoryMapper, ResourceMapper, UnitMapper, ResourcePriceMapper, RegionMapper, SupplierMapper (hamısı MapStruct), **AttributeEnumValueMapper** (`ResourceAttributeMapper` 2026-07-28 silindi — cavab çoxlu cədvəldən yığıldığı üçün servisdə əl ilə qurulur) |
| `exception` | GlobalExceptionHandler, ResourceNotFoundException, BadRequestException, InvalidTokenException, DuplicateCategoryCodeException, CircularHierarchyException, CategoryHasChildrenException, CategoryInUseException, DuplicateResourceCodeException, DuplicateAttributeNameException, DuplicateUnitCodeException, UnitInUseException, InvalidPriceStateException, DuplicateRegionCodeException, RegionInUseException, DuplicateSupplierCodeException, SupplierInUseException, **DuplicateAttributeDefinitionNameException, AttributeDefinitionInUseException, CategoryAttributeDefinitionInUseException** |
| `audit` | AuditAction, AuditorAwareImpl, AuditLogService |
| `util` | HashUtil (SHA-256), IpAddressUtil, CurrentUserUtil |
| `validation` | ValidUsername, UsernameValidator |
| `service` (+`impl`) | AuthService/AuthServiceImpl, UserService/UserServiceImpl, ResourceCategoryService/ResourceCategoryServiceImpl, ResourceService/ResourceServiceImpl (indi ResourceMatchingService-dən asılıdır), ResourceAttributeService/ResourceAttributeServiceImpl (2026-07-28 tam yenidən yazıldı, bölmə 4o), UnitService/UnitServiceImpl, ResourcePriceService/ResourcePriceServiceImpl (indi Region/SupplierRepository-dən də asılıdır), RegionService/RegionServiceImpl, SupplierService/SupplierServiceImpl, ResourceMatchingService/ResourceMatchingServiceImpl, ResourceMatchGroupWriter, **AttributeDefinitionService/AttributeDefinitionServiceImpl, CategoryAttributeDefinitionService/CategoryAttributeDefinitionServiceImpl** |
| `controller` | AuthController, ResourceCategoryController (2026-07-28 `/{id}/attributes` GET+POST əlavə olundu), ResourceController, ResourceAttributeController, UnitController, ResourcePriceController, RegionController, SupplierController, **AttributeDefinitionController, CategoryAttributeDefinitionController** |

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

### Endpoint-lər — Resources (`/api/resources`)
| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (kateqoriya mövcudluğu; **2026-07-28: `code` artıq göndərilmir, avtomatik generasiya olunur — bölmə 4q**) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib (`code` artıq dəyişməzdir) |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (soft-delete) |
| `GET /{id}` | `COST_READ` | ✅ test edilib (soft-deleted → 404) |
| `GET /` (pagination+sorting+filtering) | `COST_READ` | ✅ test edilib (`name/code/category/manufacturer/brand/unit/status` + **`attributeName`/`attributeValue`** filtri, `sort=` parametri) |
| `GET /{resourceId}/attributes` | `COST_READ` | ✅ test edilib (sortOrder-ə görə sıralı, resurs yoxdursa 404) |
| `GET /manufacturers`, `/brands`, `/models` (`?search=`) | `COST_READ` | ✅ test edilib — autocomplete, mövcud fərqli dəyərlər (bölmə 4q, 2026-07-28) |

**Qeyd (2026-07-27):** `POST/PUT/DELETE/{id}/GET/{id}/GET` (search) indi `organization_id` görünürlük/sahiblik modelinə tabedir — bölmə 4l-ə bax (başqa təşkilatın resursu = 404, ümumi (`NULL`) resurs hamıya görünür amma yalnız mərkəz redaktə edir, `VIEW_ALL_ORGANIZATION_RESOURCES` hər şeyi görür/redaktə edir).

### Endpoint-lər — Resource Attributes (`/api/resource-attributes`)
**Qeyd (2026-07-28):** Struktur atribut lüğəti ilə yenidən dizayn edildi (bölmə 4o) — indi `attributeName`/`attributeValue`/`unit` yerinə `categoryAttributeDefinitionId`+`value` qəbul edir.

| Endpoint | Permission | Status |
|---|---|---|
| `POST /` | `COST_WRITE` | ✅ test edilib (resurs+link mövcudluğu, link resursun kateqoriyasına aiddir, unikal `(resourceId, categoryAttributeDefinitionId)`, dəyər `data_type`-a görə doğrulanır) |
| `PUT /{id}` | `COST_WRITE` | ✅ test edilib (yalnız `value`/`active` dəyişir) |
| `DELETE /{id}` | `COST_WRITE` | ✅ test edilib (hard delete — spesifikasiyada soft-delete tələb olunmayıb) |

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
| `GET /averages` (matchGroupId/regionId opsional) | `COST_READ` | ✅ test edilib — `resource_price_averages` sorğusu, **organization-görünürlük filtrsiz** (yalnız aqreqat, bax bölmə 4l) |

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
Permission-lar: `USER_READ/WRITE/DELETE`, `ROLE_READ/WRITE`, `COST_READ/WRITE/APPROVE`, `REPORT_READ/EXPORT`, `AUDIT_READ`, `SYSTEM_ADMIN` — construction-cost domenini əks etdirən permission dəsti. `resource-categories`, `resources`, `resource-attributes`, `units`, `regions` və `suppliers` modulları üçün **yeni permission yaradılmayıb**, mövcud `COST_READ`/`COST_WRITE`-dan istifadə olunur. `resource-prices` isə əlavə olaraq `COST_APPROVE`-dan da istifadə edir.

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

## 5. Verifikasiya zamanı tapılıb düzəldilən buglar

1. **`logback-spring.xml`** — `TimeBasedRollingPolicy` ilə `%i` token-i (`maxFileSize`) uyğun deyildi → tətbiq açılışda çökürdü. Düzəliş: `SizeAndTimeBasedRollingPolicy`.
2. **Liquibase XSD versiyası** — changelog-larda `dbchangelog-4.29.xsd` göstərilmişdi, amma quraşdırılmış Liquibase versiyası bunu lokal bundle etmirdi və offline mühitdə (`secureParsing=true`) uzaqdan çəkilməsinə icazə verilmirdi. Düzəliş: bütün 9 fayında `dbchangelog-latest.xsd`.
3. **pgAdmin email** — `admin@ccms.local` pgAdmin-in daxili email validator-u tərəfindən rədd edilirdi (`.local` etibarsız TLD). Düzəliş: `.env`-də `admin@ccms.dev`.

Bu üçü də koda edilib (fayllar yenilənib), sadəcə build/run zamanı üzə çıxdığı üçün burada qeyd olunur.

4. **Orphan `bootRun` prosesi (2026-07-20)** — arxa planda başladılan `bootRun` tapşırığı "dayandırılsa" belə, alt `java.exe` prosesi bəzən öldürülmür (yalnız izləyici wrapper dayanır) və portu (8181) tutmağa davam edir. Nəticədə yeni kod ilə başlatma cəhdi "Port XXXX was already in use" xətası ilə uğursuz olur, amma köhnə (bir neçə gün əvvəlki) kod hələ cavab verməyə davam edir — bu, yeni endpoint-lərin/dəyişikliklərin "yoxdur" kimi görünməsinə səbəb ola bilər. Həll: hər restart-dan əvvəl `Get-NetTCPConnection -LocalPort <port>` ilə yoxla, tapılan prosesi `Stop-Process -Force` ilə bağla, sonra yenidən başlat. Bax bölmə 0.

5. **Soft-delete ↔ FK uyğunsuzluğu (2026-07-20)** — `ResourceCategoryServiceImpl.delete()`-də "kateqoriyanın resursu var-yoxdur" yoxlaması (`existsByCategoryId`) `Resource`-un `@SQLRestriction("deleted = false")`-u səbəbindən yalnız **aktiv** (silinməmiş) resursları görürdü. Amma bir resurs soft-delete edildikdən sonra da fiziki sətir `resources` cədvəlində qalır və `resource_categories`-ə FK ilə bağlıdır. Nəticədə: son resursu soft-delete edilmiş kateqoriyanı silməyə çalışanda app-səviyyəli yoxlama "OK" deyirdi, amma real DB DELETE əməliyyatı FK constraint-ini pozurdu → tutulmamış `ConstraintViolationException` → **500 Internal Server Error** (əvəzinə gözlənilən təmiz 409). Düzəliş: (1) `ResourceRepository`-ə native SQL sorğusu ilə `existsByCategoryIdIncludingDeleted` əlavə edildi (soft-delete filtrini bilərəkdən bypass edir, çünki FK-nın özü də bunu bilmir); (2) `GlobalExceptionHandler`-ə ümumi `DataIntegrityViolationException` → 409 handler-i əlavə edildi (gələcəkdə bənzər uyğunsuzluqların 500 yerinə təmiz error qaytarması üçün təhlükəsizlik toru). Nəticə: bir kateqoriyaya heç vaxt resurs bağlanmışdısa (silinmiş olsa belə), o kateqoriya artıq həmişəlik silinməzdir — bu, qəsdən belədir (audit-trail qorunması).

6. **Hibernate flush-ordering ↔ partial unique index (2026-07-21)** — `ResourcePriceServiceImpl.approve()`-də əvvəlki aktiv qiyməti "təqaüdə göndərmək" (`expireDate`-i kəsmək) və yeni qiyməti `APPROVED` etmək eyni tranzaksiya daxilində iki ayrı `repository.save()` çağırışı idi. Hibernate defolt olaraq bu UPDATE-ləri tranzaksiya sonunda İSTƏNİLƏN sırada flush edə bilər (Java kodundakı çağırış sırasına zəmanət vermir). Nəticədə bəzən yeni qiymətin `status=APPROVED, expire_date=NULL` UPDATE-i əvvəlki qiymətin `expire_date`-i hələ kəsilməmişdən ƏVVƏL fiziki icra olunurdu — bu an üçün eyni (resource_id, supplier_id, region_id) üçlüyündə İKİ açıq `APPROVED` sətir mövcud olurdu, `uk_resource_prices_active_open` partial unique index-i pozulurdu → **409 Conflict ilə approve əməliyyatı uğursuz olurdu** (istisna tutulduğu üçün 500 yox, amma əməliyyatın özü baş tutmurdu — funksional bug). Düzəliş: təqaüdə göndərmə addımında `repository.save()` əvəzinə `repository.saveAndFlush()` istifadə edildi ki, köhnə sətrin `expire_date`-i DB-yə YENİ qiymətin statusu yazılmadan ƏVVƏL fiziki yazılsın. Canlı testlə təsdiqləndi: düzəlişdən sonra approve uğurla keçdi, köhnə qiymətin `price`/`vat` dəyəri toxunulmadan qaldı, yalnız `expireDate`-i düzgün kəsildi.

7. **Səhv tipli sahə/parametr → 500 (əvəzinə 400) (2026-07-22)** — bu bug frontend tərəfini yazan başqa bir AI agent tərəfindən real istifadə zamanı tapıldı: `resource-categories`-ə `type: "MATERIAL"` (string, Integer sahəsinə) göndərəndə 500 alırdı (əvəzinə gözlənilən 400 validation xətası). Səbəb: `GlobalExceptionHandler`-də Jackson-un JSON body-ni deserializasiya edərkən atdığı `HttpMessageNotReadableException` (səhv tipli body sahəsi üçün) və Spring-in `MethodArgumentTypeMismatchException`-u (səhv tipli query param, məs. UUID gözlənilən yerə düzgün olmayan string üçün) heç bir xüsusi handler-ə uyğun gəlmirdi, ona görə ümumi `@ExceptionHandler(Exception.class)` catch-all-a düşüb 500 qaytarırdı. Düzəliş: hər iki exception tipi üçün ayrıca handler əlavə edildi, hər ikisi 400 + aydın mesaj (hansı sahə/parametr, hansı tip gözlənilirdi) qaytarır. Canlı testlə təsdiqləndi (həm body, həm query param üçün). Bu, `FRONTEND_AI_PROMPT.md`-də əvvəlcə "known rough edge" kimi qeyd olunmuşdu, sonra həqiqətən düzəldildi və sənəd bundan sonra yeniləndi.

---

## 6. Nə YOXDUR / hələ edilməyib (bilərəkdən, tapşırıq bunu tələb etmirdi)

- **`PriceStatus`-da `EXPIRED` statusu yoxdur** — yalnız `PENDING/APPROVED/REJECTED`. Vaxtı keçmiş (`expireDate < today`) `APPROVED` qiymətlər status dəyişmədən qalır, "cari qiymət" sorğusu bunu tarix müqayisəsi ilə həll edir (scheduled job olmadan status-u sinxron saxlamaq daha kövrək olardığı üçün bilərəkdən belə edilib).
- **Digər business modulları** (construction cost qeydiyyatı, layihələr, smeta, qiymət/miqdar qeydləri və s.) — `resource-categories` (hierarxik kataloq), `resources` (konkret material/maşın/işçi/nəqliyyat/xidmət qeydləri) və `resource-attributes` (dinamik xüsusiyyətlər) hazırdır, amma bunlara istinad edəcək qiymətləndirmə/smeta modulları **hələ yoxdur**.
- **Atribut şablonu/sxemi yoxdur** — məsələn "bütün MACHINERY resursları `power_kw` atributuna malik olmalıdır" kimi bir qayda tətbiq olunmur; `attributeName`/`attributeValue` tam sərbəstdir, hər resurs üçün ayrı-ayrı əl ilə əlavə edilir. `required` sahəsi sadəcə saxlanılır (informativ bayraq), heç bir yerdə enforce edilmir — spesifikasiya bunu tələb etməyib.
- `resource_attributes`-in kütləvi (bulk) yaradılma/yeniləmə endpoint-i yoxdur — hər atribut ayrı-ayrı `POST`/`PUT` ilə idarə olunur (spesifikasiyada tələb olunmayıb).
- `resource_categories`/`resources`-in avtomatik silinmə/cleanup job-u yoxdur (tapşırıqda tələb olunmayıb).
- Bir kateqoriyaya/unit-ə/region-a/supplier-ə bir dəfə belə resurs və ya qiymət bağlanıbsa (silinmiş olsa belə) o, **həmişəlik silinməzdir** (bax bölmə 5, #5) — bu, qəsdən belədir, amma production-da uzunmüddətli DB "şişməsinə" səbəb ola bilər; lazım olsa gələcəkdə `resource_categories`/`units`/`regions`/`suppliers`-ə də soft-delete əlavə etmək düşünülə bilər.
- **User/Role idarəetmə endpoint-ləri** (`/api/users`, `/api/roles` CRUD) — tapşırıqda yalnız auth endpoint-ləri istənilmişdi, ona görə əlavə olunmayıb.
- Refresh token-lərin avtomatik təmizlənməsi (expired/revoked cleanup job) yoxdur — vaxtla `refresh_tokens` cədvəli böyüyəcək (production üçün lazım olacaq, local dev-də əhəmiyyətsizdir).
- Rate limiting / brute-force qorunması login endpoint-i üçün yoxdur.
- CI/CD pipeline yoxdur.
- Test coverage minimaldır — yalnız 2 unit test (`JwtTokenProviderTest`, `UsernameValidatorTest`), DB tələb edən inteqrasiya testi yoxdur (bilərəkdən — `./gradlew build`-in Docker olmadan işləməsi üçün).
- Production sirr idarəetməsi (Vault, AWS Secrets Manager və s.) yoxdur — `application-prod.yml` yalnız env dəyişənlərini gözləyir, defolt yoxdur (bilərəkdən fail-fast).

---

## 7. Necə işə salmaq olar

```powershell
docker compose up -d      # Postgres + pgAdmin
./gradlew bootRun         # backend (dev profili defoltdur)
```

- Swagger: http://localhost:8181/swagger-ui.html
- Health: http://localhost:8181/actuator/health
- pgAdmin: http://localhost:5050 (admin@ccms.dev / admin123)
- Login: `admin` / `Admin123!`

Dayandırmaq üçün: backend prosesini dayandırın, sonra `docker compose down` (və ya `-v` ilə volume-ları da silmək üçün, amma bu Postgres data-sını silər). **Restart edərkən bölmə 0-dakı orphan-process yoxlamasını unutmayın.**
