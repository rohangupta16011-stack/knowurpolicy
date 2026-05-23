import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Nav({ showTryFree = true }: { showTryFree?: boolean }) {
  return (
    <nav className="border-b border-ink-12 bg-cream/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="KnowUrPolicy home">
          <Logo size={20} />
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-navy-mid sm:flex">
          <Link href="/#features" className="hover:text-navy">How it works</Link>
          <Link href="/#pricing" className="hover:text-navy">Pricing</Link>
          <Link href="/#faq" className="hover:text-navy">FAQ</Link>
        </div>
        {showTryFree && (
          <Link href="/analyze" className="btn-primary !py-1.5 !text-xs">
            Try free
          </Link>
        )}
      </div>
    </nav>
  );
}
