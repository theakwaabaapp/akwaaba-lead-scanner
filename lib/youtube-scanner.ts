import type { Lead, ScanResult } from "./types";
import { isGhanaRelevant } from "./ghana-filter";

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
const BRAVE_VIDEO_URL = "https://api.search.brave.com/res/v1/videos/search";

const BUYING_SIGNALS = [
  "how do i book", "how to book", "planning a trip", "planning trip",
  "want to go", "want to visit", "taking my girls", "girls trip",
  "how much does it cost", "how much did you spend", "how much",
  "all inclusive", "package", "tour guide", "itinerary", "cost",
  "detty december", "who's going", "booking", "first time",
  "never been to ghana", "bucket list", "on my list", "is it safe",
  "recommend", "where should i stay", "how many days", "worth it",
  "link in bio", "where do i sign up", "need a guide",
];

const PAIN_SIGNALS = [
  "too expensive", "overpriced", "ripped off", "scammed",
  "not worth it", "disappointed", "regret", "never again",
  "price gouging", "overpaid", "waste of money",
];

function isSignal(text: string): boolean {
  const lower = text.toLowerCase();
  return BUYING_SIGNALS.some(s => lower.includes(s)) || PAIN_SIGNALS.some(s => lower.includes(s));
}

function scoreText(text: string): number {
  const lower = text.toLowerCase();
  if (["how do i book", "book now", "all inclusive", "where do i sign up"].some(w => lower.includes(w))) return 5;
  if (["planning a trip", "planning trip", "taking my girls", "girls trip"].some(w => lower.includes(w))) return 4;
  if (["how much", "cost", "package", "itinerary", "too expensive"].some(w => lower.includes(w))) return 3;
  if (["want to go", "bucket list", "who's going", "recommend"].some(w => lower.includes(w))) return 2;
  return 1;
}

function classify(text: string): Lead["signalType"] {
  const lower = text.toLowerCase();
  if (PAIN_SIGNALS.some(s => lower.includes(s))) return "BURNED";
  if (["planning", "book", "going to", "want to"].some(w => lower.includes(w))) return "PLANNER";
  if (BUYING_SIGNALS.some(s => lower.includes(s))) return "HIGH";
  return "INTEREST";
}

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

interface VideoResult {
  title: string;
  url: string;
  description: string;
  videoId: string | null;
}

async function braveVideoSearch(query: string): Promise<VideoResult[]> {
  if (!BRAVE_API_KEY) throw new Error("BRAVE_API_KEY not configured");

  const params = new URLSearchParams({ q: query, count: "20", freshness: "pm" });
  const res = await fetch(`${BRAVE_VIDEO_URL}?${params}`, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!res.ok) throw new Error(`Brave video search failed: ${res.status}`);

  const data = await res.json();
  return (data.results ?? [])
    .filter((r: { url: string }) => r.url.includes("youtube.com") || r.url.includes("youtu.be"))
    .map((r: { title: string; url: string; description: string }) => ({
      title: r.title,
      url: r.url,
      description: r.description ?? "",
      videoId: extractVideoId(r.url),
    }));
}

interface YouTubeComment {
  author: string;
  text: string;
  likes: number;
}

async function fetchYouTubeComments(videoId: string): Promise<YouTubeComment[]> {
  // Use YouTube's internal API endpoint (no key needed, same as what the page uses)
  // This works by fetching the video page and extracting comments from ytInitialData
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) return [];

    const html = await res.text();

    // Extract ytInitialData which contains some comment previews
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);

    // Navigate the deep structure to find comment section
    const comments: YouTubeComment[] = [];

    // Extract from engagement panels (pinned/top comments shown on page load)
    try {
      const contents = data?.contents?.twoColumnWatchNextResults?.results?.results?.contents;
      if (Array.isArray(contents)) {
        for (const item of contents) {
          const section = item?.itemSectionRenderer?.contents;
          if (Array.isArray(section)) {
            for (const s of section) {
              const commentThread = s?.commentThreadRenderer;
              if (commentThread) {
                const comment = commentThread?.comment?.commentRenderer;
                if (comment) {
                  const text = comment?.contentText?.runs?.map((r: { text: string }) => r.text).join("") ?? "";
                  const author = comment?.authorText?.simpleText ?? "";
                  const likes = comment?.voteCount?.simpleText ?? "0";
                  if (text) {
                    comments.push({
                      author,
                      text,
                      likes: parseInt(likes.replace(/[^0-9]/g, "")) || 0,
                    });
                  }
                }
              }
            }
          }
        }
      }
    } catch {
      // Comment extraction is best-effort
    }

    return comments;
  } catch {
    return [];
  }
}

const YOUTUBE_QUERIES: Record<string, string[]> = {
  intent: [
    "ghana travel trip planning 2026 site:youtube.com",
    "first time visiting ghana tips site:youtube.com",
    "ghana girls trip vlog site:youtube.com",
    "ghana itinerary site:youtube.com",
    "how much does ghana trip cost site:youtube.com",
    "ghana vacation all inclusive site:youtube.com",
    "things to do in accra ghana site:youtube.com",
  ],
  detty: [
    "detty december ghana 2025 2026 site:youtube.com",
    "detty december cost expensive site:youtube.com",
    "detty december vlog honest review site:youtube.com",
    "ghana december trip package site:youtube.com",
    "detty december what to expect site:youtube.com",
  ],
  full: [
    "ghana travel trip planning 2026 site:youtube.com",
    "first time visiting ghana tips site:youtube.com",
    "ghana girls trip vlog site:youtube.com",
    "how much does ghana trip cost site:youtube.com",
    "detty december ghana 2025 2026 site:youtube.com",
    "detty december cost expensive site:youtube.com",
    "ghana itinerary steal my itinerary site:youtube.com",
    "ghana tour all inclusive package site:youtube.com",
    "accra nightlife guide site:youtube.com",
  ],
};

export async function runYouTubeScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();
  const queries = YOUTUBE_QUERIES[scanType];
  const allLeads: Lead[] = [];
  const videosSeen = new Set<string>();
  let totalVideos = 0;

  // Run all video searches in parallel
  const searchPromises = queries.map(async (query) => {
    try {
      return await braveVideoSearch(query);
    } catch {
      return [];
    }
  });

  const allVideoResults = (await Promise.all(searchPromises)).flat();

  // Dedupe videos
  const uniqueVideos = allVideoResults.filter(v => {
    if (!v.videoId || videosSeen.has(v.videoId)) return false;
    videosSeen.add(v.videoId);
    return true;
  });

  totalVideos = uniqueVideos.length;

  // Check video titles + descriptions for signals
  for (const video of uniqueVideos) {
    const fullText = `${video.title} ${video.description}`;
    if (isSignal(fullText) && isGhanaRelevant(fullText)) {
      // Extract channel name from title (often "Title - YouTube" or "Title | Channel")
      const channelMatch = video.title.match(/[-|]\s*([^-|]+?)(?:\s*-\s*YouTube)?$/);
      const channel = channelMatch ? channelMatch[1].trim() : video.title.slice(0, 30);

      allLeads.push({
        handle: channel,
        platform: "YouTube" as Lead["platform"],
        signalType: classify(fullText),
        score: scoreText(fullText),
        quote: video.description.slice(0, 200) || video.title,
        url: video.url,
        hashtag: video.videoId ?? undefined,
      });
    }
  }

  // Try to fetch comments from top videos (best effort — YouTube may block)
  const topVideos = uniqueVideos.slice(0, 10);
  for (const video of topVideos) {
    if (!video.videoId) continue;
    const comments = await fetchYouTubeComments(video.videoId);
    for (const comment of comments) {
      if (isSignal(comment.text) && isGhanaRelevant(comment.text)) {
        allLeads.push({
          handle: comment.author || "YouTube user",
          platform: "YouTube" as Lead["platform"],
          signalType: classify(comment.text),
          score: scoreText(comment.text),
          quote: comment.text.slice(0, 200),
          url: video.url,
          hashtag: video.videoId ?? undefined,
        });
      }
    }
  }

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
      totalSearches: queries.length,
      totalLeads: uniqueLeads.length,
      scanType: `youtube-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
