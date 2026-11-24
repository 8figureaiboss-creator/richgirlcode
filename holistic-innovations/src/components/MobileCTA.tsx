"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarHeart, Calculator } from "lucide-react";

export default function MobileCTA() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const inquire = document.getElementById("inquire");
      const nearForm = inquire ? inquire.getBoundingClientRect().top < window.innerHeight : false;
      setShow(window.scrollY > 700 && !nearForm);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed inset-x-3 bottom-3 z-40 flex gap-2 rounded-full bg-white/90 p-1.5 shadow-2xl shadow-teal-ink/20 ring-1 ring-teal/10 backdrop-blur-xl lg:hidden"
        >
          <a href="#planner" className="flex flex-1 items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-teal-ink">
            <Calculator className="h-4 w-4" /> Estimate
          </a>
          <a href="#inquire" className="flex flex-[1.4] items-center justify-center gap-2 rounded-full bg-lotus py-3 text-sm font-semibold text-white">
            <CalendarHeart className="h-4 w-4" /> Book a consultation
          </a>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
