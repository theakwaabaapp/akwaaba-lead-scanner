import type { Lead, ScanResult } from "./types";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_SEARCH_URL = "https://api.search.brave.com/res/v1/web/search";
const BRAVE_VIDEO_URL = "https://api.search.brave.com/res/v1/videos/search";

const BUYING_SIGNALS = [
  "how do i book", "planning a trip", "planning trip", "want to go",
  "taking my girls", "girls trip", "how much", "all inclusive",
  "package", "first time", "detty december", "who's going",
  "booking", "itinerary", "cost", "tour guide", "bucket list",
];

const PAIN_SIGNALS = [
  "too expensive", "overpriced", "ripped off", "scammed",
  "not worth it", "disappointed", "never again", "price gouging",
];

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  if (["how do i book", "book now", "all inclusive", "where do i sign up"].some(w => lower.includes(w))) return 5;
  if (["planning a trip", "planning trip", "taking my girls", "girls trip"].some(w => lower.includes(w))) return 4;
  if (["how much", "cost", "package", "itinerary", "too expensive"].some(w => lower.includes(w))) return 3;
  if (["want to go", "bucket list", "who's going", "on my list"].some(w => lower.includes(w))) return 2;
  return 1;
}

function classifySignal(text: string): Lead["signalType"] {
  const lower = text.toLowerCase();
  if (PAIN_SIGNALS.some(s => lower.includes(s))) return "BURNED";
  if (["planning", "book", "going to"].some(w => lower.includes(w))) return "PLANNER";
  if (BUYING_SIGNALS.some(s => lower.includes(s))) return "HIGH";
  return "INTEREST";
}

function detectPlatform(url: string): Lead["platform"] {
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("reddit.com")) return "Reddit";
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
  return "TikTok";
}

function extractHandle(title: string, url: string): string {
  // Try to extract @handle from title or URL
  const atMatch = title.match(/@([\w.]+)/);
  if (atMatch) return `@${atMatch[1]}`;

  const urlMatch = url.match(/tiktok\.com\/@([\w.]+)/);
  if (urlMatch) return `@${urlMatch[1]}`;

  const redditMatch = url.match(/reddit\.com\/u\/([\w-]+)/);
  if (redditMatch) return `u/${redditMatch[1]}`;

  return title.slice(0, 30);
}

async function braveWebSearch(query: string): Promise<Array<{ title: string; url: string; description: string }>> {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");

  const params = new URLSearchParams({ q: query, count: "20" });
  const res = await fetch(`${BRAVE_SEARCH_URL}?${params}`, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!res.ok) throw new Error(`Brave search failed: ${res.status}`);

  const data = await res.json();
  return (data.web?.results ?? []).map((r: { title: string; url: string; description: string }) => ({
    title: r.title,
    url: r.url,
    description: r.description,
  }));
}

async function braveVideoSearch(query: string): Promise<Array<{ title: string; url: string; description: string }>> {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");

  const params = new URLSearchParams({ q: query, count: "20" });
  const res = await fetch(`${BRAVE_VIDEO_URL}?${params}`, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!res.ok) throw new Error(`Brave video search failed: ${res.status}`);

  const data = await res.json();
  return (data.results ?? []).map((r: { title: string; url: string; description: string }) => ({
    title: r.title,
    url: r.url,
    description: r.description ?? "",
  }));
}

function resultsToLeads(
  results: Array<{ title: string; url: string; description: string }>,
  hashtag?: string
): Lead[] {
  const leads: Lead[] = [];

  for (const r of results) {
    const fullText = `${r.title} ${r.description}`;
    const hasBuyingSignal = BUYING_SIGNALS.some(s => fullText.toLowerCase().includes(s));
    const hasPainSignal = PAIN_SIGNALS.some(s => fullText.toLowerCase().includes(s));

    if (hasBuyingSignal || hasPainSignal) {
      leads.push({
        handle: extractHandle(r.title, r.url),
        platform: detectPlatform(r.url),
        signalType: classifySignal(fullText),
        score: scoreText(fullText),
        quote: r.description.slice(0, 200),
        url: r.url,
        hashtag,
      });
    }
  }

  return leads;
}

const INTENT_QUERIES = [
  { q: 'site:tiktok.com "planning a trip to ghana" 2026', tag: "planning" },
  { q: 'site:tiktok.com "girls trip ghana" 2026', tag: "girls-trip" },
  { q: 'site:tiktok.com "detty december 2026" planning OR going', tag: "detty" },
  { q: 'site:tiktok.com "how much does it cost" ghana trip', tag: "cost" },
  { q: 'site:tiktok.com "first time ghana" 2026', tag: "first-time" },
  { q: 'site:reddit.com "planning ghana trip" 2026', tag: "reddit-planning" },
  { q: 'tiktok "ghana on my list" OR "ghana bucket list" 2026', tag: "bucket-list" },
  { q: 'tiktok "ghana all inclusive" package 2026', tag: "packages" },
];

const DETTY_QUERIES = [
  { q: 'site:tiktok.com "detty december" "too expensive" OR "overpriced" 2025', tag: "burned" },
  { q: 'site:tiktok.com "detty december 2025" hotel prices OR shortlet', tag: "price-gouging" },
  { q: 'site:reddit.com "detty december" expensive OR regret 2025', tag: "reddit-burned" },
  { q: 'site:tiktok.com "detty december 2026" booking OR planning', tag: "planners" },
  { q: '"detty december 2026" early bird package', tag: "early-bird" },
  { q: 'tiktok "detty december" "broke january" 2025', tag: "broke" },
  { q: 'tiktok ghana december 2026 group trip squad', tag: "squads" },
];

export async function runScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();

  const queries = scanType === "intent"
    ? INTENT_QUERIES
    : scanType === "detty"
    ? DETTY_QUERIES
    : [...INTENT_QUERIES, ...DETTY_QUERIES];

  // Run all searches in parallel
  const searchPromises = queries.map(async ({ q, tag }) => {
    try {
      const [webResults, videoResults] = await Promise.all([
        braveWebSearch(q),
        braveVideoSearch(q),
      ]);
      return [
        ...resultsToLeads(webResults, tag),
        ...resultsToLeads(videoResults, tag),
      ];
    } catch {
      return [];
    }
  });

  const allLeadArrays = await Promise.all(searchPromises);
  const allLeads = allLeadArrays.flat();

  // Dedupe by handle
  const seen = new Set<string>();
  const uniqueLeads = allLeads
    .sort((a, b) => b.score - a.score)
    .filter(lead => {
      if (seen.has(lead.handle)) return false;
      seen.add(lead.handle);
      return true;
    });

  return {
    leads: uniqueLeads,
    meta: {
      date: new Date().toISOString(),
      totalSearches: queries.length * 2,
      totalLeads: uniqueLeads.length,
      scanType,
      duration: Date.now() - start,
    },
  };
}
