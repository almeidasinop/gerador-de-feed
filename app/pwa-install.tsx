"use client";
import { useEffect, useState } from "react";

export default function PwaInstall() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = (e: Event) => {
      const ev = e as BeforeInstallPromptEvent;
      if (typeof ev.prompt !== "function") return;
      if (typeof ev.preventDefault === "function") {
        ev.preventDefault();
      }
      setPromptEvent(ev);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);
  const install = async () => {
    if (!promptEvent) return;
    setVisible(false);
    await promptEvent.prompt();
    setPromptEvent(null);
  };
  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow dark:border-zinc-800 dark:bg-zinc-900">
      <button onClick={install} className="font-medium text-zinc-900 hover:underline dark:text-zinc-50">Instalar aplicativo</button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
}