import { NextResponse } from "next/server";
import { runApifyScan } from "@/lib/apify-scanner";

export const maxDuration = 300; // Apify runs can take 2+ minutes

export async function POST(request: Request) {
  try {
    const { scanType = "full" } = await request.json();
    const result = await runApifyScan(scanType);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Apify scan failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
