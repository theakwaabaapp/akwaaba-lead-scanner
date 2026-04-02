import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import { runRedditScan } from "@/lib/reddit-scanner";
import { runYouTubeScan } from "@/lib/youtube-scanner";

export const maxDuration = 300;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = {
    social: { leads: 0, error: null as string | null },
    reddit: { leads: 0, error: null as string | null },
    youtube: { leads: 0, error: null as string | null },
  };

  // Run all three scans
  try {
    const socialResult = await runScan("full");
    results.social.leads = socialResult.meta.totalLeads;
  } catch (e: unknown) {
    results.social.error = e instanceof Error ? e.message : "Failed";
  }

  try {
    const redditResult = await runRedditScan("full");
    results.reddit.leads = redditResult.meta.totalLeads;
  } catch (e: unknown) {
    results.reddit.error = e instanceof Error ? e.message : "Failed";
  }

  try {
    const youtubeResult = await runYouTubeScan("full");
    results.youtube.leads = youtubeResult.meta.totalLeads;
  } catch (e: unknown) {
    results.youtube.error = e instanceof Error ? e.message : "Failed";
  }

  const totalLeads = results.social.leads + results.reddit.leads + results.youtube.leads;

  return NextResponse.json({
    success: true,
    date: new Date().toISOString(),
    totalLeads,
    results,
  });
}
