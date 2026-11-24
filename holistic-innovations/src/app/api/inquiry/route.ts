import { NextResponse } from "next/server";

const MAX = 4000;
const isEmail = (v: unknown) => typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length < 200;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: bots fill hidden fields.
  if (body.company) return NextResponse.json({ ok: true });
  if (!isEmail(body.email)) return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  if (JSON.stringify(body).length > MAX) return NextResponse.json({ error: "Message is too long." }, { status: 413 });

  const webhook = process.env.INQUIRY_WEBHOOK_URL;
  if (!webhook) {
    console.warn("[inquiry] INQUIRY_WEBHOOK_URL is not set; inquiry not delivered:", body.type);
    return NextResponse.json(
      { error: "Online inquiries aren't connected yet." },
      { status: 503 },
    );
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, receivedAt: new Date().toISOString(), source: "holisticinnovationsllc.com" }),
  }).catch(() => null);

  if (!res || !res.ok) return NextResponse.json({ error: "We couldn't send that right now." }, { status: 502 });
  return NextResponse.json({ ok: true });
}
