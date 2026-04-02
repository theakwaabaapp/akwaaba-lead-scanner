"use client";

import Image from "next/image";
import Link from "next/link";

const sections = [
  {
    id: "overview",
    title: "What Is This?",
    content: `The Akwaaba Lead Scanner finds people on social media who are planning trips to Ghana, complaining about travel costs, or asking for recommendations. It gives you their handles, what they said, and a link to their post — so you can DM them with the right Akwaaba package.`,
  },
  {
    id: "login",
    title: "Getting Started",
    steps: [
      "Go to the dashboard URL your team lead shared with you",
      "Enter the team password on the login screen",
      "You'll land on the Social tab — this is your home base",
    ],
  },
  {
    id: "tabs",
    title: "Understanding the Tabs",
    tabs: [
      {
        icon: "📱",
        name: "Social",
        what: "Searches TikTok, Instagram, Twitter, and Reddit all at once",
        when: "Daily quick check — 'who's talking about Ghana trips today?'",
        how: "Pick Intent Monitor, Detty December, or Full Sweep → click Run Scan → browse results",
      },
      {
        icon: "🔬",
        name: "TikTok Deep",
        what: "Uses Apify to pull REAL TikTok data — actual play counts, likes, comments, follower counts",
        when: "When you need engagement data — 'which Ghana videos are getting 100K+ views?'",
        how: "Pick a scan type → click Run Scan → takes 1-2 minutes (it runs a real browser). Results sorted by views",
      },
      {
        icon: "📡",
        name: "Trend Radar",
        what: "Finds what's going viral RIGHT NOW in Ghana travel — news, controversies, creator posts from this week",
        when: "Monday morning — 'what happened this week we can react to?'",
        how: "Viral Now = trending content. Travel News = announcements. Controversies = complaints (opportunity!). Creator Watch = what influencers posted",
      },
      {
        icon: "💬",
        name: "Reddit",
        what: "Digs into actual Reddit comment threads — r/ghana, r/travel, r/solotravel, r/blackladies",
        when: "When you want deep leads — people write paragraphs on Reddit about their trip plans",
        how: "Run Full Sweep → look for Score 4-5 leads → click View to go to the thread → reply helpfully with Akwaaba link",
      },
      {
        icon: "▶️",
        name: "YouTube",
        what: "Finds Ghana travel vlogs and cost breakdown videos",
        when: "Looking for creators to collab with, or videos to make TikTok responses to",
        how: "Run scan → find high-view videos → either respond with your own content or contact the creator for collab",
      },
      {
        icon: "❓",
        name: "Quora",
        what: "Finds Quora threads where people ask Ghana travel questions",
        when: "SEO play — answering Quora questions gets you free backlinks and visibility",
        how: "Run scan → find unanswered questions → write a helpful answer → include akwaaba.app link naturally",
      },
      {
        icon: "🔍",
        name: "Competitors",
        what: "Monitors 7 competitors — roottoursghana, visitghana, beyondthereturn, etc.",
        when: "Weekly — 'what are competitors posting? what are their prices?'",
        how: "Pricing Intel = their package prices. Content Watch = their latest posts. Use this to differentiate",
      },
      {
        icon: "🎬",
        name: "Content Lab",
        what: "Gives you ready-to-use TikTok hooks, content gap ideas, and creators to collab with",
        when: "When you need content ideas — 'I need to record 3 TikToks today, what should I make?'",
        how: "Run Full Lab → Hook Templates are ready to record. Trending Now = content to react to. Find Creators = collab targets",
      },
      {
        icon: "⭐",
        name: "Saved",
        what: "Your lead pipeline — every lead you save goes here with status tracking",
        when: "Outreach day — work through your saved leads, DM them, track who replied",
        how: "Save leads from any tab → go to Saved → change status: New → Contacted → Replied → Converted",
      },
    ],
  },
  {
    id: "scores",
    title: "Lead Scores Explained",
    content: "Every lead gets a score from 1-5 based on what they said:",
    scores: [
      { score: 5, label: "HOT", color: "bg-red-600", meaning: "Ready to buy — 'how do I book?', 'all inclusive Ghana package'", action: "DM immediately" },
      { score: 4, label: "HIGH", color: "bg-orange-500", meaning: "Planning actively — 'planning a trip to Ghana', 'girls trip'", action: "DM within 24 hours" },
      { score: 3, label: "WARM", color: "bg-amber-500", meaning: "Researching — 'how much does Ghana cost?', 'itinerary'", action: "DM with helpful info + link" },
      { score: 2, label: "INTEREST", color: "bg-emerald-600", meaning: "Early interest — 'Ghana is on my bucket list', 'want to go'", action: "Save for later, nurture" },
      { score: 1, label: "LOW", color: "bg-gray-500", meaning: "General mention — might become a lead later", action: "Monitor, don't DM yet" },
    ],
  },
  {
    id: "dm-scripts",
    title: "Using DM Scripts",
    steps: [
      "Click 'DM Scripts' button in the top-right header",
      "8 templates appear — each for a different lead type",
      "Click any script to copy it to your clipboard",
      "Go to the lead's profile (click 'View' on their row)",
      "Paste the script into a DM — personalize the first line",
      "Mark the lead as 'Contacted' in the Saved tab",
    ],
    tip: "Always personalize! Change the first line to reference something specific they said. Generic DMs get ignored.",
  },
  {
    id: "saving",
    title: "Saving & Tracking Leads",
    steps: [
      "On any scan result, click 'Save' on a lead's row",
      "Go to the ⭐ Saved tab to see all saved leads",
      "Use the dropdown to change status: New → Contacted → Replied → Converted → Skip",
      "Filter by score to focus on hot leads first",
      "Export to CSV anytime for spreadsheet tracking",
    ],
  },
  {
    id: "clickup",
    title: "Pushing Leads to ClickUp",
    steps: [
      "Run a scan on any tab",
      "Click the purple 'ClickUp' button in the filter bar",
      "Select your ClickUp list from the dropdown",
      "Click 'Push X leads' — each lead becomes a ClickUp task",
      "Tasks include: handle, platform, score, quote, source URL, and DM script",
      "Tasks are auto-tagged by platform and score level",
    ],
  },
  {
    id: "csv",
    title: "Exporting to CSV",
    steps: [
      "Run a scan or go to Saved tab",
      "Use the score filter to narrow down (e.g., 3+ only)",
      "Click the gold 'CSV' button",
      "File downloads with columns: Handle, Platform, Signal, Score, Quote, URL",
      "Open in Google Sheets or Excel for team sharing",
    ],
  },
  {
    id: "weekly",
    title: "Recommended Weekly Routine",
    schedule: [
      { day: "Monday", task: "Check Trend Radar → what's viral? Plan reactive content for the week", tab: "📡 Trend Radar" },
      { day: "Tuesday", task: "Run Full Sweep on Social + Reddit → collect new leads → save Score 3+ leads", tab: "📱 Social + 💬 Reddit" },
      { day: "Wednesday", task: "DM 10-15 saved leads → update statuses in Saved tab", tab: "⭐ Saved" },
      { day: "Thursday", task: "Check Competitors → what are they posting? Any new pricing?", tab: "🔍 Competitors" },
      { day: "Friday", task: "Content Lab → pick 3-5 hooks → batch record TikToks for next week", tab: "🎬 Content Lab" },
      { day: "Saturday", task: "Follow up on 'Contacted' leads that haven't replied", tab: "⭐ Saved" },
      { day: "Auto", task: "Weekly auto-scan runs every Monday 9am UTC — fresh data waiting for you", tab: "Automatic" },
    ],
  },
  {
    id: "packages",
    title: "Akwaaba Packages (Reference)",
    content: "Use these when DMing leads — match the package to their intent:",
    packages: [
      { name: "2-Day Explore", price: "$499", best: "First timers, weekend warriors", link: "akwaaba.app/ghana-vacation-packages" },
      { name: "3-Day All-Inclusive", price: "$1,475", best: "Short trips, couples", link: "akwaaba.app/ghana-vacation-packages" },
      { name: "4-Day Wildlife", price: "$1,995", best: "Nature lovers, Mole National Park", link: "akwaaba.app/ghana-vacation-packages" },
      { name: "5-Day Package", price: "$1,250", best: "Balanced trip, most popular", link: "akwaaba.app/ghana-vacation-packages" },
      { name: "7-Day Package", price: "$1,750", best: "Full experience, explorers", link: "akwaaba.app/ghana-vacation-packages" },
      { name: "8-Day Detty December", price: "$3,995", best: "Detty December, groups, squads", link: "akwaaba.app/ghana-detty-december-2026-packages" },
      { name: "Girls Trip", price: "Custom", best: "Girls trip planners", link: "akwaaba.app/ghana-girls-trip-packages" },
      { name: "Corporate Retreat", price: "Custom", best: "Companies, team building", link: "akwaaba.app/ghana-corporate-retreats" },
    ],
  },
  {
    id: "tips",
    title: "Pro Tips",
    tips: [
      "Score 5 leads should be DMed within 1 hour — they're ready to buy RIGHT NOW",
      "Detty December leads are highest value ($3,995 package) — prioritize them Sept-Dec",
      "When DMing, always reference what they actually said — 'saw your post about...'",
      "TikTok Deep scan costs Apify credits ($0.003/video) — use Full Sweep on Social tab for free daily checks, save TikTok Deep for weekly deep dives",
      "Reddit leads are goldmines — people write detailed posts about their plans. Reply publicly (not DM) with helpful advice + Akwaaba mention",
      "Quora answers live forever and get Google traffic — answer 2-3 questions per week for long-term SEO",
      "The 'NEW' badge means you haven't seen this lead before — focus on new leads first",
      "Export CSV weekly and share with the team in ClickUp/Slack for accountability",
      "Competitor tab shows their prices — if they're higher, mention Akwaaba's transparent pricing in your DMs",
    ],
  },
];

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-akwaaba-cream">
      {/* Header */}
      <header className="bg-gradient-to-r from-akwaaba-green-dark to-akwaaba-green text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/akwaaba-logo.png" alt="Akwaaba" width={44} height={44} className="rounded-lg" />
            <div>
              <h1 className="text-xl font-bold tracking-tight">How To Guide</h1>
              <p className="text-xs text-green-200 opacity-80">Lead Scanner Manual for Marketing Team</p>
            </div>
          </div>
          <Link href="/" className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all">
            Back to Scanner
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Table of Contents */}
        <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="font-bold text-sm text-gray-700 mb-3 uppercase tracking-wider">Contents</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {sections.map(s => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-akwaaba-green hover:text-akwaaba-green-light transition-colors">
                {s.title}
              </a>
            ))}
          </div>
        </nav>

        {/* Sections */}
        {sections.map(section => (
          <div key={section.id} id={section.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">{section.title}</h2>

            {section.content && (
              <p className="text-sm text-gray-600 mb-4">{section.content}</p>
            )}

            {/* Steps */}
            {"steps" in section && section.steps && (
              <ol className="space-y-2">
                {section.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 w-6 h-6 rounded-full bg-akwaaba-green text-white flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="text-gray-600 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            )}

            {/* Tip */}
            {"tip" in section && section.tip && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
                <strong>Tip:</strong> {section.tip}
              </div>
            )}

            {/* Tabs */}
            {"tabs" in section && section.tabs && (
              <div className="space-y-4">
                {section.tabs.map(tab => (
                  <div key={tab.name} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{tab.icon}</span>
                      <span className="font-semibold text-sm text-gray-800">{tab.name}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium text-gray-700">What:</span> <span className="text-gray-500">{tab.what}</span></p>
                      <p><span className="font-medium text-gray-700">When:</span> <span className="text-gray-500">{tab.when}</span></p>
                      <p><span className="font-medium text-gray-700">How:</span> <span className="text-gray-500">{tab.how}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Scores */}
            {"scores" in section && section.scores && (
              <div className="space-y-3 mt-2">
                {section.scores.map(s => (
                  <div key={s.score} className="flex items-start gap-3">
                    <span className={`${s.color} text-white text-xs font-bold px-2.5 py-1 rounded-full shrink-0`}>
                      {s.score} {s.label}
                    </span>
                    <div className="text-sm">
                      <p className="text-gray-700">{s.meaning}</p>
                      <p className="text-gray-400 text-xs mt-0.5">Action: {s.action}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Schedule */}
            {"schedule" in section && section.schedule && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Day</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-500 text-xs uppercase">Task</th>
                      <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Tab</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.schedule.map(row => (
                      <tr key={row.day} className="border-b border-gray-50">
                        <td className="py-2 pr-4 font-medium text-gray-800">{row.day}</td>
                        <td className="py-2 pr-4 text-gray-600">{row.task}</td>
                        <td className="py-2 text-gray-400 text-xs">{row.tab}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Packages */}
            {"packages" in section && section.packages && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 text-xs uppercase">Package</th>
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 text-xs uppercase">Price</th>
                      <th className="text-left py-2 pr-3 font-semibold text-gray-500 text-xs uppercase">Best For</th>
                      <th className="text-left py-2 font-semibold text-gray-500 text-xs uppercase">Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.packages.map(pkg => (
                      <tr key={pkg.name} className="border-b border-gray-50">
                        <td className="py-2 pr-3 font-medium text-gray-800">{pkg.name}</td>
                        <td className="py-2 pr-3 text-akwaaba-green font-bold">{pkg.price}</td>
                        <td className="py-2 pr-3 text-gray-600">{pkg.best}</td>
                        <td className="py-2 text-xs text-akwaaba-green">{pkg.link}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tips */}
            {"tips" in section && section.tips && (
              <ul className="space-y-3">
                {section.tips.map((tip, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="shrink-0 text-akwaaba-gold font-bold">*</span>
                    <span className="text-gray-600">{tip}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <Image src="/akwaaba-logo.png" alt="" width={16} height={16} className="rounded" />
            <span>Akwaaba Lead Scanner v2.0 — How To Guide</span>
          </div>
          <Link href="/" className="text-akwaaba-green hover:text-akwaaba-green-light">Back to Scanner</Link>
        </div>
      </footer>
    </div>
  );
}
