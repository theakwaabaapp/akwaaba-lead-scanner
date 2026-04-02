export interface Lead {
  handle: string;
  platform: "TikTok" | "Instagram" | "Reddit" | "Twitter";
  signalType: "HIGH" | "WARM" | "INTEREST" | "BURNED" | "PLANNER";
  score: number;
  quote: string;
  url: string;
  hashtag?: string;
  engagement?: number;
}

export interface ScanResult {
  leads: Lead[];
  meta: {
    date: string;
    totalSearches: number;
    totalLeads: number;
    scanType: string;
    duration: number;
  };
}

export interface ScanRequest {
  scanType: "intent" | "detty" | "full";
  hashtags?: string[];
  keywords?: string[];
}
