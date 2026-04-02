import type { Lead } from "./types";

export type LeadStatus = "new" | "contacted" | "replied" | "converted" | "skip";

export interface StoredLead extends Lead {
  id: string;
  status: LeadStatus;
  notes: string;
  savedAt: string;
  scanDate: string;
}

const STORAGE_KEY = "akwaaba-leads";
const HISTORY_KEY = "akwaaba-scan-history";

export function generateLeadId(lead: Lead): string {
  return `${lead.handle}-${lead.platform}-${lead.url}`.replace(/[^a-zA-Z0-9-]/g, "_");
}

export function getSavedLeads(): StoredLead[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveLead(lead: Lead, status: LeadStatus = "new"): StoredLead {
  const saved = getSavedLeads();
  const id = generateLeadId(lead);
  const existing = saved.find((l) => l.id === id);

  if (existing) {
    existing.status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return existing;
  }

  const stored: StoredLead = {
    ...lead,
    id,
    status,
    notes: "",
    savedAt: new Date().toISOString(),
    scanDate: new Date().toISOString().split("T")[0],
  };

  saved.push(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  return stored;
}

export function updateLeadStatus(id: string, status: LeadStatus): void {
  const saved = getSavedLeads();
  const lead = saved.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
}

export function updateLeadNotes(id: string, notes: string): void {
  const saved = getSavedLeads();
  const lead = saved.find((l) => l.id === id);
  if (lead) {
    lead.notes = notes;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
}

export function removeLead(id: string): void {
  const saved = getSavedLeads().filter((l) => l.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
}

export function isLeadSaved(lead: Lead): StoredLead | undefined {
  const saved = getSavedLeads();
  const id = generateLeadId(lead);
  return saved.find((l) => l.id === id);
}

// Scan history for new-vs-seen tracking
export interface ScanHistoryEntry {
  date: string;
  tab: string;
  leadCount: number;
  handles: string[];
}

export function saveScanHistory(tab: string, handles: string[]): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(HISTORY_KEY);
  const history: ScanHistoryEntry[] = raw ? JSON.parse(raw) : [];

  history.push({
    date: new Date().toISOString(),
    tab,
    leadCount: handles.length,
    handles,
  });

  // Keep last 50 scans
  const trimmed = history.slice(-50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

export function getPreviousHandles(tab: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = localStorage.getItem(HISTORY_KEY);
  const history: ScanHistoryEntry[] = raw ? JSON.parse(raw) : [];

  const allHandles = new Set<string>();
  for (const entry of history.filter((e) => e.tab === tab)) {
    for (const h of entry.handles) {
      allHandles.add(h);
    }
  }
  return allHandles;
}
