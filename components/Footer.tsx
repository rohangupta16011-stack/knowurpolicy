import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="border-t border-ink-12 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-xs text-navy-mid sm:flex-row">
        <Logo size={16} />
        <span>© {new Date().getFullYear()} KnowUrPolicy. Built with care.</span>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          <Link href="/privacy" className="hover:text-navy">Privacy</Link>
          <Link href="/terms" className="hover:text-navy">Terms</Link>
          <Link href="/refunds" className="hover:text-navy">Refunds</Link>
          <Link href="/delivery" className="hover:text-navy">Delivery</Link>
          <Link href="/contact" className="hover:text-navy">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
