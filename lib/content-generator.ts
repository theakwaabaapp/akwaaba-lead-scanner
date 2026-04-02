import type { ScanResult, Lead } from "./types";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;

interface TrendingVideo {
  title: string;
  url: string;
  description: string;
  platform: string;
}

async function braveVideoSearch(query: string): Promise<TrendingVideo[]> {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "20" });
  const res = await fetch(`https://api.search.brave.com/res/v1/videos/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results ?? []).map((r: { title: string; url: string; description: string }) => {
    const platform = r.url.includes("tiktok.com") ? "TikTok"
      : r.url.includes("youtube.com") ? "YouTube"
      : r.url.includes("instagram.com") ? "Instagram"
      : "Web";
    return { title: r.title, url: r.url, description: r.description ?? "", platform };
  });
}

async function braveWebSearch(query: string) {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");
  const params = new URLSearchParams({ q: query, count: "10" });
  const res = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
    headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.web?.results ?? []) as Array<{ title: string; url: string; description: string }>;
}

// Content idea hooks mapped to Akwaaba products
const HOOK_TEMPLATES = [
  { hook: "POV: You booked an all-inclusive Ghana trip for ${price}", product: "akwaaba.app/ghana-vacation-packages", tags: "#ghanatravel #allinclusiveghana" },
  { hook: "Things they don't tell you about visiting Ghana", product: "akwaaba.app", tags: "#ghanatravel #ghanatips" },
  { hook: "I spent {X} days in Ghana and here's what happened", product: "akwaaba.app/ghana-vacation-packages", tags: "#ghanavlog #traveltiktok" },
  { hook: "Ghana vs {competitor} — which trip is actually worth it?", product: "akwaaba.app", tags: "#ghanatravel #traveltok" },
  { hook: "Detty December 2026 but make it stress-free", product: "akwaaba.app/ghana-detty-december-2026-packages", tags: "#dettydecember2026 #ghana" },
  { hook: "My honest review of {experience} in Ghana", product: "akwaaba.app/ghana-vacation-packages", tags: "#ghanatravel #honestrevview" },
  { hook: "Stop overpaying for Ghana trips — here's what I paid", product: "akwaaba.app/ghana-vacation-packages", tags: "#ghanatripcost #budgettravel" },
  { hook: "Girls trip to Ghana under $1500 each? Here's how", product: "akwaaba.app/ghana-girls-trip-packages", tags: "#girlstrip #ghanagirlstrip" },
  { hook: "First time in Ghana? Start here", product: "akwaaba.app", tags: "#ghanatravel #firsttimeghana" },
  { hook: "What $3,995 gets you for Detty December (everything)", product: "akwaaba.app/ghana-detty-december-2026-packages", tags: "#dettydecember #allinclusive" },
];

const TRENDING_QUERIES = [
  "ghana travel tiktok viral 2026",
  "accra ghana content trending this week",
  "detty december 2026 tiktok trending",
  "ghana travel vlog new 2026",
  "ghana food tour tiktok viral",
  "ghana nightlife tiktok new",
  "west africa travel tiktok trending",
  "ghana girls trip tiktok 2026",
];

const CONTENT_GAP_QUERIES = [
  "ghana travel questions people ask 2026",
  "ghana trip mistakes to avoid tiktok",
  "ghana travel hack tips nobody talks about",
  "ghana budget breakdown real cost tiktok",
  "ghana solo female travel experience",
];

export async function runContentScan(scanType: string): Promise<ScanResult> {
  const start = Date.now();
  const allLeads: Lead[] = [];

  if (scanType === "trending" || scanType === "full") {
    // Find currently trending Ghana travel content
    const trendingResults = await Promise.all(
      TRENDING_QUERIES.map(q => braveVideoSearch(q).catch(() => []))
    );

    const seen = new Set<string>();
    for (const batch of trendingResults) {
      for (const video of batch) {
        if (seen.has(video.url)) continue;
        seen.add(video.url);

        // Extract creator handle
        const tiktokMatch = video.url.match(/tiktok\.com\/@([^/]+)/);
        const handle = tiktokMatch ? `@${tiktokMatch[1]}` : video.title.slice(0, 40);

        allLeads.push({
          handle,
          platform: video.platform as Lead["platform"],
          signalType: "HIGH",
          score: 4,
          quote: video.description?.slice(0, 200) || video.title,
          url: video.url,
          hashtag: "trending",
        });
      }
    }
  }

  if (scanType === "ideas" || scanType === "full") {
    // Generate content ideas from pain points + gaps
    const gapResults = await Promise.all(
      CONTENT_GAP_QUERIES.map(q => braveWebSearch(q).catch(() => []))
    );

    for (const batch of gapResults) {
      for (const result of batch) {
        allLeads.push({
          handle: "Content Idea",
          platform: "TikTok" as Lead["platform"],
          signalType: "PLANNER",
          score: 3,
          quote: result.title + " — " + (result.description?.slice(0, 150) ?? ""),
          url: result.url,
          hashtag: "content-gap",
        });
      }
    }

    // Add hook templates as ideas
    for (const tmpl of HOOK_TEMPLATES) {
      allLeads.push({
        handle: "Hook Template",
        platform: "TikTok" as Lead["platform"],
        signalType: "HIGH",
        score: 5,
        quote: `HOOK: "${tmpl.hook}" → CTA: ${tmpl.product} ${tmpl.tags}`,
        url: `https://${tmpl.product}`,
        hashtag: "hook-template",
      });
    }
  }

  if (scanType === "creators" || scanType === "full") {
    // Find active Ghana travel creators to collaborate with or monitor
    const creatorQueries = [
      "ghana travel creator tiktok 2026 site:tiktok.com",
      "ghana travel influencer vlog site:tiktok.com",
      "accra content creator travel site:tiktok.com",
      "ghana travel blogger site:youtube.com",
    ];

    const creatorResults = await Promise.all(
      creatorQueries.map(q => braveVideoSearch(q).catch(() => []))
    );

    const creatorsSeen = new Set<string>();
    for (const batch of creatorResults) {
      for (const video of batch) {
        const tiktokMatch = video.url.match(/tiktok\.com\/@([^/]+)/);
        const ytMatch = video.url.match(/youtube\.com\/@([^/]+)/);
        const handle = tiktokMatch ? `@${tiktokMatch[1]}` : ytMatch ? `@${ytMatch[1]}` : null;
        if (!handle || creatorsSeen.has(handle)) continue;
        creatorsSeen.add(handle);

        allLeads.push({
          handle,
          platform: (tiktokMatch ? "TikTok" : "YouTube") as Lead["platform"],
          signalType: "INTEREST",
          score: 3,
          quote: video.title.slice(0, 200),
          url: video.url,
          hashtag: "creator",
        });
      }
    }
  }

  // Dedupe
  const seen = new Set<string>();
  const unique = allLeads.filter(l => {
    const key = `${l.handle}-${l.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return {
    leads: unique,
    meta: {
      date: new Date().toISOString(),
      totalSearches: TRENDING_QUERIES.length + CONTENT_GAP_QUERIES.length,
      totalLeads: unique.length,
      scanType: `content-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
