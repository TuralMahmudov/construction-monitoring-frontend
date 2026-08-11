# Backend üçün sorğu — `GET /api/resources`-a yaradılma tarixi filtri

Bu fayl frontend tərəfindən 2026-08-11-də hazırlanıb, backend-ə göndərmək üçündür.

---

## Kontekst

Canlıda yoxladım (`/v3/api-docs`) — `GET /api/resources` hazırda yalnız bunları qəbul edir:
`product`, `organization`, `status`, `active`, `name`, `code`, `regionId`, `minPrice`, `maxPrice`,
`documentId`, `hasPrice`, `pageable` (o cümlədən `sort=createdDate` — sıralamaq mümkündür, amma
**aralıqla filtrləmək mümkün deyil**).

"Resurslar (Elanlar)" səhifəsində admin resursu **yaradılma tarixinə görə** süzgəcləyə bilmək istəyir
(məs. "son bir həftədə yaradılanlar").

## Sorğu

- **`createdFrom`** (tarix, `YYYY-MM-DD`, opsional) — bu tarixdən (daxil) sonra yaradılan resurslar.
- **`createdTo`** (tarix, `YYYY-MM-DD`, opsional) — bu tarixə (daxil) qədər yaradılan resurslar.
- Hər ikisi opsional və bir-birindən asılı olmadan göndərilə bilməlidir (təkcə `createdFrom` və ya
  təkcə `createdTo` da mənalı sorğudur).
- Adlandırma `GET /api/documents` (Sənədlərin İdarəsi) endpoint-i ilə uyğun olsun deyə, əgər orada artıq
  bənzər bir tarix-aralığı parametri varsa, eyni adlandırma konvensiyasından istifadə edin (bilmirik,
  yoxlamadıq — sizin qərarınızdır).

## Nəyə görə lazımdır

Frontend-də bu filtri artıq UI-da planlaşdırırıq (Region filtri ilə eyni sətirdə, iki kiçik tarix
sahəsi kimi), amma backend dəstəyi olmadan işə düşməyəcək.

---
