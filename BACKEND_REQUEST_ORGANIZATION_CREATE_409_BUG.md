# Backend üçün bug report — `POST /api/organizations` hər zaman `409 Conflict` qaytarır

Bu fayl frontend tərəfindən 2026-09-07-də hazırlanıb, backend-ə göndərmək üçündür.

**🔴 TƏSDİQLƏNMİŞ BUG, HAZIRDA TƏŞKİLAT YARATMA TAMAMİLƏ SINIQDIR.**

## Müşahidə

`FRONTEND_AI_PROMPT_CENTRAL_ORG_AND_ROLES.md` § 1-in (2026-09-07, `roleNames` opsional edilməsi) frontend tərəfini tətbiq etdikdən sonra canlı brauzerdə test edərkən, `POST /api/organizations`-a göndərilən **hər** sorğu eyni cavabı qaytardı:

```json
HTTP 409 Conflict
{
  "timestamp": "2026-09-07T13:20:09.059736100Z",
  "status": 409,
  "error": "Conflict",
  "message": "The request could not be completed because it conflicts with existing data",
  "path": "/api/organizations"
}
```

## Təkrarlama addımları

Admin panelində ("Sistem idarəetməsi" → "Təşkilatlar" → "Yeni Təşkilat") 3 ardıcıl cəhd, hər dəfə **tam unikal** məlumatlarla:

| # | `name` | `username` | `type` | `roleNames` | Nəticə |
|---|---|---|---|---|---|
| 1 | RoleHide Test Vendor 5 | rolehide-test-vendor-5 | 2 (İstehsalçı) | (göndərilmədi) | 409 |
| 2 | RoleHide Test Vendor 6 | rolehide-test-vendor-6 | 2 (İstehsalçı) | (göndərilmədi) | 409 |
| 3 | RoleHide Test Vendor 7 | rolehide-test-vendor-7 | 6 (Digər) | (göndərilmədi) | 409 |

Hər üç halda `Ad`/`İstifadəçi adı` siyahıda mövcud olan heç bir sətirlə üst-üstə düşmürdü (yaradılmadan əvvəl siyahıda "RoleHide" axtarışı boş nəticə verdi, cəhdlərdən sonra da yenə boşdur — yəni sətir DB-yə düşmür, sorğu tam rədd olunur). Sınaqdan öncə eyni forma (o zaman hələ `roleNames: ["OPERATOR"]` açıq göndərilirdi) ilə də eyni 409 alınmışdı — deməli bu, `roleNames`-in göndərilib-göndərilməməsindən asılı deyil.

## Diaqnostik qeyd

`POST /api/users` (mərkəzi istifadəçi yaratma) eyni sessiyada, eyni brauzer/token ilə **normal işləyir** (`roleNames: ["VIEWER"]` ilə, uğurla yaradıldı) — yəni problem ümumi auth/DB qatında deyil, spesifik olaraq `/api/organizations` endpoint-inin özündədir.

## Zamanlama

Bu, `FRONTEND_AI_PROMPT_CENTRAL_ORG_AND_ROLES.md` § 2-nin ("Mərkəz" artıq real, sabit bir `organizations` sətri, hər istifadəçinin `organizationId`-si həmişə dolu) canlıya çıxdığı **eyni gün** aşkar edilib. Ehtimal (təsdiqlənməyib): yeni "Mərkəz" sabit sətrinə qarşı unikallıq/əlaqə yoxlaması səhvən **hər** yeni təşkilat yaratma cəhdini konflikt kimi qeyd edir. Amma bu, sadəcə frontend-in müşahidəsidir — real səbəb backend loglarında araşdırılmalıdır.

## Sorğu

`POST /api/organizations`-un niyə hər sorğunu `409`-la rədd etdiyini araşdırın və düzəldin. Hazırda admin panelindən **heç bir yeni vendor təşkilat yaradıla bilmir** — bu, produksiyaya çıxmazdan əvvəl bloklayıcı bir defektdir.
