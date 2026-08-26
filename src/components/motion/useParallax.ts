"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks normalized pointer position (-0.5 .. 0.5 on each axis) for
 * subtle cursor-driven parallax. Returns zero on touch-only devices
 * and disables itself under prefers-reduced-motion.
 */
export function usePointerParallax(strength = 1) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (reduced) return;

    const handleMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * strength;
        const y = (e.clientY / window.innerHeight - 0.5) * strength;
        setOffset({ x, y });
      });
    };

    window.addEventListener("pointermove", handleMove);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [strength]);

  return offset;
}
