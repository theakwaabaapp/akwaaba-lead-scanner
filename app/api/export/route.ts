import { NextResponse } from "next/server";
import type { Lead } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { leads, format } = (await request.json()) as {
      leads: Lead[];
      format: "csv";
    };

    if (format === "csv") {
      const header = "Handle,Platform,Signal,Score,Quote,URL,Hashtag";
      const rows = leads.map(
        (l) =>
          `"${l.handle}","${l.platform}","${l.signalType}",${l.score},"${l.quote.replace(/"/g, '""')}","${l.url}","${l.hashtag ?? ""}"`
      );
      const csv = [header, ...rows].join("\n");

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="akwaaba-leads-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unsupported format" },
      { status: 400 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
