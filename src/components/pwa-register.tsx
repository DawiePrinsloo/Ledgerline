"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.warn("Ledgerline offline service could not start", error);
    });
  }, []);
  return null;
}
