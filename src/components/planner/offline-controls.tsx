"use client";

import { useEffect, useState } from "react";
import { HardDrive, RefreshCcw, Smartphone, Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface OfflineControlsProps {
  saved: boolean;
  onStartFresh: () => void;
}

export function OfflineControls({ saved, onStartFresh }: OfflineControlsProps) {
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installHelp, setInstallHelp] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("beforeinstallprompt", onInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("beforeinstallprompt", onInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) {
      setInstallHelp((v) => !v);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstallPrompt(null);
  };

  return (
    <section className="border border-line bg-coal">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2.5 sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center border border-line text-lime">
            <HardDrive size={13} />
          </span>
          <div className="min-w-0">
            <div className="text-[11.5px] font-medium text-bone">
              {saved ? "Saved on this device" : "Preparing your private planner…"}
            </div>
            <div className="flex items-center gap-1 text-[9.5px] text-mist">
              {online ? <Wifi size={10} /> : <WifiOff size={10} />}
              {online
                ? "Ready to work offline — your data is not shared"
                : "Offline now — every planner feature still works"}
            </div>
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          {!installed && (
            <button
              onClick={install}
              className="inline-flex items-center gap-1.5 border border-lime/60 px-2.5 py-1.5 text-[10.5px] font-medium text-lime transition-colors hover:bg-lime hover:text-limedark"
            >
              <Smartphone size={12} />
              Install app
            </button>
          )}
          <button
            onClick={onStartFresh}
            title="Remove all demo entries and savings from this device"
            className="inline-flex items-center gap-1.5 border border-line px-2.5 py-1.5 text-[10.5px] text-mist transition-colors hover:border-rose hover:text-rose"
          >
            <RefreshCcw size={12} />
            Start fresh
          </button>
        </div>
      </div>

      {installHelp && !installed && (
        <div className="border-t border-line px-4 py-2.5 text-[11px] leading-relaxed text-fog">
          <strong className="font-semibold text-bone">Install on this device:</strong>{" "}
          open your browser menu and choose <em>Add to Home Screen</em> or{" "}
          <em>Install app</em>. Open Ledgerline once while online; after that it works
          without internet.
          <button
            onClick={() => setInstallHelp(false)}
            className={cn("ml-2 text-lime underline underline-offset-2")}
          >
            Hide
          </button>
        </div>
      )}
    </section>
  );
}
