"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { LanguageOption, NicheOption } from "@/lib/schemas";

type ChatMessage = { role: "assistant" | "user"; content: string };

type DiscoveryChatProps = {
  niche: NicheOption | "";
  customNiche?: string;
  language: LanguageOption;
  onComplete: (result: {
    summary: string;
    sharingStyles: string[];
    peopleAskAbout: string;
    enjoyHelpingWith: string;
  }) => void;
  onCancel: () => void;
};

export default function DiscoveryChat({
  niche,
  customNiche,
  language,
  onComplete,
  onCancel,
}: DiscoveryChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const started = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(nextMessages: ChatMessage[]) {
    setLoading(true);
    setError(undefined);
    try {
      const response = await fetch("/api/discovery/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche || undefined,
          customNiche,
          language,
          messages: nextMessages,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Could not continue the chat.");
      }

      const reply = String(payload.reply || "").trim();
      const withAssistant: ChatMessage[] = [
        ...nextMessages,
        { role: "assistant", content: reply },
      ];
      setMessages(withAssistant);

      if (payload.done) {
        onComplete({
          summary: String(payload.summary || reply),
          sharingStyles: payload.suggestedAnswers?.sharingStyles || [],
          peopleAskAbout: payload.suggestedAnswers?.peopleAskAbout || "",
          enjoyHelpingWith: payload.suggestedAnswers?.enjoyHelpingWith || "",
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.includes("OPENAI")
            ? "AI isn’t set up yet. Add your OpenAI key, then try again."
            : "We couldn’t continue that reply. Try sending again."
          : "We couldn’t continue that reply. Try sending again.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void send([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend() {
    const text = draft.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setDraft("");
    await send(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-line bg-paper/70 p-3">
        <p className="text-xs font-semibold text-pine">Help me figure it out</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          Short answers are fine. We&apos;ll ask one simple question at a time.
        </p>
      </div>

      <div className="max-h-[320px] space-y-2.5 overflow-y-auto rounded-2xl border border-line bg-surface p-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                message.role === "user"
                  ? "bg-pine text-white"
                  : "border border-line bg-paper text-pine-ink"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading ? (
          <p className="text-xs text-ink-muted">Thinking…</p>
        ) : null}
        <div ref={bottomRef} />
      </div>

      {error ? (
        <div role="alert" className="rounded-2xl border border-[#f0c7c0] bg-[#fef3f2] px-3 py-2.5">
          <p className="text-xs font-semibold text-error">Chat paused</p>
          <p className="mt-0.5 text-xs leading-relaxed text-[#7a271a]">
            {error}
          </p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <input
          className="sp-field__control sp-field__control--plain flex-1"
          placeholder="Type a short answer…"
          value={draft}
          disabled={loading}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void handleSend();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          disabled={loading || !draft.trim()}
          onClick={() => void handleSend()}
        >
          Send
        </Button>
      </div>

      <button
        type="button"
        onClick={onCancel}
        className="text-center text-xs font-semibold text-muted hover:text-ink"
      >
        Back to guided choices
      </button>
    </div>
  );
}
