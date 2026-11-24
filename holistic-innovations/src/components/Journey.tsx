"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { journey } from "@/lib/content";
import Reveal, { SectionLabel } from "./Reveal";

export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 60%"] });
  const line = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="journey" className="relative scroll-mt-20 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <SectionLabel>The fourth trimester</SectionLabel>
          <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
            Support that grows <em className="text-lotus">with</em> your family.
          </h2>
          <p className="mt-5 text-lg text-mist">
            The weeks after birth bring a lot of change. This is how care usually looks from late pregnancy through the first three months.
          </p>
        </Reveal>

        <div ref={ref} className="relative mt-20">
          <div className="absolute left-5 top-0 h-full w-px bg-teal/15 md:left-1/2" />
          <motion.div style={{ height: line }} className="absolute left-5 top-0 w-px bg-gradient-to-b from-lotus to-teal md:left-1/2" />

          <ol className="space-y-14 md:space-y-24">
            {journey.map((j, i) => {
              const left = i % 2 === 0;
              return (
                <li key={j.phase} className="relative grid md:grid-cols-2 md:gap-16">
                  <motion.span
                    aria-hidden="true"
                    initial={{ opacity: 0, x: left ? 40 : -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className={`pointer-events-none hidden select-none self-center font-display text-7xl font-light italic text-blush/70 md:block xl:text-8xl ${left ? "md:col-start-2 md:row-start-1 md:pl-10" : "md:col-start-1 md:row-start-1 md:pr-10 md:text-right"}`}
                  >
                    {j.phase}
                  </motion.span>
                  <motion.span
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: "-120px" }}
                    transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    className="absolute left-5 top-2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full bg-white font-display text-lg text-lotus shadow-lg ring-4 ring-cream md:left-1/2"
                  >
                    {i + 1}
                  </motion.span>
                  <Reveal
                    y={20}
                    className={`ml-14 md:row-start-1 md:ml-0 ${left ? "md:col-start-1 md:pr-10 md:text-right" : "md:col-start-2 md:pl-10"}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">{j.phase} · {j.when}</p>
                    <h3 className="mt-2 font-display text-3xl font-medium text-teal-ink">{j.title}</h3>
                    <p className="mt-3 leading-relaxed text-mist">{j.body}</p>
                    <div className={`mt-4 flex flex-wrap gap-2 ${left ? "md:justify-end" : ""}`}>
                      {j.services.map((s) => (
                        <span key={s} className="rounded-full bg-blush-soft px-3 py-1 text-xs font-semibold text-lotus-deep">{s}</span>
                      ))}
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
