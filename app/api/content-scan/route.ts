import { NextResponse } from "next/server";
import { runContentScan } from "@/lib/content-generator";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { scanType = "full" } = await request.json();
    const result = await runContentScan(scanType);
    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Content scan failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
