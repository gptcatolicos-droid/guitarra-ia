// Spotify matching logic: normalization + scoring + strict verdict gates.

const VERSION_TERMS = /\b(live|en vivo|acoustic|acustico|remaster|remastered|remix|radio edit|instrumental|karaoke|tribute|tributo|cover|sped up|slowed|demo)\b/i;
// Versions that must NEVER auto-approve unless the catalog record itself declares them.
const UNWANTED_VERSION_TERMS = /\b(live|en vivo|acoustic|acustico|remix|instrumental|karaoke|tribute|tributo|cover)\b/i;
const FEAT_TERMS = /\s*(feat\.?|featuring|ft\.?|con)\s+.*/i;

// Confidence thresholds (0..1)
export const AUTO_APPROVE_SCORE = 0.90; // global score needed for auto-approval
export const REVIEW_MIN_SCORE = 0.72;   // below this = discarded
export const ARTIST_GATE = 0.80;        // artist similarity gate
export const TITLE_GATE = 0.80;         // title similarity gate

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

// Returns the raw sub-scores and the combined score, plus flags used by the verdict gates.
export function analyzeMatch(catalogTitle, catalogArtist, track) {
  const normCatalogTitle = normalizeMusicText(catalogTitle);
  const normCatalogArtist = normalizeMusicText(catalogArtist);

  const trackTitle = normalizeMusicText(track.name);
  const trackArtists = (track.artists || []).map((a) => normalizeMusicText(a.name));
  const primaryArtist = trackArtists[0] || '';

  const titleSim = similarity(normCatalogTitle, trackTitle);
  const artistSim = similarity(normCatalogArtist, primaryArtist);

  // Version flags — evaluated on the RAW track name, and whether the catalog declares it.
  const catalogDeclaresVersion = VERSION_TERMS.test(catalogTitle);
  const isUnwantedVersion = UNWANTED_VERSION_TERMS.test(track.name) && !catalogDeclaresVersion;
  const isAnyVersion = VERSION_TERMS.test(track.name) && !catalogDeclaresVersion;

  const versionPenalty = isAnyVersion ? 0.25 : 0;
  const karaokePenalty = /karaoke|tribute|tributo|cover/i.test(track.name) && !catalogDeclaresVersion ? 0.4 : 0;

  // Collaborator bonus (a secondary artist appears in the catalog title/artist)
  const collabBonus = trackArtists.slice(1).some((a) =>
    normCatalogArtist.includes(a) || normCatalogTitle.includes(a)
  ) ? 0.05 : 0;

  const rawScore = titleSim * 0.5 + artistSim * 0.35 + collabBonus;
  const score = Math.min(1, Math.max(0, rawScore - versionPenalty - karaokePenalty));

  return { score, titleSim, artistSim, isUnwantedVersion };
}

// Strict verdict: combines score with mandatory artist/title gates and version rejection.
// method === 'isrc' short-circuits to auto-approval (ISRC = unique recording id).
export function getVerdict(analysis, method) {
  if (method === 'isrc') {
    return { status: 'matched', reason: 'isrc_exact' };
  }
  const { score, titleSim, artistSim, isUnwantedVersion } = analysis;

  // Hard reject unwanted versions from auto-approval.
  if (isUnwantedVersion) {
    if (score >= REVIEW_MIN_SCORE && artistSim >= ARTIST_GATE && titleSim >= ARTIST_GATE) {
      return { status: 'review_required', reason: 'unwanted_version' };
    }
    return { status: 'not_found', reason: 'unwanted_version_low_score' };
  }

  // Auto-approve only when score AND both gates pass.
  if (score >= AUTO_APPROVE_SCORE && artistSim >= ARTIST_GATE && titleSim >= TITLE_GATE) {
    return { status: 'matched', reason: 'high_confidence' };
  }

  // Anything above the review floor with reasonable gates → manual review.
  if (score >= REVIEW_MIN_SCORE && artistSim >= 0.6 && titleSim >= 0.6) {
    return { status: 'review_required', reason: 'below_auto_threshold' };
  }

  return { status: 'not_found', reason: 'low_confidence' };
}

// Back-compat helpers (kept so existing callers don't break)
export function scoreMatch(catalogTitle, catalogArtist, track) {
  return analyzeMatch(catalogTitle, catalogArtist, track).score;
}

export function getMatchStatus(score) {
  if (score >= AUTO_APPROVE_SCORE) return 'matched';
  if (score >= REVIEW_MIN_SCORE) return 'review_required';
  return 'not_found';
}