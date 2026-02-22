// src/hooks/useNotificationPermission.js
// Usage: call requestPermissionIfNeeded() before adding a reminder
import { useState, useCallback } from "react";

export function useNotificationPermission() {
  const supported = typeof window !== "undefined" && "Notification" in window;

  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : "unsupported"
  );
  const [showModal, setShowModal] = useState(false);

  // Resolves true if granted, false otherwise
  const requestPermissionIfNeeded = useCallback(() => {
    return new Promise((resolve) => {
      if (!supported) { resolve(false); return; }
      if (Notification.permission === "granted") { resolve(true); return; }
      if (Notification.permission === "denied")  { resolve(false); return; }
      // permission is "default" — show our modal first
      setShowModal(true);
      // The modal will call onAllow or onDismiss which resolve this promise
      window.__notifResolve = resolve;
    });
  }, [supported]);

  function onAllow() {
    setShowModal(false);
    Notification.requestPermission().then((result) => {
      setPermission(result);
      window.__notifResolve?.(result === "granted");
      delete window.__notifResolve;
    });
  }

  function onDismiss() {
    setShowModal(false);
    window.__notifResolve?.(false);
    delete window.__notifResolve;
  }

  return { permission, showModal, requestPermissionIfNeeded, onAllow, onDismiss };
}