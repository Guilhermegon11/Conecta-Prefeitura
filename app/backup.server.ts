import { readOperations } from "./operations-server";
import { DATA_BUCKET, downloadPrivateObject, ensureDataBucket, supabaseAdminConfig, supabaseAdminHeaders, uploadPrivateObject } from "./supabase-admin";

type Listed = { name?: string; id?: string };

async function listPrefix(prefix: string) {
  await ensureDataBucket();
  const { url } = supabaseAdminConfig();
  const response = await fetch(`${url}/storage/v1/object/list/${encodeURIComponent(DATA_BUCKET)}`, {
    method: "POST",
    headers: supabaseAdminHeaders("application/json"),
    body: JSON.stringify({ prefix, limit: 1000, offset: 0, sortBy: { column: "name", order: "asc" } }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<Listed[]>;
}

export async function createCriticalBackup(reason: "manual" | "scheduled" = "manual") {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const copied: string[] = [];
  for (const prefix of ["state", "citizen-feedback", "file-meta"]) {
    const entries = await listPrefix(prefix);
    for (const entry of entries) {
      if (!entry.name || !entry.name.endsWith(".json")) continue;
      const source = `${prefix}/${entry.name}`;
      const response = await downloadPrivateObject(source);
      if (!response.ok) continue;
      const bytes = await response.arrayBuffer();
      await uploadPrivateObject(`backups/${stamp}/${source}`, bytes, response.headers.get("content-type") || "application/json", false);
      copied.push(source);
    }
  }
  const operations = await readOperations();
  if (operations.revision > 0) {
    const path = "operations/state.json";
    await uploadPrivateObject(`backups/${stamp}/${path}`, JSON.stringify(operations), "application/json", false);
    copied.push(path);
  }
  const manifest = { createdAt: new Date().toISOString(), reason, count: copied.length, files: copied };
  await uploadPrivateObject(`backups/${stamp}/manifest.json`, JSON.stringify(manifest), "application/json", false);
  return { stamp, count: copied.length };
}
