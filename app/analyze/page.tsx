"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
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
import QAPanel from "@/components/QAPanel";
import type { AnalysisResult, ClauseItem } from "@/lib/types";

type Stage =
  | { kind: "idle" }
  | { kind: "selected"; file: File }
  | { kind: "processing"; stageIndex: number }
  | { kind: "error"; message: string }
  | {
      kind: "done";
      analysis: AnalysisResult;
      filename: string;
      // Held in client state only — server never persists post-analysis (PRD §6.6).
      // Sent back with each Q&A request so the server can answer without storage.
      documentText: string;
    };

const MAX_BYTES = 10 * 1024 * 1024;

const PROCESSING_STAGES = [
  "Reading your document",
  "Identifying key clauses",
  "Flagging risks",
  "Building your plain English summary",
];

export default function AnalyzePage() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  function pickFile(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStage({ kind: "error", message: "Only PDF files are supported right now." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage({ kind: "error", message: "File is too large. Please upload a PDF under 10MB." });
      return;
    }
    setStage({ kind: "selected", file });
  }

  async function analyse() {
    if (stage.kind !== "selected") return;
    const file = stage.file;

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
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = (await res.json()) as
        | { analysis: AnalysisResult; documentText: string }
        | { error: string; message: string };

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

  return (
    <>
      <Nav />

      <main className="mx-auto max-w-3xl px-6 pb-32 pt-8">
        <StepIndicator current={currentStep} />

        {stage.kind === "idle" || stage.kind === "selected" || stage.kind === "error" ? (
          <UploadView
            stage={stage}
            onPick={pickFile}
            onAnalyse={analyse}
            onReset={() => setStage({ kind: "idle" })}
          />
        ) : null}

        {stage.kind === "processing" && <ProcessingView stageIndex={stage.stageIndex} />}

        {stage.kind === "done" && (
          <ResultsView
            analysis={stage.analysis}
            filename={stage.filename}
            documentText={stage.documentText}
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
  onPick,
  onAnalyse,
  onReset,
}: {
  stage: Stage;
  onPick: (f: File | null) => void;
  onAnalyse: () => void;
  onReset: () => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const selected = stage.kind === "selected" ? stage.file : null;
  const error = stage.kind === "error" ? stage.message : null;

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
          disabled={!selected}
          onClick={onAnalyse}
          className="btn-primary w-full text-base"
        >
          {selected ? "Analyse this document →" : "Select a file to continue"}
        </button>
        {selected && (
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

function ResultsView({
  analysis,
  filename,
  documentText,
  onReset,
}: {
  analysis: AnalysisResult;
  filename: string;
  documentText: string;
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
          What's covered → What's NOT covered → Watch list → Deadlines → Obligations.
          Watch list is force-open since it's the highest-priority risk surface. */}
      <AccordionSection
        icon={<CircleCheck className="h-4 w-4 text-flag-g-text" />}
        title="What's covered"
        subtitle="What the document grants or includes."
        tone="green"
        items={analysis.covered}
      />

      <AccordionSection
        icon={<CircleX className="h-4 w-4 text-flag-r-text" />}
        title="What's NOT covered"
        subtitle="Exclusions, gaps, and topics not addressed in this document."
        tone="red"
        items={analysis.not_covered}
      />

      {analysis.watch_list.length > 0 && (
        <AccordionSection
          icon={<TriangleAlert className="h-4 w-4 text-flag-r-text" />}
          title="Watch list"
          subtitle="Unusual or restrictive clauses — read carefully."
          tone="red"
          items={analysis.watch_list}
          forceOpen
        />
      )}

      <AccordionSection
        icon={<Clock className="h-4 w-4 text-flag-y-text" />}
        title="Deadlines & limits"
        subtitle="Time windows, caps, and notice periods."
        tone="yellow"
        items={analysis.deadlines_and_limits}
      />

      <AccordionSection
        icon={<ClipboardList className="h-4 w-4 text-flag-y-text" />}
        title="Your obligations"
        subtitle="What you must do to keep the agreement valid."
        tone="yellow"
        items={analysis.your_obligations}
      />

      <NextStepsBar
        redCount={redCount}
        onAsk={() => setQaOpen(true)}
        onReset={onReset}
      />

      <QAPanel
        open={qaOpen}
        onClose={() => setQaOpen(false)}
        documentText={documentText}
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
  onAsk,
  onReset,
}: {
  redCount: number;
  onAsk: () => void;
  onReset: () => void;
}) {
  const hook =
    redCount === 0
      ? "Document looks standard. Here's what to do next."
      : `You have ${redCount} item${redCount === 1 ? "" : "s"} worth a closer look. Here's what to do next.`;

  return (
    <div className="mt-8 rounded-lg border border-ink-12 bg-white p-6">
      <div className="text-xs font-semibold uppercase tracking-[0.08em] text-amber">
        What next?
      </div>
      <p className="mt-2 text-lg font-display font-bold text-navy">{hook}</p>

      {/* Primary — full-width amber. Highest engagement moment, biggest button. */}
      <button
        type="button"
        onClick={onAsk}
        className="btn-primary mt-5 w-full !py-3.5 text-base"
      >
        <MessageCircle className="h-4 w-4" />
        Ask a question about this document
      </button>
      <p className="mt-1.5 text-center text-xs text-navy-mid">
        Answers come strictly from the document — no general knowledge.
      </p>

      {/* Secondary — Pro upgrade with price + benefit + amber border treatment */}
      <div className="mt-5 rounded-lg border-2 border-amber bg-amber-soft/40 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-md bg-amber text-white">
              <Download className="h-4 w-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-navy">Export as PDF</span>
                <span className="rounded-full bg-amber px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                  Pro
                </span>
              </div>
              <div className="text-xs text-navy-mid">$9.99/month</div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-navy">
          Save the full analysis as a formatted PDF you can share with a
          partner, lawyer, or anyone reviewing this document with you.
        </p>
        <Link
          href="/#pricing"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber hover:underline"
        >
          Upgrade to Pro <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  tone: "green" | "yellow" | "red";
  items: ClauseItem[];
  forceOpen?: boolean;
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

  const initiallyOpen = forceOpen || isDesktop;

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
