/**
 * Shared Ghana relevance filter — used by ALL scanners.
 * Every result must pass BOTH checks:
 * 1. Contains at least one Ghana keyword
 * 2. Does NOT match any blocked terms
 */

const GHANA_KEYWORDS = [
  // === COUNTRY ===
  "ghana",

  // === CITIES & TOWNS ===
  "accra", "kumasi", "cape coast", "tamale", "elmina", "takoradi",
  "koforidua", "sunyani", "bolgatanga", "wa ", "ho ghana",
  "techiman", "tema", "sekondi", "nkawkaw", "obuasi", "winneba",
  "axim", "busua", "kokrobite", "ada foah", "sogakope",

  // === REGIONS ===
  "ashanti region", "volta region", "northern region", "greater accra",
  "western region", "eastern region", "central region", "upper east",
  "upper west", "oti region", "bono region", "ahafo region",

  // === NEIGHBORHOODS (Accra) ===
  "labadi", "osu accra", "cantonments", "east legon", "labone",
  "airport residential", "ridge accra", "madina", "spintex",
  "tema community", "teshie", "nungua",

  // === LANDMARKS & ATTRACTIONS ===
  "makola market", "jamestown accra", "kwame nkrumah memorial",
  "kakum national park", "kakum canopy", "mole national park",
  "wli waterfalls", "boti falls", "kintampo waterfalls",
  "cape coast castle", "elmina castle", "fort amsterdam",
  "slave castle", "door of no return",
  "mount afadjato", "lake volta", "lake bosomtwe",
  "aburi botanical", "shai hills", "ankasa",
  "larabanga mosque", "manhyia palace", "kejetia market",

  // === BEACHES ===
  "labadi beach", "busua beach", "kokrobite beach", "axim beach",
  "anomabo beach", "ada foah beach", "paradise beach ghana",

  // === CULTURE & EVENTS ===
  "detty december", "year of return", "beyond the return",
  "december in ghana", "ghana december",
  "homowo", "chale wote", "afrochella", "afro nation ghana",
  "panafest", "emancipation day ghana", "odwira", "damba festival",
  "aboakyer", "hogbetsotso", "ghana independence day",
  "kente cloth", "kente", "adinkra", "ashanti culture",
  "highlife music", "azonto", "jama",

  // === FOOD ===
  "jollof ghana", "waakye", "banku", "fufu ghana", "kenkey",
  "red red ghana", "kelewele", "ghana food tour",
  "chop bar", "eatwithafia",

  // === TRAVEL TERMS + GHANA ===
  "ghana travel", "ghana trip", "ghana tour", "ghana vacation",
  "ghana package", "ghana girls trip", "ghana honeymoon",
  "ghana corporate retreat", "ghana safari", "ghana food tour",
  "visit ghana", "visiting ghana", "explore ghana",
  "ghana itinerary", "ghana budget", "ghana cost",
  "ghana visa", "ghana flight", "ghana hotel", "ghana hostel",
  "ghana airbnb", "ghana nightlife", "ghana beach",
  "ghana festival", "ghana guide", "ghana tips",
  "ghana solo travel", "ghana group trip", "ghana family trip",
  "first time ghana", "never been to ghana",
  "ghana 2026", "ghana 2025",

  // === AFRICA TRAVEL (specific enough) ===
  "west africa travel", "west african travel",
  "gold coast africa",

  // === GHANA TRAVEL CREATORS ===
  "beverlyadaeze", "findingmeroe", "eatwithafia",

  // === BRAND ===
  "akwaaba",
];

// Explicit blocklist — these are NEVER relevant
const BLOCKED_TERMS = [
  // Food/restaurant (not Ghana-specific)
  "benihana", "olive garden", "red lobster", "chick-fil-a",
  "mcdonalds", "starbucks", "chipotle",
  // Yacht/luxury unrelated
  "yacht charter", "charter a yacht", "superyacht",
  // Relationships
  "relationship theory", "dating advice", "boyfriend", "girlfriend drama",
  // Finance
  "crypto", "bitcoin", "nft", "stock market", "mortgage", "credit score",
  // Unrelated services
  "real estate investment", "weight loss", "diet plan",
  "nail salon", "hair salon", "car dealership", "auto repair",
  "pet grooming", "dog walking", "plumber", "electrician",
  // Entertainment
  "video game", "gaming", "fortnite", "minecraft",
  "movie review", "film review", "tv show",
  // US/UK specific unrelated
  "las vegas", "miami beach", "cancun", "bali resort",
  "punta cana", "jamaica all inclusive",
];

export function isGhanaRelevant(text: string): boolean {
  const lower = text.toLowerCase();

  // Must NOT contain blocked terms
  if (BLOCKED_TERMS.some(bt => lower.includes(bt))) return false;

  // Must contain at least one Ghana keyword
  return GHANA_KEYWORDS.some(kw => lower.includes(kw));
}
