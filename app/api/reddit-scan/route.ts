import { NextResponse } from "next/server";
import { runRedditScan } from "@/lib/reddit-scanner";
import type { ScanRequest } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanRequest;
    const scanType = body.scanType ?? "full";

    if (!["intent", "detty", "full"].includes(scanType)) {
      return NextResponse.json(
        { success: false, error: "Invalid scan type" },
        { status: 400 }
      );
    }

    const result = await runRedditScan(scanType);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reddit scan failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
