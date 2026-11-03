"use client";

import { useEffect } from "react";

// Registers public/sw.js, which only shows an offline page when the
// installed app is opened without a connection. Production only: in dev it
// would keep serving that page after you restart the server.
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {
        // Not fatal: the app works without it, just not offline.
      });
  }, []);

  return null;
}
