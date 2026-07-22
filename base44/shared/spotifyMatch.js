// Spotify matching logic: normalization + scoring

const VERSION_TERMS = /\b(live|en vivo|acoustic|acustico|remaster|remastered|remix|radio edit|instrumental|karaoke|tribute|cover|sped up|slowed|demo)\b/i;
const FEAT_TERMS = /\s*(feat\.?|featuring|ft\.?|con)\s+.*/i;

export function normalizeMusicText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, 'and')
    .replace(FEAT_TERMS, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarity(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  if (longer.includes(shorter)) return shorter.length / longer.length;

  // Levenshtein ratio
  const matrix = [];
  for (let i = 0; i <= shorter.length; i++) matrix[i] = [i];
  for (let j = 0; j <= longer.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= shorter.length; i++) {
    for (let j = 1; j <= longer.length; j++) {
      const cost = shorter[i - 1] === longer[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return (longer.length - matrix[shorter.length][longer.length]) / longer.length;
}

export function scoreMatch(catalogTitle, catalogArtist, track) {
  const normCatalogTitle = normalizeMusicText(catalogTitle);
  const normCatalogArtist = normalizeMusicText(catalogArtist);

  const trackTitle = normalizeMusicText(track.name);
  const trackArtists = (track.artists || []).map(a => normalizeMusicText(a.name));
  const primaryArtist = trackArtists[0] || '';

  // Penalize unwanted versions
  const isVersion = VERSION_TERMS.test(track.name);
  const catalogIsVersion = VERSION_TERMS.test(catalogTitle);
  const versionPenalty = isVersion && !catalogIsVersion ? 0.25 : 0;

  // Penalize karaoke/tribute/cover
  const isKaraoke = /karaoke|tribute|cover/i.test(track.name);
  const karaokePenalty = isKaraoke ? 0.4 : 0;

  const titleScore = similarity(normCatalogTitle, trackTitle) * 0.50;
  const artistScore = similarity(normCatalogArtist, primaryArtist) * 0.35;

  // Collaborator bonus
  const collabBonus = trackArtists.slice(1).some(a =>
    normCatalogArtist.includes(a) || normalizeMusicText(catalogTitle).includes(a)
  ) ? 0.05 : 0;

  const rawScore = titleScore + artistScore + collabBonus;
  const finalScore = Math.max(0, rawScore - versionPenalty - karaokePenalty);

  return Math.min(1, finalScore);
}

export function getMatchStatus(score) {
  if (score >= 0.90) return 'matched';
  if (score >= 0.75) return 'review_required';
  return 'not_found';
}