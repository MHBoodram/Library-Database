// Centralized mapping for custom book covers and a local placeholder
// Normalize titles to avoid case/punctuation mismatches

import cloningBooksCover from "./assets/CloningBooksTheEasyWayCover.png";
import fillerMangaV6Cover from "./assets/FillerMangaV6Cover.png";
import fillerMangaVol1Cover from "./assets/FILLERMANGAVOL.1Cover.png";
import defaultPlaceholder from "./assets/book-placeholder.svg";

function normalizeTitle(title) {
  return String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

const coverMap = new Map([
  ["cloningbookstheeasyway", cloningBooksCover],
  ["fillermangav6", fillerMangaV6Cover],
  ["fillermangavol1", fillerMangaVol1Cover],
  ["fillermangavol1cover", fillerMangaVol1Cover],
  ["fillermangavol1volume1", fillerMangaVol1Cover],
]);

// Try exact match first; if not found, try fuzzy contains for robustness
export function getCustomCoverForTitle(title) {
  const key = normalizeTitle(title);
  const direct = coverMap.get(key);
  if (direct) return direct;

  const fuzzyPatterns = [
    { patterns: ["cloningbookstheeasyway"], cover: cloningBooksCover },
    { patterns: ["fillermangav6", "fillermanga6"], cover: fillerMangaV6Cover },
    { patterns: ["fillermangavol1", "fillermangav1", "fillermanga1"], cover: fillerMangaVol1Cover },
  ];

  for (const entry of fuzzyPatterns) {
    if (entry.patterns.some((p) => key.includes(p))) return entry.cover;
  }
  return null;
}

export const DEFAULT_BOOK_PLACEHOLDER = defaultPlaceholder;
