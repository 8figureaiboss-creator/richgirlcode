"use client";
import { useEffect, useMemo, useState } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Moon, Home, RefreshCcw, Sun, Info } from "lucide-react";
import type { Region } from "@/lib/content";
import { SectionLabel } from "./Reveal";
import { prefillInquiry } from "@/lib/prefill";

type Kind = "overnight" | "postpartum" | "livein" | "rota";

const kinds: { id: Kind; label: string; icon: typeof Moon; hours: [number, number, number]; days: [number, number, number]; hoursLabel: string; daysLabel: string }[] = [
  { id: "overnight", label: "Overnight care", icon: Moon, hours: [8, 12, 10], days: [1, 7, 5], hoursLabel: "Hours per night", daysLabel: "Nights per week" },
  { id: "postpartum", label: "Postpartum day visits", icon: Sun, hours: [3, 8, 4], days: [1, 7, 3], hoursLabel: "Hours per visit", daysLabel: "Visits per week" },
  { id: "livein", label: "Temporary live-in", icon: Home, hours: [8, 12, 10], days: [3, 7, 6], hoursLabel: "Working hours per day", daysLabel: "Days per week" },
  { id: "rota", label: "Rotational (ROTA)", icon: RefreshCcw, hours: [8, 12, 10], days: [3, 7, 7], hoursLabel: "Working hours per day", daysLabel: "Days on per rotation week" },
];

function rate(kind: Kind, region: Region, twins: boolean) {
  if (kind === "overnight") return twins ? (region === "sacramento" ? 75 : 80) : region === "sacramento" ? 65 : 75;
  if (kind === "livein") return 55;
  return 65;
}

const fmt = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function AnimatedNumber({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => fmt(Math.round(v)));
  useEffect(() => {
    const c = animate(mv, value, { duration: 0.6, ease: "easeOut" });
    return c.stop;
  }, [value, mv]);
  return <motion.span>{text}</motion.span>;
}

function Slider({ label, value, min, max, onChange, suffix }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; suffix: string }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className="flex items-baseline justify-between text-sm">
        <span className="font-medium text-white/80">{label}</span>
        <span className="font-display text-2xl text-white">
          {value} <span className="text-sm text-white/60">{suffix}</span>
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full accent-lotus"
        style={{ background: `linear-gradient(to right, #e86b9d ${pct}%, rgba(255,255,255,.15) ${pct}%)` }}
      />
    </label>
  );
}

export default function CarePlanner() {
  const [kind, setKind] = useState<Kind>("overnight");
  const [region, setRegion] = useState<Region>("sacramento");
  const [twins, setTwins] = useState(false);
  const cfg = kinds.find((k) => k.id === kind)!;
  const [hours, setHours] = useState(cfg.hours[2]);
  const [days, setDays] = useState(cfg.days[2]);
  const [weeks, setWeeks] = useState(4);

  const pick = (k: Kind) => {
    const c = kinds.find((x) => x.id === k)!;
    setKind(k);
    setHours(c.hours[2]);
    setDays(c.days[2]);
  };

  const r = rate(kind, region, twins);
  const serviceFor: Record<Kind, string> = { overnight: "Overnight Newborn Care", postpartum: "Postpartum Recovery Support", livein: "Temporary Live-In Support", rota: "Rotational (ROTA) Support" };
  const request = (e: React.MouseEvent) => {
    e.preventDefault();
    prefillInquiry({
      services: [serviceFor[kind]],
      message: `Care plan: ${cfg.label}${kind === "overnight" && twins ? " (twins)" : ""}, ${region === "sacramento" ? "Sacramento" : "Bay Area"}. ${hours} hrs × ${days} days/week × ${weeks} weeks (est. ${fmt(total)}).`,
    });
  };
  const { perShift, perWeek, total, totalHours } = useMemo(() => {
    const perShift = r * hours;
    const perWeek = perShift * days;
    return { perShift, perWeek, total: perWeek * weeks, totalHours: hours * days * weeks };
  }, [r, hours, days, weeks]);

  return (
    <section id="planner" className="relative scroll-mt-20 overflow-hidden bg-teal-ink py-24 text-white sm:py-32">
      <div className="pointer-events-none absolute -right-40 -top-40 h-[40rem] w-[40rem] rounded-full bg-teal/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-20 h-[30rem] w-[30rem] rounded-full bg-lotus/20 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <SectionLabel light>Care planner</SectionLabel>
          <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-balance sm:text-5xl">
            Plan your support <em className="text-blush">before</em> baby arrives.
          </h2>
          <p className="mt-5 text-lg text-white/70">
            Build a care schedule and see an estimated investment right away. Most families book overnight care in 8–12 hour
            shifts over several weeks.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-10">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {kinds.map((k) => (
                <button
                  key={k.id}
                  onClick={() => pick(k.id)}
                  aria-pressed={kind === k.id}
                  className={`flex flex-col items-start gap-3 rounded-2xl p-4 text-left text-sm font-semibold transition ${kind === k.id ? "bg-white text-teal-ink shadow-xl" : "bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10"}`}
                >
                  <k.icon className={`h-5 w-5 ${kind === k.id ? "text-lotus" : "text-blush"}`} />
                  {k.label}
                </button>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {(["sacramento", "bayarea"] as Region[]).map((rg) => (
                <button
                  key={rg}
                  onClick={() => setRegion(rg)}
                  aria-pressed={region === rg}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${region === rg ? "bg-lotus text-white" : "bg-white/5 text-white/75 ring-1 ring-white/15 hover:bg-white/10"}`}
                >
                  {rg === "sacramento" ? "Sacramento" : "Bay Area"}
                </button>
              ))}
              {kind === "overnight" && (
                <button
                  onClick={() => setTwins(!twins)}
                  aria-pressed={twins}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${twins ? "bg-lotus text-white" : "bg-white/5 text-white/75 ring-1 ring-white/15 hover:bg-white/10"}`}
                >
                  Twins
                </button>
              )}
            </div>

            <div className="mt-10 space-y-8">
              <Slider label={cfg.hoursLabel} value={hours} min={cfg.hours[0]} max={cfg.hours[1]} onChange={setHours} suffix="hrs" />
              <Slider label={cfg.daysLabel} value={days} min={cfg.days[0]} max={cfg.days[1]} onChange={setDays} suffix="days" />
              <Slider label="Number of weeks" value={weeks} min={1} max={16} onChange={setWeeks} suffix="wks" />
            </div>
          </div>

          <div className="flex flex-col rounded-[2rem] bg-gradient-to-br from-lotus to-lotus-deep p-8 shadow-2xl shadow-lotus/30 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Estimated investment</p>
            <p className="mt-4 font-display text-6xl font-medium tracking-tight sm:text-7xl">
              <AnimatedNumber value={total} />
            </p>
            <p className="mt-2 text-white/80">
              {totalHours} hours of care at ${r}/hr{kind === "livein" || kind === "rota" ? " + applicable overtime" : ""}
            </p>
            <dl className="mt-8 space-y-3 border-t border-white/20 pt-6 text-sm">
              <div className="flex justify-between"><dt className="text-white/75">Per {kind === "overnight" ? "night" : kind === "postpartum" ? "visit" : "day"}</dt><dd className="font-semibold"><AnimatedNumber value={perShift} /></dd></div>
              <div className="flex justify-between"><dt className="text-white/75">Per week</dt><dd className="font-semibold"><AnimatedNumber value={perWeek} /></dd></div>
              <div className="flex justify-between"><dt className="text-white/75">Hourly rate</dt><dd className="font-semibold">${r}</dd></div>
            </dl>
            <a href="#inquire" onClick={request} className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-4 font-semibold text-lotus-deep transition hover:-translate-y-0.5 hover:shadow-xl">
              Request this care plan
            </a>
            <p className="mt-auto flex gap-2 pt-6 text-xs leading-relaxed text-white/75">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Estimate only. Final terms, including overtime, travel and expenses, are set in your individual client agreement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
