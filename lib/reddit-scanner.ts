import type { Lead, ScanResult } from "./types";

const USER_AGENT = "akwaaba-lead-scanner/1.0 (travel research)";

const BUYING_SIGNALS = [
  "how do i book", "how to book", "planning a trip", "planning trip",
  "planning to visit", "want to go", "want to visit", "taking my girls",
  "girls trip", "how much does it cost", "how much did you spend",
  "all inclusive", "package", "tour guide", "itinerary", "cost",
  "detty december", "who's going", "booking", "first time",
  "never been to ghana", "bucket list", "on my list", "is it safe",
  "recommend", "recommendations", "advice", "where should i stay",
  "how many days", "worth it",
];

const PAIN_SIGNALS = [
  "too expensive", "overpriced", "ripped off", "scammed",
  "not worth it", "disappointed", "regret", "never again",
  "price gouging", "shortlet", "broke january", "overpaid",
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

interface RedditPost {
  id: string;
  title: string;
  subreddit: string;
  author: string;
  permalink: string;
  num_comments: number;
  score: number;
  selftext: string;
}

interface RedditComment {
  author: string;
  body: string;
  score: number;
}

async function fetchRedditJSON(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!res.ok) throw new Error(`Reddit ${res.status}`);
  return res.json();
}

async function searchSubreddit(subreddit: string, query: string, limit: number): Promise<RedditPost[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encoded}&sort=relevance&limit=${limit}&t=year&restrict_sr=on`;
    const data = await fetchRedditJSON(url) as { data: { children: Array<{ kind: string; data: RedditPost }> } };
    return data.data.children
      .filter(c => c.kind === "t3")
      .map(c => ({
        id: c.data.id,
        title: c.data.title,
        subreddit: c.data.subreddit,
        author: c.data.author,
        permalink: c.data.permalink,
        num_comments: c.data.num_comments,
        score: c.data.score,
        selftext: (c.data.selftext ?? "").slice(0, 500),
      }));
  } catch {
    return [];
  }
}

async function getComments(permalink: string): Promise<RedditComment[]> {
  try {
    const url = `https://www.reddit.com${permalink}.json?limit=100&sort=top`;
    const data = await fetchRedditJSON(url) as Array<{ data: { children: Array<{ kind: string; data: { author: string; body: string; score: number; replies?: { data?: { children?: Array<{ kind: string; data: { author: string; body: string; score: number } }> } } } }> } }>;
    if (!Array.isArray(data) || data.length < 2) return [];

    const comments: RedditComment[] = [];

    function extract(children: Array<{ kind: string; data: { author: string; body: string; score: number; replies?: { data?: { children?: Array<{ kind: string; data: { author: string; body: string; score: number } }> } } } }>) {
      for (const c of children) {
        if (c.kind !== "t1") continue;
        comments.push({
          author: c.data.author,
          body: c.data.body,
          score: c.data.score,
        });
        const replies = c.data.replies;
        if (replies && typeof replies === "object" && "data" in replies) {
          const replyChildren = replies.data?.children;
          if (replyChildren) extract(replyChildren as typeof children);
        }
      }
    }

    extract(data[1].data.children);
    return comments;
  } catch {
    return [];
  }
}

const SUBREDDITS = ["ghana", "travel", "solotravel", "blackladies", "AfricanDiaspora"];

const REDDIT_QUERIES: Record<string, string[]> = {
  intent: [
    "ghana trip planning",
    "first time ghana",
    "ghana girls trip",
    "ghana tour package all inclusive",
    "visiting ghana advice",
  ],
  detty: [
    "detty december",
    "detty december expensive overpriced",
    "ghana december trip",
    "detty december 2026 planning",
  ],
  full: [
    "ghana trip planning",
    "detty december",
    "ghana girls trip",
    "first time ghana",
    "ghana travel cost expensive",
    "ghana tour package all inclusive",
  ],
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function runRedditScan(scanType: "intent" | "detty" | "full"): Promise<ScanResult> {
  const start = Date.now();
  const queries = REDDIT_QUERIES[scanType];
  const allLeads: Lead[] = [];
  let totalPosts = 0;
  let totalComments = 0;

  for (const sub of SUBREDDITS) {
    for (const query of queries) {
      const posts = await searchSubreddit(sub, query, 10);
      totalPosts += posts.length;
      await delay(500);

      for (const post of posts) {
        const fullPostText = `${post.title} ${post.selftext}`;
        if (isSignal(fullPostText)) {
          allLeads.push({
            handle: `u/${post.author}`,
            platform: "Reddit",
            signalType: classify(fullPostText),
            score: scoreText(fullPostText),
            quote: post.title.slice(0, 200),
            url: `https://reddit.com${post.permalink}`,
            hashtag: `r/${post.subreddit}`,
          });
        }

        // Scan comments for posts with discussion
        if (post.num_comments >= 3) {
          const comments = await getComments(post.permalink);
          totalComments += comments.length;
          await delay(300);

          for (const comment of comments) {
            if (comment.author === "[deleted]" || comment.author === "AutoModerator") continue;
            if (isSignal(comment.body)) {
              allLeads.push({
                handle: `u/${comment.author}`,
                platform: "Reddit",
                signalType: classify(comment.body),
                score: scoreText(comment.body),
                quote: comment.body.slice(0, 200).replace(/\n/g, " "),
                url: `https://reddit.com${post.permalink}`,
                hashtag: `r/${post.subreddit}`,
              });
            }
          }
        }
      }
    }
  }

  // Dedupe
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
      totalSearches: SUBREDDITS.length * queries.length,
      totalLeads: uniqueLeads.length,
      scanType: `reddit-${scanType}`,
      duration: Date.now() - start,
    },
  };
}
