"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/** globals.css'teki --ease-yumusak ile aynı eğri. */
const YUMUSAK: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Görünüm alanına girdiğinde bir kez yumuşakça belirir.
 * Hareket azaltma tercihi açıksa yalnızca opaklık geçişi uygulanır.
 */
export function Reveal({
  children,
  className,
  gecikme = 0,
  kaydir = 26,
  sure = 0.7,
}: {
  children: ReactNode;
  className?: string;
  gecikme?: number;
  kaydir?: number;
  sure?: number;
}) {
  const azalt = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: azalt ? 0 : kaydir }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: azalt ? 0.3 : sure, delay: gecikme, ease: YUMUSAK }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Alt öğelerini sırayla açan kapsayıcı. Çocuklar `<KademeliOge>` ile sarılmalı.
 */
export function Kademeli({
  children,
  className,
  aralik = 0.08,
  gecikme = 0,
  etiket = "div",
}: {
  children: ReactNode;
  className?: string;
  aralik?: number;
  gecikme?: number;
  etiket?: "div" | "ul" | "ol";
}) {
  const azalt = useReducedMotion();
  const kapsayici: Variants = {
    gizli: {},
    goruntu: {
      transition: {
        staggerChildren: azalt ? 0 : aralik,
        delayChildren: gecikme,
      },
    },
  };

  const Bilesen = etiket === "ul" ? motion.ul : etiket === "ol" ? motion.ol : motion.div;

  return (
    <Bilesen
      className={className}
      variants={kapsayici}
      initial="gizli"
      whileInView="goruntu"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </Bilesen>
  );
}

export function KademeliOge({
  children,
  className,
  kaydir = 22,
  etiket = "div",
}: {
  children: ReactNode;
  className?: string;
  kaydir?: number;
  etiket?: "div" | "li";
}) {
  const azalt = useReducedMotion();
  const oge: Variants = {
    gizli: { opacity: 0, y: azalt ? 0 : kaydir },
    goruntu: {
      opacity: 1,
      y: 0,
      transition: { duration: azalt ? 0.3 : 0.6, ease: YUMUSAK },
    },
  };

  const Bilesen = etiket === "li" ? motion.li : motion.div;

  return (
    <Bilesen className={className} variants={oge}>
      {children}
    </Bilesen>
  );
}
