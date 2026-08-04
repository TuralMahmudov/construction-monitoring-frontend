# CCMS Frontend — Admin Panel: Organization (Vendor) + User (Central Staff) + Role Lookup

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT.md`** (əsas 8 modul) və **`FRONTEND_AI_PROMPT_ADMIN_PANEL.md`**-un
> (org-ownership/görünürlük admin funksionallığı) **davamıdır** — unified response envelope,
> `PageResponse<T>`, auth axını, MUI stack, `isCentralAdmin` gating burada təkrarlanmır, birbaşa
> istinad edilir. `FRONTEND_AI_PROMPT_ADMIN_PANEL.md`-in "⚠️ Vacib məhdudiyyət:
> `organizations` üçün CRUD endpoint-i YOXDUR" bölməsi artıq **köhnəlib** — bu fayl həmin boşluğu
> bağlayır.
>
> Bu fayl backend-də **2026-08-03**-də əlavə olunmuş 3 yeni endpoint qrupunu əhatə edir:
> (1) `/api/organizations` — vendor təşkilat onboarding-i (giriş hesabı bundle olunur),
> (2) `/api/users` — mərkəzi (central) heyət idarəetməsi, (3) `/api/roles` — rol lookup-u
> (dropdown üçün). Bütün bunlar **real Postgres-ə qarşı canlı test edilib** — `PROJECT_STATUS.md`
> bölmə 4w-də tam detal var, bu fayl yalnız frontend üçün lazım olan hissəni çıxarır.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Domen modeli (vacib, UI-ı buna görə qurun)

- **"Mərkəz"** DB-də ayrıca bir sətir DEYİL — `organizationId=NULL` olan bütün istifadəçilər
  mərkəzi fərdi heyətdir. Bu fayldakı "İstifadəçi yarat" forması YALNIZ bunları yaradır.
- **"Digər təşkilatlar" (vendor/təchizatçı)** `organizations` cədvəlində sətir kimi mövcuddur,
  HƏR BİRİNİN YALNIZ BİR giriş hesabı olur (`actorType=ORGANIZATION`, sistemə təşkilatın özü
  kimi login olur — fərdi işçi hesabı yoxdur). "Təşkilat yarat" forması bunu edir: ad + giriş
  məlumatları (username/password/rol) BİR formada, bir sorğuda.
- Nəticə: admin paneldə **iki ayrı, fərqli məqsədli forma** olmalıdır — "Yeni Təşkilat"
  (=`/api/organizations`, giriş hesabı bundle) və "Yeni İstifadəçi" (=`/api/users`, yalnız
  mərkəzi heyət). Bunları eyni formada birləşdirməyin — məntiqləri fərqlidir (biri
  təşkilat+giriş yaradır, digəri sırf fərdi hesab).
- `/api/users` siyahısı/detalı vendor giriş hesablarını **heç göstərmir** (backend-də
  `organizationId IS NULL` filtri sərt tətbiq olunur, `GET /api/users/{id}` vendor hesabının
  UUID-i ilə çağırılsa belə 404 qaytarır) — bunları redaktə etmək lazımdırsa, gələcəkdə ayrıca
  bir funksionallıq tələb olunacaq (hazırda yoxdur).

## Gating

Yeni 5 icazə (`ORGANIZATION_READ`/`ORGANIZATION_WRITE`/`USER_READ`/`USER_WRITE`/`ROLE_READ`)
hazırda **yalnız** `SUPER_ADMIN` və `ADMIN` rollarına verilib — `FRONTEND_AI_PROMPT_ADMIN_PANEL.md`
§1-də təsvir olunan mövcud gating kifayətdir, yeni məntiq lazım deyil:

```js
const isCentralAdmin = roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
```

Bütün bu bölmədəki menyu elementləri/formalar yalnız `isCentralAdmin === true` olanda göstərilsin.

---

## 1. `GET /api/roles` — rol lookup (dropdown üçün)

Paginasiya YOXDUR, sadə massiv (6 sabit rol):

```json
{
  "success": true,
  "data": [
    { "id": "uuid", "name": "SUPER_ADMIN", "description": "Full unrestricted access to the system" },
    { "id": "uuid", "name": "ADMIN", "description": "..." },
    { "id": "uuid", "name": "EXPERT", "description": "..." },
    { "id": "uuid", "name": "ANALYST", "description": "..." },
    { "id": "uuid", "name": "OPERATOR", "description": "..." },
    { "id": "uuid", "name": "VIEWER", "description": "..." }
  ]
}
```

Həm "Yeni Təşkilat", həm "Yeni İstifadəçi" formasındakı rol seçimi (multi-select) bu siyahıdan
gəlməlidir — heç bir rol adını frontend-də hardcode etməyin.

---

## 2. `/api/organizations` — vendor təşkilat onboarding-i

### `POST /api/organizations` (`ORGANIZATION_WRITE`)

Bir sorğuda həm təşkilat, həm onun tək giriş hesabı yaranır:

```json
{
  "name": "Acme Construction Supplies",
  "taxId": "TAX-0099",
  "contactInfo": "acme@example.com",
  "username": "acme-vendor",
  "email": "acme-vendor@example.com",
  "password": "VendorPass123!",
  "roleNames": ["OPERATOR"]
}
```

- `name`: məcburi. `taxId`/`contactInfo`: opsional.
- `username`/`email`/`password`: məcburi — bu, təşkilatın giriş hesabıdır (parol min 8 simvol).
- `roleNames`: məcburi, ən azı 1 rol (§1-dəki lookup-dan multi-select).
- **`type` sahəsi YOXDUR** — server həmişə `VENDOR` yaradır. Formaya "təşkilat növü" seçimi
  qoymayın, bu endpoint yalnız vendor üçündür.

Uğurlu cavab (`201`):

```json
{
  "success": true,
  "message": "Organization created successfully",
  "data": {
    "id": "uuid",
    "name": "Acme Construction Supplies",
    "type": 2,
    "taxId": "TAX-0099",
    "contactInfo": "acme@example.com",
    "status": 1
  }
}
```

- `type`: raw Integer kod — `1`=CENTRAL (bu endpoint-dən heç yaranmır, görməyəcəksiniz),
  `2`=VENDOR (həmişə bu).
- `status`: `1`=ACTIVE, `2`=INACTIVE, `3`=SUSPENDED (aşağıda §2.2-də dəyişdirilir).

**Xəta halları:** `username`/`email` artıq mövcuddursa → `400` (`"Username is already taken: ..."`
/ `"Email is already taken: ..."`). Naməlum `roleNames` → `400` (`"Unknown role: ..."`).

### 2.1 `GET /api/organizations/{id}` / `GET /api/organizations` (`ORGANIZATION_READ`)

Paginasiyalı siyahı (`PageResponse<OrganizationResponse>`), filtr: `name` (contains),
`status` (Integer, dəqiq bərabərlik). Sıralama defoltu `name`.

### 2.2 `PUT /api/organizations/{id}` (`ORGANIZATION_WRITE`)

```json
{ "name": "Acme Construction Supplies", "taxId": "TAX-0099", "contactInfo": "...", "status": 3 }
```

`status`-u `3` (SUSPENDED) və ya `2` (INACTIVE) edərək təşkilatı söndürə bilərsiniz — giriş
hesabının özü (`enabled`) toxunulmur, yalnız təşkilatın statusu dəyişir. **Bu, giriş hesabını
söndürmür** — vendor hələ də login ola bilər. Hesabı tam bloklamaq lazımdırsa, hazırda ayrıca
bir mexanizm yoxdur (gələcək iş kimi qeyd edin).

Hard-delete (DELETE) YOXDUR — təşkilat `users`/`resources`/`suppliers` tərəfindən istinad
edildiyi üçün (`FK RESTRICT`), silmək əvəzinə `status` ilə söndürülür.

---

## 3. `/api/users` — mərkəzi heyət idarəetməsi

### `POST /api/users` (`USER_WRITE`)

```json
{
  "username": "jane-central",
  "email": "jane@example.com",
  "password": "CentralPass123!",
  "firstName": "Jane",
  "lastName": "Doe",
  "roleNames": ["ANALYST"]
}
```

- **`organizationId`/`actorType` sahələri YOXDUR** — bu forma yalnız mərkəzi fərdi heyət
  yaradır, server avtomatik `organizationId=null`/`actorType=INDIVIDUAL` təyin edir. Formaya
  bunları qoymayın (göndərsəniz belə görməzdən gəlinir).
- `roleNames`: məcburi, ən azı 1 (§1-dəki lookup-dan).

Uğurlu cavab (`201`) — mövcud `UserResponse` formatı (`FRONTEND_AI_PROMPT_ADMIN_PANEL.md` §1-ə
bax), `organizationId` sahəsi `null` olduğu üçün JSON-da görünmür:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid", "username": "jane-central", "email": "jane@example.com",
    "firstName": "Jane", "lastName": "Doe", "enabled": true,
    "actorType": 1, "roles": ["ANALYST"]
  }
}
```

**Xəta halları:** `username`/`email` təkrarlanır → `400`. Naməlum rol → `400`.

### 3.1 `GET /api/users/{id}` / `GET /api/users` (`USER_READ`)

Paginasiyalı siyahı, filtr: `username`/`email` (contains), `enabled` (Boolean). Sıralama
defoltu `username`. **Yalnız mərkəzi heyəti göstərir** — vendor giriş hesabları bu siyahıda
görünmür, `GET /{id}` ilə vendor hesabının UUID-i göndərilsə belə `404` qaytarır.

### 3.2 `PUT /api/users/{id}` (`USER_WRITE`)

```json
{ "firstName": "Jane", "lastName": "Doe", "enabled": true, "accountNonLocked": true, "roleNames": ["ANALYST", "VIEWER"] }
```

`roleNames` mövcud rol dəstini **tamamilə əvəz edir** (əlavə etmə deyil). **Parol dəyişmə bu
endpoint-də yoxdur** — belə bir sahə göndərsəniz görməzdən gəlinir; parol sıfırlama lazımdırsa,
bu, ayrıca gələcək iş kimi qeyd olunmalıdır.

Hard-delete YOXDUR — `enabled=false` ilə söndürülür.

---

## 4. Sample curl

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:8181/api/auth/login -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}' | jq -r .data.accessToken)

# Yeni vendor təşkilat (giriş hesabı bundle)
curl -s -X POST http://localhost:8181/api/organizations -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{
    "name": "Acme Construction Supplies", "taxId": "TAX-0099", "contactInfo": "acme@example.com",
    "username": "acme-vendor", "email": "acme-vendor@example.com", "password": "VendorPass123!",
    "roleNames": ["OPERATOR"]
  }'

# Yeni mərkəzi istifadəçi
curl -s -X POST http://localhost:8181/api/users -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" -d '{
    "username": "jane-central", "email": "jane@example.com", "password": "CentralPass123!",
    "firstName": "Jane", "lastName": "Doe", "roleNames": ["ANALYST"]
  }'
```
