"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Target, X } from "lucide-react";
import { parseDollarsToCents, moneyWhole } from "@/lib/format";
import { symbolFor } from "@/lib/currencies";
import { useCurrency } from "@/lib/currency-context";
import type { GoalDTO } from "@/lib/types";
import { cn } from "@/lib/utils";

const GOAL_ICONS = [
  { key: "plane", emoji: "✈️", label: "Travel" },
  { key: "shield", emoji: "🛡️", label: "Emergency" },
  { key: "armchair", emoji: "🪑", label: "Home" },
  { key: "heart", emoji: "❤️", label: "Health" },
  { key: "sparkles", emoji: "✨", label: "Personal" },
  { key: "briefcase", emoji: "💼", label: "Career" },
  { key: "cart", emoji: "🛒", label: "Big purchase" },
  { key: "home", emoji: "🏠", label: "Housing" },
];

const GOAL_COLORS = [
  "#7EC8E3", "#C6F24E", "#FF9E6B", "#B79CFF",
  "#FF6B81", "#FFD84D", "#8FE3B0", "#FFB3C7",
];

interface ManageGoalModalProps {
  open: boolean;
  editing: GoalDTO | null;
  onClose: () => void;
  onSave: (goal: Omit<GoalDTO, "id" | "savedCents">) => void;
  onDelete?: (goalId: number) => void;
}

export function ManageGoalModal({
  open,
  editing,
  onClose,
  onSave,
  onDelete,
}: ManageGoalModalProps) {
  const { code } = useCurrency();
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [label, setLabel] = useState("");
  const [icon, setIcon] = useState("plane");
  const [color, setColor] = useState(GOAL_COLORS[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      if (editing) {
        setName(editing.name);
        setTarget((editing.targetCents / 100).toString());
        setLabel(editing.targetLabel ?? "");
        setIcon(editing.icon);
        setColor(editing.color);
      } else {
        setName("");
        setTarget("");
        setLabel("");
        setIcon("plane");
        setColor(GOAL_COLORS[0]);
      }
      setError("");
    }
  }, [open, editing]);

  const submit = () => {
    if (!name.trim()) return setError("Give your goal a name.");
    const targetCents = parseDollarsToCents(target);
    if (targetCents === null || targetCents <= 0)
      return setError("Enter a target amount, for example 5000.");
    onSave({
      name: name.trim().slice(0, 40),
      targetCents,
      targetLabel: label.trim().slice(0, 30) || null,
      icon,
      color,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center p-3 sm:items-center sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/75 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="scroll-slim relative max-h-[90vh] w-full max-w-[430px] overflow-y-auto border border-linebright bg-panel p-5 shadow-2xl shadow-black/70 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold text-bone">
                <Target size={15} className="text-lime" />
                {editing ? "Edit savings goal" : "New savings goal"}
              </h2>
              <button onClick={onClose} aria-label="Close" className="shrink-0 p-1 text-mist hover:text-bone">
                <X size={15} />
              </button>
            </div>

            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">What are you saving for?</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                maxLength={40}
                placeholder="e.g. Japan holiday, New car, Emergency fund"
                className="mt-1.5 w-full border-b border-linebright bg-transparent pb-1.5 text-[15px] text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-lime"
              />
            </label>

            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">Target amount</span>
              <span className="mt-1.5 flex items-baseline gap-2 border-b border-linebright pb-1.5 focus-within:border-lime">
                <span className="font-mono text-lg text-mist">{symbolFor(code)}</span>
                <input
                  value={target}
                  onChange={(e) => { setTarget(e.target.value.replace(/[^0-9.,]/g, "")); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  inputMode="decimal"
                  placeholder="0.00"
                  className="tabular w-full bg-transparent font-mono text-[22px] text-bone outline-none placeholder:text-mist/40"
                />
              </span>
            </label>

            <label className="mt-5 block">
              <span className="text-[11px] font-medium text-fog">Short description (optional)</span>
              <input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={30}
                placeholder="e.g. Flights + 7 nights, 6-month buffer"
                className="mt-1.5 w-full border-b border-linebright bg-transparent pb-1.5 text-[13px] text-bone outline-none transition-colors placeholder:text-mist/50 focus:border-lime"
              />
            </label>

            <div className="mt-5">
              <span className="text-[11px] font-medium text-fog">Icon</span>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {GOAL_ICONS.map((g) => (
                  <button
                    key={g.key}
                    onClick={() => setIcon(g.key)}
                    className={cn(
                      "flex flex-col items-center gap-1 border py-2 text-[20px] transition-colors",
                      icon === g.key ? "border-lime bg-lime/10" : "border-line text-fog hover:border-linebright"
                    )}
                  >
                    {g.emoji}
                    <span className="text-[9px] text-mist">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <span className="text-[11px] font-medium text-fog">Colour</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {GOAL_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "size-8 rounded-full transition-transform hover:scale-110",
                      color === c && "ring-2 ring-offset-2 ring-offset-panel ring-white scale-110"
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 min-h-4 text-[11.5px] text-rose">{error}</div>

            <div className="mt-2 flex items-center justify-between gap-3">
              {editing && onDelete && (
                <button
                  onClick={() => { if (window.confirm(`Delete "${editing.name}"?`)) { onDelete(editing.id); onClose(); } }}
                  className="text-[11.5px] text-rose/70 underline decoration-dotted underline-offset-4 hover:text-rose"
                >
                  Delete goal
                </button>
              )}
              <div className={cn("flex items-center gap-3", !editing && "ml-auto")}>
                <button onClick={onClose} className="px-4 py-3 text-[12px] text-mist hover:text-bone">Cancel</button>
                <button
                  onClick={submit}
                  className="bg-lime px-6 py-3 text-[12px] font-semibold text-limedark hover:-translate-y-0.5 transition-transform"
                >
                  {editing ? "Save changes" : "Create goal"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
