const CACHE_NAME = "reel-friends-v2" // Updated cache version to force refresh
const urlsToCache = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"]

// Install event - cache only essential static resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    }),
  )
  self.skipWaiting()
})

// Fetch event - network first strategy for navigation
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.pathname.startsWith("/api/")) {
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match("/")
          })
        }),
    )
  } else {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone)
              })
            }
            return fetchResponse
          })
        )
      }),
    )
  }
})

// Activate event - clean up old caches and take control immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        return self.clients.claim()
      }),
  )
})

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  const data = event.data.json()
  const options = {
    body: data.body,
    icon: data.icon || "/icon-192.png",
    badge: data.badge || "/icon-192.png",
    data: data.data || {},
    actions: [
      {
        action: "view",
        title: "View",
        icon: "/icon-192.png",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: true,
    tag: data.data?.type || "default",
  }

  event.waitUntil(self.registration.showNotification(data.title, options))
})

// Notification click event - handle notification interactions
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const data = event.notification.data
  let url = "/"

  // Route to appropriate page based on notification type
  switch (data.type) {
    case "friend_request_received":
    case "friend_request_accepted":
      url = "/friends"
      break
    case "mutual_match":
      url = "/explore"
      break
    case "list_comment":
    case "list_like":
    case "list_shared":
      url = data.relatedId ? `/lists/${data.relatedId}` : "/lists"
      break
    case "recommendation_added_to_wishlist":
      url = "/profile"
      break
    default:
      url = "/"
  }

  if (event.action === "view" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus()
          }
        }
        // If no matching window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
    )
  }

  // Mark notification as read
  if (data.notificationId) {
    fetch(`/api/notifications/${data.notificationId}/read`, {
      method: "POST",
    }).catch(console.error)
  }
})
