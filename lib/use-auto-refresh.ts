"use client";

import { useEffect, useRef } from "react";

export function notifyDataChanged() {
  window.dispatchEvent(new Event("dw-data-changed"));
}

type RefreshReason = "focus" | "data-changed";

export function useAutoRefresh(
  refresh: (reason: RefreshReason) => void | Promise<void>,
) {
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = (reason: RefreshReason) => {
      if (document.visibilityState === "hidden") return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        void refreshRef.current(reason);
      }, 150);
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") scheduleRefresh("focus");
    };

    const handleFocus = () => scheduleRefresh("focus");
    const handleDataChanged = () => scheduleRefresh("data-changed");
    window.addEventListener("focus", handleFocus);
    window.addEventListener("dw-data-changed", handleDataChanged);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("dw-data-changed", handleDataChanged);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
