"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { Lead, ScanResult } from "@/lib/types";

type ActiveTab = "social" | "reddit" | "youtube";
type ScanType = "intent" | "detty" | "full";
type FilterPlatform = "all" | "TikTok" | "Instagram" | "Reddit" | "Twitter" | "YouTube";

const SCAN_LABELS: Record<ScanType, { label: string; desc: string; icon: string }> = {
  intent: {
    label: "Intent Monitor",
    desc: "Find people planning Ghana trips, asking about packages, ready to book",
    icon: "🎯",
  },
  detty: {
    label: "Detty December",
    desc: "Find 2025 price-gouging victims + 2026 planners for the $3,995 package",
    icon: "🔥",
  },
  full: {
    label: "Full Sweep",
    desc: "Run both scans together for maximum lead coverage",
    icon: "⚡",
  },
};

const REDDIT_SCAN_LABELS: Record<ScanType, { label: string; desc: string; icon: string }> = {
  intent: {
    label: "Trip Planning",
    desc: "People asking for Ghana travel advice, itineraries, and recommendations",
    icon: "🗺️",
  },
  detty: {
    label: "Detty December",
    desc: "People discussing Detty December costs, complaints, and 2026 plans",
    icon: "🔥",
  },
  full: {
    label: "Full Sweep",
    desc: "All subreddits, all queries — maximum comment mining",
    icon: "⚡",
  },
};

const YOUTUBE_SCAN_LABELS: Record<ScanType, { label: string; desc: string; icon: string }> = {
  intent: {
    label: "Travel Vlogs",
    desc: "Ghana travel vlogs, itinerary videos, and trip planning guides",
    icon: "🗺️",
  },
  detty: {
    label: "Detty December",
    desc: "Detty December vlogs, cost breakdowns, and honest reviews",
    icon: "🔥",
  },
  full: {
    label: "Full Sweep",
    desc: "All Ghana travel YouTube content — vlogs, guides, and reviews",
    icon: "⚡",
  },
};

const SCORE_LABELS: Record<number, string> = {
  5: "HOT",
  4: "HIGH",
  3: "WARM",
  2: "INTEREST",
  1: "LOW",
};

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`score-${score} text-xs font-bold px-2 py-0.5 rounded-full`}>
      {score} {SCORE_LABELS[score]}
    </span>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    TikTok: "T",
    Instagram: "I",
    Reddit: "R",
    Twitter: "X",
    YouTube: "Y",
  };
  const colorMap: Record<string, string> = {
    TikTok: "bg-black text-white",
    Instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    Reddit: "bg-orange-600 text-white",
    Twitter: "bg-black text-white",
    YouTube: "bg-red-600 text-white",
  };
  return (
    <span
      className={`${colorMap[platform] ?? "bg-gray-500 text-white"} w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}
    >
      {icons[platform] ?? "?"}
    </span>
  );
}

function LeadsTable({
  leads,
  filterPlatform,
  filterMinScore,
  onFilterPlatform,
  onFilterMinScore,
  onExport,
  platformCounts,
  showSubreddit,
}: {
  leads: Lead[];
  filterPlatform: FilterPlatform;
  filterMinScore: number;
  onFilterPlatform: (p: FilterPlatform) => void;
  onFilterMinScore: (s: number) => void;
  onExport: () => void;
  platformCounts: Record<string, number>;
  showSubreddit?: boolean;
}) {
  const scoreCounts = leads.reduce(
    (acc, lead) => {
      acc[lead.score] = (acc[lead.score] ?? 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const filteredLeads = leads.filter((lead) => {
    if (filterPlatform !== "all" && lead.platform !== filterPlatform) return false;
    if (lead.score < filterMinScore) return false;
    return true;
  });

  return (
    <>
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-akwaaba-green">{leads.length}</div>
          <div className="text-xs text-gray-500 mt-1">Total Leads</div>
        </div>
        {[5, 4, 3, 2].map((score) => (
          <div key={score} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <div className="text-3xl font-bold">{scoreCounts[score] ?? 0}</div>
            <div className="text-xs text-gray-500 mt-1">
              <ScoreBadge score={score} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        {!showSubreddit && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-600">Platform:</span>
            {(["all", "TikTok", "Reddit", "Instagram", "Twitter"] as FilterPlatform[]).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => onFilterPlatform(p)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    filterPlatform === p
                      ? "bg-akwaaba-green text-white"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {p === "all" ? "All" : p}
                  {p !== "all" && platformCounts[p] ? ` (${platformCounts[p]})` : ""}
                </button>
              )
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Min Score:</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => onFilterMinScore(s)}
              className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-all ${
                filterMinScore === s
                  ? "bg-akwaaba-green text-white"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
              }`}
            >
              {s}+
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <button
            onClick={onExport}
            className="text-sm px-4 py-2 rounded-xl bg-akwaaba-gold text-akwaaba-green-dark font-semibold hover:bg-akwaaba-gold-light transition-all"
          >
            Export CSV ({filteredLeads.length})
          </button>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Lead
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Score
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Signal
                </th>
                {showSubreddit && (
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                    Subreddit
                  </th>
                )}
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 max-w-md">
                  Quote
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeads.map((lead, i) => (
                <tr key={`${lead.handle}-${i}`} className="hover:bg-green-50/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <PlatformIcon platform={lead.platform} />
                      <div>
                        <div className="font-semibold text-sm">{lead.handle}</div>
                        <div className="text-xs text-gray-400">{lead.platform}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={lead.score} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                      {lead.signalType}
                    </span>
                  </td>
                  {showSubreddit && (
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                        {lead.hashtag}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 max-w-md">
                    <p className="text-sm text-gray-600 line-clamp-2">{lead.quote}</p>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-akwaaba-green hover:text-akwaaba-green-light transition-colors"
                    >
                      View &rarr;
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            {leads.length === 0
              ? "No leads found -- try a different scan type"
              : "No leads match your filters"}
          </div>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("social");
  const [scanType, setScanType] = useState<ScanType>("full");
  const [scanning, setScanning] = useState(false);
  const [socialResult, setSocialResult] = useState<ScanResult | null>(null);
  const [redditResult, setRedditResult] = useState<ScanResult | null>(null);
  const [youtubeResult, setYoutubeResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all");
  const [filterMinScore, setFilterMinScore] = useState(1);

  const result = activeTab === "social" ? socialResult : activeTab === "reddit" ? redditResult : youtubeResult;
  const scanLabels = activeTab === "social" ? SCAN_LABELS : activeTab === "reddit" ? REDDIT_SCAN_LABELS : YOUTUBE_SCAN_LABELS;

  const filteredLeads = (result?.leads ?? []).filter((lead) => {
    if (filterPlatform !== "all" && lead.platform !== filterPlatform) return false;
    if (lead.score < filterMinScore) return false;
    return true;
  });

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    const endpoints: Record<ActiveTab, string> = {
      social: "/api/scan",
      reddit: "/api/reddit-scan",
      youtube: "/api/youtube-scan",
    };
    const endpoint = endpoints[activeTab];
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanType }),
      });
      const data = await res.json();
      if (data.success) {
        if (activeTab === "social") {
          setSocialResult(data.data);
        } else if (activeTab === "reddit") {
          setRedditResult(data.data);
        } else {
          setYoutubeResult(data.data);
        }
      } else {
        setError(data.error ?? "Scan failed");
      }
    } catch {
      setError("Network error -- check your connection");
    } finally {
      setScanning(false);
    }
  }, [scanType, activeTab]);

  const exportCSV = useCallback(async () => {
    if (!filteredLeads.length) return;
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leads: filteredLeads, format: "csv" }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const prefix = activeTab === "reddit" ? "reddit-leads" : "akwaaba-leads";
      a.download = `${prefix}-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    }
  }, [filteredLeads, activeTab]);

  const platformCounts = (result?.leads ?? []).reduce(
    (acc, lead) => {
      acc[lead.platform] = (acc[lead.platform] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-akwaaba-green-dark to-akwaaba-green text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/akwaaba-logo.png"
              alt="Akwaaba"
              width={44}
              height={44}
              className="rounded-lg"
            />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lead Scanner</h1>
              <p className="text-xs text-green-200 opacity-80">Social media intelligence for marketing</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {result && (
              <span className="text-xs text-green-200 hidden sm:inline">
                Last scan: {new Date(result.meta.date).toLocaleString()} &middot; {(result.meta.duration / 1000).toFixed(1)}s
              </span>
            )}
            <a
              href="https://akwaaba.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              akwaaba.app
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => { setActiveTab("social"); setFilterPlatform("all"); }}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === "social"
                  ? "bg-akwaaba-cream text-akwaaba-green-dark"
                  : "text-green-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="mr-1.5">📱</span>
              Social Media
            </button>
            <button
              onClick={() => { setActiveTab("reddit"); setFilterPlatform("all"); }}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === "reddit"
                  ? "bg-akwaaba-cream text-akwaaba-green-dark"
                  : "text-green-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="mr-1.5">💬</span>
              Reddit
              {redditResult && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {redditResult.meta.totalLeads}
                </span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab("youtube"); setFilterPlatform("all"); }}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-all ${
                activeTab === "youtube"
                  ? "bg-akwaaba-cream text-akwaaba-green-dark"
                  : "text-green-200 hover:text-white hover:bg-white/10"
              }`}
            >
              <span className="mr-1.5">▶️</span>
              YouTube
              {youtubeResult && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {youtubeResult.meta.totalLeads}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1">
        {/* Tab info banners */}
        {activeTab === "reddit" && !redditResult && !scanning && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <p className="text-sm font-semibold text-orange-800">Reddit Comment Mining</p>
              <p className="text-xs text-orange-600 mt-0.5">
                Scans r/ghana, r/travel, r/solotravel, r/blackladies, r/AfricanDiaspora — digs into comment threads to find people asking about trips, costs, and packages. No API key needed.
              </p>
            </div>
          </div>
        )}
        {activeTab === "youtube" && !youtubeResult && !scanning && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <span className="text-2xl">▶️</span>
            <div>
              <p className="text-sm font-semibold text-red-800">YouTube Comment Mining</p>
              <p className="text-xs text-red-600 mt-0.5">
                Finds Ghana travel vlogs, cost breakdowns, and Detty December reviews on YouTube. Extracts video creators and comment authors with buying signals. No API key needed.
              </p>
            </div>
          </div>
        )}

        {/* Scan Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {activeTab === "reddit" ? "Reddit Scan Type" : "Scan Type"}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(scanLabels) as ScanType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setScanType(type)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      scanType === type
                        ? activeTab === "reddit"
                          ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
                          : activeTab === "youtube"
                            ? "border-red-500 bg-red-50 shadow-md shadow-red-100"
                            : "border-akwaaba-green bg-green-50 shadow-md shadow-green-100"
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{scanLabels[type].icon}</span>
                      <span className="font-semibold text-sm">{scanLabels[type].label}</span>
                    </div>
                    <div className="text-xs text-gray-500">{scanLabels[type].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={runScan}
              disabled={scanning}
              className={`shrink-0 px-8 py-3 rounded-xl font-bold text-white transition-all ${
                scanning
                  ? "bg-gray-400 cursor-not-allowed animate-scan-pulse"
                  : activeTab === "reddit"
                    ? "bg-orange-600 hover:bg-orange-500 active:scale-95 shadow-lg shadow-orange-200"
                    : activeTab === "youtube"
                      ? "bg-red-600 hover:bg-red-500 active:scale-95 shadow-lg shadow-red-200"
                      : "bg-akwaaba-green hover:bg-akwaaba-green-light active:scale-95 shadow-lg shadow-green-200"
              }`}
            >
              {scanning
                ? activeTab === "reddit" ? "Mining comments..." : activeTab === "youtube" ? "Scanning YouTube..." : "Scanning..."
                : "Run Scan"
              }
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <LeadsTable
            leads={result.leads}
            filterPlatform={filterPlatform}
            filterMinScore={filterMinScore}
            onFilterPlatform={setFilterPlatform}
            onFilterMinScore={setFilterMinScore}
            onExport={exportCSV}
            platformCounts={platformCounts}
            showSubreddit={activeTab === "reddit" || activeTab === "youtube"}
          />
        )}

        {/* Empty State */}
        {!result && !scanning && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-akwaaba-green/5 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-akwaaba-green/10">
              {activeTab === "reddit" ? (
                <span className="text-4xl">💬</span>
              ) : activeTab === "youtube" ? (
                <span className="text-4xl">▶️</span>
              ) : (
                <Image
                  src="/akwaaba-logo.png"
                  alt="Akwaaba"
                  width={56}
                  height={56}
                  className="rounded-lg"
                />
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {activeTab === "reddit" ? "Ready to mine Reddit" : activeTab === "youtube" ? "Ready to scan YouTube" : "Ready to find leads"}
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto mb-4">
              {activeTab === "reddit"
                ? "Select a scan type and click Run Scan to dig through Reddit comment threads for people discussing Ghana travel, costs, and planning."
                : activeTab === "youtube"
                  ? "Select a scan type and click Run Scan to find Ghana travel vlogs, cost breakdowns, and trip reviews on YouTube."
                  : "Select a scan type above and click Run Scan to find people planning Ghana trips on TikTok, Instagram, and Reddit."
              }
            </p>
            <div className="flex flex-wrap gap-3 justify-center text-xs text-gray-400">
              {activeTab === "reddit" ? (
                <>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">Comment mining</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">5 subreddits</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">No API key</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">u/handles</span>
                </>
              ) : (
                <>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">Real @handles</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">Video URLs</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">Lead scoring 1-5</span>
                  <span className="bg-white px-3 py-1.5 rounded-full border border-gray-100">CSV export</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Scanning State */}
        {scanning && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className={`absolute inset-0 rounded-full border-4 ${activeTab === "reddit" ? "border-orange-200" : activeTab === "youtube" ? "border-red-200" : "border-akwaaba-green/20"}`}></div>
              <div className={`absolute inset-0 rounded-full border-4 border-transparent ${activeTab === "reddit" ? "border-t-orange-500" : activeTab === "youtube" ? "border-t-red-500" : "border-t-akwaaba-green"} animate-spin`}></div>
              {activeTab === "reddit" ? (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">💬</span>
              ) : activeTab === "youtube" ? (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">▶️</span>
              ) : (
                <Image
                  src="/akwaaba-logo.png"
                  alt=""
                  width={32}
                  height={32}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
                />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {activeTab === "reddit" ? "Mining Reddit comments..." : activeTab === "youtube" ? "Scanning YouTube..." : "Scanning social media..."}
            </h3>
            <p className="text-sm text-gray-400">
              {activeTab === "reddit"
                ? "Searching 5 subreddits and digging into comment threads"
                : activeTab === "youtube"
                  ? "Finding Ghana travel vlogs and scanning for leads"
                  : "Searching TikTok, Reddit, Instagram for Ghana travel leads"
              }
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/akwaaba-logo.png" alt="" width={16} height={16} className="rounded" />
            <span>Akwaaba Lead Scanner v1.0</span>
          </div>
          <span>{activeTab === "reddit" ? "Reddit public JSON" : activeTab === "youtube" ? "YouTube via Brave Search" : "Powered by Brave Search API"}</span>
        </div>
      </footer>
    </div>
  );
}
