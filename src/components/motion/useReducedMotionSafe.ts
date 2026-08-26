"use client";

import { useReducedMotion } from "framer-motion";

/**
 * Thin wrapper so every scene reads reduced-motion preference the
 * same way, and so we have one place to change the fallback later.
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
