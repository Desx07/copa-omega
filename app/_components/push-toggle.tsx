"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

type PushState = "loading" | "unsupported" | "denied" | "enabled" | "disabled";

export default function PushToggle() {
  const [state, setState] = useState<PushState>("loading");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    checkCurrentState();
  }, []);

  async function checkCurrentState() {
    // Check browser support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    const permission = Notification.permission;
    if (permission === "denied") {
      setState("denied");
      return;
    }

    // Check if we already have an active subscription
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        setState(subscription ? "enabled" : "disabled");
      } else {
        setState("disabled");
      }
    } catch {
      setState("disabled");
    }
  }

  async function handleEnable() {
    setBusy(true);
    try {
      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // 2. Request notification permission
      const permission = await Notification.requestPermission();
      if (permission === "denied") {
        setState("denied");
        toast.error("Permiso de notificaciones denegado");
        return;
      }
      if (permission !== "granted") {
        toast.error("No se otorgo permiso de notificaciones");
        return;
      }

      // 3. Subscribe to Push API
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error("Error de configuracion: falta clave VAPID");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      // 4. Send subscription to our API
      const subJson = subscription.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error guardando suscripcion");
      }

      setState("enabled");
      toast.success("Notificaciones activadas!");
    } catch (err) {
      console.error("Push enable error:", err);
      toast.error(
        err instanceof Error ? err.message : "Error activando notificaciones"
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      if (registration) {
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          // Unsubscribe from Push API
          const endpoint = subscription.endpoint;
          await subscription.unsubscribe();

          // Remove from our backend
          await fetch("/api/push/unsubscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint }),
          });
        }
      }

      setState("disabled");
      toast.success("Notificaciones desactivadas");
    } catch (err) {
      console.error("Push disable error:", err);
      toast.error("Error desactivando notificaciones");
    } finally {
      setBusy(false);
    }
  }

  // -- Render --

  if (state === "loading") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-omega-muted" />
          <span className="text-sm text-omega-muted">Notificaciones push</span>
        </div>
        <Loader2 className="size-4 animate-spin text-omega-muted" />
      </div>
    );
  }

  if (state === "unsupported") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellOff className="size-4 text-omega-muted" />
          <span className="text-sm text-omega-muted">
            Tu navegador no soporta notificaciones push
          </span>
        </div>
      </div>
    );
  }

  if (state === "denied") {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BellOff className="size-4 text-omega-red" />
          <span className="text-sm text-omega-muted">
            Notificaciones bloqueadas en el navegador
          </span>
        </div>
      </div>
    );
  }

  const isEnabled = state === "enabled";

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {isEnabled ? (
          <Bell className="size-4 text-omega-green" />
        ) : (
          <BellOff className="size-4 text-omega-muted" />
        )}
        <span className="text-sm text-omega-muted">
          {isEnabled
            ? "Notificaciones push activadas"
            : "Notificaciones push desactivadas"}
        </span>
      </div>
      <button
        onClick={isEnabled ? handleDisable : handleEnable}
        disabled={busy}
        className={`w-10 h-6 rounded-full transition-all relative ${
          isEnabled ? "bg-omega-green" : "bg-omega-border"
        }`}
      >
        {busy ? (
          <Loader2 className="size-3 animate-spin absolute top-1.5 left-3.5 text-white" />
        ) : (
          <div
            className={`size-4 rounded-full bg-white absolute top-1 transition-all ${
              isEnabled ? "left-5" : "left-1"
            }`}
          />
        )}
      </button>
    </div>
  );
}

/**
 * Convert a URL-safe base64 string to a Uint8Array (for applicationServerKey).
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
