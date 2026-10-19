"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

export interface ToastItem {
  id: number;
  msg: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[95] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="pointer-events-auto flex items-center gap-3 border border-linebright bg-raise px-4 py-3 font-mono text-[10.5px] tracking-[0.15em] text-bone shadow-2xl shadow-black/60"
          >
            <Check size={13} className="shrink-0 text-lime" />
            <span>{t.msg}</span>
            {t.actionLabel && (
              <button
                onClick={() => {
                  t.onAction?.();
                  onDismiss(t.id);
                }}
                className="ml-1 text-lime underline decoration-lime/50 underline-offset-4 transition-colors hover:decoration-lime"
              >
                {t.actionLabel}
              </button>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
