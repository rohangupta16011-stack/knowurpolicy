"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type State = "idle" | "loading" | "done" | "error";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.message ?? "Something went wrong. Try again.");
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
      <div className="mt-4 flex items-center gap-2 rounded-md border border-flag-g-text/30 bg-flag-g-bg px-3 py-2.5 text-sm text-flag-g-text">
        <Check className="h-4 w-4 flex-none" />
        You&apos;re on the list. We&apos;ll email you the moment paid analyses go live.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-2">
      <label htmlFor="waitlist-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="waitlist-email"
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={state === "loading"}
          className="flex-1 rounded-md border border-ink-22 bg-white px-3 py-2 text-sm text-navy placeholder:text-navy-mid focus:border-amber focus:outline-none focus:ring-2 focus:ring-amber/30 disabled:opacity-60"
        />
        <button type="submit" disabled={state === "loading"} className="btn-primary">
          {state === "loading" ? "..." : "Notify me"}
        </button>
      </div>
      {error && <p className="text-xs text-flag-r-text">{error}</p>}
    </form>
  );
}
