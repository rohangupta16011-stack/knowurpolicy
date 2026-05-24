import { NextRequest, NextResponse } from "next/server";
import {
  pricingToSmallestUnit,
  razorpayClient,
  razorpayPublicKey,
} from "@/lib/razorpay";
import { getPricingForCountry } from "@/lib/pricing";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Product = "analysis" | "download";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as
    | { email?: string; product?: string }
    | null;
  const email = body?.email?.trim().toLowerCase();
  const product: Product = body?.product === "download" ? "download" : "analysis";

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const country = req.headers.get("x-vercel-ip-country");
  const pricing = getPricingForCountry(country);

  // Pick amount + display string based on product.
  const amount =
    product === "download"
      ? Math.round(pricing.downloadPerDoc * 100)
      : pricingToSmallestUnit(pricing);
  const displayAmount =
    product === "download" ? pricing.downloadPerDocDisplay : pricing.perDocDisplay;
  const description =
    product === "download"
      ? "Download analysis as PDF"
      : "1 document analysis credit";

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
