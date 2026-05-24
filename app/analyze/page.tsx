"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  CircleX,
  ClipboardList,
  Clock,
  CloudUpload,
  Download,
  FileText,
  Loader,
  MessageCircle,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import LegalDisclaimer from "@/components/LegalDisclaimer";
import Nav from "@/components/Nav";
import PaymentButton from "@/components/PaymentButton";
import QAPanel from "@/components/QAPanel";
import SignInPrompt from "@/components/SignInPrompt";
import { isSupabaseBrowserConfigured, supabaseBrowser } from "@/lib/supabase";
import type { PricingTier } from "@/lib/pricing";
import type { AnalysisResult, ClauseItem } from "@/lib/types";

type AuthState =
  | { kind: "loading" }
  | { kind: "signed_out" }
  | { kind: "signed_in"; email: string }
  | { kind: "skipped" }; // Supabase not configured — degraded mode, no auth gate

type Stage =
  | { kind: "idle" }
  | { kind: "selected"; file: File }
  | { kind: "processing"; stageIndex: number }
  | { kind: "error"; message: string }
  | { kind: "payment_required"; file: File; message: string }
  | {
      kind: "done";
      analysis: AnalysisResult;
      filename: string;
      // Held in client state only — server never persists post-analysis (PRD §6.6).
      // Sent back with each Q&A request so the server can answer without storage.
      documentText: string;
      pricing: PricingTier;
    };

const MAX_BYTES = 10 * 1024 * 1024;

const PROCESSING_STAGES = [
  "Reading your document",
  "Identifying key clauses",
  "Flagging risks",
  "Building your plain English summary",
];

// Minimal email validator — server is authoritative, this just blocks the
// most obvious typos before round-tripping.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  // Email survives across re-analyses (user enters once, keeps going).
  // When signed in via Google, this is auto-populated from the profile and
  // the manual email input is hidden in UploadView.
  const [email, setEmail] = useState("");

  const supabaseConfigured = isSupabaseBrowserConfigured();
  const [auth, setAuth] = useState<AuthState>(
    supabaseConfigured ? { kind: "loading" } : { kind: "skipped" },
  );

  // Watch Supabase auth state. When signed in, mirror the Google profile
  // email into the page state so the rest of the flow (analysis, payment,
  // Q&A) keys off the verified identity instead of a manual entry.
  useEffect(() => {
    if (!supabaseConfigured) return;
    const supabase = supabaseBrowser();
    let cancelled = false;

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      const userEmail = data.user?.email;
      if (userEmail) {
        setAuth({ kind: "signed_in", email: userEmail });
        setEmail(userEmail);
      } else {
        setAuth({ kind: "signed_out" });
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const userEmail = session?.user?.email;
      if (userEmail) {
        setAuth({ kind: "signed_in", email: userEmail });
        setEmail(userEmail);
      } else {
        setAuth({ kind: "signed_out" });
      }
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [supabaseConfigured]);

  async function handleSignOut() {
    if (!supabaseConfigured) return;
    try {
      await supabaseBrowser().auth.signOut();
      // Reset client state so the next user doesn't inherit anything.
      setEmail("");
      setStage({ kind: "idle" });
    } catch (e) {
      console.error("Sign-out failed", e);
    }
  }

  function pickFile(file: File | null) {
    if (!file) return;
    // Accept anything ending in .pdf (case-insensitive) regardless of MIME,
    // because cloud-storage / email attachments often arrive with
    // application/octet-stream or empty type. If extension is missing, fall
    // back to MIME containing "pdf". Real non-PDFs will fail cleanly later
    // in the extraction step with a clearer error.
    const filename = file.name.toLowerCase();
    const mime = (file.type || "").toLowerCase();
    const looksLikePdf = filename.endsWith(".pdf") || mime.includes("pdf");
    if (!looksLikePdf) {
      setStage({ kind: "error", message: "Only PDF files are supported right now." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage({ kind: "error", message: "File is too large. Please upload a PDF under 10MB." });
      return;
    }
    setStage({ kind: "selected", file });
  }

  const emailValid = EMAIL_RE.test(email.trim());

  // Accepts an explicit file so the retry-after-payment flow can re-trigger
  // analysis without depending on the current stage.
  //
  // IMPORTANT: defensively check that fileOverride is actually a File. When
  // this was wired as `onClick={onAnalyse}` React was passing the synthetic
  // click event as the first argument, which is truthy and was being treated
  // as the file — FormData then stringified the event to "[object Object]"
  // and the server rejected the upload.
  async function analyse(fileOverride?: File) {
    const overrideFile =
      fileOverride instanceof File ? fileOverride : undefined;
    const file =
      overrideFile ??
      (stage.kind === "selected"
        ? stage.file
        : stage.kind === "payment_required"
          ? stage.file
          : null);
    if (!file || !emailValid) return;

    setStage({ kind: "processing", stageIndex: 0 });
    const interval = window.setInterval(() => {
      setStage((s) => {
        if (s.kind !== "processing") return s;
        if (s.stageIndex >= PROCESSING_STAGES.length - 1) return s;
        return { kind: "processing", stageIndex: s.stageIndex + 1 };
      });
    }, 6000);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("email", email.trim().toLowerCase());
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = (await res.json()) as
        | { analysis: AnalysisResult; documentText: string; pricing: PricingTier }
        | { error: string; message: string };

      // 402 from the freemium gate — user has used their free analysis
      // and has no paid credits. Surface a dedicated payment flow.
      if (res.status === 402 && "error" in data) {
        setStage({ kind: "payment_required", file, message: data.message });
        return;
      }

      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.message : "Something went wrong. Please try again.";
        setStage({ kind: "error", message: msg });
        return;
      }
      setStage({
        kind: "done",
        analysis: data.analysis,
        filename: file.name,
        documentText: data.documentText,
        pricing: data.pricing,
      });
    } catch {
      setStage({ kind: "error", message: "Something went wrong. Please try again." });
    } finally {
      window.clearInterval(interval);
    }
  }

  const currentStep =
    stage.kind === "idle" || stage.kind === "selected" || stage.kind === "error"
      ? 1
      : stage.kind === "processing"
        ? 2
        : 3;

  // Auth gate — only renders the upload flow once signed in (or when
  // Supabase isn't configured, falling back to manual-email mode).
  if (auth.kind === "loading") {
    return (
      <>
        <Nav />
        <main className="mx-auto flex max-w-3xl items-center justify-center px-6 py-24">
          <Loader className="h-5 w-5 animate-spin text-amber" />
        </main>
      </>
    );
  }

  if (auth.kind === "signed_out") {
    return (
      <>
        <Nav />
        <main className="mx-auto max-w-md px-6 pb-32 pt-8">
          <StepIndicator current={1} />
          <header className="mt-2">
            <h1 className="font-display text-3xl font-bold text-navy">
              Understand what you&apos;re signing
            </h1>
            <p className="mt-1.5 text-sm text-navy-mid">
              Upload any policy, contract, or legal document and get a
              plain-English breakdown in 30 seconds. Your first analysis is on
              us.
            </p>
          </header>
          <div className="mt-7">
            <SignInPrompt redirectNext="/analyze" />
          </div>
        </main>
        <LegalDisclaimer />
      </>
    );
  }

  const signedIn = auth.kind === "signed_in";

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-3xl px-6 pb-32 pt-8">
        {signedIn && (
          <div className="mb-4 flex items-center justify-end gap-3 text-xs text-navy-mid">
            <span>
              Signed in as <strong className="text-navy">{auth.email}</strong>
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-medium text-amber hover:underline"
            >
              Sign out
            </button>
          </div>
        )}

        <StepIndicator current={currentStep} />

        {stage.kind === "idle" || stage.kind === "selected" || stage.kind === "error" ? (
          <UploadView
            stage={stage}
            email={email}
            emailValid={emailValid}
            emailLocked={signedIn}
            onEmailChange={setEmail}
            onPick={pickFile}
            onAnalyse={analyse}
            onReset={() => setStage({ kind: "idle" })}
          />
        ) : null}

        {stage.kind === "processing" && <ProcessingView stageIndex={stage.stageIndex} />}

        {stage.kind === "payment_required" && (
          <PaymentRequiredView
            file={stage.file}
            message={stage.message}
            email={email}
            onPaid={() => analyse(stage.file)}
            onReset={() => setStage({ kind: "idle" })}
          />
        )}

        {stage.kind === "done" && (
          <ResultsView
            analysis={stage.analysis}
            filename={stage.filename}
            documentText={stage.documentText}
            email={email}
            pricing={stage.pricing}
            onReset={() => setStage({ kind: "idle" })}
          />
        )}
      </main>

      <LegalDisclaimer />
    </>
  );
}

function StepIndicator({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: "Upload" },
    { n: 2, label: "Analyse" },
    { n: 3, label: "Understand" },
  ];
  return (
    <ol className="mb-8 flex items-center justify-center gap-2 sm:gap-3" aria-label="Progress">
      {steps.map((step, i) => {
        // Step 3 is the terminal step — once we're on it, the analysis is done.
        // Treat it as completed (✓) so the stepper doesn't read as "still loading".
        const isComplete = step.n < current || (step.n === 3 && current === 3);
        const isCurrent = step.n === current && !isComplete;

        return (
          <li key={step.n} className="flex items-center gap-2 sm:gap-3">
            <span
              aria-current={step.n === current ? "step" : undefined}
              className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-semibold transition ${
                isComplete
                  ? "bg-amber text-white"
                  : isCurrent
                    ? "bg-amber text-white ring-4 ring-amber/20"
                    : "bg-ink-12 text-navy-mid"
              }`}
            >
              {isComplete ? <Check className="h-3.5 w-3.5" /> : step.n}
            </span>
            <span
              className={`text-xs font-semibold ${
                isCurrent || isComplete ? "text-navy" : "text-navy-mid"
              }`}
            >
              {step.label}
            </span>
            {i < steps.length - 1 && (
              <span
                className={`hidden h-px w-10 sm:block ${
                  step.n < current ? "bg-amber" : "bg-ink-12"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function UploadView({
  stage,
  email,
  emailValid,
  emailLocked,
  onEmailChange,
  onPick,
  onAnalyse,
  onReset,
}: {
  stage: Stage;
  email: string;
  emailValid: boolean;
  /** True when the email is sourced from the auth session (Google profile)
   *  and the user shouldn't be editing it. Hides the email input. */
  emailLocked: boolean;
  onEmailChange: (v: string) => void;
  onPick: (f: File | null) => void;
  onAnalyse: () => void;
  onReset: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const selected = stage.kind === "selected" ? stage.file : null;
  const error = stage.kind === "error" ? stage.message : null;
  const emailHasError = emailTouched && email.length > 0 && !emailValid;
  const canSubmit = emailValid && selected !== null;

  return (
    <section>
      <header>
        <h1 className="font-display text-3xl font-bold text-navy">
          Upload any document
        </h1>
        <p className="mt-1.5 text-sm text-navy-mid">
          Insurance policy, lease, employment or freelance contract, terms of
          service, NDA, EULA — anything binding you didn&apos;t write.
        </p>
      </header>

      {/* Email gate — when signed in, the email is supplied by the auth
          session and the manual input is hidden. When Supabase isn't
          configured (degraded mode) the input falls back to the original
          manual entry. */}
      {!emailLocked && (
        <div className="mt-6">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-[0.08em] text-navy"
          >
            Your email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            aria-invalid={emailHasError}
            aria-describedby="email-help"
            className={`mt-1.5 w-full rounded-md border bg-white px-3 py-2.5 text-sm text-navy placeholder:text-navy-mid focus:outline-none focus:ring-2 ${
              emailHasError
                ? "border-flag-r-text focus:border-flag-r-text focus:ring-flag-r-text/30"
                : "border-ink-22 focus:border-amber focus:ring-amber/30"
            }`}
          />
          <p id="email-help" className="mt-1.5 text-xs text-navy-mid">
            {emailHasError
              ? "Please enter a valid email address."
              : "We use this to give you 1 free analysis. No spam."}
          </p>
        </div>
      )}

      <label
        htmlFor="pdf"
        className={`mt-7 block cursor-pointer rounded-lg border-2 border-dashed bg-cream p-10 text-center transition ${
          isDragging
            ? "border-amber bg-amber-soft"
            : "border-ink-22 hover:border-amber"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          onPick(e.dataTransfer.files[0] ?? null);
        }}
      >
        <input
          id="pdf"
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
        <CloudUpload className="mx-auto h-9 w-9 text-amber" />
        <div className="mt-3 text-sm font-semibold text-navy">
          Drag and drop your PDF here
        </div>
        <div className="mt-1 text-xs text-navy-mid">
          or{" "}
          <span className="font-semibold text-amber underline-offset-2 hover:underline">
            click to browse
          </span>{" "}
          — PDF only, max 10MB
        </div>
      </label>

      <p className="mt-3 text-center text-xs text-navy-mid">
        You&apos;ll get a clause-by-clause breakdown like{" "}
        <Link
          href="/#sample"
          className="font-semibold text-amber underline-offset-2 hover:underline"
        >
          this sample ↓
        </Link>
      </p>

      {selected && (
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-ink-12 bg-white px-4 py-3">
          <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-amber-soft text-[10px] font-bold text-amber">
            PDF
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <div className="truncate font-semibold text-navy">{selected.name}</div>
            <div className="text-xs text-navy-mid">
              {(selected.size / 1024 / 1024).toFixed(2)} MB · Ready
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-3 rounded-lg border border-flag-r-text/30 bg-flag-r-bg px-4 py-3 text-sm text-flag-r-text"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 flex-none" />
          <div className="flex-1">{error}</div>
          {stage.kind === "error" && (
            <button
              onClick={onReset}
              className="font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          )}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2.5 rounded-md border border-flag-g-text/30 bg-flag-g-bg px-3.5 py-3 text-xs leading-relaxed text-flag-g-text">
        <ShieldCheck className="mt-0.5 h-4 w-4 flex-none" />
        <div>
          <strong className="font-semibold">Your document is safe.</strong> It
          is analysed and immediately deleted. We never store your files, never
          share them, and never use them to train AI models. GDPR compliant.
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => onAnalyse()}
          className="btn-primary w-full text-base"
        >
          {!emailValid && !selected
            ? "Enter email and select a file"
            : !emailValid
              ? "Enter your email to continue"
              : !selected
                ? "Select a file to continue"
                : "Analyse this document →"}
        </button>
        {canSubmit && (
          <p className="text-center text-xs text-navy-mid">Takes ~30 seconds</p>
        )}
      </div>
    </section>
  );
}

function ProcessingView({ stageIndex }: { stageIndex: number }) {
  return (
    <section className="flex min-h-[55vh] flex-col items-center justify-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-soft">
        <Loader className="h-6 w-6 animate-spin text-amber" />
      </div>

      <ol className="mt-8 w-full max-w-md space-y-2" aria-live="polite">
        {PROCESSING_STAGES.map((label, i) => {
          const done = i < stageIndex;
          const current = i === stageIndex;
          return (
            <li
              key={label}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm transition ${
                current
                  ? "border-amber bg-white font-semibold text-navy"
                  : done
                    ? "border-transparent bg-transparent text-navy-mid"
                    : "border-transparent bg-transparent text-navy-mid/60"
              }`}
            >
              <span
                className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-flag-g-text text-white"
                    : current
                      ? "bg-amber text-white"
                      : "border border-ink-22 text-navy-mid/60"
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span>{label}</span>
              {current && (
                <Loader className="ml-auto h-3.5 w-3.5 animate-spin text-amber" />
              )}
            </li>
          );
        })}
      </ol>

      <p className="mt-6 text-center text-xs text-navy-mid">
        Larger documents can take up to a minute. Hold tight.
      </p>
    </section>
  );
}

function PaymentRequiredView({
  file,
  message,
  email,
  onPaid,
  onReset,
}: {
  file: File;
  message: string;
  email: string;
  onPaid: () => void;
  onReset: () => void;
}) {
  return (
    <section className="mx-auto max-w-md">
      <div className="rounded-lg border border-amber bg-amber-soft/40 p-6">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
          Free analysis used
        </div>
        <p className="mt-2 font-display text-xl font-bold text-navy">
          {message}
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-md border border-ink-12 bg-white px-3 py-2.5 text-sm">
          <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-amber-soft text-[10px] font-bold text-amber">
            PDF
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold text-navy">{file.name}</div>
            <div className="text-xs text-navy-mid">
              {(file.size / 1024 / 1024).toFixed(2)} MB · ready to analyse
            </div>
          </div>
        </div>

        <div className="mt-5">
          <PaymentButton
            email={email}
            label="Pay & analyse"
            onSuccess={onPaid}
          />
        </div>

        <p className="mt-4 text-center text-xs text-navy-mid">
          Region-aware price · Razorpay handles the payment
        </p>
      </div>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-navy-mid hover:text-navy"
        >
          ← Start over
        </button>
      </div>
    </section>
  );
}

function ResultsView({
  analysis,
  filename,
  documentText,
  email,
  pricing,
  onReset,
}: {
  analysis: AnalysisResult;
  filename: string;
  documentText: string;
  email: string;
  pricing: PricingTier;
  onReset: () => void;
}) {
  const [qaOpen, setQaOpen] = useState(false);

  // Red-flag count drives the "What next?" hook copy. Sourced from the two
  // sections that carry red-flagged items.
  const redCount = analysis.not_covered.length + analysis.watch_list.length;

  return (
    <section className="space-y-6">
      {/* Document header — filename moved out of the nav so the nav can carry
          its standard menu items. */}
      <header className="border-b border-ink-12 pb-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <FileText className="h-4 w-4 flex-none text-amber" />
          <span className="truncate">{filename}</span>
        </div>
      </header>

      <ComplexityCard score={analysis.plain_english_score} />

      {/* Plain English summary */}
      <div className="rounded-lg border border-ink-12 bg-white p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
          Plain English summary
        </div>
        <p className="mt-2 text-base leading-relaxed text-navy">
          {analysis.summary}
        </p>
      </div>

      {/* Section order per UX-audit P0: positive baseline first, then risks.
          Each section is now in preview mode — one sample item visible, the
          rest paywalled behind the PDF download. */}
      <AccordionSection
        icon={<CircleCheck className="h-4 w-4 text-flag-g-text" />}
        title="What's covered"
        subtitle="What the document grants or includes."
        tone="green"
        items={analysis.covered}
        previewCount={1}
      />

      <AccordionSection
        icon={<CircleX className="h-4 w-4 text-flag-r-text" />}
        title="What's NOT covered"
        subtitle="Exclusions, gaps, and topics not addressed in this document."
        tone="red"
        items={analysis.not_covered}
        previewCount={1}
      />

      {analysis.watch_list.length > 0 && (
        <AccordionSection
          icon={<TriangleAlert className="h-4 w-4 text-flag-r-text" />}
          title="Watch list"
          subtitle="Unusual or restrictive clauses — read carefully."
          tone="red"
          items={analysis.watch_list}
          previewCount={1}
        />
      )}

      <AccordionSection
        icon={<Clock className="h-4 w-4 text-flag-y-text" />}
        title="Deadlines & limits"
        subtitle="Time windows, caps, and notice periods."
        tone="yellow"
        items={analysis.deadlines_and_limits}
        previewCount={1}
      />

      <AccordionSection
        icon={<ClipboardList className="h-4 w-4 text-flag-y-text" />}
        title="Your obligations"
        subtitle="What you must do to keep the agreement valid."
        tone="yellow"
        items={analysis.your_obligations}
        previewCount={1}
      />

      <NextStepsBar
        redCount={redCount}
        email={email}
        analysis={analysis}
        filename={filename}
        documentText={documentText}
        pricing={pricing}
        onAsk={() => setQaOpen(true)}
        onReset={onReset}
      />

      <QAPanel
        open={qaOpen}
        onClose={() => setQaOpen(false)}
        documentText={documentText}
        email={email}
        pricing={pricing}
      />
    </section>
  );
}

function ComplexityCard({
  score,
}: {
  score: AnalysisResult["plain_english_score"];
}) {
  const palette = (() => {
    switch (score.label) {
      case "Easy":
        return {
          chip: "bg-flag-g-bg text-flag-g-text",
          accent: "text-flag-g-text",
          border: "border-flag-g-text/30",
        };
      case "Moderate":
        return {
          chip: "bg-flag-y-bg text-flag-y-text",
          accent: "text-flag-y-text",
          border: "border-flag-y-border/40",
        };
      case "Complex":
      case "Very Complex":
        return {
          chip: "bg-flag-r-bg text-flag-r-text",
          accent: "text-flag-r-text",
          border: "border-flag-r-text/30",
        };
    }
  })();

  return (
    <div className={`flex items-center gap-5 rounded-lg border ${palette.border} bg-white p-5`}>
      <div className="flex-none text-center">
        <div className={`font-display text-5xl font-bold leading-none ${palette.accent}`}>
          {score.score}
        </div>
        <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-navy-mid">
          / 100
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
          Complexity
        </div>
        <div className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${palette.chip}`}>
          {score.label}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-navy">{score.note}</p>
      </div>
    </div>
  );
}

function NextStepsBar({
  redCount,
  email,
  analysis,
  filename,
  documentText,
  pricing,
  onAsk,
  onReset,
}: {
  redCount: number;
  email: string;
  analysis: AnalysisResult;
  filename: string;
  documentText: string;
  pricing: PricingTier;
  onAsk: () => void;
  onReset: () => void;
}) {
  const hook =
    redCount === 0
      ? "Document looks standard. Get the full report to read every clause."
      : `You have ${redCount} item${redCount === 1 ? "" : "s"} worth a closer look. Get the full report to read every clause.`;

  return (
    <div className="mt-8 rounded-lg border border-ink-12 bg-white p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
        What next?
      </div>
      <p className="mt-2 text-lg font-display font-bold text-navy">{hook}</p>

      {/* Primary — download the full report (now that on-screen view is a preview) */}
      <DownloadCard
        email={email}
        analysis={analysis}
        filename={filename}
        pricing={pricing}
      />

      {/* Secondary — Q&A. Still works against the full document text, just
          presented after the main download CTA. */}
      <button
        type="button"
        onClick={onAsk}
        className="btn-secondary mt-5 w-full !py-3.5 text-base"
      >
        <MessageCircle className="h-4 w-4" />
        Or ask a question about this document
      </button>
      <p className="mt-1.5 text-center text-xs text-navy-mid">
        Answers come strictly from the document — no general knowledge.
      </p>

      {/* Secondary — buy another analysis via Razorpay. Only the user's
          region price is shown (detected server-side from the edge); the
          full price grid lives on /terms for the legal record. */}
      <div className="mt-5 rounded-lg border-2 border-amber bg-amber-soft/40 p-4">
        <div className="text-sm font-semibold text-navy">
          Got another document?
        </div>
        <p className="mt-1 text-sm text-navy-mid">
          Your first analysis is free. Each additional analysis is{" "}
          <strong className="text-navy">{pricing.perDocDisplay}</strong>,
          charged in {pricing.currency}.
        </p>
        <div className="mt-4">
          <PaymentButton
            email={email}
            label={`Buy another analysis · ${pricing.perDocDisplay}`}
          />
        </div>
      </div>

      {/* Tertiary — analyse another, text link */}
      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-navy-mid hover:text-navy"
        >
          ← Analyse another document
        </button>
      </div>
    </div>
  );
}

/**
 * Pay-and-download card. Uses PaymentButton with product="download" so the
 * region-aware lower price is charged. On success, the verify endpoint
 * returns a short-lived signed token; we immediately POST it (with the
 * analysis JSON + filename) to /api/download/pdf and trigger a file save.
 *
 * No sign-in gate — payment alone authorises the download via the signed
 * HMAC token issued by /api/payment/verify.
 */
function DownloadCard({
  email,
  analysis,
  filename,
  pricing,
}: {
  email: string;
  analysis: AnalysisResult;
  filename: string;
  pricing: PricingTier;
}) {
  type DownloadState =
    | { kind: "ready" }
    | { kind: "downloading" }
    | { kind: "done" }
    | { kind: "error"; message: string };

  const [state, setState] = useState<DownloadState>({ kind: "ready" });

  async function fetchAndSavePdf(token: string) {
    setState({ kind: "downloading" });
    try {
      const res = await fetch("/api/download/pdf", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, analysis, filename }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        setState({
          kind: "error",
          message:
            errBody.message ?? "Couldn't generate the PDF. Please try again.",
        });
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const base = filename.replace(/\.pdf$/i, "");
      a.download = `${base} — KnowUrPolicy.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setState({ kind: "done" });
    } catch (e) {
      setState({
        kind: "error",
        message:
          e instanceof Error ? e.message : "Couldn't generate the PDF.",
      });
    }
  }

  return (
    <div className="mt-5 rounded-lg border border-ink-12 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-amber-soft text-amber">
          <Download className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-semibold text-navy">
            Read the full analysis
          </div>
          <div className="text-xs text-navy-mid">
            On-screen view above is a preview. The PDF has every clause, every
            risk, and every deadline — save, print, or share it with a
            partner / lawyer.
          </div>
        </div>
      </div>

      <div className="mt-4">
        {state.kind === "downloading" && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-ink-12 bg-cream px-3 py-2.5 text-sm text-navy">
            <Loader className="h-4 w-4 animate-spin text-amber" />
            Generating your PDF…
          </div>
        )}

        {state.kind === "done" && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-flag-g-text/30 bg-flag-g-bg px-3 py-2.5 text-sm font-semibold text-flag-g-text">
            <Check className="h-4 w-4 flex-none" /> Download started — check
            your browser&apos;s downloads folder
          </div>
        )}

        {state.kind === "error" && (
          <div className="space-y-2">
            <div
              role="alert"
              className="rounded-md border border-flag-r-text/30 bg-flag-r-bg px-3 py-2 text-xs text-flag-r-text"
            >
              {state.message}
            </div>
            <PaymentButton
              email={email}
              product="download"
              label={`Pay ${pricing.downloadPerDocDisplay} & download`}
              successHidden
              onSuccess={(res) => {
                if (res.downloadToken) fetchAndSavePdf(res.downloadToken);
              }}
            />
          </div>
        )}

        {state.kind === "ready" && (
          <PaymentButton
            email={email}
            product="download"
            label={`Pay ${pricing.downloadPerDocDisplay} & download`}
            successHidden
            onSuccess={(res) => {
              if (res.downloadToken) fetchAndSavePdf(res.downloadToken);
            }}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Accordion section per design doc screen 3.
 * Default state: expanded on desktop, collapsed on mobile (PRD §6.3.3).
 * `forceOpen` overrides (used for Watch List, always expanded).
 */
function AccordionSection({
  icon,
  title,
  subtitle,
  tone,
  items,
  forceOpen = false,
  previewCount,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tone: "green" | "yellow" | "red";
  items: ClauseItem[];
  forceOpen?: boolean;
  /** When set, render in preview mode: always open, show only this many items,
   *  and append a "download full PDF" nudge. */
  previewCount?: number;
}) {
  const [isDesktop, setIsDesktop] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const headerBg = {
    green: "bg-white",
    yellow: "bg-white",
    red: "bg-flag-r-bg",
  }[tone];

  const countChip = {
    green: "bg-flag-g-bg text-flag-g-text border-flag-g-text/30",
    yellow: "bg-flag-y-bg text-flag-y-text border-flag-y-border/40",
    red: "bg-flag-r-bg text-flag-r-text border-flag-r-text/30",
  }[tone];

  const inPreviewMode = typeof previewCount === "number";
  const initiallyOpen = inPreviewMode || forceOpen || isDesktop;
  const visibleItems = inPreviewMode ? items.slice(0, previewCount) : items;
  const hiddenCount = inPreviewMode ? Math.max(0, items.length - previewCount) : 0;

  if (items.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-ink-12 bg-white">
        <div className={`flex items-center justify-between px-4 py-3 ${headerBg}`}>
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            {icon}
            {title}
          </div>
          <span className="text-xs font-medium text-navy-mid">none</span>
        </div>
      </div>
    );
  }

  // In preview mode, render a static expanded card (no <details> toggle) and
  // append a "download for the rest" nudge below the visible items.
  if (inPreviewMode) {
    return (
      <div className="overflow-hidden rounded-lg border border-ink-12 bg-white">
        <div className={`flex items-center justify-between px-4 py-3 ${headerBg}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              {icon}
              {title}
              <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${countChip}`}>
                {items.length} {items.length === 1 ? "item" : "items"}
              </span>
            </div>
            {subtitle && (
              <div className="mt-0.5 ml-6 text-[11px] text-navy-mid">
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <ul className="space-y-2 bg-cream p-3">
          {visibleItems.map((item, i) => (
            <ClauseListItem key={i} item={item} tone={tone} />
          ))}
        </ul>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => {
              document
                .getElementById("download-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            }}
            className="flex w-full items-center justify-between border-t border-ink-12 bg-amber-soft/60 px-4 py-3 text-left text-xs font-semibold text-navy transition hover:bg-amber-soft"
          >
            <span>
              + {hiddenCount} more {hiddenCount === 1 ? "item" : "items"} —
              read in the full PDF
            </span>
            <span className="text-amber">Download →</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <details
      key={`${title}-${initiallyOpen}`}
      open={initiallyOpen}
      className="group overflow-hidden rounded-lg border border-ink-12 bg-white"
    >
      <summary
        className={`flex cursor-pointer list-none items-center justify-between px-4 py-3 transition hover:brightness-95 ${headerBg}`}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy">
            {icon}
            {title}
            <span className={`ml-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${countChip}`}>
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          {subtitle && (
            <div className="mt-0.5 ml-6 text-[11px] text-navy-mid">
              {subtitle}
            </div>
          )}
        </div>
        <ChevronDown className="h-4 w-4 flex-none text-navy-mid transition group-open:rotate-180" />
      </summary>
      <ul className="space-y-2 bg-cream p-3">
        {items.map((item, i) => (
          <ClauseListItem key={i} item={item} tone={tone} />
        ))}
      </ul>
    </details>
  );
}

function ClauseListItem({
  item,
  tone,
}: {
  item: ClauseItem;
  tone: "green" | "yellow" | "red";
}) {
  const stripeColor = {
    green: "bg-flag-g-text",
    yellow: "bg-flag-y-border",
    red: "bg-flag-r-text",
  }[tone];

  const flagClass = { green: "flag-g", yellow: "flag-y", red: "flag-r" }[tone];
  const flagLabel = { green: "Standard", yellow: "Watch", red: "Red flag" }[tone];

  // Consistent circle-family icons across all three severities per UX-audit P2.
  // Was previously mixing CircleCheck / AlertTriangle / OctagonAlert.
  const FlagIcon = {
    green: CircleCheck,
    yellow: CircleAlert,
    red: CircleX,
  }[tone];

  return (
    <li className="overflow-hidden rounded-lg border border-ink-12 bg-white">
      <div className="flex items-stretch">
        <div className={`w-1 flex-none ${stripeColor}`} />
        <div className="flex-1 p-3.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-navy">{item.title}</span>
            <span className={`flag ${flagClass} text-[10px]`}>
              <FlagIcon className="h-3 w-3" />
              {flagLabel}
            </span>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-navy-mid">
            {item.explanation}
          </p>
        </div>
      </div>
    </li>
  );
}
