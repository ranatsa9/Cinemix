const TRAILING_ARTICLE = /^(.*),\s*(The|A|An)$/i;

/** Convert MovieLens titles such as "Grand Budapest Hotel, The" to natural display order. */
export function formatMovieTitle(title: string): string {
  const cleaned = title.trim();
  const match = cleaned.match(TRAILING_ARTICLE);

  return match
    ? `${match[2]} ${match[1]}`
    : cleaned;
}
