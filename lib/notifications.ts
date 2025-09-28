import { createClient } from "@/lib/supabase/server"

export type NotificationType =
  | "friend_request_received"
  | "friend_request_accepted"
  | "recommendation_added_to_wishlist"
  | "mutual_match"
  | "list_comment"
  | "list_like"
  | "list_shared"

export interface NotificationData {
  type: NotificationType
  userId: string
  title: string
  message: string
  fromUserId?: string
  relatedId?: string
  relatedType?: string
  data?: Record<string, any>
}

export async function createNotification(notificationData: NotificationData) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: notificationData.userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      from_user_id: notificationData.fromUserId,
      related_id: notificationData.relatedId,
      related_type: notificationData.relatedType,
      data: notificationData.data || {},
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating notification:", error)
    throw error
  }

  // Send push notification if user has subscriptions
  if (data) {
    await sendPushNotification(data)
  }

  return data
}

export async function sendPushNotification(notification: any) {
  try {
    const supabase = await createClient()

    // Get user's push subscriptions
    const { data: subscriptions } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", notification.user_id)

    if (!subscriptions || subscriptions.length === 0) {
      return
    }

    // Send push notification to each subscription
    for (const subscription of subscriptions) {
      try {
        await fetch("/api/notifications/push", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription: {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload: {
              title: notification.title,
              body: notification.message,
              icon: "/icon-192x192.png",
              badge: "/badge-72x72.png",
              data: {
                notificationId: notification.id,
                type: notification.type,
                relatedId: notification.related_id,
                relatedType: notification.related_type,
              },
            },
          }),
        })
      } catch (pushError) {
        console.error("Error sending push notification:", pushError)
        // Remove invalid subscription
        await supabase.from("push_subscriptions").delete().eq("id", subscription.id)
      }
    }
  } catch (error) {
    console.error("Error in sendPushNotification:", error)
  }
}

// Helper functions for specific notification types
export async function notifyFriendRequest(fromUserId: string, toUserId: string, fromUserName: string) {
  return createNotification({
    type: "friend_request_received",
    userId: toUserId,
    title: "New Friend Request",
    message: `${fromUserName} sent you a friend request`,
    fromUserId,
    relatedId: fromUserId,
    relatedType: "friend",
  })
}

export async function notifyFriendRequestAccepted(fromUserId: string, toUserId: string, accepterName: string) {
  return createNotification({
    type: "friend_request_accepted",
    userId: fromUserId,
    title: "Friend Request Accepted",
    message: `${accepterName} accepted your friend request`,
    fromUserId: toUserId,
    relatedId: toUserId,
    relatedType: "friend",
  })
}

export async function notifyRecommendationAddedToWishlist(
  recommenderId: string,
  userId: string,
  movieTitle: string,
  userDisplayName: string,
) {
  return createNotification({
    type: "recommendation_added_to_wishlist",
    userId: recommenderId,
    title: "Recommendation Added",
    message: `${userDisplayName} added "${movieTitle}" to their wishlist from your recommendation`,
    fromUserId: userId,
    data: { movieTitle },
  })
}

export async function notifyMutualMatch(
  userId1: string,
  userId2: string,
  movieTitle: string,
  user1Name: string,
  user2Name: string,
) {
  // Notify both users
  await Promise.all([
    createNotification({
      type: "mutual_match",
      userId: userId1,
      title: "Mutual Match!",
      message: `You and ${user2Name} both want to watch "${movieTitle}"`,
      fromUserId: userId2,
      data: { movieTitle },
    }),
    createNotification({
      type: "mutual_match",
      userId: userId2,
      title: "Mutual Match!",
      message: `You and ${user1Name} both want to watch "${movieTitle}"`,
      fromUserId: userId1,
      data: { movieTitle },
    }),
  ])
}

export async function notifyListComment(
  listOwnerId: string,
  commenterId: string,
  commenterName: string,
  listName: string,
  listId: string,
) {
  return createNotification({
    type: "list_comment",
    userId: listOwnerId,
    title: "New Comment",
    message: `${commenterName} commented on your "${listName}" list`,
    fromUserId: commenterId,
    relatedId: listId,
    relatedType: "list",
  })
}

export async function notifyListLike(
  listOwnerId: string,
  likerId: string,
  likerName: string,
  listName: string,
  listId: string,
) {
  return createNotification({
    type: "list_like",
    userId: listOwnerId,
    title: "List Liked",
    message: `${likerName} liked your "${listName}" list`,
    fromUserId: likerId,
    relatedId: listId,
    relatedType: "list",
  })
}

export async function notifyListShared(
  recipientId: string,
  senderId: string,
  senderName: string,
  listName: string,
  listId: string,
) {
  return createNotification({
    type: "list_shared",
    userId: recipientId,
    title: "List Shared",
    message: `${senderName} shared their "${listName}" list with you`,
    fromUserId: senderId,
    relatedId: listId,
    relatedType: "list",
  })
}
