"use client";
import { useState, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { BookOpen, Loader2, Check } from "lucide-react";
import { guides, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/content";
import { submitInquiry } from "@/lib/submit";
import Lotus from "./Lotus";
import Reveal, { SectionLabel } from "./Reveal";

function Book({ g, i }: { g: (typeof guides)[number]; i: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rx = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [-0.5, 0.5], [-14, 14]), { stiffness: 200, damping: 18 });
  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - r.left) / r.width - 0.5);
    y.set((e.clientY - r.top) / r.height - 0.5);
  };
  return (
    <Reveal delay={i * 0.08} className="[perspective:1000px]">
      <motion.div
        onMouseMove={onMove}
        onMouseLeave={() => { x.set(0); y.set(0); }}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", background: `linear-gradient(150deg, ${g.from}, ${g.to})` }}
        className="relative aspect-[3/4] overflow-hidden rounded-r-2xl rounded-l-md p-6 text-white shadow-[18px_24px_50px_-18px_rgba(11,63,65,.45)]"
      >
        <div className="absolute inset-y-0 left-0 w-3 bg-black/15" />
        <Lotus className="absolute -bottom-8 -right-8 h-40 w-40 text-white/20" mono animate={false} />
        <div style={{ transform: "translateZ(40px)" }} className="relative flex h-full flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/80">The Holistic Maternal Wellness Collection</p>
          <p className="mt-auto font-display text-sm italic text-white/80">Guide {g.n}</p>
          <h3 className="mt-1 font-display text-2xl font-medium leading-tight">{g.title}</h3>
          <div className="mt-4 h-px w-10 bg-white/60" />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">Holistic Innovations</p>
        </div>
      </motion.div>
      <p className="mt-4 text-sm leading-relaxed text-mist">{g.topics}</p>
    </Reveal>
  );
}

export default function Guides() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("loading");
    const r = await submitInquiry({ type: "guide-waitlist", email });
    if (r.ok) setState("done");
    else { setState("error"); setError(r.error); }
  };

  return (
    <section id="guides" className="relative scroll-mt-20 overflow-hidden bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 lg:flex-row lg:items-end">
          <Reveal className="max-w-2xl">
            <SectionLabel>Coming soon · Publishing</SectionLabel>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
              The Holistic Maternal Wellness <em className="text-lotus">Collection</em>
            </h2>
            <p className="mt-5 text-lg text-mist">
              Practical, concise guides drawn from years of bedside experience, planned for digital and print editions.
              Join the list to hear first when Guide 1 is released.
            </p>
          </Reveal>
          <Reveal delay={0.1} className="w-full max-w-md">
            {state === "done" ? (
              <p className="flex items-center gap-3 rounded-full bg-teal/10 px-6 py-4 font-semibold text-teal-ink">
                <Check className="h-5 w-5 text-teal" /> You&rsquo;re on the list. Thank you!
              </p>
            ) : (
              <form onSubmit={join} className="flex flex-col gap-2 rounded-full bg-cream p-1.5 ring-1 ring-teal/15 sm:flex-row">
                <label htmlFor="waitlist" className="sr-only">Email address</label>
                <input
                  id="waitlist"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="min-w-0 flex-1 rounded-full bg-transparent px-5 py-3 outline-none placeholder:text-mist/60"
                />
                <button disabled={state === "loading"} className="inline-flex items-center justify-center gap-2 rounded-full bg-lotus px-6 py-3 font-semibold text-white transition hover:bg-lotus-deep disabled:opacity-60">
                  {state === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                  Join the waitlist
                </button>
              </form>
            )}
            {state === "error" && (
              <p className="mt-3 text-sm text-lotus-deep">
                {error} You can also DM <a className="underline" href={INSTAGRAM_URL} target="_blank" rel="noreferrer">{INSTAGRAM_HANDLE}</a>.
              </p>
            )}
          </Reveal>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4 lg:gap-8">
          {guides.map((g, i) => <Book key={g.n} g={g} i={i} />)}
        </div>
      </div>
    </section>
  );
}
