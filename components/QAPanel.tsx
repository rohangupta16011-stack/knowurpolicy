"use client";

import { useEffect, useRef, useState } from "react";
import { Loader, MessageCircle, Send, X } from "lucide-react";

type QAState =
  | { kind: "idle" }
  | { kind: "loading"; question: string }
  | { kind: "answered"; question: string; answer: string }
  | { kind: "error"; question: string; message: string };

/**
 * Side-drawer Q&A panel. Document text stays in client memory and is sent
 * back with every question — server doesn't persist anything (PRD §6.6).
 *
 * Per PRD §6.4 the conversation is ephemeral: showing the prior Q + A is
 * useful within a single open-panel session, but we don't keep history
 * across panel reopens.
 */
export default function QAPanel({
  open,
  onClose,
  documentText,
}: {
  open: boolean;
  onClose: () => void;
  documentText: string;
}) {
  const [state, setState] = useState<QAState>({ kind: "idle" });
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the input when the panel opens
  useEffect(() => {
    if (open && state.kind === "idle") {
      // Slight delay so the panel finishes transitioning in before focus
      const t = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(t);
    }
  }, [open, state.kind]);

  // Esc closes the panel
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = draft.trim();
    if (!question) return;

    setState({ kind: "loading", question });
    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ documentText, question }),
      });
      const data = (await res.json()) as
        | { answer: string }
        | { error: string; message: string };

      if (!res.ok || !("answer" in data)) {
        const msg =
          "message" in data ? data.message : "Something went wrong. Please try again.";
        setState({ kind: "error", question, message: msg });
        return;
      }
      setState({ kind: "answered", question, answer: data.answer });
      setDraft("");
    } catch {
      setState({ kind: "error", question, message: "Network error. Try again." });
    }
  }

  function reset() {
    setState({ kind: "idle" });
    setDraft("");
    window.setTimeout(() => inputRef.current?.focus(), 50);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden={!open}
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-navy/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel — full-width bottom sheet on mobile, right drawer on md+ */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Ask a question about this document"
        className={`fixed bottom-0 left-0 right-0 z-50 flex h-[85vh] flex-col bg-white shadow-2xl transition-transform md:left-auto md:top-0 md:h-screen md:w-[460px] ${
          open
            ? "translate-y-0 md:translate-x-0"
            : "translate-y-full md:translate-y-0 md:translate-x-full"
        }`}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-3 border-b border-ink-12 px-5 py-4">
          <div>
            <div className="flex items-center gap-2 text-amber">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.12em]">
                Ask anything
              </span>
            </div>
            <h2 className="mt-1 font-display text-xl font-bold text-navy">
              About this document
            </h2>
            <p className="mt-1 text-xs text-navy-mid">
              Answers come strictly from the document you uploaded.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-navy-mid hover:bg-cream hover:text-navy"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {state.kind === "idle" && <SuggestionList onPick={setDraft} />}

          {state.kind === "loading" && (
            <Bubble role="user">{state.question}</Bubble>
          )}
          {state.kind === "loading" && (
            <div className="mt-3 flex items-center gap-2 text-sm text-navy-mid">
              <Loader className="h-4 w-4 animate-spin text-amber" />
              Searching the document…
            </div>
          )}

          {state.kind === "answered" && (
            <>
              <Bubble role="user">{state.question}</Bubble>
              <Bubble role="assistant">{state.answer}</Bubble>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-sm font-semibold text-amber hover:underline"
              >
                Ask another question
              </button>
            </>
          )}

          {state.kind === "error" && (
            <>
              <Bubble role="user">{state.question}</Bubble>
              <div
                role="alert"
                className="mt-3 rounded-md border border-flag-r-text/30 bg-flag-r-bg px-3 py-2 text-sm text-flag-r-text"
              >
                {state.message}
              </div>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-sm font-semibold text-amber hover:underline"
              >
                Try again
              </button>
            </>
          )}
        </div>

        {/* Composer — hidden when an answer is shown (use the buttons above to reset) */}
        {(state.kind === "idle" || state.kind === "loading") && (
          <form
            onSubmit={ask}
            className="border-t border-ink-12 bg-cream/60 px-5 py-4"
          >
            <label htmlFor="qa-input" className="sr-only">
              Your question
            </label>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                id="qa-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    ask(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="e.g. What happens if I cancel early?"
                rows={2}
                disabled={state.kind === "loading"}
                className="flex-1 resize-none rounded-md border border-ink-22 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy-mid focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!draft.trim() || state.kind === "loading"}
                className="btn-primary !py-2 !px-3"
                aria-label="Send question"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-navy-mid">
              Press Enter to send · Shift+Enter for a new line
            </p>
          </form>
        )}
      </aside>
    </>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  if (role === "user") {
    return (
      <div className="mb-3 flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-amber px-4 py-2.5 text-sm text-white">
          {children}
        </div>
      </div>
    );
  }
  return (
    <div className="mb-3 flex">
      <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-ink-12 bg-cream px-4 py-2.5 text-sm leading-relaxed text-navy">
        {children}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "What happens if I cancel?",
  "What are the deadlines I need to remember?",
  "Are there any hidden fees?",
  "What am I responsible for?",
];

function SuggestionList({ onPick }: { onPick: (s: string) => void }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
        Try asking
      </div>
      <ul className="mt-3 space-y-2">
        {SUGGESTIONS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="w-full rounded-md border border-ink-12 bg-white px-3 py-2 text-left text-sm text-navy hover:border-amber hover:bg-amber-soft"
            >
              {s}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
