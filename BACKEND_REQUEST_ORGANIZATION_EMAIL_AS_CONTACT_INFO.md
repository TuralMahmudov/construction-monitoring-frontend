# Backend üçün sorğu — Təşkilat `email`-i giriş hesabından çıxarılıb əlaqə məlumatına keçirilsin

Bu fayl frontend tərəfindən 2026-08-12-də hazırlanıb, backend-ə göndərmək üçündür.

---

## Kontekst

Hazırda `POST /api/organizations` (təşkilat + giriş hesabı yaratma, bax
`FRONTEND_AI_PROMPT_ADMIN_ORG_USERS.md` § 2) `email` sahəsini giriş hesabının bir hissəsi kimi
işləyir:

- məcburi (`username`/`email`/`password` — "bu, təşkilatın giriş hesabıdır")
- unikal — təkrarlansa `400 "Email is already taken: ..."`
- yalnız yaratma zamanı yazılır: `GET /api/organizations`/`GET /api/organizations/{id}`
  cavablarında heç vaxt qayıtmır, `PUT /api/organizations/{id}` ilə də dəyişdirilə bilmir.

Giriş (login) isə həmişə yalnız `username` + `password` ilə olub — frontend-in login forması
yalnız `username` göndərir, `email` login axınına heç vaxt qarışmayıb. Bu səbəbdən email-in
"giriş hesabı" bölməsində unikal/məcburi credential kimi saxlanması artıq lazım deyil — sadəcə
əlaqə üçün informativ məlumat olaraq kifayətdir (məs. "Əlaqə məlumatı" (`contactInfo`) sahəsi
kimi: telefon, ünvan və s. ilə yanaşı).

## Sorğu

1. **`POST /api/organizations`** — `email` sahəsi:
   - Artıq **məcburi olmasın** (optional, boş buraxıla bilsin).
   - **Unikallıq yoxlaması ləğv olunsun** ("Email is already taken" xətası artıq atılmasın) —
     bu artıq login credential deyil, sadəcə məlumat sahəsidir.
   - Format yoxlaması (e-poçt formatına uyğunluq) istəyə bağlı saxlanıla bilər, amma məcburi
     deyil.

2. **`OrganizationResponse`** (`GET /api/organizations`, `GET /api/organizations/{id}`) —
   `email` sahəsi **əlavə olunsun** (indi ümumiyyətlə qayıtmır, `contactInfo`/`taxId` kimi
   oxuna bilən olsun).

3. **`PUT /api/organizations/{id}`** — `email` sahəsi **redaktə oluna bilsin**, `contactInfo`
   və `taxId` ilə eyni səviyyədə opsional sahə kimi əlavə olunsun (indi bu endpoint-də
   ümumiyyətlə yoxdur).

4. **Login (`POST /api/auth/login`) dəyişmir** — bu, artıq yalnız `username`+`password` ilə
   işləyir, `email` heç vaxt bu axına qarışmayıb. Bu sorğu login mexanizminə toxunmur, yalnız
   `email`-in təşkilat yaratma/redaktə axınındakı rolunu dəyişir.

## Nəyə görə lazımdır

Frontend tərəfində "Yeni Təşkilat" formunda `E-poçt` sahəsi "Giriş hesabı" bölməsində,
`İstifadəçi adı` və `Şifrə` arasında yerləşir — bu, operatorlara belə görünür ki, guya bu ayrıca
bir giriş üsuludur (email+parol ilə giriş), halbuki sistemdə belə bir mexanizm yoxdur. Bu,
formanın anlaşılmasını çətinləşdirir və (canlı sınaqda müşahidə etdiyimiz kimi) brauzerin
auto-fill funksiyası bu sahəni "login email"i kimi tanıyıb admin öz hesabının saxlanmış
məlumatlarını səhvən bu sahəyə doldura bilir.

Email-i sadə, opsional əlaqə məlumatına çevirməklə:

- Forma daha sadə və düzgün strukturlaşdırılmış olur ("Təşkilat məlumatları" bölməsində,
  VÖEN/Əlaqə məlumatı ilə yanaşı — "Giriş hesabı" bölməsi yalnız `username`+`password`-dan
  ibarət qalır).
- Artıq lazımsız unikallıq/məcburilik məhdudiyyəti aradan qalxır.
- Admin email-i sonradan redaktə edə bilər (indi ümumiyyətlə mümkün deyil).

---

**Qeyd:** Bu dəyişiklik yalnız `email`-in rolunu dəyişir — login axını (`username`+`password`)
toxunulmaz qalır, heç bir yeni endpoint tələb olunmur.
