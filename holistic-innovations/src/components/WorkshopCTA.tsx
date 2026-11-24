"use client";
import { prefillInquiry } from "@/lib/prefill";

export default function WorkshopCTA() {
  return (
    <a
      href="#inquire"
      onClick={(e) => { e.preventDefault(); prefillInquiry({ services: ["Workshops"] }); }}
      className="mt-6 inline-flex rounded-full bg-teal-ink px-6 py-3.5 font-semibold text-white transition hover:bg-teal"
    >
      Register interest
    </a>
  );
}
