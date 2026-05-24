"use client";

import { useState } from "react";
import { Check, Loader, Send } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

const TOPICS = [
  { value: "feedback", label: "Product feedback" },
  { value: "privacy", label: "Privacy / data request" },
  { value: "billing", label: "Billing / refund" },
  { value: "partnership", label: "Press / partnership" },
  { value: "legal", label: "Legal / abuse" },
  { value: "other", label: "Something else" },
] as const;

type Topic = (typeof TOPICS)[number]["value"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<Topic>("feedback");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit =
    name.trim().length > 0 &&
    emailValid &&
    message.trim().length >= 10 &&
    state !== "loading";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          topic,
          message: message.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Couldn't send your message. Try again.");
        setState("error");
        return;
      }
      setState("done");
    } catch {
      setError("Network error. Try again.");
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg border border-flag-g-text/30 bg-flag-g-bg p-6">
        <div className="flex items-center gap-2 text-flag-g-text">
          <Check className="h-5 w-5 flex-none" />
          <span className="font-display text-xl font-bold">Message sent</span>
        </div>
        <p className="mt-2 text-sm text-flag-g-text">
          Thanks — we&apos;ve got your message and will reply at{" "}
          <strong>{email.trim().toLowerCase()}</strong> within 2 business days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" htmlFor="contact-name">
          <input
            id="contact-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={state === "loading"}
            placeholder="Priya Sharma"
            className={baseInput}
          />
        </Field>

        <Field label="Email address" htmlFor="contact-email">
          <input
            id="contact-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={state === "loading"}
            placeholder="you@company.com"
            className={baseInput}
          />
        </Field>
      </div>

      <Field label="What's this about?" htmlFor="contact-topic">
        <select
          id="contact-topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value as Topic)}
          disabled={state === "loading"}
          className={baseInput}
        >
          {TOPICS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Your message" htmlFor="contact-message" hint="At least a sentence or two so we can help.">
        <textarea
          id="contact-message"
          required
          rows={6}
          minLength={10}
          maxLength={4000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={state === "loading"}
          placeholder="Tell us what's going on…"
          className={`${baseInput} resize-y`}
        />
        <p className="mt-1 text-right text-[11px] text-navy-mid">
          {message.length} / 4000
        </p>
      </Field>

      <div className="flex flex-col gap-3">
        <button
          type="submit"
          disabled={!canSubmit}
          className="btn-primary w-full sm:w-auto sm:self-start"
        >
          {state === "loading" ? (
            <>
              <Loader className="h-4 w-4 animate-spin" /> Sending…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Send message
            </>
          )}
        </button>
        {error && (
          <p role="alert" className="text-sm text-flag-r-text">
            {error}
          </p>
        )}
        <p className="text-xs text-navy-mid">
          By sending, you agree to be contacted at the email you provide. We
          handle the message under our{" "}
          <a
            href="/privacy"
            className="text-amber underline-offset-2 hover:underline"
          >
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </form>
  );
}

const baseInput =
  "w-full rounded-md border border-ink-22 bg-white px-3 py-2.5 text-sm text-navy placeholder:text-navy-mid focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60";

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-semibold uppercase tracking-[0.08em] text-navy"
      >
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-navy-mid">{hint}</p>}
    </div>
  );
}
