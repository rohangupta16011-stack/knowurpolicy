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

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  // Determine pricing from Vercel edge country header
  const country = req.headers.get("x-vercel-ip-country");
  const pricing = getPricingForCountry(country);
  const amount = pricingToSmallestUnit(pricing);

  if (amount < 100) {
    // Razorpay minimum charge is 100 (₹1 or $0.01-equivalent)
    return NextResponse.json(
      { error: "amount_too_low", message: "Configured amount is below Razorpay minimum." },
      { status: 400 },
    );
  }

  // Receipt — Razorpay limit is 40 chars. Encode a quick reference.
  const receipt = `kup_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  try {
    const order = await razorpayClient().orders.create({
      amount,
      currency: pricing.currency,
      receipt,
      notes: {
        email,
        tier: pricing.tier,
        country: country ?? "unknown",
      },
    });

    // Persist if Supabase is configured. Graceful no-op otherwise so the
    // checkout still works in environments without Supabase set up yet.
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
        // Log but don't fail the order — order is already created on Razorpay's side
        console.warn(`[payment/order] supabase insert failed: ${e instanceof Error ? e.message : e}`);
      }
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpayPublicKey(),
      display_amount: pricing.perDocDisplay,
    });
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error(`[payment/order] failed: ${detail}`);
    // Razorpay's error class has a `statusCode` field; surface 401 on auth
    // failures distinctly so the client can suggest checking the keys.
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
