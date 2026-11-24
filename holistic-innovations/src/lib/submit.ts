export type SubmitResult = { ok: true } | { ok: false; error: string };

export async function submitInquiry(payload: Record<string, unknown>): Promise<SubmitResult> {
  try {
    const res = await fetch("/api/inquiry", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) return { ok: true };
    return { ok: false, error: data.error ?? "Something went wrong." };
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}
