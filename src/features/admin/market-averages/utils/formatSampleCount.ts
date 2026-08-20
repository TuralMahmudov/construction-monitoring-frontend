// sampleCount = neçə təşkilat, resourceCount = neçə resurs (xam qiymət
// təklifi) — ikisi fərqli ola bilər (bax priceAverage.types.ts). Hər ikisini
// göstərmək lazımdır ki, istifadəçi "məlumat itib" düşünməsin.
export function formatSampleCount(sampleCount: number, resourceCount: number): string {
  return `${sampleCount} təşkilat (${resourceCount} resurs)`;
}
