"use client";

import { useState } from "react";
import { FileText, ImagePlus, Link2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RESOURCE_LIMITS,
} from "@/lib/creator-intelligence/schemas";
import type { CreatorResourceClient } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type ResourceCollectorProps = {
  resources: CreatorResourceClient[];
  onChange: (resources: CreatorResourceClient[]) => void;
  className?: string;
};

const MAX_IMAGE_BYTES = 1_400_000;
const MAX_DOC_BYTES = 2_500_000;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function ResourceCollector({
  resources,
  onChange,
  className,
}: ResourceCollectorProps) {
  const [urlDraft, setUrlDraft] = useState("");
  const [textDraft, setTextDraft] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);

  const images = resources.filter((r) => r.type === "image");
  const urls = resources.filter((r) => r.type === "url");
  const docs = resources.filter((r) => r.type === "document");
  const texts = resources.filter((r) => r.type === "text");

  function remove(id: string) {
    onChange(resources.filter((r) => r.id !== id));
  }

  async function addImages(list: FileList | null) {
    if (!list?.length) return;
    setError(undefined);
    setBusy(true);
    try {
      const room = RESOURCE_LIMITS.images - images.length;
      const incoming = Array.from(list).slice(0, Math.max(0, room));
      const next = [...resources];

      for (const file of incoming) {
        if (!file.type.startsWith("image/")) {
          setError("Images only for screenshots (JPG/PNG).");
          continue;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          setError("Keep each image under ~1.4MB.");
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        next.push({
          id: makeId("image"),
          type: "image",
          filename: file.name,
          mimeType: file.type,
          title: file.name,
          dataUrl,
          previewUrl: dataUrl,
        });
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  async function addDocuments(list: FileList | null) {
    if (!list?.length) return;
    setError(undefined);
    setBusy(true);
    try {
      const room = RESOURCE_LIMITS.documents - docs.length;
      const incoming = Array.from(list).slice(0, Math.max(0, room));
      const next = [...resources];

      for (const file of incoming) {
        const isPdf =
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf");
        const isText =
          file.type.startsWith("text/") ||
          /\.(txt|md|markdown)$/i.test(file.name);

        if (!isPdf && !isText) {
          setError("Documents: PDF or text/markdown only.");
          continue;
        }
        if (file.size > MAX_DOC_BYTES) {
          setError("Keep each document under ~2.5MB.");
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        next.push({
          id: makeId("document"),
          type: "document",
          filename: file.name,
          mimeType: file.type || (isPdf ? "application/pdf" : "text/plain"),
          title: file.name,
          dataUrl,
        });
      }
      onChange(next);
    } finally {
      setBusy(false);
    }
  }

  function addUrl() {
    const value = urlDraft.trim();
    if (!value) return;
    setError(undefined);
    if (urls.length >= RESOURCE_LIMITS.urls) {
      setError(`Up to ${RESOURCE_LIMITS.urls} links.`);
      return;
    }
    let parsed: URL;
    try {
      parsed = new URL(value.startsWith("http") ? value : `https://${value}`);
    } catch {
      setError("Enter a valid public URL.");
      return;
    }
    onChange([
      ...resources,
      {
        id: makeId("url"),
        type: "url",
        url: parsed.toString(),
        title: parsed.hostname,
      },
    ]);
    setUrlDraft("");
  }

  function addText() {
    const value = textDraft.trim();
    if (value.length < 12) {
      setError("Paste at least a short caption or note.");
      return;
    }
    if (texts.length >= RESOURCE_LIMITS.textBlocks) {
      setError(`Up to ${RESOURCE_LIMITS.textBlocks} text notes.`);
      return;
    }
    setError(undefined);
    onChange([
      ...resources,
      {
        id: makeId("text"),
        type: "text",
        title: "Caption / notes",
        text: value,
      },
    ]);
    setTextDraft("");
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <p className="text-sm font-medium text-ink">Evidence (optional)</p>
        <p className="mt-1 text-xs text-muted">
          Up to {RESOURCE_LIMITS.images} screenshots · {RESOURCE_LIMITS.urls}{" "}
          links · {RESOURCE_LIMITS.documents} docs. No video. No scraping.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-dashed border-line bg-paper/60 px-3 py-4 text-center transition hover:border-pine/40">
          <ImagePlus className="h-4 w-4 text-pine" />
          <span className="text-xs font-semibold text-pine-ink">Screenshots</span>
          <span className="text-[10px] text-ink-muted">
            {images.length}/{RESOURCE_LIMITS.images}
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy || images.length >= RESOURCE_LIMITS.images}
            onChange={(e) => void addImages(e.target.files)}
          />
        </label>

        <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border border-dashed border-line bg-paper/60 px-3 py-4 text-center transition hover:border-pine/40">
          <FileText className="h-4 w-4 text-pine" />
          <span className="text-xs font-semibold text-pine-ink">PDF / notes</span>
          <span className="text-[10px] text-ink-muted">
            {docs.length}/{RESOURCE_LIMITS.documents}
          </span>
          <input
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            multiple
            className="hidden"
            disabled={busy || docs.length >= RESOURCE_LIMITS.documents}
            onChange={(e) => void addDocuments(e.target.files)}
          />
        </label>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            className="sp-field__control sp-field__control--plain pl-9 text-sm"
            placeholder="Public page URL"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addUrl();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={addUrl}
          disabled={urls.length >= RESOURCE_LIMITS.urls}
        >
          Add
        </Button>
      </div>

      <div className="space-y-2">
        <textarea
          className="sp-field__control sp-field__control--plain min-h-[72px] resize-y text-sm"
          placeholder="Paste a caption, transcript snippet, or short note…"
          value={textDraft}
          onChange={(e) => setTextDraft(e.target.value)}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={addText}
          disabled={texts.length >= RESOURCE_LIMITS.textBlocks}
        >
          Add text
        </Button>
      </div>

      {busy ? (
        <p className="inline-flex items-center gap-2 text-xs text-muted">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Preparing files…
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-[#f0c7c0] bg-[#fef3f2] px-3 py-2.5"
        >
          <p className="text-xs font-semibold text-error">Couldn’t add that</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#7a271a]">{error}</p>
        </div>
      ) : null}

      {resources.length > 0 ? (
        <ul className="space-y-2">
          {resources.map((resource) => (
            <li
              key={resource.id}
              className="flex items-center gap-3 rounded-2xl border border-line bg-surface px-3 py-2"
            >
              {resource.type === "image" && resource.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resource.previewUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-sage-soft text-[10px] font-bold uppercase text-pine">
                  {resource.type.slice(0, 3)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-pine-ink">
                  {resource.title || resource.filename || resource.url || "Resource"}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-ink-muted">
                  {resource.type}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(resource.id)}
                className="rounded-full p-1.5 text-ink-muted hover:bg-paper hover:text-pine-ink"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
