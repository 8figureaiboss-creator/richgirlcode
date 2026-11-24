"use client";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Moon, HeartHandshake, Baby, Award } from "lucide-react";
import Lotus from "./Lotus";

const words = ["Holistic", "care", "for", "the", "fourth", "trimester", "and", "beyond."];

const stats = [
  { k: "8+", v: "years of specialized care", icon: Award },
  { k: "2020", v: "practice established", icon: HeartHandshake },
  { k: "CLC", v: "Certified Lactation Counselor", icon: Baby },
  { k: "24/7", v: "overnight, live-in & ROTA", icon: Moon },
];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const lotusY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const lotusRotate = useTransform(scrollYProgress, [0, 1], [0, 18]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section id="top" ref={ref} className="grain relative isolate overflow-hidden pb-20 pt-32 sm:pt-40 lg:pb-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] animate-float rounded-full bg-blush/70 blur-3xl" />
        <div className="absolute -right-32 top-24 h-[28rem] w-[28rem] animate-float rounded-full bg-teal/15 blur-3xl [animation-delay:-3s]" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 animate-float rounded-full bg-lotus/20 blur-3xl [animation-delay:-6s]" />
      </div>

      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[1.15fr_.85fr] lg:px-8">
        <motion.div style={{ opacity: fade }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-white/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-teal backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lotus opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lotus" />
            </span>
            Sacramento · <span className="hidden sm:inline">San Francisco&nbsp;</span>Bay Area
          </motion.p>

          <h1 className="font-display text-[2.7rem] leading-[1.02] font-medium tracking-tight text-teal-ink text-balance sm:text-6xl lg:text-7xl">
            {words.map((w, i) => (
              <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
                <motion.span
                  className={`inline-block ${w === "fourth" || w === "trimester" ? "italic text-lotus" : ""}`}
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                >
                  {w}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-6 max-w-xl text-lg leading-relaxed text-mist text-pretty"
          >
            Overnight newborn care, postpartum recovery, lactation counseling and private family support from{" "}
            <strong className="font-semibold text-teal-ink">Jamie Madeline Wilson</strong>, a Postpartum Doula, Newborn Care
            Specialist and Certified Lactation Counselor. Compassionate, evidence-informed and made for your family.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <a href="#inquire" className="group inline-flex items-center justify-center gap-2 rounded-full bg-lotus px-7 py-4 font-semibold text-white shadow-xl shadow-lotus/30 transition hover:-translate-y-0.5 hover:bg-lotus-deep">
              Book a consultation
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </a>
            <a href="#planner" className="inline-flex items-center justify-center gap-2 rounded-full border border-teal/25 bg-white/60 px-7 py-4 font-semibold text-teal-ink backdrop-blur transition hover:border-teal hover:bg-white">
              Estimate your care
            </a>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: lotusY, rotate: lotusRotate }} className="relative mx-auto w-full max-w-md">
          <div className="absolute inset-6 animate-spin-slow rounded-full border border-dashed border-teal/25" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/80 to-blush/40 shadow-[0_40px_120px_-30px_rgba(232,107,157,.55)]" />
          <Lotus className="relative h-full w-full p-10" />
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.6 }}
            className="absolute -right-2 top-10 rounded-2xl bg-white/90 px-4 py-3 text-sm shadow-xl backdrop-blur sm:-right-8"
          >
            <p className="font-display text-lg text-teal-ink">Twins welcome</p>
            <p className="text-xs text-mist">Multiples specialist</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.8 }}
            className="absolute -left-2 bottom-12 rounded-2xl bg-teal-ink px-4 py-3 text-sm text-white shadow-xl sm:-left-8"
          >
            <p className="font-display text-lg">Sleep, restored</p>
            <p className="text-xs text-white/70">8–12 hr overnight shifts</p>
          </motion.div>
        </motion.div>
      </div>

      <div className="mx-auto mt-20 grid max-w-7xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-teal/10 bg-teal/10 px-0 sm:mx-6 lg:mx-auto lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.k}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + i * 0.1 }}
            className="flex items-center gap-4 bg-white/80 p-5 backdrop-blur sm:p-7"
          >
            <s.icon className="hidden h-8 w-8 shrink-0 text-lotus sm:block" strokeWidth={1.5} />
            <div>
              <p className="font-display text-3xl font-medium text-teal-ink">{s.k}</p>
              <p className="text-xs leading-snug text-mist sm:text-sm">{s.v}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
