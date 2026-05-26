import { NextRequest, NextResponse } from "next/server";
import { issueDownloadToken } from "@/lib/download-token";
import { normalizeEmail } from "@/lib/email-normalize";
import { verifyCheckoutSignature } from "@/lib/razorpay";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type VerifyBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  email?: string;
  /** "analysis" (default) or "download" */
  product?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as VerifyBody | null;
  const orderId = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;
  const emailInput = body?.email?.trim() ?? "";
  const product: "analysis" | "download" | "qa" =
    body?.product === "download"
      ? "download"
      : body?.product === "qa"
        ? "qa"
        : "analysis";

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json(
      { error: "missing_fields", message: "Missing order, payment, or signature." },
      { status: 400 },
    );
  }
  if (!emailInput || !EMAIL_RE.test(emailInput.toLowerCase())) {
    return NextResponse.json(
      { error: "invalid_email", message: "Missing or invalid email." },
      { status: 400 },
    );
  }
  // Canonical form so credit grants line up with consume_analysis_credit in
  // /api/analyze regardless of plus-addressing / dot variations the user typed.
  const email = normalizeEmail(emailInput);

  // Verify the Checkout signature FIRST. Without this guard anyone could
  // POST arbitrary ids and grant themselves a download token or credit.
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

  // Update the payment row (best-effort — webhook is the source of truth)
  if (isSupabaseConfigured()) {
    try {
      const supabase = supabaseAdmin();
      await supabase
        .from("payments")
        .update({ razorpay_payment_id: paymentId, status: "captured" })
        .eq("razorpay_order_id", orderId);
    } catch (e) {
      console.error(`[payment/verify] supabase update failed: ${e instanceof Error ? e.message : e}`);
    }
  }

  if (product === "download") {
    // Issue a short-lived signed token bound to this email. The client uses
    // it to authenticate the immediate /api/download/pdf call. No DB row —
    // the user pays, downloads, done. (Idempotency call below still runs
    // to mark the payment row as disbursed for accounting.)
    if (isSupabaseConfigured()) {
      await idempotentGrant(orderId, email, "download");
    }
    const downloadToken = issueDownloadToken(email);
    return NextResponse.json({ ok: true, product: "download", downloadToken });
  }

  // analysis or qa — grant via the idempotent RPC so verify + webhook can't
  // double-grant for the same order.
  if (isSupabaseConfigured()) {
    await idempotentGrant(orderId, email, product);
  }
  return NextResponse.json({ ok: true, product });
}

async function idempotentGrant(
  orderId: string,
  email: string,
  product: "analysis" | "download" | "qa",
) {
  try {
    const { data, error } = await supabaseAdmin().rpc("grant_credit_for_order", {
      p_order_id: orderId,
      p_email: email,
      p_product: product,
    });
    if (error) {
      console.error(
        `[payment/verify] grant_credit_for_order failed for ${orderId}: ${error.message}`,
      );
    } else {
      console.log(
        `[payment/verify] grant_credit_for_order ${orderId} (${product}) -> ${data}`,
      );
    }
  } catch (e) {
    console.error(
      `[payment/verify] supabase failed: ${e instanceof Error ? e.message : e}`,
    );
  }
}
