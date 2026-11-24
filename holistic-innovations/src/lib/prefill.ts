export const PREFILL_EVENT = "hi:prefill-inquiry";
export type Prefill = { services?: string[]; message?: string };

export function prefillInquiry(detail: Prefill) {
  window.dispatchEvent(new CustomEvent<Prefill>(PREFILL_EVENT, { detail }));
  document.getElementById("inquire")?.scrollIntoView({ behavior: "smooth" });
}
