"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import {
  sendMessageSchema,
  startConversationSchema,
  type SendMessageInput,
  type StartConversationInput,
} from "@/lib/validation/messaging";
import { getCurrentUser, type CurrentUser } from "@/server/auth/current-user";
import { AuthorisationError } from "@/server/auth/guards";
import { recordAudit } from "@/server/audit/record-audit";

export type MessageActionResult =
  | {
      ok: true;
      message?: string;
      conversationId?: string;
    }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

function fieldErrorsFromZod(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    result[key] = [...(result[key] ?? []), issue.message];
  }
  return result;
}

async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthorisationError("Not signed in", "UNAUTHENTICATED");
  }
  return user;
}

function toFriendlyError(error: unknown): MessageActionResult {
  if (error instanceof AuthorisationError) {
    return {
      ok: false,
      message:
        error.code === "UNAUTHENTICATED"
          ? "Sign in to continue."
          : "You do not have permission to do that.",
    };
  }
  console.error("[messages] unexpected error", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}

function rpcMessage(message: string, fallback: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("not a member")) {
    return "You are not a member of this organisation.";
  }
  if (lower.includes("recipient")) {
    return "One or more recipients are not active members of this organisation.";
  }
  if (lower.includes("at least one recipient")) {
    return "Select at least one recipient.";
  }
  if (lower.includes("not found")) {
    return "That conversation is no longer available.";
  }
  if (lower.includes("4000") || lower.includes("between 1 and")) {
    return "Keep messages under 4000 characters.";
  }
  if (lower.includes("subject")) {
    return "Enter a subject between 3 and 160 characters.";
  }
  return fallback;
}

export async function startConversationAction(
  input: StartConversationInput,
): Promise<MessageActionResult> {
  const parsed = startConversationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("start_conversation", {
      p_organisation: parsed.data.organisationId,
      p_participant_ids: parsed.data.participantIds,
      p_subject: parsed.data.subject,
      p_body: parsed.data.body,
    });

    if (error || !data) {
      return {
        ok: false,
        message: rpcMessage(
          error?.message ?? "",
          "We could not start that conversation.",
        ),
      };
    }

    await recordAudit({
      actorId: user.id,
      organisationId: parsed.data.organisationId,
      action: "message.conversation.started",
      entityType: "conversation",
      entityId: data,
      metadata: { recipients: parsed.data.participantIds.length },
    });

    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard");
    return {
      ok: true,
      message: "Conversation started.",
      conversationId: data,
    };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function sendMessageAction(
  input: SendMessageInput,
): Promise<MessageActionResult> {
  const parsed = sendMessageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error.issues),
    };
  }

  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("send_message", {
      p_conversation: parsed.data.conversationId,
      p_body: parsed.data.body,
    });

    if (error || !data) {
      return {
        ok: false,
        message: rpcMessage(error?.message ?? "", "We could not send that message."),
      };
    }

    await recordAudit({
      actorId: user.id,
      action: "message.sent",
      entityType: "message",
      entityId: data,
      metadata: { conversationId: parsed.data.conversationId },
    });

    revalidatePath("/dashboard/messages");
    revalidatePath("/dashboard");
    return { ok: true, message: "Message sent." };
  } catch (error) {
    return toFriendlyError(error);
  }
}

export async function markConversationReadAction(
  conversationId: string,
): Promise<MessageActionResult> {
  try {
    await requireUser();
    const supabase = await createClient();
    const { error } = await supabase.rpc("mark_conversation_read", {
      p_conversation: conversationId,
    });

    if (error) {
      return { ok: false, message: "Could not update read state." };
    }

    revalidatePath("/dashboard/messages");
    return { ok: true };
  } catch (error) {
    return toFriendlyError(error);
  }
}
