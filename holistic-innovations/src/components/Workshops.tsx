import { CalendarHeart } from "lucide-react";
import { workshopTopics } from "@/lib/content";
import Reveal from "./Reveal";
import WorkshopCTA from "./WorkshopCTA";

export default function Workshops() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blush via-blush-soft to-white p-8 sm:p-14">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-lotus/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-lotus shadow">
                  <CalendarHeart className="h-6 w-6" />
                </span>
                <h2 className="mt-6 font-display text-4xl font-medium leading-tight text-teal-ink text-balance">Workshops, in development</h2>
                <p className="mt-4 text-lg text-ink/75">
                  Virtual group workshops and private educational sessions are planned as the guide series grows. Tell us what you
                  want to learn and you&rsquo;ll be the first invited.
                </p>
                <WorkshopCTA />
              </div>
              <ul className="flex flex-wrap gap-3">
                {workshopTopics.map((t, i) => (
                  <li
                    key={t}
                    className="rounded-2xl bg-white/80 px-5 py-4 font-display text-xl text-teal-ink shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg"
                    style={{ transform: `rotate(${[-2, 1.5, -1, 2, -1.5][i]}deg)` }}
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
