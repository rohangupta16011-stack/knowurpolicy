import { NextRequest, NextResponse } from "next/server";
import { normalizeEmail } from "@/lib/email-normalize";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

/**
 * Razorpay webhook handler.
 *
 * Razorpay can deliver the same event multiple times (network retries on
 * non-2xx responses, intentional re-delivery). We dedupe by event id via
 * the `webhook_events` table.
 *
 * Webhook is the source of truth — /api/payment/verify gives a fast
 * client-side confirmation, but the webhook fires reliably even if the user
 * closes their browser mid-flow.
 *
 * Configure in Razorpay Dashboard → Settings → Webhooks:
 *   URL    = https://knowurpolicy.com/api/payment/webhook
 *   Events = payment.captured, payment.failed, payment.authorized, order.paid
 *   Secret = stored in RAZORPAY_WEBHOOK_SECRET env var
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "no_signature" }, { status: 401 });
  }

  // Must read the raw body — re-serialising JSON changes whitespace and
  // breaks the HMAC.
  const rawBody = await req.text();

  if (!verifyWebhookSignature({ rawBody, signature })) {
    console.warn("[payment/webhook] signature mismatch");
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let event: WebhookPayload;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventId = event.id ?? event.payload?.payment?.entity?.id;
  const eventType = event.event;

  if (!eventId || !eventType) {
    return NextResponse.json({ error: "malformed_event" }, { status: 400 });
  }

  // Idempotency + processing both require Supabase. If it isn't configured
  // we still 200 (Razorpay just retries to a connected receiver later).
  if (!isSupabaseConfigured()) {
    console.warn(`[payment/webhook] supabase not configured, event ${eventId} acknowledged but not processed`);
    return NextResponse.json({ ok: true, persisted: false });
  }

  const supabase = supabaseAdmin();

  // Idempotency check
  const { data: existing } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("id", eventId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ ok: true, dedupe: true });
  }

  await supabase.from("webhook_events").insert({
    id: eventId,
    event_type: eventType,
    payload: event,
  });

  // Event handling
  const payment = event.payload?.payment?.entity;
  const order = event.payload?.order?.entity;
  const orderId = payment?.order_id ?? order?.id;
  // Notes.email was normalized at order-creation time, but normalize again as
  // a safety net (old orders, manually-set notes, etc.) so credit grants
  // always land on the canonical key.
  const rawEmail =
    typeof payment?.notes?.email === "string" ? payment.notes.email : null;
  const email = rawEmail ? normalizeEmail(rawEmail) : null;

  if (eventType === "payment.captured" || eventType === "order.paid") {
    if (orderId) {
      await supabase
        .from("payments")
        .update({
          razorpay_payment_id: payment?.id,
          status: "captured",
        })
        .eq("razorpay_order_id", orderId);
    }
    if (email) {
      // Grant credit. Idempotent against duplicate webhook deliveries because
      // we early-returned above; idempotent across verify+webhook because
      // the webhook secret event is fired exactly once per real capture.
      await supabase.rpc("grant_paid_credits", {
        p_email: email,
        p_amount: 1,
      });
    }
  }

  if (eventType === "payment.failed") {
    if (orderId) {
      await supabase
        .from("payments")
        .update({
          status: "failed",
          failure_reason: payment?.error_description ?? payment?.error_code ?? null,
        })
        .eq("razorpay_order_id", orderId);
    }
  }

  return NextResponse.json({ ok: true });
}

type WebhookPayload = {
  id?: string;
  event: string;
  payload?: {
    payment?: { entity?: PaymentEntity };
    order?: { entity?: { id?: string } };
  };
};

type PaymentEntity = {
  id?: string;
  order_id?: string;
  notes?: Record<string, string>;
  error_code?: string;
  error_description?: string;
};
