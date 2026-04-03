import type { Lead, ScanResult } from "./types";

/**
 * Reddit scanner — uses Brave Search with site:reddit.com queries.
 * Reddit blocks cloud IPs from their JSON API, so we use Brave to find
 * Reddit posts and comments about Ghana travel.
 */

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

const BLOCKED_TERMS = [
  "election", "parliament", "football", "black stars", "premier league",
  "nollywood", "crypto", "bitcoin", "forex", "hair product", "braiding",
  "ghana twist", "coco twist", "recipe video", "prix unité",
  "deutschland", "österreich",
];

function isRelevant(text: string): boolean {
  return !BLOCKED_TERMS.some(bt => text.toLowerCase().includes(bt));
}

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  if (["how do i book", "all inclusive", "book now"].some(w => lower.includes(w))) return 5;
  if (["planning a trip", "planning trip", "girls trip"].some(w => lower.includes(w))) return 4;
  if (["how much", "cost", "package", "itinerary", "expensive", "overpriced"].some(w => lower.includes(w))) return 3;
  if (["want to go", "bucket list", "recommend", "advice", "safe"].some(w => lower.includes(w))) return 2;
  return 1;
}

function classify(text: string): Lead["signalType"] {
  const lower = text.toLowerCase();
  if (["expensive", "overpriced", "scammed", "ripped off", "regret"].some(s => lower.includes(s))) return "BURNED";
  if (["planning", "book", "going to", "want to"].some(w => lower.includes(w))) return "PLANNER";
  return "INTEREST";
}

function extractRedditHandle(url: string, title: string): string {
  const userMatch = url.match(/reddit\.com\/u(?:ser)?\/([^/]+)/);
  if (userMatch) return `u/${userMatch[1]}`;
  // Try to extract from title patterns like "u/username"
  const titleMatch = title.match(/u\/(\w+)/);
  if (titleMatch) return `u/${titleMatch[1]}`;
  return title.slice(0, 35);
}

function extractSubreddit(url: string): string {
  const match = url.match(/reddit\.com\/r\/([^/]+)/);
  return match ? `r/${match[1]}` : "r/unknown";
}

async function braveSearch(query: string): Promise<Array<{ title: string; url: string; description: string }>> {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "20", freshness: "pm" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.web?.results ?? []).map((r: { title: string; url: string; description: string }) => ({
    title: r.title, url: r.url, description: r.description ?? "",
  }));
}

const REDDIT_QUERIES: Record<string, string[]> = {
  intent: [
    'site:reddit.com "planning trip" ghana 2026',
    'site:reddit.com "visiting ghana" first time advice',
    'site:reddit.com ghana girls trip planning',
    'site:reddit.com ghana itinerary days',
    'site:reddit.com ghana tour package recommend',
    'site:reddit.com "going to ghana" advice tips',
    'site:reddit.com accra travel recommend things to do',
  ],
  detty: [
    'site:reddit.com "detty december" ghana expensive overpriced',
    'site:reddit.com "detty december 2026" planning',
    'site:reddit.com "detty december" hotel shortlet cost',
    'site:reddit.com ghana december trip experience',
  ],
  full: [
    'site:reddit.com "planning trip" ghana 2026',
    'site:reddit.com "visiting ghana" first time advice',
    'site:reddit.com ghana girls trip planning',
    'site:reddit.com ghana itinerary recommend',
    'site:reddit.com "detty december" ghana 2026',
    'site:reddit.com "detty december" expensive overpriced',
    'site:reddit.com ghana travel budget cost how much',
    'site:reddit.com accra nightlife things to do',
    'site:reddit.com ghana solo travel safe',
    'site:reddit.com ghana tour all inclusive package',
  ],
};

export async function runRedditScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();
  const queries = REDDIT_QUERIES[scanType];
  const allLeads: Lead[] = [];

  const results = await Promise.all(queries.map(q => braveSearch(q).catch(() => [])));

  for (const batch of results) {
    for (const r of batch) {
      if (!r.url.includes("reddit.com")) continue;
      const fullText = `${r.title} ${r.description}`;
      if (!isRelevant(fullText)) continue;

      allLeads.push({
        handle: extractRedditHandle(r.url, r.title),
        platform: "Reddit",
        signalType: classify(fullText),
        score: scoreText(fullText),
        quote: r.description.slice(0, 200),
        url: r.url,
        hashtag: extractSubreddit(r.url),
      });
    }
  }

  const seen = new Set<string>();
  const unique = allLeads
    .sort((a, b) => b.score - a.score)
    .filter(l => {
      if (seen.has(l.url)) return false;
      seen.add(l.url);
      return true;
    });

  return {
    leads: unique,
    meta: {
      date: new Date().toISOString(),
      totalSearches: queries.length,
      totalLeads: unique.length,
      scanType: `reddit-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
