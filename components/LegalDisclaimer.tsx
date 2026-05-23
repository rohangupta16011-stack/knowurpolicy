import { Info } from "lucide-react";

// Non-dismissable disclaimer required on every output screen per PRD §6.3.5.
// Amber bar styling per design doc — distinct from page chrome so it reads
// as a regulatory notice, not a footer.
export default function LegalDisclaimer() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-start gap-2 border-t border-amber/20 bg-amber-soft px-4 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 flex-none text-amber" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-amber">
        <strong className="font-semibold">KnowUrPolicy</strong> helps you
        understand documents. This is not legal advice. For decisions with legal
        consequences, please consult a qualified attorney.
      </p>
    </div>
  );
}
