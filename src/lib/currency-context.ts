"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY } from "./currencies";

export interface CurrencyCtx {
  code: string;
  setCode: (code: string) => void;
}

/** Default USD everywhere the provider doesn't reach (e.g. the landing case file). */
export const CurrencyContext = createContext<CurrencyCtx>({
  code: DEFAULT_CURRENCY,
  setCode: () => undefined,
});

export function useCurrency(): CurrencyCtx {
  return useContext(CurrencyContext);
}
