import { NextRequest, NextResponse } from "next/server";
import {
  pricingToSmallestUnit,
  razorpayClient,
  razorpayPublicKey,
} from "@/lib/razorpay";
import { normalizeEmail } from "@/lib/email-normalize";
import { getPricingForCountry } from "@/lib/pricing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Product = "analysis" | "download" | "qa";

function parseProduct(raw: unknown): Product {
  if (raw === "download") return "download";
  if (raw === "qa") return "qa";
  return "analysis";
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; product?: string }
    | null;
  const emailInput = body?.email?.trim() ?? "";
  const product: Product = parseProduct(body?.product);

  if (!emailInput || !EMAIL_RE.test(emailInput.toLowerCase()) || emailInput.length > 254) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  // Canonical form used as the DB key. Razorpay receipt still goes to the
  // raw email the user typed (the user-facing "we'll email you" inbox).
  const email = normalizeEmail(emailInput);

  const country = req.headers.get("x-vercel-ip-country");
  const pricing = getPricingForCountry(country);

  // Pick amount + display string + description based on product.
  let amount: number;
  let displayAmount: string;
  let description: string;
  if (product === "download") {
    amount = Math.round(pricing.downloadPerDoc * 100);
    displayAmount = pricing.downloadPerDocDisplay;
    description = "Download analysis as PDF";
  } else if (product === "qa") {
    amount = Math.round(pricing.qaBundlePrice * 100);
    displayAmount = pricing.qaBundlePriceDisplay;
    description = `${pricing.qaBundleSize} follow-up Q&A questions`;
  } else {
    amount = pricingToSmallestUnit(pricing);
    displayAmount = pricing.perDocDisplay;
    description = "1 document analysis credit";
  }

  if (amount < 100) {
    return NextResponse.json(
      { error: "amount_too_low", message: "Configured amount is below Razorpay minimum." },
      { status: 400 },
    );
  }

  const receipt = `kup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const order = await razorpayClient().orders.create({
      amount,
      currency: pricing.currency,
      receipt,
      notes: {
        email,
        product,
        tier: pricing.tier,
        country: country ?? "unknown",
      },
    });

    // Persist if Supabase is configured.
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin().from("payments").insert({
          email,
          razorpay_order_id: order.id,
          amount,
          currency: pricing.currency,
          status: "created",
          region_tier: pricing.tier,
        });
      } catch (e) {
        console.warn(`[payment/order] supabase insert failed: ${e instanceof Error ? e.message : e}`);
      }
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayPublicKey(),
      display_amount: displayAmount,
      description,
      product,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[payment/order] failed: ${detail}`);
    const status =
      typeof (e as { statusCode?: number })?.statusCode === "number" &&
      (e as { statusCode: number }).statusCode === 401
        ? 401
        : 500;
    return NextResponse.json(
      {
        error: status === 401 ? "razorpay_auth_failed" : "order_creation_failed",
        message:
          status === 401
            ? "Payment gateway authentication failed. Check API keys."
            : "Couldn't start checkout. Please try again.",
      },
      { status },
    );
  }
}
