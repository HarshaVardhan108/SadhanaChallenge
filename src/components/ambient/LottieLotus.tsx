"use client";

import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import { motion } from "framer-motion";

/** Lightweight procedural lotus as Lottie-compatible JSON (no external CDN). */
function createLotusAnimation() {
  // Simple 2-layer blooming circle animation encoded as Lottie
  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 90,
    w: 200,
    h: 200,
    nm: "LotusBloom",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Petals",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: {
            a: 1,
            k: [
              { t: 0, s: [0], e: [360] },
              { t: 90, s: [360] },
            ],
          },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [70, 70, 100], e: [100, 100, 100] },
              { t: 45, s: [100, 100, 100], e: [90, 90, 100] },
              { t: 90, s: [90, 90, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "el",
            p: { a: 0, k: [0, -28] },
            s: { a: 0, k: [36, 56] },
          },
          {
            ty: "fl",
            c: { a: 0, k: [1, 0.75, 0.8, 1] },
            o: { a: 0, k: 85 },
          },
          {
            ty: "el",
            p: { a: 0, k: [24, -10] },
            s: { a: 0, k: [34, 52] },
          },
          {
            ty: "fl",
            c: { a: 0, k: [1, 0.7, 0.75, 1] },
            o: { a: 0, k: 80 },
          },
          {
            ty: "el",
            p: { a: 0, k: [-24, -10] },
            s: { a: 0, k: [34, 52] },
          },
          {
            ty: "fl",
            c: { a: 0, k: [1, 0.72, 0.78, 1] },
            o: { a: 0, k: 80 },
          },
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0,
      },
      {
        ddd: 0,
        ind: 2,
        ty: 4,
        nm: "Center",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [100, 100, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [80, 80, 100], e: [110, 110, 100] },
              { t: 45, s: [110, 110, 100], e: [100, 100, 100] },
              { t: 90, s: [100, 100, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "el",
            p: { a: 0, k: [0, 0] },
            s: { a: 0, k: [40, 40] },
          },
          {
            ty: "fl",
            c: { a: 0, k: [1, 0.835, 0.31, 1] },
            o: { a: 0, k: 100 },
          },
        ],
        ip: 0,
        op: 90,
        st: 0,
        bm: 0,
      },
    ],
  };
}

export function LottieLotus({
  className,
  size = 120,
}: {
  className?: string;
  size?: number;
}) {
  const [data, setData] = useState<object | null>(null);

  useEffect(() => {
    setData(createLotusAnimation());
  }, []);

  if (!data) {
    return (
      <motion.div
        className={className}
        style={{ width: size, height: size }}
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        <span className="text-6xl">🪷</span>
      </motion.div>
    );
  }

  return (
    <div className={className} style={{ width: size, height: size }}>
      <Lottie animationData={data} loop autoplay style={{ width: size, height: size }} />
    </div>
  );
}
