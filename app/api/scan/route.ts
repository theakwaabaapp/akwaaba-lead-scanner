import { NextResponse } from "next/server";
import { runScan } from "@/lib/scanner";
import type { ScanRequest } from "@/lib/types";

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

    const result = await runScan(scanType);

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Scan failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
