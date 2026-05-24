"use client";

import { useState } from "react";
import { Loader, ShieldCheck } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase";

export default function SignInPrompt({
  redirectNext = "/analyze",
}: {
  /** Where the OAuth callback should bounce the user after sign-in. */
  redirectNext?: string;
}) {
  const [state, setState] = useState<"idle" | "redirecting" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setError(null);
    setState("redirecting");
    try {
      const supabase = supabaseBrowser();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectNext)}`;
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (authError) {
        setError(authError.message);
        setState("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start sign-in.");
      setState("error");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-md border border-ink-12 bg-cream px-4 py-3 text-sm text-navy-mid">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-amber" />
        <div>
          <div className="font-semibold text-navy">
            Sign in to start your free analysis
          </div>
          <div className="mt-1 text-xs">
            We use Google sign-in so your free credit, paid analyses, and PDF
            downloads stay attached to your account — no passwords, no extra
            forms.
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => handleSignIn()}
        disabled={state === "redirecting"}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-22 bg-white px-4 py-3 text-sm font-semibold text-navy transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state === "redirecting" ? (
          <>
            <Loader className="h-4 w-4 animate-spin" /> Redirecting to Google…
          </>
        ) : (
          <>
            <GoogleMark className="h-4 w-4" /> Continue with Google
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="text-center text-xs text-flag-r-text">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.614z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.441 1.346l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  );
}
