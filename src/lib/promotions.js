// Promotion detection from free-form BBB session names, e.g.
// "Andromède - S08E07 - Proxmox", "S07E01 - Naga - GraphQL", "Prepa TP - Freki - CTM".

// A first word followed by an episode code ("Alderson S01E01", "Risoclette - S07E01 - ...") is a
// promotion from its very first session. Without that structure, a first word needs this many
// sessions to be taken as a promotion, so that one-off meeting names do not fill the menu.
const MIN_SESSIONS = 10;
const MAX_TYPO_DISTANCE = 2;
// A close spelling with less than this share of a bigger promotion's sessions is a typo of it
// (e.g. "Helsinky" for "Helsinki"), while two big close spellings stay apart ("Samoussa" / "Samoussas").
const TYPO_MAX_RATIO = 0.15;

// First words that are not promotion names (recurring meetings, generic words, tests).
const STOP_WORDS = new Set([
  "accompagnement", "activite", "atelier", "bienvenue", "certif", "certification",
  "certifications", "cours", "daily", "demo", "dossier", "essai", "fin", "formation",
  "jpo", "la", "lancement", "le", "les", "live", "matinee", "nomdelapromo", "nomdepromo",
  "onboarding", "parlons", "point", "pour", "prepa", "preparation", "presentation",
  "presentations", "projet", "promo", "random", "retrospective", "reunion", "saison",
  "salle", "session", "sessions", "soutenance", "soutenances", "tech", "terrain", "titre",
  "un", "une",
]);

// Groups for the sessions that do not belong to a promotion, so that every session is reachable
// from the promotion filter. Their keys start with "@" and never collide with a promotion key.
export const GROUPS = [
  { value: "@personal-rooms", label: "Salles personnelles" },
  { value: "@tests", label: "Tests" },
  { value: "@no-promotion", label: "Sans promotion" },
  { value: "@others", label: "Autres" },
];
const [PERSONAL_ROOMS, TESTS, NO_PROMOTION, OTHERS] = GROUPS.map((group) => group.value);
// Episodes named without their promotion: "S06E01 - Clean Architecture", "SB05E02 - ...".
const LEADING_EPISODE_CODE = /^s[a-z]?\d+\s*e\d+/i;

const TOKEN_SEPARATORS = /[\s\-/[\]+,:;|_()"'.!?]+/;
const EPISODE_CODE = /^s[a-z]?\d+e\d+$/i;

export function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function toKey(token) {
  return normalize(token).replace(/[^a-z0-9]/g, "");
}

function isCandidate(key) {
  return (
    key.length >= 2 &&
    /[a-z]/.test(key) &&
    // Episode / season codes: s08e07, sa05e09, e01, j1, p03...
    !/^([a-z]{0,2}\d+)+$/.test(key) &&
    !key.startsWith("test") &&
    !STOP_WORDS.has(key)
  );
}

function isPersonalRoom(name) {
  return /'s room$/i.test(name) || /^salle de /i.test(name);
}

function isTest(name) {
  return tokenize(name)
    .map(toKey)
    .some((key, index) =>
      key.startsWith("test") ||
      (index === 0 && ["essai", "nomdepromo", "nomdelapromo"].includes(key)),
    );
}

// Group of a session that has no promotion.
function groupOf(name) {
  if (isPersonalRoom(name)) return PERSONAL_ROOMS;
  if (isTest(name)) return TESTS;
  if (LEADING_EPISODE_CODE.test(name.trim())) return NO_PROMOTION;
  return OTHERS;
}

function tokenize(name) {
  return name.trim().split(TOKEN_SEPARATORS).filter(Boolean);
}

function displaySpelling(word) {
  // Keep short acronyms (CDA), normalize the rest ("OSHUN" / "oshun" -> "Oshun").
  if (word.length <= 4 && word === word.toUpperCase()) return word;
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function levenshtein(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Detects the promotion of every session, or the group it falls in when it has none
 * (personal rooms, tests, episodes without promotion, others).
 * Returns { promotionOf: Map(courseId -> key), promotions: [{ value, label, count, isGroup }] },
 * the promotions sorted by name, followed by the non-empty groups.
 */
export function detectPromotions(courses) {
  // 1. Promotion candidates from the first word of each session name.
  const candidates = new Map(); // key -> { count, spellings: Map(label -> count) }
  const firstKeyOf = new Map();
  for (const course of courses) {
    if (isPersonalRoom(course.name)) continue;
    const [first, second] = tokenize(course.name);
    const key = first && toKey(first);
    if (!key || !isCandidate(key)) continue;
    firstKeyOf.set(course.id, key);
    const entry = candidates.get(key) ?? { count: 0, structured: false, spellings: new Map() };
    const label = displaySpelling(first);
    entry.count++;
    if (second && EPISODE_CODE.test(second)) entry.structured = true;
    entry.spellings.set(label, (entry.spellings.get(label) ?? 0) + 1);
    candidates.set(key, entry);
  }

  // 2. From the biggest to the smallest: a candidate is a typo of a close, bigger promotion
  // when it is small, otherwise it is a promotion of its own if it is named like one
  // (followed by an episode code) or has enough sessions.
  const canonical = new Map();
  const listed = [];
  const bySize = [...candidates].sort((a, b) => b[1].count - a[1].count);
  for (const [key, { count, structured }] of bySize) {
    let target = null;
    let targetDistance = MAX_TYPO_DISTANCE + 1;
    for (const promotion of listed) {
      const distance = levenshtein(key, promotion);
      if (distance < targetDistance) {
        target = promotion;
        targetDistance = distance;
      }
    }
    const isTypo =
      target &&
      (count < MIN_SESSIONS || count < TYPO_MAX_RATIO * candidates.get(target).count);
    if (isTypo) {
      canonical.set(key, target);
    } else if (structured || count >= MIN_SESSIONS) {
      canonical.set(key, key);
      listed.push(key);
    }
  }

  // 3. Assign each session, looking further in the name when the first word is not a promotion,
  // and falling back to a group.
  const promotionOf = new Map();
  const counts = new Map();
  for (const course of courses) {
    let key = null;
    if (!isPersonalRoom(course.name)) {
      key =
        canonical.get(firstKeyOf.get(course.id)) ??
        tokenize(course.name)
          .map(toKey)
          .map((token) => canonical.get(token))
          .find(Boolean);
    }
    key ??= groupOf(course.name);
    promotionOf.set(course.id, key);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const promotions = listed
    .map((key) => {
      const [label] = [...candidates.get(key).spellings].sort((a, b) => b[1] - a[1])[0];
      return { value: key, label, count: counts.get(key) ?? 0, isGroup: false };
    })
    .sort((a, b) => a.value.localeCompare(b.value));
  const groups = GROUPS.filter((group) => counts.has(group.value)).map((group) => ({
    ...group,
    count: counts.get(group.value),
    isGroup: true,
  }));

  return { promotionOf, promotions: [...promotions, ...groups] };
}
