# CCMS Frontend — Təşkilat `email`-i giriş hesabından çıxarıldı, opsional əlaqə məlumatına keçirildi

> Bu faylı olduğu kimi kopyalayıb frontend-i yazan AI alətinə verin.
> Bu fayl **2026-08-12**-də backend-də edilmiş bir dəyişikliyi əhatə edir və
> **`FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md`** § 2-dəki (`/api/organizations`) email-ə aid
> hissələri **əvəz edir** (o fayldakı digər bölmələr — rol lookup, `/api/users`, `status`
> idarəetməsi və s. — hələ də etibarlıdır, dəyişməyib).
>
> Backend tərəfi `PROJECT_STATUS.md` bölmə 4cc-də tam təsvir olunub (miqrasiya, canlı HTTP
> test nəticələri).

**Base URL (dev):** `http://localhost:8181` (dəyişməyib)

---

## Nə dəyişdi və niyə

Sizin qaldırdığınız problem (email `İstifadəçi adı`/`Şifrə` arasında yerləşdiyi üçün sanki
ayrıca bir "email+parol login" üsulu varmış kimi görünürdü, brauzer auto-fill-i də bunu login
sahəsi kimi tanıyıb admin-in öz məlumatlarını səhvən doldururdu) təsdiqləndi və düzəldildi.
**Login mexanizmi heç vaxt dəyişməyib** — `POST /api/auth/login` əvvəlki kimi yalnız
`username`+`password`-dur, email bu axına heç vaxt qarışmayıb və indi də qarışmır.

Texniki aydınlıq (UI qərarlarınıza təsir edə bilər): `email` `Organization`-un öz sahəsi
deyildi/deyil — tamamilə təşkilatın bundled giriş hesabının (`User`) sahəsidir, `username` ilə
eyni sətirdə saxlanılır. İndi bu sahənin rolu dəyişdi: artıq login credential-ı deyil, sadəcə
əlaqə məlumatıdır — amma fiziki olaraq hələ də giriş hesabı ilə bir yerdə saxlanılır (bu,
backend-in daxili detalıdır, frontend üçün fərq etmir — sadəcə "niyə email hələ də `username`-lə
eyni obyektə bağlıdır" sualının izahıdır).

---

## 1. `POST /api/organizations` — `email` artıq OPSİONALDIR

```json
{
  "name": "Acme Construction Supplies",
  "type": 2,
  "taxId": "TAX-0099",
  "contactInfo": "acme@example.com",
  "username": "acme-vendor",
  "password": "VendorPass123!",
  "roleNames": ["OPERATOR"]
}
```

- **`email` göndərilməyə bilər** (sahəni tamamilə buraxın və ya boş göndərin) — artıq `400
  "Email is required"` almayacaqsınız.
- Göndərilərsə, format yoxlanılır (`@Email`) və **hələ də unikaldır** — başqa bir təşkilat/
  mərkəzi istifadəçi tərəfindən artıq istifadə olunan email göndərsəniz, əvvəlki kimi
  `400 "Email is already taken: ..."` alacaqsınız. Fərq: boş/göndərilməyən email artıq bu
  yoxlamaya düşmür (istənilən sayda təşkilat email-siz qala bilər).
- `username`/`password` — **dəyişməyib**, hələ də məcburi, bu, təşkilatın giriş hesabıdır.

Uğurlu cavab (`201`) indi `email`-i də qaytarır (əvvəllər heç qaytarmırdı):

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
    "status": 1,
    "username": "acme-vendor",
    "email": "acme-vendor@example.com"
  }
}
```

Email göndərilməyibsə, `data.email` sahəsi cavabda ümumiyyətlə görünmür (JSON-da `null`
sahələr çıxarılır) — `data.email`-in mövcud olub-olmadığını yoxlayaraq idarə edin, boş string
gözləməyin.

## 2. `GET /api/organizations` / `GET /api/organizations/{id}` — `email` indi qayıdır

Əvvəllər `OrganizationResponse`-da email ümumiyyətlə yox idi. İndi `username` ilə eyni
səviyyədə, read-only sahə kimi əlavə olundu — yuxarıdakı nümunə cavab formatına baxın. Siyahı
görünüşündə (`GET /api/organizations`) hər sətirdə də eyni şəkildə gələcək.

## 3. `PUT /api/organizations/{id}` — `email` indi REDAKTƏ OLUNA BİLƏR

```json
{
  "name": "Acme Construction Supplies",
  "taxId": "TAX-0099",
  "contactInfo": "acme@example.com",
  "status": 1,
  "type": 2,
  "email": "new-contact@example.com"
}
```

- `email`: **yeni, opsional sahə** — `taxId`/`contactInfo` ilə eyni səviyyədə. Göndərilməzsə
  və ya boş göndərilərsə, mövcud email silinir/boş qalır (bu, `taxId`/`contactInfo`-nun
  davranışı ilə eynidir — bu endpoint dolğun overwrite edir, qismən (partial) update deyil,
  ona görə redaktə formasında həmişə cari dəyərləri əvvəlcədən doldurub göndərin).
- Unikallıq yoxlaması burada da işləyir: başqasının email-inə dəyişmək istəsəniz `400 "Email is
  already taken: ..."` alarsınız. Öz cari email-inizi eynilə geri göndərmək (dəyişməmiş)
  xətaya səbəb olmur.
- `username`/`password` — **hələ də bu endpoint-də yoxdur, redaktə oluna bilmir** (dəyişməyib).

---

## 4. Forma UI-ı üçün konkret tövsiyə

"Yeni Təşkilat" / "Təşkilatı Redaktə Et" formalarında:

- **`Email` sahəsini "Giriş hesabı" bölməsindən çıxarın.** Onu `Ad`/`Vergi nömrəsi (taxId)`/
  `Əlaqə məlumatı (contactInfo)` ilə yanaşı, **"Təşkilat məlumatları"** bölməsinə köçürün,
  label-i sadəcə "E-poçt (əlaqə üçün, opsional)" kimi qoyun.
- **"Giriş hesabı" bölməsi artıq yalnız `Username` + `Password`-dan ibarət olmalıdır** —
  bu, brauzerin auto-fill-i email-tipli sahəni login sahəsi kimi tanıyıb admin-in öz
  məlumatlarını yanlış doldurma problemini də aradan qaldırır (email input-u artıq
  password input-una bitişik deyil).
- "Təşkilatı Redaktə Et" formasına indi `Email` sahəsini əlavə edə bilərsiniz (əvvəllər
  ümumiyyətlə mümkün deyildi) — `GET`-dən gələn cari dəyəri doldurub göstərin.

---

## 5. Toxunulmayanlar (dəyişməyib, xatırlatma)

- **`POST /api/auth/login`** — yalnız `username`+`password`, dəyişməyib.
- **`POST /api/users` (mərkəzi heyət)** — `email` burada **hələ də məcburidir**
  (`FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` § 3-ə bax, dəyişməyib). Bu dəyişiklik **yalnız**
  `/api/organizations` axınına aiddir, `/api/users`-a yox — iki formanı qarışdırmayın.
