import type { Lead } from "./types";

const CLICKUP_API = "https://api.clickup.com/api/v2";

function getHeaders(): HeadersInit {
  const token = process.env.CLICKUP_API_TOKEN;
  if (!token) throw new Error("CLICKUP_API_TOKEN not configured");
  return {
    "Authorization": token,
    "Content-Type": "application/json",
  };
}

export async function getClickUpLists(): Promise<Array<{ id: string; name: string }>> {
  const teamId = process.env.CLICKUP_TEAM_ID;
  if (!teamId) throw new Error("CLICKUP_TEAM_ID not configured");

  const res = await fetch(`${CLICKUP_API}/team/${teamId}/space?archived=false`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`ClickUp API error: ${res.status}`);

  const data = await res.json();
  const lists: Array<{ id: string; name: string }> = [];

  for (const space of data.spaces ?? []) {
    const foldersRes = await fetch(`${CLICKUP_API}/space/${space.id}/folder?archived=false`, {
      headers: getHeaders(),
    });
    const foldersData = await foldersRes.json();
    for (const folder of foldersData.folders ?? []) {
      for (const list of folder.lists ?? []) {
        lists.push({ id: list.id, name: `${space.name} / ${folder.name} / ${list.name}` });
      }
    }

    // Folderless lists
    const listsRes = await fetch(`${CLICKUP_API}/space/${space.id}/list?archived=false`, {
      headers: getHeaders(),
    });
    const listsData = await listsRes.json();
    for (const list of listsData.lists ?? []) {
      lists.push({ id: list.id, name: `${space.name} / ${list.name}` });
    }
  }

  return lists;
}

export async function pushLeadToClickUp(
  listId: string,
  lead: Lead,
  dmScript?: string,
): Promise<{ id: string; url: string }> {
  const scoreLabels: Record<number, string> = {
    5: "HOT", 4: "HIGH", 3: "WARM", 2: "INTEREST", 1: "LOW",
  };

  const priority = lead.score >= 4 ? 1 : lead.score >= 3 ? 2 : lead.score >= 2 ? 3 : 4;

  const description = [
    `**Platform:** ${lead.platform}`,
    `**Handle:** ${lead.handle}`,
    `**Score:** ${lead.score} (${scoreLabels[lead.score] ?? "LOW"})`,
    `**Signal:** ${lead.signalType}`,
    `**Quote:** "${lead.quote}"`,
    `**Source:** ${lead.url}`,
    lead.hashtag ? `**Tag:** ${lead.hashtag}` : "",
    "",
    dmScript ? `---\n\n**DM Script:**\n${dmScript}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(`${CLICKUP_API}/list/${listId}/task`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: `[${lead.platform}] ${lead.handle} — ${scoreLabels[lead.score]} lead`,
      description,
      priority,
      tags: [lead.platform.toLowerCase(), lead.signalType.toLowerCase(), `score-${lead.score}`],
      status: "to do",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ClickUp create task failed: ${res.status} ${err}`);
  }

  const task = await res.json();
  return { id: task.id, url: task.url };
}

export async function pushBatchToClickUp(
  listId: string,
  leads: Lead[],
  dmScript?: string,
): Promise<Array<{ lead: Lead; taskId: string; taskUrl: string }>> {
  const results: Array<{ lead: Lead; taskId: string; taskUrl: string }> = [];

  // Push sequentially to avoid rate limits
  for (const lead of leads) {
    try {
      const task = await pushLeadToClickUp(listId, lead, dmScript);
      results.push({ lead, taskId: task.id, taskUrl: task.url });
    } catch {
      // Skip failed pushes
    }
  }

  return results;
}
