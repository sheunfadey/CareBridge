"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUser } from "@/server/auth/current-user";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/server/notifications/service";

export type NotificationActionResult = { ok: boolean; message?: string };

export async function markNotificationReadAction(
  id: string,
): Promise<NotificationActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const ok = await markNotificationRead(id);
  revalidatePath("/dashboard");
  return { ok, message: ok ? undefined : "Could not update the notification." };
}

export async function markAllNotificationsReadAction(): Promise<NotificationActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, message: "Not signed in." };
  }

  const ok = await markAllNotificationsRead();
  revalidatePath("/dashboard");
  return { ok, message: ok ? undefined : "Could not update notifications." };
}
