"use client";

// Premium motion + interaction primitives layered on top of the base
// FadeIn/Stagger set. These implement the "high-end feel" layer: magnetic
// buttons, 3D tilt cards, and refined layout-morphing KPI cards.
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  useRef,
  type CSSProperties,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type { LucideIcon } from "lucide-react";
import { TrendingDown, TrendingUp, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Counter } from "./shared";

export const premiumEase = [0.22, 1, 0.36, 1] as const;

/* ------------------------------ Magnetic ------------------------------ */
/* Smooth, subtle pull-toward-cursor interaction for buttons and controls. */
export function Magnetic({ children, strength = 0.25, className, style }: { children: ReactNode; strength?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 200, damping: 18, mass: 0.4 });
  const y = useSpring(0, { stiffness: 200, damping: 18, mass: 0.4 });

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
      className={className}
      style={{ x, y, display: "inline-flex", ...style }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------ TiltCard ------------------------------ */
/* Pointer-driven 3D tilt with a soft light that follows the cursor. */
export function TiltCard({ children, intensity = 6, className, style }: { children: ReactNode; intensity?: number; className?: string; style?: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(py, [0, 1], [intensity, -intensity]), { stiffness: 250, damping: 20 });
  const rotateY = useSpring(useTransform(px, [0, 1], [-intensity, intensity]), { stiffness: 250, damping: 20 });

  // Light sheen that drifts opposite to the tilt, scaled to a 2x-oversized layer.
  const glowX = useTransform(px, [0, 1], [12, -12]);
  const glowY = useTransform(py, [0, 1], [12, -12]);

  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onLeave() {
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
        perspective: 900,
        ...(style as object),
      }}
      className={className}
    >
      <motion.div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          background: "radial-gradient(180px circle at 50% 0%, rgba(255,255,255,0.85), transparent 60%)",
          x: glowX,
          y: glowY,
          scale: 2.2,
        }}
      />
      <div style={{ transform: "translateZ(20px)", position: "relative" }}>{children}</div>
    </motion.div>
  );
}

/* ------------------------------ KpiCard ------------------------------- */
export type Kpi = {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  sub: string;
  icon: LucideIcon;
  tone: string;
};

export function KpiCard({ item, index = 0, selected, onSelect }: { item: Kpi; index?: number; selected?: boolean; onSelect?: (label: string) => void }) {
  const { label, value, trend, up, sub, icon: Icon, tone } = item;
  return (
    <motion.button
      type="button"
      className={cn("kx-kpi", selected && "is-selected")}
      onClick={() => onSelect?.(label)}
      initial={{ opacity: 0, y: 26, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay: index * 0.07, ease: premiumEase }}
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="kx-kpi-sheen" aria-hidden />
      <span className={`kx-kpi-iconwrap tone-${tone}`}>
        <Icon size={19} strokeWidth={1.75} />
      </span>
      <span className="kx-kpi-label">{label}</span>
      <strong className="kx-kpi-value">
        <Counter value={value} />
      </strong>
      <span className={`kx-kpi-trend ${up ? "up" : "down"}`}>
        {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
        <b>{trend}</b>
        <small>{sub}</small>
      </span>
      <MoreHorizontal className="kx-kpi-more" size={16} />
    </motion.button>
  );
}

export { Counter };
