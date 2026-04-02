"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { Lead, ScanResult } from "@/lib/types";
import { DM_SCRIPTS } from "@/lib/dm-scripts";
import {
  saveLead, updateLeadStatus, getSavedLeads, isLeadSaved,
  saveScanHistory, getPreviousHandles,
  type LeadStatus, type StoredLead,
} from "@/lib/lead-store";

type ActiveTab = "social" | "tiktok-deep" | "trends" | "reddit" | "youtube" | "quora" | "competitors" | "content" | "saved";
type ScanType = "intent" | "detty" | "full";
type CompetitorScanType = "pricing" | "content" | "full";

const TAB_CONFIG: Record<string, { icon: string; label: string; color: string; endpoint: string }> = {
  social: { icon: "📱", label: "Social", color: "green", endpoint: "/api/scan" },
  "tiktok-deep": { icon: "🔬", label: "TikTok Deep", color: "black", endpoint: "/api/apify-scan" },
  trends: { icon: "📡", label: "Trend Radar", color: "indigo", endpoint: "/api/trend-scan" },
  reddit: { icon: "💬", label: "Reddit", color: "orange", endpoint: "/api/reddit-scan" },
  youtube: { icon: "▶️", label: "YouTube", color: "red", endpoint: "/api/youtube-scan" },
  quora: { icon: "❓", label: "Quora", color: "red", endpoint: "/api/quora-scan" },
  competitors: { icon: "🔍", label: "Competitors", color: "purple", endpoint: "/api/competitor-scan" },
  content: { icon: "🎬", label: "Content Lab", color: "pink", endpoint: "/api/content-scan" },
  saved: { icon: "⭐", label: "Saved", color: "yellow", endpoint: "" },
};

const SCAN_LABELS: Record<string, Record<string, { label: string; desc: string; icon: string }>> = {
  social: {
    intent: { label: "Intent Monitor", desc: "People planning Ghana trips", icon: "🎯" },
    detty: { label: "Detty December", desc: "DD 2025 victims + 2026 planners", icon: "🔥" },
    full: { label: "Full Sweep", desc: "All scans combined", icon: "⚡" },
  },
  "tiktok-deep": {
    intent: { label: "Travel Hashtags", desc: "Deep scan #ghanatravel #visitghana with engagement data", icon: "🎯" },
    detty: { label: "Detty December", desc: "Deep scan #dettydecember with play counts + likes", icon: "🔥" },
    full: { label: "Full Deep Scan", desc: "All Ghana hashtags — plays, likes, comments, follower counts", icon: "⚡" },
  },
  trends: {
    viral: { label: "Viral Now", desc: "Currently viral Ghana/Africa travel content this week", icon: "📈" },
    news: { label: "Travel News", desc: "Ghana tourism news, visa changes, new hotels, events", icon: "📰" },
    controversy: { label: "Controversies", desc: "Travel complaints, scams, drama — opportunities to respond", icon: "⚠️" },
    influencer: { label: "Creator Watch", desc: "Latest posts from 12 Ghana travel influencers", icon: "👀" },
    full: { label: "Full Radar", desc: "Everything — viral + news + controversy + influencers", icon: "⚡" },
  },
  reddit: {
    intent: { label: "Trip Planning", desc: "Ghana travel discussions", icon: "🗺️" },
    detty: { label: "Detty December", desc: "Cost complaints + 2026 plans", icon: "🔥" },
    full: { label: "Full Sweep", desc: "All subreddits, all queries", icon: "⚡" },
  },
  youtube: {
    intent: { label: "Travel Vlogs", desc: "Ghana travel videos", icon: "🗺️" },
    detty: { label: "Detty December", desc: "DD vlogs and reviews", icon: "🔥" },
    full: { label: "Full Sweep", desc: "All Ghana YouTube content", icon: "⚡" },
  },
  quora: {
    intent: { label: "Travel Q&A", desc: "Ghana trip questions", icon: "🗺️" },
    detty: { label: "Detty December", desc: "DD questions on Quora", icon: "🔥" },
    full: { label: "Full Sweep", desc: "All Ghana Quora threads", icon: "⚡" },
  },
  competitors: {
    pricing: { label: "Pricing Intel", desc: "Competitor package prices", icon: "💰" },
    content: { label: "Content Watch", desc: "Latest competitor posts", icon: "📝" },
    full: { label: "Full Scan", desc: "Pricing + content together", icon: "⚡" },
  },
  content: {
    trending: { label: "Trending Now", desc: "Currently viral Ghana travel content to react to", icon: "📈" },
    ideas: { label: "Content Ideas", desc: "Hook templates + content gap analysis", icon: "💡" },
    creators: { label: "Find Creators", desc: "Active Ghana travel creators to collab with", icon: "🤝" },
    full: { label: "Full Lab", desc: "Trending + ideas + creators all at once", icon: "⚡" },
  },
};

const SCORE_LABELS: Record<number, string> = { 5: "HOT", 4: "HIGH", 3: "WARM", 2: "INTEREST", 1: "LOW" };
const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-gray-100 text-gray-600",
  contacted: "bg-blue-100 text-blue-700",
  replied: "bg-green-100 text-green-700",
  converted: "bg-akwaaba-green text-white",
  skip: "bg-gray-200 text-gray-400",
};

function ScoreBadge({ score }: { score: number }) {
  const cls: Record<number, string> = {
    5: "bg-red-600 text-white", 4: "bg-orange-500 text-white", 3: "bg-amber-500 text-white",
    2: "bg-emerald-600 text-white", 1: "bg-gray-500 text-white",
  };
  return <span className={`${cls[score]} text-xs font-bold px-2 py-0.5 rounded-full`}>{score} {SCORE_LABELS[score]}</span>;
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = { TikTok: "T", Instagram: "I", Reddit: "R", Twitter: "X", YouTube: "Y", Quora: "Q", Competitor: "C" };
  const colors: Record<string, string> = {
    TikTok: "bg-black text-white", Instagram: "bg-gradient-to-br from-purple-500 to-pink-500 text-white",
    Reddit: "bg-orange-600 text-white", Twitter: "bg-black text-white", YouTube: "bg-red-600 text-white",
    Quora: "bg-red-700 text-white", Competitor: "bg-purple-600 text-white",
  };
  return (
    <span className={`${colors[platform] ?? "bg-gray-500 text-white"} w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0`}>
      {icons[platform] ?? "?"}
    </span>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("social");
  const [scanType, setScanType] = useState<string>("full");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<Record<string, ScanResult>>({});
  const [error, setError] = useState<string | null>(null);
  const [filterMinScore, setFilterMinScore] = useState(1);
  const [showDMPanel, setShowDMPanel] = useState(false);
  const [copiedScript, setCopiedScript] = useState<number | null>(null);
  const [savedLeads, setSavedLeads] = useState<StoredLead[]>([]);
  const [clickUpListId, setClickUpListId] = useState("");
  const [clickUpLists, setClickUpLists] = useState<Array<{ id: string; name: string }>>([]);
  const [pushingToClickUp, setPushingToClickUp] = useState(false);
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());

  // Load saved leads on mount
  useEffect(() => {
    setSavedLeads(getSavedLeads());
  }, []);

  const result = results[activeTab] ?? null;
  const tabConfig = TAB_CONFIG[activeTab];
  const scanLabels = SCAN_LABELS[activeTab] ?? SCAN_LABELS.social;

  const currentLeads = activeTab === "saved"
    ? savedLeads.map(sl => ({ ...sl } as Lead))
    : (result?.leads ?? []);

  const filteredLeads = currentLeads.filter(lead => lead.score >= filterMinScore);

  const runScan = useCallback(async () => {
    if (activeTab === "saved") return;
    setScanning(true);
    setError(null);
    try {
      const res = await fetch(tabConfig.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanType }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(prev => ({ ...prev, [activeTab]: data.data }));
        // Track new vs seen
        const handles = (data.data.leads as Lead[]).map(l => l.handle);
        const prevHandles = getPreviousHandles(activeTab);
        const newIds = new Set<string>();
        for (const h of handles) {
          if (!prevHandles.has(h)) newIds.add(h);
        }
        setNewLeadIds(newIds);
        saveScanHistory(activeTab, handles);
      } else {
        setError(data.error ?? "Scan failed");
      }
    } catch {
      setError("Network error");
    } finally {
      setScanning(false);
    }
  }, [scanType, activeTab, tabConfig.endpoint]);

  const exportCSV = useCallback(async () => {
    if (!filteredLeads.length) return;
    const res = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leads: filteredLeads, format: "csv" }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `akwaaba-${activeTab}-leads-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLeads, activeTab]);

  const handleSaveLead = useCallback((lead: Lead) => {
    saveLead(lead, "new");
    setSavedLeads(getSavedLeads());
  }, []);

  const handleStatusChange = useCallback((id: string, status: LeadStatus) => {
    updateLeadStatus(id, status);
    setSavedLeads(getSavedLeads());
  }, []);

  const copyScript = useCallback((idx: number) => {
    navigator.clipboard.writeText(DM_SCRIPTS[idx].template);
    setCopiedScript(idx);
    setTimeout(() => setCopiedScript(null), 2000);
  }, []);

  const fetchClickUpLists = useCallback(async () => {
    const res = await fetch("/api/clickup");
    const data = await res.json();
    if (data.success) setClickUpLists(data.data);
  }, []);

  const pushToClickUp = useCallback(async () => {
    if (!clickUpListId || !filteredLeads.length) return;
    setPushingToClickUp(true);
    await fetch("/api/clickup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "push-batch",
        listId: clickUpListId,
        leads: filteredLeads.slice(0, 50),
      }),
    });
    setPushingToClickUp(false);
  }, [clickUpListId, filteredLeads]);

  const scoreCounts = currentLeads.reduce((acc, lead) => {
    acc[lead.score] = (acc[lead.score] ?? 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-akwaaba-green-dark to-akwaaba-green text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/akwaaba-logo.png" alt="Akwaaba" width={44} height={44} className="rounded-lg" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">Lead Scanner</h1>
              <p className="text-xs text-green-200 opacity-80">Social media intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDMPanel(!showDMPanel)}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all"
            >
              {showDMPanel ? "Hide Scripts" : "DM Scripts"}
            </button>
            <a href="/guide"
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all">
              How To
            </a>
            <a href="https://akwaaba.app" target="_blank" rel="noopener noreferrer"
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all hidden sm:inline-block">
              akwaaba.app
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {Object.entries(TAB_CONFIG).map(([key, cfg]) => {
              const tabResult = key === "saved" ? null : results[key];
              return (
                <button
                  key={key}
                  onClick={() => { setActiveTab(key as ActiveTab); setScanType("full"); }}
                  className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap ${
                    activeTab === key
                      ? "bg-akwaaba-cream text-akwaaba-green-dark"
                      : "text-green-200 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <span className="mr-1">{cfg.icon}</span>
                  {cfg.label}
                  {key === "saved" && savedLeads.length > 0 && (
                    <span className="ml-1 bg-akwaaba-gold text-akwaaba-green-dark text-xs px-1.5 py-0.5 rounded-full">{savedLeads.length}</span>
                  )}
                  {tabResult && (
                    <span className="ml-1 bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{tabResult.meta.totalLeads}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1">
        {/* DM Scripts Panel */}
        {showDMPanel && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h3 className="font-bold text-sm text-gray-700 mb-4">DM Scripts — click to copy</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DM_SCRIPTS.map((script, idx) => (
                <button
                  key={idx}
                  onClick={() => copyScript(idx)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    copiedScript === idx
                      ? "border-akwaaba-green bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-xs text-gray-800">{script.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{script.target}</div>
                  <div className="text-xs text-gray-500 mt-2 line-clamp-3">{script.template}</div>
                  {copiedScript === idx && (
                    <div className="text-xs text-akwaaba-green font-bold mt-1">Copied!</div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scan Controls (not for saved tab) */}
        {activeTab !== "saved" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Scan Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(scanLabels).map(([key, cfg]) => (
                    <button
                      key={key}
                      onClick={() => setScanType(key)}
                      className={`text-left p-3 rounded-xl border-2 transition-all ${
                        scanType === key
                          ? "border-akwaaba-green bg-green-50 shadow-md shadow-green-100"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{cfg.icon}</span>
                        <span className="font-semibold text-sm">{cfg.label}</span>
                      </div>
                      <div className="text-xs text-gray-500">{cfg.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={runScan}
                disabled={scanning}
                className={`shrink-0 px-8 py-3 rounded-xl font-bold text-white transition-all ${
                  scanning ? "bg-gray-400 cursor-not-allowed animate-pulse" : "bg-akwaaba-green hover:bg-akwaaba-green-light active:scale-95 shadow-lg shadow-green-200"
                }`}
              >
                {scanning ? "Scanning..." : "Run Scan"}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">{error}</div>
        )}

        {/* Results */}
        {(activeTab === "saved" || result) && currentLeads.length > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
                <div className="text-3xl font-bold text-akwaaba-green">{currentLeads.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total</div>
              </div>
              {[5, 4, 3, 2].map(s => (
                <div key={s} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl font-bold">{scoreCounts[s] ?? 0}</div>
                  <div className="text-xs mt-1"><ScoreBadge score={s} /></div>
                </div>
              ))}
            </div>

            {/* Filters + Actions */}
            <div className="flex flex-wrap gap-3 items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Min Score:</span>
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setFilterMinScore(s)}
                    className={`text-xs px-2.5 py-1.5 rounded-full font-medium transition-all ${
                      filterMinScore === s ? "bg-akwaaba-green text-white" : "bg-white text-gray-600 border border-gray-200"
                    }`}>
                    {s}+
                  </button>
                ))}
              </div>

              {newLeadIds.size > 0 && activeTab !== "saved" && (
                <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                  {newLeadIds.size} new leads
                </span>
              )}

              <div className="ml-auto flex gap-2">
                <button onClick={exportCSV}
                  className="text-sm px-4 py-2 rounded-xl bg-akwaaba-gold text-akwaaba-green-dark font-semibold hover:bg-akwaaba-gold-light transition-all">
                  CSV ({filteredLeads.length})
                </button>
                <button
                  onClick={() => { if (!clickUpLists.length) fetchClickUpLists(); }}
                  className="text-sm px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-500 transition-all">
                  ClickUp
                </button>
              </div>
            </div>

            {/* ClickUp Push Panel */}
            {clickUpLists.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-purple-800">Push to ClickUp:</span>
                <select
                  value={clickUpListId}
                  onChange={e => setClickUpListId(e.target.value)}
                  className="text-sm border border-purple-300 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="">Select list...</option>
                  {clickUpLists.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <button
                  onClick={pushToClickUp}
                  disabled={!clickUpListId || pushingToClickUp}
                  className="text-sm px-4 py-1.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 disabled:opacity-50"
                >
                  {pushingToClickUp ? "Pushing..." : `Push ${Math.min(filteredLeads.length, 50)} leads`}
                </button>
              </div>
            )}

            {/* Leads Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Lead</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Score</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Signal</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 max-w-md">Quote</th>
                      <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredLeads.map((lead, i) => {
                      const saved = isLeadSaved(lead);
                      const isNew = newLeadIds.has(lead.handle);
                      return (
                        <tr key={`${lead.handle}-${i}`} className={`transition-colors ${isNew ? "bg-green-50/50" : "hover:bg-green-50/30"}`}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <PlatformIcon platform={lead.platform} />
                              <div>
                                <div className="font-semibold text-sm flex items-center gap-1">
                                  {lead.handle}
                                  {isNew && <span className="bg-green-500 text-white text-[10px] px-1 rounded">NEW</span>}
                                </div>
                                <div className="text-xs text-gray-400">{lead.platform}{lead.hashtag ? ` / ${lead.hashtag}` : ""}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3"><ScoreBadge score={lead.score} /></td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{lead.signalType}</span>
                          </td>
                          <td className="px-4 py-3 max-w-md">
                            <p className="text-sm text-gray-600 line-clamp-2">{lead.quote}</p>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <a href={lead.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs font-medium text-akwaaba-green hover:text-akwaaba-green-light">
                                View
                              </a>
                              {activeTab === "saved" && saved ? (
                                <select
                                  value={saved.status}
                                  onChange={e => handleStatusChange(saved.id, e.target.value as LeadStatus)}
                                  className={`text-xs px-2 py-0.5 rounded ${STATUS_COLORS[saved.status]} border-0 cursor-pointer`}
                                >
                                  <option value="new">New</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="replied">Replied</option>
                                  <option value="converted">Converted</option>
                                  <option value="skip">Skip</option>
                                </select>
                              ) : (
                                <button
                                  onClick={() => handleSaveLead(lead)}
                                  className={`text-xs px-2 py-0.5 rounded transition-all ${
                                    saved ? "bg-akwaaba-green text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                  }`}
                                >
                                  {saved ? "Saved" : "Save"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  {activeTab === "saved" ? "No saved leads yet — save leads from scan results" : "No leads match filters"}
                </div>
              )}
            </div>
          </>
        )}

        {/* Empty/Scanning States */}
        {activeTab !== "saved" && !result && !scanning && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">{tabConfig.icon}</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to scan</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Select a scan type above and click Run Scan
            </p>
          </div>
        )}

        {scanning && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="absolute inset-0 rounded-full border-4 border-akwaaba-green/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-akwaaba-green animate-spin"></div>
              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl">{tabConfig.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-700">Scanning...</h3>
          </div>
        )}
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/akwaaba-logo.png" alt="" width={16} height={16} className="rounded" />
            <span>Akwaaba Lead Scanner v2.0</span>
          </div>
          <span>Weekly auto-scan: Mondays 9am UTC</span>
        </div>
      </footer>
    </div>
  );
}
