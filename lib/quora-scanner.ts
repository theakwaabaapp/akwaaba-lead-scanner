import type { Lead, ScanResult } from "./types";
// Quora queries already target Ghana travel specifically, so we use a lighter filter
const QUORA_BLOCKED = [
  "election", "parliament", "football", "black stars", "crypto", "bitcoin",
  "hair product", "braiding", "ghana twist", "recipe",
];
function isQuoraRelevant(text: string): boolean {
  return !QUORA_BLOCKED.some(bt => text.toLowerCase().includes(bt));
}

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

const BUYING_SIGNALS = [
  "how do i book", "planning a trip", "planning trip", "want to go",
  "girls trip", "how much", "all inclusive", "package", "itinerary",
  "cost", "detty december", "first time", "bucket list", "recommend",
  "is it safe", "where should i stay", "how many days", "worth it",
];

const PAIN_SIGNALS = [
  "too expensive", "overpriced", "scammed", "not worth it",
  "disappointed", "regret", "price gouging",
];

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  if (["how do i book", "all inclusive"].some(w => lower.includes(w))) return 5;
  if (["planning a trip", "girls trip"].some(w => lower.includes(w))) return 4;
  if (["how much", "cost", "package", "itinerary", "too expensive"].some(w => lower.includes(w))) return 3;
  if (["want to go", "bucket list", "recommend"].some(w => lower.includes(w))) return 2;
  return 1;
}

function classify(text: string): Lead["signalType"] {
  const lower = text.toLowerCase();
  if (PAIN_SIGNALS.some(s => lower.includes(s))) return "BURNED";
  if (["planning", "book"].some(w => lower.includes(w))) return "PLANNER";
  return "INTEREST";
}

function isSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return BUYING_SIGNALS.some(s => lower.includes(s)) || PAIN_SIGNALS.some(s => lower.includes(s));
}

async function braveSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "20", freshness: "pm" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.web?.results ?? []) as Array<{ title: string; url: string; description: string }>;
}

const QUERIES: Record<string, string[]> = {
  intent: [
    "ghana trip planning site:quora.com", "first time visiting ghana site:quora.com",
    "ghana girls trip site:quora.com", "how much does ghana trip cost site:quora.com",
    "is ghana safe to visit site:quora.com", "best time to visit ghana site:quora.com",
  ],
  detty: [
    "detty december ghana site:quora.com", "detty december cost site:quora.com",
    "ghana december trip site:quora.com",
  ],
  full: [
    "ghana trip planning site:quora.com", "first time visiting ghana site:quora.com",
    "ghana girls trip site:quora.com", "how much does ghana trip cost site:quora.com",
    "detty december ghana site:quora.com", "is ghana safe site:quora.com",
    "ghana tour package site:quora.com", "things to do in accra site:quora.com",
  ],
};

export async function runQuoraScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();
  const queries = QUERIES[scanType];
  const allLeads: Lead[] = [];

  const results = await Promise.all(queries.map(q => braveSearch(q).catch(() => [])));

  for (const batch of results) {
    for (const r of batch) {
      if (!r.url.includes("quora.com")) continue;
      const fullText = `${r.title} ${r.description}`;
      if (isSignal(fullText) && isQuoraRelevant(fullText)) {
        const authorMatch = r.url.match(/quora\.com\/profile\/([^/]+)/);
        const handle = authorMatch ? authorMatch[1].replace(/-/g, " ") : r.title.slice(0, 40);
        allLeads.push({
          handle,
          platform: "Quora",
          signalType: classify(fullText),
          score: scoreText(fullText),
          quote: r.description.slice(0, 200),
          url: r.url,
        });
      }
    }
  }

  const seen = new Set<string>();
  const unique = allLeads.sort((a, b) => b.score - a.score).filter(l => {
    if (seen.has(l.handle)) return false;
    seen.add(l.handle);
    return true;
  });

  return {
    leads: unique,
    meta: {
      date: new Date().toISOString(),
      totalSearches: queries.length,
      totalLeads: unique.length,
      scanType: `quora-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
