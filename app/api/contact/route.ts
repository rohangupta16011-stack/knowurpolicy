import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_TOPICS = new Set([
  "feedback",
  "privacy",
  "billing",
  "partnership",
  "legal",
  "other",
]);

type ContactBody = {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as ContactBody | null;

  const name = body?.name?.trim();
  const email = body?.email?.trim().toLowerCase();
  const topic = body?.topic?.trim();
  const message = body?.message?.trim();

  if (!name || name.length < 1 || name.length > 200) {
    return NextResponse.json(
      { error: "invalid_name", message: "Please enter your name." },
      { status: 400 },
    );
  }
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json(
      { error: "invalid_email", message: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  if (!topic || !ALLOWED_TOPICS.has(topic)) {
    return NextResponse.json(
      { error: "invalid_topic", message: "Pick a topic from the list." },
      { status: 400 },
    );
  }
  if (!message || message.length < 10 || message.length > 4000) {
    return NextResponse.json(
      { error: "invalid_message", message: "Message must be 10–4000 characters." },
      { status: 400 },
    );
  }

  // Lightweight metadata for triage. No IP retention.
  const userAgent = req.headers.get("user-agent")?.slice(0, 500) ?? null;
  const country = req.headers.get("x-vercel-ip-country") ?? null;
  const submittedAt = new Date().toISOString();

  const payload = {
    name,
    email,
    topic,
    message,
    user_agent: userAgent,
    country,
    submitted_at: submittedAt,
    // Optional shared secret so a leaked Apps Script URL alone isn't enough to
    // write spam rows. The script should check this matches GOOGLE_SHEETS_SHARED_SECRET.
    secret: process.env.GOOGLE_SHEETS_SHARED_SECRET ?? null,
  };

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      // Apps Script web apps reject CORS preflight on POST with a JSON
      // content-type; using text/plain is the common workaround and Apps
      // Script can still parse the body as JSON.
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "content-type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        // Don't let a hung Apps Script call block the user too long.
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.error(
          `[contact] sheets webhook returned ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`,
        );
      }
    } catch (e) {
      console.error(
        `[contact] sheets webhook failed: ${e instanceof Error ? e.message : e}`,
      );
      // Fall through — we still log + return ok so the user isn't stranded.
    }
  }

  // Always log so Vercel logs are the backup channel if the webhook is
  // unconfigured or fails.
  console.log(
    `[contact] ${topic} from ${email} (${name})${country ? ` [${country}]` : ""} :: ${message.slice(0, 200)}${message.length > 200 ? "…" : ""}`,
  );

  return NextResponse.json({ ok: true });
}
