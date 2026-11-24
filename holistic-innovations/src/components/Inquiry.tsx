"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, Send } from "lucide-react";
import Instagram from "./InstagramIcon";
import { services, INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/content";
import { submitInquiry } from "@/lib/submit";
import { PREFILL_EVENT, type Prefill } from "@/lib/prefill";
import Lotus from "./Lotus";
import { SectionLabel } from "./Reveal";

const interests = [...services.map((s) => s.title), "Workshops", "Maternal health guides"];

const input =
  "w-full rounded-2xl border border-teal/15 bg-white px-4 py-3.5 text-ink outline-none transition placeholder:text-mist/50 focus:border-teal focus:ring-4 focus:ring-teal/10";

export default function Inquiry() {
  const [picked, setPicked] = useState<string[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<Prefill>).detail;
      if (d.services) setPicked((p) => [...new Set([...p, ...d.services!])]);
      if (d.message) setMessage(d.message);
      setState((s) => (s === "done" ? "idle" : s));
    };
    window.addEventListener(PREFILL_EVENT, h);
    return () => window.removeEventListener(PREFILL_EVENT, h);
  }, []);

  const toggle = (t: string) => setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("loading");
    const r = await submitInquiry({ type: "consultation", ...Object.fromEntries(fd), services: picked });
    if (r.ok) setState("done");
    else { setState("error"); setError(r.error); }
  };

  return (
    <section id="inquire" className="relative scroll-mt-20 overflow-hidden bg-teal-ink py-24 text-white sm:py-32">
      <Lotus className="pointer-events-none absolute -left-24 bottom-0 h-[30rem] w-[30rem] text-white/[.04]" mono animate={false} />
      <div className="relative mx-auto grid max-w-7xl gap-14 px-4 sm:px-6 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
        <div>
          <SectionLabel light>Begin here</SectionLabel>
          <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-balance sm:text-5xl">
            Let&rsquo;s plan the support <em className="text-blush">you</em> deserve.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/70">
            Share a little about your family and timing. Jamie reviews each inquiry personally and follows up to schedule a
            consultation.
          </p>
          <ol className="mt-10 space-y-5">
            {["Send your inquiry", "Talk through needs & schedule", "Receive your client agreement", "Care begins"].map((s, i) => (
              <li key={s} className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-blush/40 font-display text-blush">{i + 1}</span>
                <span className="text-white/85">{s}</span>
              </li>
            ))}
          </ol>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="mt-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/20">
            <Instagram className="h-4 w-4" /> Prefer to DM? {INSTAGRAM_HANDLE}
          </a>
        </div>

        <div className="rounded-[2rem] bg-cream p-6 text-ink shadow-2xl sm:p-10">
          <AnimatePresence mode="wait">
            {state === "done" ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex min-h-[28rem] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-teal text-white"><Check className="h-8 w-8" /></span>
                <h3 className="mt-6 font-display text-3xl text-teal-ink">Thank you, your inquiry is in.</h3>
                <p className="mt-3 max-w-sm text-mist">Jamie will be in touch soon. In the meantime, rest if you can.</p>
              </motion.div>
            ) : (
              <motion.form key="form" onSubmit={onSubmit} className="space-y-5">
                <fieldset>
                  <legend className="text-sm font-semibold text-teal-ink">I&rsquo;m interested in</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {interests.map((t) => {
                      const on = picked.includes(t);
                      return (
                        <button
                          type="button"
                          key={t}
                          onClick={() => toggle(t)}
                          aria-pressed={on}
                          className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${on ? "bg-lotus text-white" : "bg-white text-teal-ink ring-1 ring-teal/15 hover:ring-lotus"}`}
                        >
                          {on && <Check className="-ml-0.5 mr-1 inline h-3.5 w-3.5" />}
                          {t}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block"><span className="text-sm font-semibold text-teal-ink">Name</span><input name="name" required autoComplete="name" className={`${input} mt-2`} /></label>
                  <label className="block"><span className="text-sm font-semibold text-teal-ink">Email</span><input name="email" type="email" required autoComplete="email" className={`${input} mt-2`} /></label>
                  <label className="block"><span className="text-sm font-semibold text-teal-ink">Phone <span className="font-normal text-mist">(optional)</span></span><input name="phone" type="tel" autoComplete="tel" className={`${input} mt-2`} /></label>
                  <label className="block">
                    <span className="text-sm font-semibold text-teal-ink">Location</span>
                    <select name="region" className={`${input} mt-2`} defaultValue="">
                      <option value="" disabled>Select…</option>
                      <option>Sacramento area</option>
                      <option>San Francisco Bay Area</option>
                      <option>Other / travel</option>
                    </select>
                  </label>
                  <label className="block"><span className="text-sm font-semibold text-teal-ink">Due date or baby&rsquo;s birthday</span><input name="date" type="date" className={`${input} mt-2`} /></label>
                  <label className="block">
                    <span className="text-sm font-semibold text-teal-ink">Expecting</span>
                    <select name="multiples" className={`${input} mt-2`} defaultValue="One baby">
                      <option>One baby</option><option>Twins</option><option>Triplets or more</option><option>Not applicable (doula / mentorship)</option>
                    </select>
                  </label>
                </div>
                <label className="block"><span className="text-sm font-semibold text-teal-ink">Tell us about your family & needs</span><textarea name="message" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className={`${input} mt-2 resize-none`} placeholder="Schedule you have in mind, any questions…" /></label>
                <input type="text" name="company" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
                <button disabled={state === "loading"} className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-lotus px-7 py-4 font-semibold text-white shadow-lg shadow-lotus/30 transition hover:bg-lotus-deep disabled:opacity-60">
                  {state === "loading" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 transition group-hover:translate-x-1" />}
                  Send inquiry
                </button>
                {state === "error" && (
                  <p className="text-center text-sm text-lotus-deep">
                    {error} Please DM <a href={INSTAGRAM_URL} className="underline" target="_blank" rel="noreferrer">{INSTAGRAM_HANDLE}</a> on Instagram.
                  </p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
