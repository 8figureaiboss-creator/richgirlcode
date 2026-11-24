import { Globe } from "lucide-react";
import Instagram from "./InstagramIcon";
import { INSTAGRAM_URL, INSTAGRAM_HANDLE } from "@/lib/content";
import Lotus from "./Lotus";

export default function Footer() {
  return (
    <footer className="bg-cream pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Lotus className="h-14 w-14" animate={false} />
              <div>
                <p className="font-display text-2xl text-teal-ink">Holistic Innovations LLC</p>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lotus">Holistic Wellness for Women</p>
              </div>
            </div>
            <p className="mt-6 max-w-sm leading-relaxed text-mist">
              Compassionate maternal wellness care, specialized newborn services, professional mentorship and education to support
              women and families through life&rsquo;s transitions.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-ink">Explore</p>
            <ul className="mt-4 space-y-2.5 text-mist">
              {[["#services", "Services"], ["#planner", "Care Planner"], ["#journey", "Fourth Trimester"], ["#about", "About Jamie"], ["#mentorship", "Doula Mentorship"], ["#faq", "FAQ"]].map(([h, l]) => (
                <li key={h}><a href={h} className="transition hover:text-lotus">{l}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-ink">Connect</p>
            <ul className="mt-4 space-y-2.5 text-mist">
              <li><a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-lotus"><Instagram className="h-4 w-4" /> {INSTAGRAM_HANDLE}</a></li>
              <li><a href="https://www.holisticinnovationsllc.com" className="inline-flex items-center gap-2 transition hover:text-lotus"><Globe className="h-4 w-4" /> holisticinnovationsllc.com</a></li>
              <li>Sacramento & San Francisco Bay Area</li>
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-teal/10 pt-8 text-xs text-mist sm:flex-row">
          <p>© {new Date().getFullYear()} Holistic Innovations LLC. Established 2020.</p>
          <p className="max-w-xl sm:text-right">Services are nonmedical and do not replace care from a licensed healthcare provider.</p>
        </div>
      </div>
    </footer>
  );
}
