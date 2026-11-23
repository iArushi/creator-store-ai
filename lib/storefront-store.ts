import { promises as fs } from "fs";
import path from "path";
import { StorefrontSchema, type Storefront } from "@/lib/schemas";
import { normalizeStorefront } from "@/lib/storefront-normalize";

type GlobalStore = {
  storefronts: Map<string, Storefront>;
};

function getGlobalStore(): GlobalStore {
  const g = globalThis as typeof globalThis & {
    __creatorStoreAiStorefronts?: GlobalStore;
  };
  if (!g.__creatorStoreAiStorefronts) {
    g.__creatorStoreAiStorefronts = { storefronts: new Map() };
  }
  return g.__creatorStoreAiStorefronts;
}

function dataDir() {
  return path.join(process.cwd(), "data", "storefronts");
}

function filePathFor(slug: string) {
  return path.join(dataDir(), `${slug}.json`);
}

export function createSlug(seed?: string): string {
  const base = (seed || "creator")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base || "creator"}-${suffix}`;
}

export async function saveStorefront(storefront: Storefront): Promise<Storefront> {
  const parsed = StorefrontSchema.parse(storefront);
  getGlobalStore().storefronts.set(parsed.slug, parsed);

  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(
      filePathFor(parsed.slug),
      JSON.stringify(parsed, null, 2),
      "utf8",
    );
  } catch {
    // Filesystem may be read-only on some hosts; memory still works for the session.
  }

  return parsed;
}

export async function getStorefront(slug: string): Promise<Storefront | null> {
  // Prefer disk when available so refreshed sample / edited JSON is visible.
  try {
    const raw = await fs.readFile(filePathFor(slug), "utf8");
    const normalized = normalizeStorefront(JSON.parse(raw));
    if (normalized) {
      getGlobalStore().storefronts.set(slug, normalized);
      return normalized;
    }
  } catch {
    // fall through to memory
  }

  const memory = getGlobalStore().storefronts.get(slug);
  if (memory) {
    return normalizeStorefront(memory) || memory;
  }
  return null;
}
