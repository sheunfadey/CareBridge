import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  NotificationCategory,
  NotificationPriority,
} from "@/types/database";

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string | null;
  actionUrl: string | null;
  read: boolean;
  createdAt: string;
};

export type CreateNotificationInput = {
  userId: string;
  title: string;
  body?: string;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  actionUrl?: string;
  organisationId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Creates an in-app notification for a user. Uses the service-role client
 * because notifications are frequently created on behalf of another user. Never
 * throws: notification creation must not break the business action that triggered
 * it. Returns whether the notification was persisted.
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<boolean> {
  const client = createAdminClient();
  if (!client) {
    return false;
  }

  // High-priority notices (safeguarding, payment failures, account security)
  // are always delivered in-app. Everything else respects the user's choice.
  if (input.priority !== "high") {
    const { data: preferences } = await client
      .from("user_notification_preferences")
      .select("in_app_enabled")
      .eq("user_id", input.userId)
      .maybeSingle();

    if (preferences && preferences.in_app_enabled === false) {
      return false;
    }
  }

  const { error } = await client.from("notifications").insert({
    user_id: input.userId,
    title: input.title,
    body: input.body ?? null,
    category: input.category ?? "platform",
    priority: input.priority ?? "normal",
    action_url: input.actionUrl ?? null,
    organisation_id: input.organisationId ?? null,
    metadata: (input.metadata ?? {}) as never,
  });

  if (error) {
    console.warn("[notifications] create failed", { reason: error.message });
    return false;
  }

  return true;
}

export async function listNotifications(
  limit = 25,
): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, category, priority, title, body, action_url, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return data.map((row) => ({
    id: row.id,
    category: row.category,
    priority: row.priority,
    title: row.title,
    body: row.body,
    actionUrl: row.action_url,
    read: row.read_at !== null,
    createdAt: row.created_at,
  }));
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);

  return !error;
}

export async function markAllNotificationsRead(): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);

  return !error;
}
