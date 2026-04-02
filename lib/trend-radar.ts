import type { Lead, ScanResult } from "./types";
import { isGhanaRelevant } from "./ghana-filter";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

// Ghana travel sources to monitor for trends
const TRAVEL_NEWS_SOURCES = [
  "https://www.ghanaweb.com/GhanaHomePage/tourism/",
  "https://citinewsroom.com/category/travel/",
  "https://www.modernghana.com/lifestyle/travel.html",
  "https://edition.cnn.com/travel",
  "https://www.lonelyplanet.com/articles?q=ghana",
];

const INFLUENCER_ACCOUNTS = [
  // Ghana travel TikTokers / creators to monitor
  "beverlyadaeze", "findingmeroe", "eatwithafia", "hey_ciara",
  "jas_teaa", "mawiestwisted", "_itsniania", "your_travel_geek",
  "lindanxx_", "ferinajo", "prunelscx", "toyin.o",
];

async function braveSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "15", freshness: "pw" }); // pw = past week
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.web?.results ?? []) as Array<{ title: string; url: string; description: string; age?: string }>;
}

async function braveVideoSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "15", freshness: "pw" });
  const res = await fetch(`https://api.search.brave.com/res/v1/videos/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Array<{ title: string; url: string; description: string }>;
}

async function braveNewsSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "15", freshness: "pw" });
  const res = await fetch(`https://api.search.brave.com/res/v1/news/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []) as Array<{ title: string; url: string; description: string; age?: string }>;
}

// Trend detection queries — what's happening RIGHT NOW in Ghana travel
const TREND_QUERIES = {
  viral: [
    "ghana travel viral this week tiktok",
    "ghana trending travel content new",
    "accra viral tiktok this week",
    "detty december 2026 news update",
    "ghana tourism news this week",
    "west africa travel trending",
  ],
  news: [
    "ghana travel news 2026",
    "ghana tourism announcement",
    "ghana visa policy change 2026",
    "accra new hotel restaurant opening",
    "ghana festival event 2026",
    "ghana airline new route",
  ],
  controversy: [
    "ghana travel controversy",
    "ghana tourism complaint",
    "ghana scam tourist warning",
    "detty december drama controversy",
    "ghana travel negative experience",
  ],
  influencer: INFLUENCER_ACCOUNTS.map(a => `site:tiktok.com @${a} new`),
};

function scoreTrend(title: string, desc: string): number {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes("viral") || text.includes("million views") || text.includes("breaking")) return 5;
  if (text.includes("trending") || text.includes("new") || text.includes("just")) return 4;
  if (text.includes("update") || text.includes("announce") || text.includes("launch")) return 3;
  return 2;
}

function classifyTrend(title: string, desc: string): Lead["signalType"] {
  const text = `${title} ${desc}`.toLowerCase();
  if (text.includes("scam") || text.includes("warning") || text.includes("complaint") || text.includes("expensive")) return "BURNED";
  if (text.includes("viral") || text.includes("trending") || text.includes("million")) return "HIGH";
  if (text.includes("new") || text.includes("open") || text.includes("launch")) return "PLANNER";
  return "INTEREST";
}

function detectPlatform(url: string): Lead["platform"] {
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("youtube.com")) return "YouTube";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("reddit.com")) return "Reddit";
  if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
  return "TikTok"; // default for web articles
}

export async function runTrendRadar(scanType: string): Promise<ScanResult> {
  const start = Date.now();
  const allLeads: Lead[] = [];

  const querySet = scanType === "viral" ? TREND_QUERIES.viral
    : scanType === "news" ? TREND_QUERIES.news
    : scanType === "controversy" ? TREND_QUERIES.controversy
    : scanType === "influencer" ? TREND_QUERIES.influencer
    : [...TREND_QUERIES.viral, ...TREND_QUERIES.news, ...TREND_QUERIES.controversy, ...TREND_QUERIES.influencer.slice(0, 5)];

  // Run searches in parallel
  const [videoResults, webResults, newsResults] = await Promise.all([
    Promise.all(querySet.slice(0, 6).map(q => braveVideoSearch(q).catch(() => []))),
    Promise.all(querySet.map(q => braveSearch(q).catch(() => []))),
    Promise.all(querySet.slice(0, 4).map(q => braveNewsSearch(q).catch(() => []))),
  ]);

  // Process video results (most valuable — viral content)
  const seenUrls = new Set<string>();
  for (const batch of videoResults) {
    for (const v of batch) {
      if (seenUrls.has(v.url)) continue;
      if (!isGhanaRelevant(`${v.title} ${v.description}`)) continue;
      seenUrls.add(v.url);
      const tiktokMatch = v.url.match(/tiktok\.com\/@([^/]+)/);
      const handle = tiktokMatch ? `@${tiktokMatch[1]}` : v.title.slice(0, 35);
      allLeads.push({
        handle,
        platform: detectPlatform(v.url),
        signalType: classifyTrend(v.title, v.description),
        score: scoreTrend(v.title, v.description),
        quote: `${v.title}`,
        url: v.url,
        hashtag: "viral-content",
      });
    }
  }

  // Process news
  for (const batch of newsResults) {
    for (const n of batch) {
      if (seenUrls.has(n.url)) continue;
      if (!isGhanaRelevant(`${n.title} ${n.description}`)) continue;
      seenUrls.add(n.url);
      allLeads.push({
        handle: new URL(n.url).hostname.replace("www.", ""),
        platform: "TikTok" as Lead["platform"], // placeholder
        signalType: classifyTrend(n.title, n.description),
        score: scoreTrend(n.title, n.description),
        quote: `${n.title} — ${n.description?.slice(0, 100) ?? ""}`,
        url: n.url,
        hashtag: n.age ?? "news",
      });
    }
  }

  // Process web results
  for (const batch of webResults) {
    for (const w of batch) {
      if (seenUrls.has(w.url)) continue;
      if (!isGhanaRelevant(`${w.title} ${w.description}`)) continue;
      seenUrls.add(w.url);
      allLeads.push({
        handle: new URL(w.url).hostname.replace("www.", ""),
        platform: detectPlatform(w.url),
        signalType: classifyTrend(w.title, w.description),
        score: Math.max(1, scoreTrend(w.title, w.description) - 1), // web results score lower than video
        quote: w.title,
        url: w.url,
        hashtag: "web",
      });
    }
  }

  // Sort by score, dedupe
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
      totalSearches: querySet.length * 3,
      totalLeads: unique.length,
      scanType: `trends-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
