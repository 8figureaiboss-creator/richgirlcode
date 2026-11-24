"use client";
import { motion, type HTMLMotionProps } from "framer-motion";

export default function Reveal({ delay = 0, y = 28, ...props }: HTMLMotionProps<"div"> & { delay?: number; y?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      {...props}
    />
  );
}

export function SectionLabel({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p className={`mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] ${light ? "text-blush" : "text-teal"}`}>
      <span className={`h-px w-8 ${light ? "bg-blush" : "bg-lotus"}`} />
      {children}
    </p>
  );
}
