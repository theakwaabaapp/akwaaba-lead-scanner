/**
 * Shared Ghana relevance filter — used by ALL scanners.
 * Every result must pass BOTH checks:
 * 1. Contains at least one Ghana keyword
 * 2. Does NOT match any blocked terms
 */

const GHANA_KEYWORDS = [
  // Country + cities
  "ghana", "accra", "kumasi", "cape coast", "tamale", "elmina",
  "takoradi", "koforidua", "sunyani", "bolgatanga",
  // Regions
  "ashanti", "volta region", "northern region", "greater accra",
  "western region", "eastern region", "central region",
  // Landmarks + neighborhoods
  "labadi", "osu", "cantonments", "east legon", "labone",
  "makola", "jamestown", "kwame nkrumah", "kakum", "mole national",
  "wli waterfalls", "boti falls", "cape coast castle", "elmina castle",
  // Culture + events
  "detty december", "year of return", "beyond the return",
  "homowo", "chale wote", "afrochella", "afro nation",
  "kente", "adinkra", "highlife",
  // Travel terms + Ghana
  "ghana travel", "ghana trip", "ghana tour", "ghana vacation",
  "ghana package", "ghana girls trip", "ghana honeymoon",
  "ghana corporate retreat", "ghana safari", "ghana food tour",
  "visit ghana", "visiting ghana", "explore ghana",
  "ghana itinerary", "ghana budget", "ghana cost",
  "ghana visa", "ghana flight", "ghana hotel",
  "ghana nightlife", "ghana beach", "ghana festival",
  // Africa travel (broader but still relevant)
  "west africa travel", "west african travel",
  // Brand
  "akwaaba",
];

// Block results that match these — they're never relevant
const BLOCKED_TERMS = [
  "benihana", "yacht charter", "charter a yacht",
  "relationship theory", "dating advice",
  "crypto", "bitcoin", "nft",
  "real estate investment", "stock market",
  "weight loss", "diet plan",
  "nail salon", "hair salon",
  "car dealership", "auto repair",
  "pet grooming", "dog walking",
  "video game", "gaming",
  "mortgage", "credit score",
];

export function isGhanaRelevant(text: string): boolean {
  const lower = text.toLowerCase();

  // Must NOT contain blocked terms
  if (BLOCKED_TERMS.some(bt => lower.includes(bt))) return false;

  // Must contain at least one Ghana keyword
  return GHANA_KEYWORDS.some(kw => lower.includes(kw));
}
