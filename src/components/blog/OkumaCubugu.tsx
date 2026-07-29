"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/** Sayfanın en üstünde ilerleyen okuma göstergesi. */
export function OkumaCubugu() {
  const { scrollYProgress } = useScroll();
  const yumusak = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX: yumusak }}
      className="fixed inset-x-0 top-0 z-60 h-1 origin-left bg-gradient-to-r
        from-sari-400 via-sari-500 to-sari-700"
    />
  );
}
