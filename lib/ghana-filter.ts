/**
 * Shared Ghana TRAVEL relevance filter — used by ALL scanners.
 *
 * TWO-GATE system:
 * Gate 1: Must mention Ghana (or a Ghana-specific place)
 * Gate 2: Must ALSO mention travel/tourism/trip/tour/experience
 * Gate 3: Must NOT contain blocked terms
 *
 * This prevents Ghana news, politics, sports, hair products etc from leaking in.
 */

// Gate 1: Ghana identity — proves the content is ABOUT Ghana
const GHANA_IDENTITY = [
  "ghana", "accra", "kumasi", "cape coast", "tamale", "elmina",
  "takoradi", "koforidua", "busua", "kokrobite", "ada foah",
  "labadi", "osu", "east legon", "cantonments",
  "ashanti", "volta region", "kakum", "mole national",
  "cape coast castle", "elmina castle", "wli waterfalls",
  "detty december", "afrochella", "afro nation",
  "chale wote", "homowo", "panafest",
  "akwaaba",
];

// Gate 2: Travel intent — proves it's about TRAVEL, not just Ghana news
const TRAVEL_INTENT = [
  // Direct travel terms
  "travel", "trip", "tour", "visit", "vacation", "holiday",
  "itinerary", "package", "all inclusive", "all-inclusive",
  "booking", "book", "flight", "hotel", "hostel", "airbnb",
  "resort", "accommodation", "stay",
  // Planning signals
  "planning", "plan a trip", "first time", "bucket list",
  "how much", "cost", "budget", "afford", "spend",
  "passport", "visa", "requirements",
  // Experience terms
  "things to do", "nightlife", "beach", "food tour", "safari",
  "explore", "experience", "adventure", "vlog", "guide",
  "attraction", "sightseeing", "cultural", "heritage",
  // Group travel
  "girls trip", "group trip", "solo travel", "honeymoon",
  "corporate retreat", "team building",
  // Specific Akwaaba terms
  "detty december", "year of return", "beyond the return",
  "afrochella", "afro nation", "chale wote",
  // Travel content signals
  "traveltok", "traveltiktok", "blacktravel", "travelvlog",
  "ghanatravel", "visitghana", "ghanatrip", "ghanavacation",
];

// Gate 3: Explicit blocklist — NEVER relevant
const BLOCKED_TERMS = [
  // Hair/beauty
  "coco twist", "twist pack", "ghana twist", "ghana braid",
  "braiding hair", "crochet hair", "wig", "lace front",
  "hair product", "hair extension",
  // Dental/medical
  "tooth filling", "dental", "dentist", "root canal",
  // Product listings
  "prix unité", "prix caisse", "disponible", "wholesale",
  "bulk order",
  // Food (not Ghana-specific food tours)
  "benihana", "olive garden", "red lobster", "chick-fil-a",
  "recipe video",
  // Finance/crypto
  "crypto", "bitcoin", "nft", "stock market", "mortgage",
  "credit score", "forex",
  // Politics/news (not travel)
  "election", "parliament", "minister resign", "corruption",
  "arrested", "court ruling", "sentence", "interpol",
  "building collapse", "accident", "fire outbreak",
  // Sports
  "black stars", "premier league", "football match", "goal highlight",
  "champions league",
  // Entertainment (not travel)
  "video game", "gaming", "fortnite", "minecraft",
  "movie review", "film review", "tv show", "nollywood",
  // Unrelated travel
  "yacht charter", "las vegas", "cancun", "bali resort",
  "punta cana", "jamaica all inclusive",
  // Relationships
  "relationship theory", "dating advice",
  // Jobs/business (not travel)
  "job opening", "hiring", "in-demand skills", "employer",
  "recruitment",
];

export function isGhanaRelevant(text: string): boolean {
  const lower = text.toLowerCase();

  // Gate 3: Block known garbage first (fastest check)
  if (BLOCKED_TERMS.some(bt => lower.includes(bt))) return false;

  // Gate 1: Must mention Ghana or a Ghana-specific place
  const hasGhanaIdentity = GHANA_IDENTITY.some(kw => lower.includes(kw));
  if (!hasGhanaIdentity) return false;

  // Gate 2: Must ALSO mention travel/tourism intent
  const hasTravelIntent = TRAVEL_INTENT.some(kw => lower.includes(kw));
  if (!hasTravelIntent) return false;

  return true;
}
