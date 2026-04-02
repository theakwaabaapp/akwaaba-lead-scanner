"use client";

import { useState, useCallback } from "react";
import type { Lead, ScanResult } from "@/lib/types";

type ScanType = "intent" | "detty" | "full";
type FilterPlatform = "all" | "TikTok" | "Instagram" | "Reddit" | "Twitter";

const SCAN_LABELS: Record<ScanType, { label: string; desc: string }> = {
  intent: {
    label: "Intent Monitor",
    desc: "Find people planning Ghana trips, asking about packages, ready to book",
  },
  detty: {
    label: "Detty December",
    desc: "Find 2025 price-gouging victims + 2026 planners for the $3,995 package",
  },
  full: {
    label: "Full Sweep",
    desc: "Run both scans together for maximum lead coverage",
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
  };
  const colors: Record<string, string> = {
    TikTok: "bg-black text-white",
    Instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    Reddit: "bg-orange-600 text-white",
    Twitter: "bg-black text-white",
  };
  return (
    <span
      className={`${colors[platform] ?? "bg-gray-500 text-white"} w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}
    >
      {icons[platform] ?? "?"}
    </span>
  );
}

export default function Dashboard() {
  const [scanType, setScanType] = useState<ScanType>("full");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<FilterPlatform>("all");
  const [filterMinScore, setFilterMinScore] = useState(1);

  const filteredLeads = (result?.leads ?? []).filter((lead) => {
    if (filterPlatform !== "all" && lead.platform !== filterPlatform) return false;
    if (lead.score < filterMinScore) return false;
    return true;
  });

  const runScan = useCallback(async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanType }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.error ?? "Scan failed");
      }
    } catch {
      setError("Network error -- check your connection");
    } finally {
      setScanning(false);
    }
  }, [scanType]);

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
      a.download = `akwaaba-leads-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Export failed");
    }
  }, [filteredLeads]);

  const platformCounts = (result?.leads ?? []).reduce(
    (acc, lead) => {
      acc[lead.platform] = (acc[lead.platform] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const scoreCounts = (result?.leads ?? []).reduce(
    (acc, lead) => {
      acc[lead.score] = (acc[lead.score] ?? 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-akwaaba-green-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-akwaaba-gold rounded-lg flex items-center justify-center font-bold text-akwaaba-green-dark text-lg">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Akwaaba Lead Scanner</h1>
              <p className="text-sm text-green-200 opacity-80">Social media intelligence</p>
            </div>
          </div>
          <div className="text-sm text-green-200">
            {result && (
              <span>
                Last scan: {new Date(result.meta.date).toLocaleString()} ({result.meta.duration}ms)
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Scan Controls */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Scan Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(Object.keys(SCAN_LABELS) as ScanType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setScanType(type)}
                    className={`text-left p-3 rounded-xl border-2 transition-all ${
                      scanType === type
                        ? "border-akwaaba-green bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="font-semibold text-sm">{SCAN_LABELS[type].label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{SCAN_LABELS[type].desc}</div>
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
                  : "bg-akwaaba-green hover:bg-akwaaba-green-light active:scale-95 shadow-lg shadow-green-200"
              }`}
            >
              {scanning ? "Scanning..." : "Run Scan"}
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
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-akwaaba-green">{result.meta.totalLeads}</div>
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Platform:</span>
                {(["all", "TikTok", "Reddit", "Instagram", "Twitter"] as FilterPlatform[]).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => setFilterPlatform(p)}
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

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Min Score:</span>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setFilterMinScore(s)}
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
                  onClick={exportCSV}
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
                            View Post &rarr;
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  {result.leads.length === 0
                    ? "No leads found -- try a different scan type"
                    : "No leads match your filters"}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!result && !scanning && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-akwaaba-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-10 h-10 bg-akwaaba-gold rounded-lg flex items-center justify-center font-bold text-akwaaba-green-dark text-xl">
                A
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to find leads</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-1">
              Select a scan type above and click Run Scan to find people planning Ghana trips on TikTok, Instagram, and Reddit.
            </p>
            <p className="text-sm text-gray-400">
              Results include real handles, video URLs, and recommended DM scripts.
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-400">
          <span>Akwaaba Lead Scanner v1.0</span>
          <span>Powered by Brave Search API</span>
        </div>
      </footer>
    </div>
  );
}
