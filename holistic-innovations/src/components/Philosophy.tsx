"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flower2, Moon, GraduationCap } from "lucide-react";
import { categories, wellnessPillars } from "@/lib/content";
import Reveal, { SectionLabel } from "./Reveal";

const icons = { maternal: Flower2, newborn: Moon, education: GraduationCap } as const;
const angles = [-45, -15, 15, 45];

export default function Philosophy() {
  const [active, setActive] = useState(0);
  return (
    <section className="relative py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <Reveal>
            <SectionLabel>Our philosophy</SectionLabel>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
              A woman is more than a birth story. We care for <em className="text-lotus">all</em> of her.
            </h2>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-mist">
              Holistic Innovations exists to support, educate and empower women through compassionate, individualized care,
              evidence-informed education and holistic wellness practices across every part of well-being.
            </p>
            <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Dimensions of wellness">
              {wellnessPillars.map((p, i) => (
                <button
                  key={p.key}
                  role="tab"
                  aria-selected={active === i}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setActive(i)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${active === i ? "bg-teal text-white shadow-lg shadow-teal/25" : "bg-white text-teal-ink ring-1 ring-teal/15 hover:ring-teal/40"}`}
                >
                  {p.key}
                </button>
              ))}
            </div>
            <div className="mt-6 min-h-24">
              <AnimatePresence mode="wait">
                <motion.p
                  key={active}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-md font-display text-2xl italic leading-snug text-teal-ink"
                >
                  {wellnessPillars[active].body}
                </motion.p>
              </AnimatePresence>
            </div>
          </Reveal>

          <Reveal delay={0.15} className="relative mx-auto aspect-square w-full max-w-md">
            <svg viewBox="-40 -20 280 200" className="h-full w-full overflow-visible" role="img" aria-label="Four petals: physical, emotional, mental and spiritual wellness">
              <circle cx="100" cy="100" r="104" fill="none" stroke="#168e91" strokeOpacity=".15" strokeDasharray="2 5" />
              <path d="M100 150 C 78 118, 80 66, 100 30 C 120 66, 122 118, 100 150 Z" fill="#168e91" fillOpacity=".14" />
              {angles.map((a, i) => (
                <g key={a} transform={`rotate(${a} 100 150)`}>
                  <motion.path
                    d="M100 150 C 74 118, 76 62, 100 24 C 124 62, 126 118, 100 150 Z"
                    style={{ transformBox: "view-box", transformOrigin: "100px 150px" }}
                    animate={{ scale: active === i ? 1.08 : 0.9, fill: active === i ? "#e86b9d" : "#f3cad7" }}
                    transition={{ type: "spring", stiffness: 160, damping: 16 }}
                    stroke="#fff"
                    strokeWidth="1.5"
                    className="cursor-pointer"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => setActive(i)}
                  />
                </g>
              ))}
              {angles.map((a, i) => {
                const rad = ((a - 90) * Math.PI) / 180;
                return (
                  <text
                    key={`t${a}`}
                    x={100 + Math.cos(rad) * 146}
                    y={150 + Math.sin(rad) * 146}
                    textAnchor="middle"
                    fontSize="7.5"
                    fontWeight="700"
                    letterSpacing="1.2"
                    fill={active === i ? "#c94a7f" : "#168e91"}
                    style={{ textTransform: "uppercase", transition: "fill .3s" }}
                  >
                    {wellnessPillars[i].key}
                  </text>
                );
              })}
              <path d="M48 160 Q 100 178 152 160" fill="none" stroke="#168e91" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </Reveal>
        </div>

        <div className="mt-24 grid gap-5 md:grid-cols-3">
          {categories.map((c, i) => {
            const Icon = icons[c.id];
            return (
              <Reveal key={c.id} delay={i * 0.1}>
                <a href="#services" className="group relative block h-full overflow-hidden rounded-3xl bg-white p-8 ring-1 ring-teal/10 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-teal/10">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blush-soft transition duration-700 group-hover:scale-[3]" />
                  <div className="relative">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-teal/10 text-teal transition group-hover:bg-teal group-hover:text-white">
                      <Icon className="h-6 w-6" strokeWidth={1.6} />
                    </span>
                    <h3 className="mt-6 font-display text-2xl font-medium text-teal-ink">{c.title}</h3>
                    <p className="mt-3 leading-relaxed text-mist">{c.blurb}</p>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
