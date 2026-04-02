import type { Lead, ScanResult } from "./types";
import { isGhanaRelevant } from "./ghana-filter";

const APIFY_TOKEN = process.env.APIFY_API_TOKEN;
const TIKTOK_ACTOR = "clockworks~tiktok-scraper";

const BUYING_SIGNALS = [
  "how do i book", "how to book", "planning a trip", "planning trip",
  "want to go", "taking my girls", "girls trip", "how much",
  "all inclusive", "package", "first time", "detty december",
  "who's going", "booking", "itinerary", "cost", "tour guide",
  "bucket list", "recommend", "where should i stay",
  "link in bio", "need a guide", "how many days",
];

const PAIN_SIGNALS = [
  "too expensive", "overpriced", "ripped off", "scammed",
  "not worth it", "disappointed", "never again", "price gouging",
];

function isSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return BUYING_SIGNALS.some(s => lower.includes(s)) || PAIN_SIGNALS.some(s => lower.includes(s));
}

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  if (["how do i book", "all inclusive", "where do i sign up"].some(w => lower.includes(w))) return 5;
  if (["planning a trip", "girls trip", "taking my girls"].some(w => lower.includes(w))) return 4;
  if (["how much", "cost", "package", "itinerary", "too expensive"].some(w => lower.includes(w))) return 3;
  if (["want to go", "bucket list", "recommend"].some(w => lower.includes(w))) return 2;
  return 1;
}

function classify(text: string): Lead["signalType"] {
  const lower = text.toLowerCase();
  if (PAIN_SIGNALS.some(s => lower.includes(s))) return "BURNED";
  if (["planning", "book", "going to"].some(w => lower.includes(w))) return "PLANNER";
  return "HIGH";
}

interface ApifyTikTokVideo {
  id: string;
  text: string;
  authorMeta: { name: string; fans: number; verified: boolean };
  playCount: number;
  diggCount: number;
  commentCount: number;
  shareCount: number;
  hashtags: Array<{ name: string }>;
}

async function runApifyActor(input: Record<string, unknown>): Promise<ApifyTikTokVideo[]> {
  if (!APIFY_TOKEN) throw new Error("APIFY_API_TOKEN not configured");

  // Start the actor run
  const startRes = await fetch(
    `https://api.apify.com/v2/acts/${TIKTOK_ACTOR}/runs?waitForFinish=120`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${APIFY_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    }
  );

  if (!startRes.ok) {
    const err = await startRes.text();
    throw new Error(`Apify start failed: ${startRes.status} ${err}`);
  }

  const runData = await startRes.json();
  const datasetId = runData.data?.defaultDatasetId;

  if (!datasetId) throw new Error("No dataset ID returned");

  // Fetch results
  const dataRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?limit=100`,
    { headers: { Authorization: `Bearer ${APIFY_TOKEN}` } }
  );

  if (!dataRes.ok) throw new Error(`Apify dataset fetch failed: ${dataRes.status}`);

  return dataRes.json();
}

const HASHTAG_SETS: Record<string, string[]> = {
  intent: ["ghanatravel", "ghanatrip", "visitghana", "ghanavacation", "ghanagirlstrip"],
  detty: ["dettydecember", "dettydecember2026", "ghanadecember"],
  full: ["ghanatravel", "ghanatrip", "dettydecember", "dettydecember2026", "ghanagirlstrip", "visitghana", "accranightlife"],
};

export async function runApifyScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();
  const hashtags = HASHTAG_SETS[scanType];
  const allLeads: Lead[] = [];

  try {
    const videos = await runApifyActor({
      hashtags,
      resultsPerPage: 15,
      shouldDownloadVideos: false,
      shouldDownloadCovers: false,
    });

    // Process videos — sorted by engagement
    const sorted = [...videos].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));

    for (const video of sorted) {
      const text = video.text ?? "";
      const author = video.authorMeta?.name ?? "unknown";
      const plays = video.playCount ?? 0;
      const likes = video.diggCount ?? 0;
      const comments = video.commentCount ?? 0;
      const fans = video.authorMeta?.fans ?? 0;
      const url = `https://www.tiktok.com/@${author}/video/${video.id}`;

      // Every video is a potential content reference or lead source
      const engagement = `${(plays / 1000).toFixed(0)}K plays, ${likes} likes, ${comments} comments`;
      const creatorInfo = fans > 10000 ? ` (${(fans / 1000).toFixed(0)}K followers)` : "";

      if (isSignal(text) && isGhanaRelevant(text)) {
        allLeads.push({
          handle: `@${author}`,
          platform: "TikTok",
          signalType: classify(text),
          score: scoreText(text),
          quote: `${text.slice(0, 150)} [${engagement}]`,
          url,
          hashtag: video.hashtags?.map(h => `#${h.name}`).join(" ").slice(0, 50),
          engagement: plays,
        });
      } else if (plays > 10000) {
        // High-engagement Ghana content — potential collab or content to react to
        allLeads.push({
          handle: `@${author}${creatorInfo}`,
          platform: "TikTok",
          signalType: "INTEREST",
          score: plays > 100000 ? 4 : plays > 50000 ? 3 : 2,
          quote: `${text.slice(0, 150)} [${engagement}]`,
          url,
          hashtag: video.hashtags?.map(h => `#${h.name}`).join(" ").slice(0, 50),
          engagement: plays,
        });
      }
    }
  } catch (error) {
    // If Apify fails, return what we have with error note
    allLeads.push({
      handle: "System",
      platform: "TikTok",
      signalType: "INTEREST",
      score: 1,
      quote: `Apify error: ${error instanceof Error ? error.message : "Unknown error"}. Try again or use Social tab as fallback.`,
      url: "https://console.apify.com",
    });
  }

  // Dedupe by handle
  const seen = new Set<string>();
  const unique = allLeads.filter(l => {
    if (seen.has(l.handle)) return false;
    seen.add(l.handle);
    return true;
  });

  return {
    leads: unique,
    meta: {
      date: new Date().toISOString(),
      totalSearches: hashtags.length,
      totalLeads: unique.length,
      scanType: `apify-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
