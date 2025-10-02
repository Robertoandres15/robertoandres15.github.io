export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationManager {
  private static instance: PushNotificationManager
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager()
    }
    return PushNotificationManager.instance
  }

  async initialize(): Promise<void> {
    console.log("[v0] Initializing push notification manager")

    if (!("serviceWorker" in navigator)) {
      console.error("[v0] Service workers not supported")
      throw new Error("Service workers are not supported")
    }

    if (!("PushManager" in window)) {
      console.error("[v0] Push manager not supported")
      throw new Error("Push notifications are not supported")
    }

    try {
      console.log("[v0] Waiting for service worker to be ready...")
      this.registration = await navigator.serviceWorker.ready
      console.log("[v0] Service worker ready for push notifications")
    } catch (error) {
      console.error("[v0] Service worker registration failed:", error)
      throw error
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    console.log("[v0] Requesting notification permission")

    if (!("Notification" in window)) {
      console.error("[v0] Notifications not supported")
      throw new Error("Notifications are not supported")
    }

    let permission = Notification.permission
    console.log("[v0] Current permission:", permission)

    if (permission === "default") {
      console.log("[v0] Requesting permission from user...")
      permission = await Notification.requestPermission()
      console.log("[v0] Permission result:", permission)
    }

    return permission
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    console.log("[v0] Starting push subscription process")

    if (!this.registration) {
      console.log("[v0] No registration, initializing...")
      await this.initialize()
    }

    if (!this.registration) {
      console.error("[v0] Service worker not registered after initialization")
      throw new Error("Service worker not registered")
    }

    const permission = await this.requestPermission()
    console.log("[v0] Permission status:", permission)

    if (permission !== "granted") {
      console.log("[v0] Permission not granted, cannot subscribe")
      return null
    }

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      console.log("[v0] VAPID key available:", !!vapidPublicKey)
      console.log("[v0] VAPID key length:", vapidPublicKey?.length || 0)

      if (!vapidPublicKey) {
        console.error("[v0] VAPID public key not configured")
        throw new Error("VAPID public key not configured")
      }

      console.log("[v0] Converting VAPID key to Uint8Array...")
      const applicationServerKey = this.urlBase64ToUint8Array(vapidPublicKey)
      console.log("[v0] Application server key created, length:", applicationServerKey.length)

      console.log("[v0] Subscribing to push manager...")
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })
      console.log("[v0] Push subscription created:", subscription.endpoint)

      const p256dhKey = subscription.getKey("p256dh")
      const authKey = subscription.getKey("auth")

      if (!p256dhKey || !authKey) {
        console.error("[v0] Missing subscription keys")
        throw new Error("Missing subscription keys")
      }

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(p256dhKey),
          auth: this.arrayBufferToBase64(authKey),
        },
      }

      console.log("[v0] Saving subscription to server...")
      await this.saveSubscription(subscriptionData)
      console.log("[v0] Subscription saved successfully")

      return subscriptionData
    } catch (error) {
      console.error("[v0] Push subscription failed:", error)
      if (error instanceof Error) {
        console.error("[v0] Error message:", error.message)
        console.error("[v0] Error stack:", error.stack)
      }
      throw error
    }
  }

  async unsubscribe(): Promise<void> {
    console.log("[v0] Unsubscribing from push notifications")

    if (!this.registration) {
      console.log("[v0] No registration, nothing to unsubscribe")
      return
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        console.log("[v0] Found subscription, unsubscribing...")
        await subscription.unsubscribe()
        await this.removeSubscription()
        console.log("[v0] Push subscription removed")
      } else {
        console.log("[v0] No subscription found")
      }
    } catch (error) {
      console.error("[v0] Push unsubscribe failed:", error)
      throw error
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      return null
    }

    return await this.registration.pushManager.getSubscription()
  }

  private async saveSubscription(subscription: PushSubscriptionData): Promise<void> {
    console.log("[v0] Sending subscription to server...")
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    })

    console.log("[v0] Server response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[v0] Server error:", errorText)
      throw new Error("Failed to save push subscription")
    }

    console.log("[v0] Subscription saved to server successfully")
  }

  private async removeSubscription(): Promise<void> {
    const response = await fetch("/api/notifications/subscribe", {
      method: "DELETE",
    })

    if (!response.ok) {
      throw new Error("Failed to remove push subscription")
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ""
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }
}

// Convenience functions
export const pushNotifications = PushNotificationManager.getInstance()

export async function enablePushNotifications(): Promise<boolean> {
  console.log("[v0] enablePushNotifications called")
  try {
    const subscription = await pushNotifications.subscribe()
    const success = subscription !== null
    console.log("[v0] Push notifications enabled:", success)
    return success
  } catch (error) {
    console.error("[v0] Failed to enable push notifications:", error)
    return false
  }
}

export async function disablePushNotifications(): Promise<void> {
  console.log("[v0] disablePushNotifications called")
  await pushNotifications.unsubscribe()
}

export async function isPushNotificationEnabled(): Promise<boolean> {
  try {
    const subscription = await pushNotifications.getSubscription()
    return subscription !== null
  } catch (error) {
    console.error("[v0] Error checking push notification status:", error)
    return false
  }
}
