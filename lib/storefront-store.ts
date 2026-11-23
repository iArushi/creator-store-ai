import { promises as fs } from "fs";
import path from "path";
import { get, put } from "@vercel/blob";
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

function blobPathFor(slug: string) {
  return `storefronts/${slug}.json`;
}

function canUseBlob() {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN ||
      (process.env.VERCEL && process.env.BLOB_STORE_ID),
  );
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

async function saveToBlob(storefront: Storefront): Promise<void> {
  if (!canUseBlob()) return;
  await put(blobPathFor(storefront.slug), JSON.stringify(storefront), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    addRandomSuffix: false,
  });
}

async function loadFromBlob(slug: string): Promise<Storefront | null> {
  if (!canUseBlob()) return null;
  try {
    const result = await get(blobPathFor(slug), { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const raw = await new Response(result.stream).text();
    return normalizeStorefront(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function saveStorefront(storefront: Storefront): Promise<Storefront> {
  const parsed = StorefrontSchema.parse(storefront);
  getGlobalStore().storefronts.set(parsed.slug, parsed);

  try {
    await saveToBlob(parsed);
  } catch {
    // Fall through to local disk / memory for local-dev without Blob.
  }

  try {
    await fs.mkdir(dataDir(), { recursive: true });
    await fs.writeFile(
      filePathFor(parsed.slug),
      JSON.stringify(parsed, null, 2),
      "utf8",
    );
  } catch {
    // Filesystem may be read-only on some hosts; memory/blob still work.
  }

  return parsed;
}

export async function getStorefront(slug: string): Promise<Storefront | null> {
  const fromBlob = await loadFromBlob(slug);
  if (fromBlob) {
    getGlobalStore().storefronts.set(slug, fromBlob);
    return fromBlob;
  }

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
