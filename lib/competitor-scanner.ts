import type { Lead, ScanResult } from "./types";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

const COMPETITORS = [
  { name: "Root Tours Ghana", domain: "roottoursghana.com", tiktok: "@_mrtourguide" },
  { name: "Visit Ghana", domain: "visitghana.com", tiktok: "" },
  { name: "Beyond The Return", domain: "beyondthereturn.com", tiktok: "" },
  { name: "Go Ghana", domain: "goghana.com", tiktok: "" },
  { name: "Luxury Ghana Tours", domain: "luxury-ghana-tours.com", tiktok: "" },
  { name: "Jolinaiko Eco Tours", domain: "jolinaikoecotours.com", tiktok: "" },
  { name: "Easy Track Ghana", domain: "easytrackghana.com", tiktok: "" },
];

async function braveSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "10", freshness: "pm" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.web?.results ?? []) as Array<{ title: string; url: string; description: string }>;
}

async function braveVideoSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "10", freshness: "pm" });
  const res = await fetch(`https://api.search.brave.com/res/v1/videos/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Array<{ title: string; url: string; description: string }>;
}

function scoreThreat(text: string, url: string): number {
  const lower = text.toLowerCase();
  if (lower.includes("$") || lower.includes("price") || lower.includes("package") || lower.includes("book now")) return 5;
  if (lower.includes("all inclusive") || lower.includes("detty december") || lower.includes("tour package")) return 4;
  if (lower.includes("ghana tour") || lower.includes("accra tour") || lower.includes("itinerary")) return 3;
  if (lower.includes("ghana travel") || lower.includes("visit ghana")) return 2;
  return 1;
}

const PRICING_QUERIES = COMPETITORS.flatMap(c => [
  `site:${c.domain} price OR pricing OR package OR book`,
  `"${c.name}" ghana tour package price 2026`,
]);

const CONTENT_QUERIES = COMPETITORS.flatMap(c => [
  `site:${c.domain}`,
  ...(c.tiktok ? [`${c.tiktok} tiktok ghana`] : []),
]);

const ALL_QUERIES = [...new Set([...PRICING_QUERIES, ...CONTENT_QUERIES])];

export async function runCompetitorScan(scanType: string): Promise<ScanResult> {
  const start = Date.now();
  const queries = scanType === "pricing" ? PRICING_QUERIES : scanType === "content" ? CONTENT_QUERIES : ALL_QUERIES;
  const allLeads: Lead[] = [];

  const searchPromises = queries.map(async q => {
    try {
      const [web, video] = await Promise.all([braveSearch(q), braveVideoSearch(q)]);
      return [...web, ...video];
    } catch { return []; }
  });

  const allResults = (await Promise.all(searchPromises)).flat();

  for (const r of allResults) {
    const competitor = COMPETITORS.find(c => r.url.includes(c.domain) || r.title.toLowerCase().includes(c.name.toLowerCase()));
    const handle = competitor?.name ?? new URL(r.url).hostname;
    const fullText = `${r.title} ${r.description}`;

    allLeads.push({
      handle,
      platform: "Competitor" as Lead["platform"],
      signalType: scoreThreat(fullText, r.url) >= 4 ? "HIGH" : scoreThreat(fullText, r.url) >= 3 ? "WARM" : "INTEREST",
      score: scoreThreat(fullText, r.url),
      quote: r.description?.slice(0, 200) || r.title,
      url: r.url,
      hashtag: competitor?.domain,
    });
  }

  const seen = new Set<string>();
  const unique = allLeads.sort((a, b) => b.score - a.score).filter(l => {
    const key = `${l.handle}-${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    leads: unique,
    meta: {
      date: new Date().toISOString(),
      totalSearches: queries.length,
      totalLeads: unique.length,
      scanType: `competitor-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
