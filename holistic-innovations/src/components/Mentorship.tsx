"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { mentorshipTopics } from "@/lib/content";
import Reveal, { SectionLabel } from "./Reveal";
import { prefillInquiry } from "@/lib/prefill";

export default function Mentorship() {
  const [hover, setHover] = useState(0);
  return (
    <section id="mentorship" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr]">
          <Reveal className="lg:sticky lg:top-28 lg:self-start">
            <SectionLabel>For emerging doulas</SectionLabel>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
              Build a doula practice you can <em className="text-lotus">sustain</em>.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-mist">
              Jamie has mentored new doulas for years. Her mentorship covers what training programs often skip: how to run
              the work as a profession with fair pay, clear contracts and boundaries that last.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-6 ring-1 ring-teal/10">
                <p className="text-xs font-semibold uppercase tracking-wider text-mist">Single session</p>
                <p className="mt-2 font-display text-4xl text-teal-ink">$150</p>
                <p className="text-sm text-mist">60 minutes</p>
              </div>
              <div className="relative rounded-3xl bg-teal p-6 text-white">
                <span className="absolute -top-3 right-4 inline-flex items-center gap-1 rounded-full bg-lotus px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" /> Save $50
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">3-session package</p>
                <p className="mt-2 font-display text-4xl">$400</p>
                <p className="text-sm text-white/70">3 × 60 minutes</p>
              </div>
            </div>
            <a href="#inquire" onClick={(e) => { e.preventDefault(); prefillInquiry({ services: ["Mentorship for Emerging Doulas"] }); }} className="group mt-8 inline-flex items-center gap-2 rounded-full bg-teal-ink px-7 py-4 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-teal">
              Apply for mentorship <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {mentorshipTopics.map((t, i) => (
              <Reveal key={t.t} delay={(i % 2) * 0.08}>
                <div
                  onMouseEnter={() => setHover(i)}
                  className="relative h-full overflow-hidden rounded-3xl bg-white p-7 ring-1 ring-teal/10"
                >
                  {hover === i && <motion.div layoutId="mentor-hl" className="absolute inset-0 bg-gradient-to-br from-blush-soft to-white" transition={{ type: "spring", stiffness: 300, damping: 30 }} />}
                  <div className="relative">
                    <span className="font-display text-sm italic text-lotus">0{i + 1}</span>
                    <h3 className="mt-2 font-display text-2xl font-medium text-teal-ink">{t.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-mist">{t.d}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
