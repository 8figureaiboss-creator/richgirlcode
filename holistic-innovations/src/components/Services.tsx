"use client";
import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { Check, Plus, MapPin, ArrowUpRight } from "lucide-react";
import { categories, services, type CategoryId, type Region } from "@/lib/content";
import Reveal, { SectionLabel } from "./Reveal";
import { prefillInquiry } from "@/lib/prefill";

type Filter = "all" | CategoryId;
const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All services" },
  { id: "maternal", label: "Maternal & Postpartum" },
  { id: "newborn", label: "Newborn & Family" },
  { id: "education", label: "Mentorship" },
];

export default function Services() {
  const [filter, setFilter] = useState<Filter>("all");
  const [region, setRegion] = useState<Region>("sacramento");
  const [twins, setTwins] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const list = services.filter((s) => filter === "all" || s.category === filter);

  return (
    <section id="services" className="relative scroll-mt-20 bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <Reveal className="max-w-2xl">
            <SectionLabel>Services & investment</SectionLabel>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
              Specialized care, <em className="text-lotus">tailored</em> to your family.
            </h2>
            <p className="mt-5 text-lg text-mist">
              Seven established services, each arranged around your needs and written into a clear client agreement.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="inline-flex items-center gap-1 rounded-full bg-blush-soft p-1" role="radiogroup" aria-label="Region">
              <MapPin className="ml-2 h-4 w-4 text-lotus" />
              {(["sacramento", "bayarea"] as Region[]).map((r) => (
                <button
                  key={r}
                  role="radio"
                  aria-checked={region === r}
                  onClick={() => setRegion(r)}
                  className="relative rounded-full px-4 py-2 text-sm font-semibold text-teal-ink"
                >
                  {region === r && <motion.span layoutId="region" className="absolute inset-0 rounded-full bg-white shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
                  <span className="relative">{r === "sacramento" ? "Sacramento" : "Bay Area"}</span>
                </button>
              ))}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-3 rounded-full bg-blush-soft px-4 py-2.5 text-sm font-semibold text-teal-ink">
              <span className={`relative h-5 w-9 rounded-full transition ${twins ? "bg-lotus" : "bg-teal/25"}`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${twins ? "left-[18px]" : "left-0.5"}`} />
              </span>
              <input type="checkbox" className="sr-only" checked={twins} onChange={(e) => setTwins(e.target.checked)} />
              Twins
            </label>
          </Reveal>
        </div>

        <LayoutGroup>
          <div className="mt-12 flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]" role="tablist" aria-label="Filter services">
            {filters.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${filter === f.id ? "text-white" : "text-teal-ink hover:bg-blush-soft"}`}
              >
                {filter === f.id && <motion.span layoutId="filter" className="absolute inset-0 rounded-full bg-teal-ink" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                <span className="relative">{f.label}</span>
              </button>
            ))}
          </div>

          <motion.div layout className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {list.map((s) => {
                const isOpen = open === s.slug;
                const cat = categories.find((c) => c.id === s.category)!;
                return (
                  <motion.article
                    layout
                    key={s.slug}
                    id={s.slug}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.35 }}
                    className="group relative flex flex-col overflow-hidden rounded-3xl border border-teal/10 bg-cream p-7 transition-shadow hover:shadow-2xl hover:shadow-lotus/10"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-display text-5xl font-light italic text-blush transition group-hover:text-lotus">{s.n}</span>
                      <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-teal ring-1 ring-teal/10">
                        {cat.id === "maternal" ? "Postpartum" : cat.id === "newborn" ? "Newborn" : "Education"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-display text-2xl font-medium text-teal-ink">{s.title}</h3>
                    <p className="mt-3 leading-relaxed text-mist">{s.summary}</p>

                    <div className="mt-6 flex items-baseline gap-2">
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={s.price(region, twins)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="font-display text-4xl font-medium text-teal-ink"
                        >
                          {s.price(region, twins)}
                        </motion.span>
                      </AnimatePresence>
                      <span className="text-sm text-mist">{s.unit}</span>
                    </div>
                    {s.regional && (
                      <p className="mt-1 text-xs font-medium text-lotus">
                        {region === "sacramento" ? "Sacramento" : "Bay Area"} rate{twins ? " · twins" : ""}
                      </p>
                    )}

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <ul className="mt-6 space-y-2.5 border-t border-teal/10 pt-5">
                            {s.includes.map((i) => (
                              <li key={i} className="flex items-start gap-2.5 text-sm text-ink/80">
                                <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal" /> {i}
                              </li>
                            ))}
                          </ul>
                          <p className="mt-4 rounded-2xl bg-white p-3 text-xs text-mist">{s.format}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                      <button
                        onClick={() => setOpen(isOpen ? null : s.slug)}
                        aria-expanded={isOpen}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:text-teal-deep"
                      >
                        <Plus className={`h-4 w-4 transition ${isOpen ? "rotate-45" : ""}`} />
                        {isOpen ? "Less" : "What's included"}
                      </button>
                      <a
                        href="#inquire"
                        onClick={(e) => { e.preventDefault(); prefillInquiry({ services: [s.title] }); }}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-ink ring-1 ring-teal/15 transition hover:bg-teal hover:text-white">
                        Inquire <ArrowUpRight className="h-4 w-4" />
                      </a>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>

        <Reveal>
          <p className="mx-auto mt-12 max-w-3xl text-center text-sm leading-relaxed text-mist">
            Overtime, travel, expenses and employment requirements are addressed in individual agreements. All services are
            nonmedical; medical concerns are referred to appropriately qualified healthcare providers.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
