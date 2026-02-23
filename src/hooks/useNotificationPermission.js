// src/hooks/useNotificationPermission.js
import { useState, useCallback, useRef } from "react";

export function useNotificationPermission() {
  const supported = typeof window !== "undefined" && "Notification" in window;

  const [permission, setPermission] = useState(() =>
    supported ? Notification.permission : "unsupported"
  );
  const [showModal, setShowModal] = useState(false);

  // Store the pending promise resolver in a ref (not window global)
  const resolveRef = useRef(null);

  /**
   * Call this before scheduling a reminder.
   * - If already granted  → resolves true immediately
   * - If denied           → resolves false immediately
   * - If default (unknown) → shows our custom modal first, THEN
   *   triggers the browser prompt when user clicks "Allow"
   */
  const requestPermissionIfNeeded = useCallback(() => {
    return new Promise((resolve) => {
      if (!supported) {
        resolve(false);
        return;
      }
      if (Notification.permission === "granted") {
        resolve(true);
        return;
      }
      if (Notification.permission === "denied") {
        // Can't re-ask; permission was previously denied
        resolve(false);
        return;
      }
      // permission === "default" → show our pretty modal
      resolveRef.current = resolve;
      setShowModal(true);
    });
  }, [supported]);

  function onAllow() {
    setShowModal(false);
    // Now trigger the real browser permission prompt
    Notification.requestPermission().then((result) => {
      setPermission(result);
      resolveRef.current?.(result === "granted");
      resolveRef.current = null;
    });
  }

  function onDismiss() {
    setShowModal(false);
    resolveRef.current?.(false);
    resolveRef.current = null;
  }

  return { permission, showModal, requestPermissionIfNeeded, onAllow, onDismiss };
}