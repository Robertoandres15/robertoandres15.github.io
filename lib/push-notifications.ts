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
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push notifications are not supported")
    }

    try {
      this.registration = await navigator.serviceWorker.ready
      console.log("[v0] Service worker ready for push notifications")
    } catch (error) {
      console.error("[v0] Service worker registration failed:", error)
      throw error
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Notifications are not supported")
    }

    let permission = Notification.permission

    if (permission === "default") {
      permission = await Notification.requestPermission()
    }

    return permission
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      await this.initialize()
    }

    if (!this.registration) {
      throw new Error("Service worker not registered")
    }

    const permission = await this.requestPermission()

    if (permission !== "granted") {
      return null
    }

    try {
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured")
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      })

      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: this.arrayBufferToBase64(subscription.getKey("auth")!),
        },
      }

      await this.saveSubscription(subscriptionData)

      return subscriptionData
    } catch (error) {
      console.error("Push subscription failed:", error)
      throw error
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.registration) {
      return
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscription()
        console.log("[v0] Push subscription removed")
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
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      throw new Error("Failed to save push subscription")
    }
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
  try {
    const subscription = await pushNotifications.subscribe()
    return subscription !== null
  } catch (error) {
    console.error("Failed to enable push notifications:", error)
    return false
  }
}

export async function disablePushNotifications(): Promise<void> {
  await pushNotifications.unsubscribe()
}

export async function isPushNotificationEnabled(): Promise<boolean> {
  try {
    const subscription = await pushNotifications.getSubscription()
    return subscription !== null
  } catch (error) {
    console.error("Error checking push notification status:", error)
    return false
  }
}
