import { BadgeCheck, Quote } from "lucide-react";
import { credentials, expertise } from "@/lib/content";
import Lotus from "./Lotus";
import Reveal, { SectionLabel } from "./Reveal";

export default function About() {
  return (
    <section id="about" className="relative scroll-mt-20 overflow-hidden bg-blush-soft py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl gap-16 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <Reveal className="relative">
          <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-teal to-teal-ink shadow-2xl shadow-teal/30">
            <Lotus className="absolute -bottom-10 -right-10 h-80 w-80 text-white/10" mono animate={false} />
            <div className="absolute inset-0 flex flex-col justify-end p-8 text-white sm:p-10">
              <p className="font-display text-sm uppercase tracking-[0.3em] text-blush">Founder</p>
              <p className="mt-3 font-display text-5xl font-medium leading-none">Jamie<br />Madeline<br />Wilson</p>
              <ul className="mt-8 space-y-2.5">
                {credentials.map((c) => (
                  <li key={c} className="flex items-center gap-2.5 text-sm text-white/90">
                    <BadgeCheck className="h-4 w-4 shrink-0 text-blush" /> {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="absolute -right-2 top-8 hidden rounded-3xl bg-white p-5 shadow-xl sm:block lg:-right-6">
            <p className="font-display text-4xl text-lotus">8+</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-mist">years in practice</p>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <SectionLabel>Meet your specialist</SectionLabel>
            <h2 className="font-display text-4xl font-medium leading-tight tracking-tight text-teal-ink text-balance sm:text-5xl">
              Evidence-informed care with a <em className="text-lotus">holistic</em> heart.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 text-lg leading-relaxed text-ink/80">
              Jamie Madeline Wilson has spent more than eight years supporting mothers, newborns and families. She combines
              evidence-informed care with a holistic understanding of maternal wellness, and she brings the same calm, skilled
              presence to a 3 a.m. feed with twins as to a first latch.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">
              She founded Holistic Innovations in 2020 and is also founder and president of <strong className="text-teal-ink">WOMB Collective</strong>.
              She has mentored emerging doulas for years and supports private families across Sacramento and the San Francisco Bay Area.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap gap-2">
              {expertise.map((e) => (
                <span key={e} className="rounded-full bg-white px-4 py-2 text-sm font-medium text-teal-ink ring-1 ring-teal/10">{e}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={0.3}>
            <figure className="relative mt-10 rounded-3xl bg-white p-8 shadow-sm">
              <Quote className="absolute -top-4 left-8 h-9 w-9 rounded-full bg-lotus p-2 text-white" />
              <blockquote className="font-display text-xl italic leading-relaxed text-teal-ink">
                &ldquo;My work today includes specialized newborn care, postpartum and lactation support, and mentorship for
                emerging doulas, services I have developed through years of professional experience.&rdquo;
              </blockquote>
              <figcaption className="mt-4 text-sm font-semibold text-mist">Jamie Madeline Wilson, Founder</figcaption>
            </figure>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
