"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Menu, X } from "lucide-react";
import Lotus from "./Lotus";

const links = [
  { href: "#services", label: "Services" },
  { href: "#planner", label: "Care Planner" },
  { href: "#journey", label: "Fourth Trimester" },
  { href: "#about", label: "About Jamie" },
  { href: "#mentorship", label: "Mentorship" },
  { href: "#guides", label: "Guides" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${scrolled ? "bg-cream/80 shadow-[0_1px_0_rgba(22,142,145,.12)] backdrop-blur-xl" : "bg-transparent"}`}>
      <nav className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <a href="#top" className="group flex items-center gap-2.5">
          <Lotus className="h-10 w-10 transition-transform duration-500 group-hover:rotate-[-8deg]" animate={false} />
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold tracking-tight text-teal-ink">Holistic Innovations</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-lotus">Wellness for Women</span>
          </span>
        </a>
        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/75 transition hover:bg-blush-soft hover:text-teal-ink">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <a href="#inquire" className="hidden rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal/20 transition hover:-translate-y-0.5 hover:bg-teal-deep sm:inline-flex">
            Book a consultation
          </a>
          <button onClick={() => setOpen(true)} className="rounded-full p-2.5 text-teal-ink hover:bg-blush-soft lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>
      <motion.div style={{ scaleX: progress }} className="h-[2px] origin-left bg-gradient-to-r from-lotus via-lotus to-teal" />
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-teal-ink px-6 pb-10 pt-6 text-white lg:hidden"
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-xl">Holistic Innovations</span>
              <button onClick={() => setOpen(false)} className="rounded-full p-2.5 hover:bg-white/10" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            <ul className="mt-12 space-y-2">
              {[...links, { href: "#inquire", label: "Book a consultation" }].map((l, i) => (
                <motion.li key={l.href} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <a href={l.href} onClick={() => setOpen(false)} className="block py-2 font-display text-3xl text-white/90 hover:text-blush">
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </ul>
            <Lotus className="mt-auto h-24 w-24 self-end text-white/20" mono arch={false} />
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
