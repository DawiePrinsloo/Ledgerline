"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderPlus, X } from "lucide-react";
import { parseDollarsToCents } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import { cn } from "@/lib/utils";
import type { Kind } from "@/lib/types";

const ICONS = [
  { key: "home", emoji: "🏠" }, { key: "cart", emoji: "🛒" },
  { key: "coffee", emoji: "☕" }, { key: "car", emoji: "🚗" },
  { key: "zap", emoji: "⚡" }, { key: "heart", emoji: "❤️" },
  { key: "repeat", emoji: "🔄" }, { key: "sparkles", emoji: "✨" },
  { key: "bag", emoji: "🛍️" }, { key: "briefcase", emoji: "💼" },
  { key: "plane", emoji: "✈️" }, { key: "shield", emoji: "🛡️" },
];

const COLORS = [
  "#E8E3D5", "#C6F24E", "#FF9E6B", "#7EC8E3",
  "#FFD84D", "#FFB3C7", "#FF6B81", "#B79CFF",
  "#8FE3B0", "#F59E0B", "#60A5FA", "#A78BFA",
];

export interface NewCategoryPayload {
  name: string;
  icon: string;
  color: string;
  budgetCents: number;
  kind: Kind;
}

interface ManageCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (cat: NewCategoryPayload) => void;
}

export function ManageCategoryModal({ open, onClose, onSave }: ManageCategoryModalProps) {
  const { code } = useCurrency();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("expense");
  const [budget, setBudget] = useState("");
  const [icon, setIcon] = useState("sparkles");
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(""); setKind("expense"); setBudget("");
      setIcon("sparkles"); setColor(COLORS[0]); setError("");
    }
  }, [open]);

  const submit = () => {
    if (!name.trim()) return setError("Give this category a name.");
    const budgetCents = kind === "expense"
      ? (parseDollarsToCents(budget) ?? 0)
      : 0;
    if (kind === "expense" && budget && budgetCents === null)
      return setError("Enter a valid monthly budget, or leave blank for no limit.");
    onSave({ name: name.trim().slice(0, 24), icon, color, budgetCents, kind });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="scroll-slim relative max-h-[90vh] w-full max-w-[420px] overflow-y-auto border border-linebright bg-panel p-5 shadow-2xl shadow-black/70 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-bone">
                <FolderPlus size={15} className="text-lime" />
                New category
              </h2>
              <button onClick={onClose} aria-label="Close" className="shrink-0 p-1 text-mist hover:text-bone">
                <X size={15} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-[2px] border border-linebright p-[2px]">
              {(["expense", "income"] as Kind[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  className={cn(
                    "py-2 text-[11px] font-medium tracking-[0.15em] transition-colors",
                    kind === k
                      ? k === "expense" ? "bg-lime text-limedark" : "bg-mint text-ink"
                      : "text-mist hover:text-fog"
                  )}
                >
                  {k === "expense" ? "Spending" : "Income"}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">Category name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={24}
                placeholder="e.g. Gym, Pets, Education"
                className="mt-1.5 w-full border-b border-linebright bg-transparent pb-1.5 text-[15px] text-bone outline-none placeholder:text-mist/50 focus:border-lime"
              />
            </label>

            {kind === "expense" && (
              <label className="mt-5 block">
                <span className="text-[11px] font-medium text-fog">Monthly budget <span className="text-mist">(optional)</span></span>
                <span className="mt-1.5 flex items-baseline gap-2 border-b border-linebright pb-1.5 focus-within:border-lime">
                  <span className="font-mono text-lg text-mist">{symbolFor(code)}</span>
                  <input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value.replace(/[^0-9.,]/g, ""))}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="tabular w-full bg-transparent font-mono text-[20px] text-bone outline-none placeholder:text-mist/40"
                  />
                </span>
              </label>
            )}

            <div className="mt-5">
              <span className="text-[11px] font-medium text-fog">Icon</span>
              <div className="mt-2 grid grid-cols-6 gap-1.5">
                {ICONS.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setIcon(g.key)}
                    className={cn(
                      "flex items-center justify-center border py-2 text-[18px] transition-colors",
                      icon === g.key ? "border-lime bg-lime/10" : "border-line hover:border-linebright"
                    )}
                  >
                    {g.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className="text-[11px] font-medium text-fog">Colour</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn("size-8 rounded-full transition-transform hover:scale-110", color === c && "ring-2 ring-white ring-offset-2 ring-offset-panel scale-110")}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 min-h-4 text-[11.5px] text-rose">{error}</div>

            <div className="mt-2 flex items-center justify-end gap-3">
              <button onClick={onClose} className="px-4 py-3 text-[12px] text-mist hover:text-bone">Cancel</button>
              <button onClick={submit} className="bg-lime px-6 py-3 text-[12px] font-semibold text-limedark hover:-translate-y-0.5 transition-transform">
                Add category
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
