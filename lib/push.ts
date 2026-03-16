import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return true;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const email = process.env.VAPID_EMAIL || "arieltsume@gmail.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] Missing VAPID keys — push notifications disabled");
    return false;
  }

  webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

/**
 * Send a push notification to all subscriptions for a given player.
 * Silently removes expired/invalid subscriptions (410 Gone).
 */
export async function sendPushToPlayer(
  playerId: string,
  title: string,
  body: string,
  url?: string
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) {
    return { sent: 0, failed: 0 };
  }

  const supabase = createAdminClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("player_id", playerId);

  if (error) {
    console.error("[push] Error fetching subscriptions:", error);
    return { sent: 0, failed: 0 };
  }

  if (!subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const payload: PushPayload = {
    title,
    body,
    icon: "/copaomega-logo.png",
    url,
  };

  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          JSON.stringify(payload)
        );
        sent++;
      } catch (err: unknown) {
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;

        if (statusCode === 404 || statusCode === 410) {
          // Subscription expired or unsubscribed — remove it
          expiredIds.push(sub.id);
        } else {
          console.error(
            `[push] Failed to send to ${sub.endpoint}:`,
            err
          );
        }
        failed++;
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", expiredIds);
  }

  return { sent, failed };
}
