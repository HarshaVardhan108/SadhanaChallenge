"use client";

import { AnimatePresence, motion } from "framer-motion";

/** Elegant feedback when a spiritual activity is completed as an offering. */
export function OfferingToast({
  show,
  message = "Offering accepted by Krishna 🙏",
}: {
  show: boolean;
  message?: string;
}) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 320, damping: 24 }}
          className="pointer-events-none fixed bottom-24 left-1/2 z-[100] -translate-x-1/2"
          role="status"
          aria-live="polite"
        >
          <div className="glass-strong flex items-center gap-3 rounded-2xl border border-gold/60 px-5 py-3 shadow-2xl">
            <span className="animate-diya text-2xl">🪔</span>
            <div>
              <p className="font-serif font-bold text-krishna">{message}</p>
              <p className="text-xs text-peacock">May this bring joy to the Lord</p>
            </div>
            <span className="text-xl animate-float">🪷</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
