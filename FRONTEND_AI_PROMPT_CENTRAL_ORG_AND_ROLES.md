# CCMS Frontend — Mərkəz real təşkilat oldu + vendor rol bloku genişləndi (2026-09-07)

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu, **`FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md`**-nin davamıdır — konvensiyalar təkrarlanmır.

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## 1. Vendor təşkilat yaradanda `roleNames` artıq OPSİONALDIR — rol dropdown-unu tamamilə çıxarın

**Kontekst:** "Mənim Resurslarım" özünə-xidmət ekranı silindiyi üçün, vendor login-in praktik olaraq edə biləcəyi YEGANƏ şey sənəd yükləməkdir (`DOCUMENT_UPLOAD`, yalnız `OPERATOR`-da var). Real DB-də 18 vendor login-dən 17-si onsuz da `OPERATOR`-dur. Ona görə rol seçimi demək olar həmişə eyni nəticəyə gəlirdi — indi bunu backend özü həll edir:

- `roleNames` **artıq məcburi deyil**. Göndərilməsə (və ya boş göndərilsə), avtomatik `OPERATOR` təyin olunur.
- İstəsəniz yenə açıq şəkildə göndərə bilərsiniz (məs. nadir "yalnız-müşahidə, sənəd yükləyə bilməsin" halı üçün `roleNames: ["VIEWER"]`), amma bu, adi axının hissəsi deyil.
- `ADMIN`/`ANALYST`/`SUPER_ADMIN` **və indi əlavə olaraq `EXPERT`** göndərilsə, hələ də `400` ilə rədd olunur (bu, ayrıca tapılmış bir icazə-sızması idi, bağlanıb) — amma bunu göndərməyəcəksiniz belə, çünki sahə artıq formda yoxdur.

```json
POST /api/organizations
{ "name": "...", "type": 2, "username": "...", "email": "...", "password": "..." }
// roleNames YOXDUR — arxa planda avtomatik OPERATOR təyin olunur
```

**Dəyişiklik:** vendor təşkilat yaratma formasından **rol seçimi sahəsini tamamilə çıxarın** — `roleNames`-i heç göndərməyin, backend özü `OPERATOR` verəcək.

---

## 2. Mərkəzi işçinin `organizationId`-si artıq HƏMİŞƏ dolu gəlir

Əvvəllər mərkəzi işçilərin (`POST /api/users`, `GET /api/users`, `GET /api/auth/me`) `organizationId` sahəsi `null` idi. İndi hər istifadəçi (mərkəzi və ya vendor, fərq etməz) real bir təşkilat sətrinə bağlıdır — mərkəzi işçilər üçün bu, "Mərkəz" adlı sabit bir sətrin ID-sidir:

```json
GET /api/users/{id}
{
  "id": "...", "username": "admin", ...,
  "organizationId": "76e4e113-...",   // əvvəllər null idi, indi HƏMİŞƏ dolu
  "actorType": 1,
  "roles": ["SUPER_ADMIN"], ...
}
```

**Bunun UI-ə təsiri:** əgər hardasa (məs. istifadəçi siyahısında bir "Təşkilat" sütunu/sahəsi) `organizationId`-nin `null`/boş olmasına görə "Mərkəzi işçi" mənasını çıxarırdınızsa, bu məntiq artıq YANLIŞ nəticə verəcək (həmişə dolu görünəcək). Bunun əvəzinə:
- Mərkəzi işçi ekranlarında (`/api/users` ilə gələnlər) `organizationId`-ni ekranda göstərməyə ehtiyac yoxdur — bu ekranın özü onsuz da yalnız mərkəzi işçiləri göstərir (`GET /api/users` başqa heç kimi qaytarmır), "Təşkilat" sütunu artıq mənasızdır, göstərilirsə çıxara bilərsiniz.
- Əgər hər halda göstərmək istəsəniz, dəyər həmişə eyni olacaq ("Mərkəz") — ayrıca sorğuya ehtiyac yoxdur, sadəcə statik mətn kimi yaza bilərsiniz.
- **Vacib:** bu ID `GET /api/organizations` siyahısında GÖRÜNMÜR (bilərəkdən, vendor-only endpoint-dir) — həmin ID ilə axtarış/uyğunlaşdırma aparmağa çalışmayın, tapılmayacaq (404).

**Funksional dəyişiklik yoxdur** — bu, sırf məlumat sahəsinin məzmunu ilə bağlıdır, heç bir endpoint-in cavab strukturu/status kodu dəyişməyib.

---

## 3. Cavab: `BACKEND_REQUEST_ORGANIZATION_CREATE_409_BUG.md` və `BACKEND_REQUEST_USER_ROLE_OPTIONAL.md`

**409 bug — TAPILDI VƏ DÜZƏLDİLDİ, §1/§2 ilə heç bir əlaqəsi yox idi.** Kök səbəb: `taxId` boş sətir (`""`) göndəriləndə backend onu `null`-a çevirmirdi, DB-də isə çox əvvəldən `tax_id=''` olan köhnə bir test sətri var idi — hər yeni boş-taxId cəhdi onunla toqquşurdu (`uk_organizations_tax_id`). Backend-də `taxId` indi (email kimi) boş/whitespace olduqda `null`-a normallaşdırılır, köhnə blok edən sətir təmizləndi. Sizin təkrarlama ssenarinizi (2 ardıcıl, hər ikisi boş `taxId` ilə) eynilə təkrarladıq — indi hər ikisi `201` qaytarır. **Formda `taxId` sahəsini boş buraxmaq tam təhlükəsizdir, əlavə heç nə etməyə ehtiyac yoxdur.**

**`POST /api/users`-də `roleNames` — sorğunuz tətbiq edildi.** İndi bu endpoint-də də `roleNames` opsionaldır, göndərilməsə avtomatik **`VIEWER`** (ən aşağı səlahiyyət) təyin olunur — eyni `POST /api/organizations`-dakı kimi. İstəsəniz `UserCreateDialog.tsx`-dəki hardcode `roleNames: ["VIEWER"]` göndərməni silib sahəni tamamilə formdan çıxara bilərsiniz (məcburi deyil — hazırkı hardcode həlliniz də hələ işləyəcək, sadəcə artıq lazım deyil).

```json
POST /api/users
{ "username": "...", "email": "...", "password": "..." }
// roleNames YOXDUR — arxa planda avtomatik VIEWER təyin olunur
```

---

## Xülasə cədvəl

| Nə | Əvvəl | İndi |
|---|---|---|
| `POST /api/organizations` `roleNames` | Məcburi idi, form-da dropdown lazım idi | Opsional, defolt `OPERATOR` — dropdown-a ehtiyac yoxdur |
| `POST /api/organizations` `roleNames:["EXPERT"]` | Uğurlu keçirdi (səhv idi) | `400`, bloklanır |
| Mərkəzi işçinin `organizationId`-si | `null` | Həmişə dolu (sabit "Mərkəz" ID-si) |
| `GET /api/organizations` siyahısı | — | Dəyişməyib, Mərkəz orada görünmür |
| `POST /api/organizations` boş `taxId` | 2-ci cəhddən `409` (bug) | Düzəldildi, hər zaman `201` |
| `POST /api/users` `roleNames` | Məcburi idi | Opsional, defolt `VIEWER` |
