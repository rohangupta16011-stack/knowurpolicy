import { NextRequest, NextResponse } from "next/server";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  email?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as VerifyBody | null;
  const orderId = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;
  const email = body?.email?.trim().toLowerCase();

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "missing_fields", message: "Missing order, payment, or signature." },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "invalid_email", message: "Missing or invalid email." },
      { status: 400 },
    );
  }

  // CRITICAL: verify the signature before doing anything else. Without this
  // check anyone could call /api/payment/verify with arbitrary ids and grant
  // themselves credits.
  const valid = verifyCheckoutSignature({
    razorpayOrderId: orderId,
    razorpayPaymentId: paymentId,
    razorpaySignature: signature,
  });

  if (!valid) {
    console.warn(`[payment/verify] signature mismatch for order ${orderId}`);
    return NextResponse.json(
      { error: "invalid_signature", message: "Payment signature did not verify." },
      { status: 400 },
    );
  }

  // Grant the credit. If Supabase isn't configured we still return ok so the
  // checkout flow completes in dev; the credit just won't be enforced.
  if (isSupabaseConfigured()) {
    try {
      const supabase = supabaseAdmin();

      // Update the payment row (best-effort — webhook is the source of truth)
      await supabase
        .from("payments")
        .update({
          razorpay_payment_id: paymentId,
          status: "captured",
        })
        .eq("razorpay_order_id", orderId);

      // Grant 1 paid credit atomically
      const { error } = await supabase.rpc("grant_paid_credits", {
        p_email: email,
        p_amount: 1,
      });
      if (error) {
        console.error(`[payment/verify] grant_paid_credits failed: ${error.message}`);
        // Don't return 500 to the client — the payment succeeded; the
        // webhook will redo this from the source of truth.
      }
    } catch (e) {
      console.error(`[payment/verify] supabase failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  return NextResponse.json({ ok: true });
}
