import { NextResponse } from "next/server";
import { getClickUpLists, pushLeadToClickUp, pushBatchToClickUp } from "@/lib/clickup";
import type { Lead } from "@/lib/types";

export async function GET() {
  try {
    const lists = await getClickUpLists();
    return NextResponse.json({ success: true, data: lists });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch ClickUp lists";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action: "push" | "push-batch";
      listId: string;
      lead?: Lead;
      leads?: Lead[];
      dmScript?: string;
    };

    if (body.action === "push" && body.lead) {
      const result = await pushLeadToClickUp(body.listId, body.lead, body.dmScript);
      return NextResponse.json({ success: true, data: result });
    }

    if (body.action === "push-batch" && body.leads) {
      const results = await pushBatchToClickUp(body.listId, body.leads, body.dmScript);
      return NextResponse.json({
        success: true,
        data: { pushed: results.length, total: body.leads.length },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "ClickUp push failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
