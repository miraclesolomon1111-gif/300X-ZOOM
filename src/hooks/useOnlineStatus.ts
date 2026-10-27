import { useState, useEffect } from "react";

export function useOnlineStatus() {
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  const [isForcedOffline, setIsForcedOffline] = useState<boolean>(() => {
    try {
      return localStorage.getItem("clearcam_force_offline") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const toggleForceOffline = () => {
    setIsForcedOffline((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("clearcam_force_offline", String(next));
      } catch {}
      return next;
    });
  };

  const effectiveOnline = isBrowserOnline && !isForcedOffline;

  return {
    isBrowserOnline,
    isForcedOffline,
    effectiveOnline,
    toggleForceOffline,
  };
}
