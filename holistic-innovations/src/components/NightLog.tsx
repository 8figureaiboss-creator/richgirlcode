"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Moon, Milk, Baby, BedDouble, NotebookPen, Sunrise, Play, Pause } from "lucide-react";
import Reveal, { SectionLabel } from "./Reveal";

const log = [
  { t: "9:00 PM", icon: Moon, title: "Arrival & handoff", body: "Quick check-in with parents: last feed, mood, any concerns. Then parents go to bed.", tag: "You sleep" },
  { t: "10:45 PM", icon: Milk, title: "Feed", body: "Bottle feed, or baby is brought to you for nursing and settled again right after.", tag: "Feeding" },
  { t: "11:20 PM", icon: Baby, title: "Diaper & soothe", body: "Gentle settling with swaddling, rocking and white noise, always following safe sleep practices.", tag: "Soothing" },
  { t: "1:30 AM", icon: Milk, title: "Feed & burp", body: "Unhurried feed, upright time and burping, with the amounts written down.", tag: "Feeding" },
  { t: "2:10 AM", icon: BedDouble, title: "Back down, on the back", body: "Baby goes back to the bassinet on a clear, flat surface. Bottles are washed while baby sleeps.", tag: "Safe sleep" },
  { t: "4:40 AM", icon: Milk, title: "Feed", body: "Last overnight feed. Pumping parts are cleaned and ready for the morning.", tag: "Feeding" },
  { t: "6:30 AM", icon: NotebookPen, title: "Log & notes", body: "A written summary: feeds, diapers, sleep stretches, and observations or tips.", tag: "Documentation" },
  { t: "7:00 AM", icon: Sunrise, title: "Morning handoff", body: "You wake up rested to a calm baby and a clear picture of how the night went.", tag: "Rested" },
];

export default function NightLog() {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20%" });

  useEffect(() => {
    if (!playing || !inView) return;
    const id = setInterval(() => setI((x) => (x + 1) % log.length), 3200);
    return () => clearInterval(id);
  }, [playing, inView]);

  const cur = log[i];
  const pct = (i / (log.length - 1)) * 100;

  return (
    <section className="relative overflow-hidden bg-[#0a2f31] py-24 text-white sm:py-32">
      {/* stars */}
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(1px 1px at 20% 30%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 70% 20%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 40% 70%, #f3cad7 50%, transparent 51%), radial-gradient(1px 1px at 85% 60%, #fff 50%, transparent 51%), radial-gradient(1px 1px at 10% 80%, #fff 50%, transparent 51%), radial-gradient(1.5px 1.5px at 55% 15%, #fff 50%, transparent 51%)", backgroundSize: "380px 380px" }} />
      <motion.div
        className="pointer-events-none absolute -top-24 h-72 w-72 rounded-full bg-blush/30 blur-3xl"
        animate={{ left: `${pct * 0.8}%` }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
      />
      <div ref={ref} className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal className="max-w-2xl">
          <SectionLabel light>A night with Jamie</SectionLabel>
          <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-balance sm:text-5xl">
            While you sleep, <em className="text-blush">every minute</em> is handled.
          </h2>
          <p className="mt-5 text-lg text-white/70">
            Here&rsquo;s an example of a typical overnight shift. Your family gets the same steady routine and written notes every night.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-stretch">
          <ol className="relative space-y-1" aria-label="Sample overnight schedule">
            {log.map((e, k) => (
              <li key={e.t}>
                <button
                  onClick={() => { setI(k); setPlaying(false); }}
                  aria-current={k === i}
                  className={`group flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${k === i ? "bg-white/10" : "hover:bg-white/5"}`}
                >
                  <span className={`w-20 shrink-0 font-display text-lg tabular-nums ${k === i ? "text-blush" : "text-white/50"}`}>{e.t}</span>
                  <span className={`h-2 w-2 shrink-0 rounded-full transition ${k === i ? "scale-150 bg-lotus" : k < i ? "bg-teal" : "bg-white/25"}`} />
                  <span className={`font-medium ${k === i ? "text-white" : "text-white/65"}`}>{e.title}</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="relative flex min-h-[22rem] flex-col overflow-hidden rounded-[2rem] bg-white/[.06] p-8 ring-1 ring-white/10 backdrop-blur sm:p-10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">Care log · sample</p>
              <button onClick={() => setPlaying(!playing)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20" aria-label={playing ? "Pause" : "Play"}>
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />} {playing ? "Pause" : "Play"}
              </button>
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.45 }} className="mt-8 flex-1">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lotus text-white shadow-lg shadow-lotus/30">
                  <cur.icon className="h-7 w-7" strokeWidth={1.6} />
                </span>
                <p className="mt-6 font-display text-5xl tabular-nums text-blush">{cur.t}</p>
                <h3 className="mt-2 font-display text-3xl">{cur.title}</h3>
                <p className="mt-3 max-w-md text-lg leading-relaxed text-white/75">{cur.body}</p>
                <span className="mt-5 inline-block rounded-full bg-teal/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90">{cur.tag}</span>
              </motion.div>
            </AnimatePresence>
            <div className="mt-8 h-1 overflow-hidden rounded-full bg-white/10">
              <motion.div className="h-full bg-gradient-to-r from-lotus to-blush" animate={{ width: `${((i + 1) / log.length) * 100}%` }} transition={{ duration: 0.6 }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
