/**
 * Shared Ghana relevance filter — used by ALL scanners.
 * Every result must pass this check or it gets dropped.
 */

const GHANA_KEYWORDS = [
  // Country + cities
  "ghana", "accra", "kumasi", "cape coast", "tamale", "elmina",
  "takoradi", "ho ", "koforidua", "sunyani", "bolgatanga",
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
  "jollof", "kente", "adinkra", "highlife",
  // Travel terms + Ghana
  "ghana travel", "ghana trip", "ghana tour", "ghana vacation",
  "ghana package", "ghana girls trip", "ghana honeymoon",
  "ghana corporate retreat", "ghana safari", "ghana food tour",
  "visit ghana", "visiting ghana", "explore ghana",
  "ghana itinerary", "ghana budget", "ghana cost",
  "ghana visa", "ghana flight", "ghana hotel",
  "ghana nightlife", "ghana beach", "ghana festival",
  // Africa travel (broader but still relevant)
  "west africa travel", "africa travel", "african trip",
  "west african", "gold coast",
  // Brand
  "akwaaba",
];

export function isGhanaRelevant(text: string): boolean {
  const lower = text.toLowerCase();
  return GHANA_KEYWORDS.some(kw => lower.includes(kw));
}
