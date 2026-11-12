import "server-only";

import { createClient } from "@/lib/supabase/server";

export type NotificationPreferences = {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  smsEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailEnabled: true,
  inAppEnabled: true,
  smsEnabled: false,
};

/**
 * Reads the signed-in user's notification preferences. Missing rows fall back
 * to the database defaults so the settings page always has something to show.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  const { data } = await supabase
    .from("user_notification_preferences")
    .select("email_enabled, in_app_enabled, sms_enabled")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }

  return {
    emailEnabled: data.email_enabled,
    inAppEnabled: data.in_app_enabled,
    smsEnabled: data.sms_enabled,
  };
}
