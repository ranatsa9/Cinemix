"use client";

import { motion } from "framer-motion";
import { ButtonHTMLAttributes, ReactNode, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type NativeButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDrag"
  | "onDragStart"
  | "onDragEnd"
>;

interface MagneticButtonProps extends NativeButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost";
}

export function MagneticButton({
  children,
  className,
  variant = "primary",
  ...props
}: MagneticButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setPos({ x: x * 0.25, y: y * 0.25 });
  };

  const handleLeave = () => setPos({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 200, damping: 15, mass: 0.4 }}
      whileTap={{ scale: 0.96 }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-3 rounded-full px-8 py-4 text-sm font-semibold tracking-[0.14em] uppercase transition-colors",
        variant === "primary"
          ? "bg-porcelain text-midnight hover:bg-gold"
          : "border border-porcelain/25 text-porcelain hover:border-porcelain/60",
        className
      )}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {variant === "primary" && (
        <motion.span
          className="pointer-events-none absolute inset-0 -z-0 rounded-full bg-gradient-to-r from-amber via-coral to-violet opacity-0 blur-md"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}
