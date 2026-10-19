"use client";

import { Plus } from "lucide-react";

interface AddSpendingFabProps {
  /** Opens the one shared Add spending form. */
  onOpen: () => void;
}

/**
 * Floating "+" for adding spending. It owns no form of its own — both this and
 * the top button open the same AddSpendingModal instance.
 */
export function AddSpendingFab({ onOpen }: AddSpendingFabProps) {
  return (
    <button
      onClick={onOpen}
      aria-label="Add spending"
      title="Add spending"
      className="fixed bottom-5 right-5 z-[70] flex size-14 items-center justify-center rounded-full bg-bone text-ink shadow-xl shadow-black/50 transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={26} strokeWidth={2.75} />
    </button>
  );
}
