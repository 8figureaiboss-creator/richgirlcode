"use client";
import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";

export const PETAL = "M100 134 C 70 110, 72 64, 100 30 C 128 64, 130 110, 100 134 Z";
const ORIGIN = { transformBox: "view-box", transformOrigin: "100px 134px" } as const;

type Props = { className?: string; animate?: boolean; arch?: boolean; mono?: boolean };

export default function Lotus({ className, animate = true, arch = true, mono = false }: Props) {
  const reduce = useReducedMotion();
  const play = animate && !reduce;
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const back = [-66, -36, 36, 66];
  const front = [-18, 18, 0];
  const pink = mono ? "currentColor" : `url(#p${uid})`;
  const blush = mono ? "currentColor" : `url(#b${uid})`;
  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      {!mono && (
        <defs>
          <linearGradient id={`p${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f59ac0" />
            <stop offset="1" stopColor="#e05d93" />
          </linearGradient>
          <linearGradient id={`b${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fdeef3" />
            <stop offset="1" stopColor="#f3cad7" />
          </linearGradient>
        </defs>
      )}
      {arch && (
        <motion.path
          d="M34 152 A 74 74 0 1 1 166 152"
          fill="none"
          stroke={mono ? "currentColor" : "#168e91"}
          strokeWidth="3.5"
          strokeLinecap="round"
          initial={play ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.8, ease: "easeInOut" }}
        />
      )}
      {[...back.map((r) => ({ r, front: false })), ...front.map((r) => ({ r, front: true }))].map(({ r, front: f }, i) => (
        <g key={`${f}${r}`} transform={`rotate(${r} 100 134)`}>
          <motion.path
            d={PETAL}
            fill={f ? pink : blush}
            stroke={mono ? "none" : f ? "#fff" : "#e86b9d"}
            strokeOpacity={f ? 0.5 : 0.35}
            strokeWidth="1"
            opacity={mono ? (f ? 1 : 0.55) : 1}
            style={ORIGIN}
            initial={play ? { scale: 0.15, opacity: 0 } : false}
            animate={{ scale: f ? (r === 0 ? 1.04 : 0.94) : 0.86, opacity: mono ? (f ? 1 : 0.55) : 1 }}
            transition={{ delay: 0.35 + i * 0.09, duration: 1.2, ease }}
          />
        </g>
      ))}
      <motion.path
        d="M56 144 Q 100 160 144 144"
        fill="none"
        stroke={mono ? "currentColor" : "#168e91"}
        strokeWidth="3.5"
        strokeLinecap="round"
        initial={play ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ delay: 1.2, duration: 0.9 }}
      />
    </svg>
  );
}
