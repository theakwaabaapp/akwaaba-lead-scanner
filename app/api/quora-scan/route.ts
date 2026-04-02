import { NextResponse } from "next/server";
import { runQuoraScan } from "@/lib/quora-scanner";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { scanType = "full" } = await request.json();
    const result = await runQuoraScan(scanType);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Quora scan failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
