import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { CurrentUser } from "@/server/auth/current-user";

export type ConversationParticipant = {
  userId: string;
  name: string;
  email: string;
};

export type ConversationSummary = {
  id: string;
  subject: string;
  organisationId: string;
  organisationName: string;
  lastMessageAt: string;
  lastMessagePreview: string | null;
  lastMessageSenderName: string | null;
  unreadCount: number;
  participants: ConversationParticipant[];
};

export type MessageItem = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string;
  mine: boolean;
};

export type ConversationDetail = {
  id: string;
  subject: string;
  organisationId: string;
  organisationName: string;
  participants: ConversationParticipant[];
  messages: MessageItem[];
};

export type MessageableMember = {
  userId: string;
  name: string;
  email: string;
  organisationId: string;
  organisationName: string;
};

type Relation<T> = T | T[] | null;

function singleRelation<T>(relation: Relation<T>): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation;
}

function displayName(
  profile: { full_name: string | null; email: string } | null,
): string {
  return profile?.full_name ?? profile?.email ?? "Member";
}

export async function listMessageableMembers(
  user: CurrentUser,
): Promise<MessageableMember[]> {
  const organisationIds = user.organisations.map((org) => org.organisationId);
  if (organisationIds.length === 0) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organisation_memberships")
    .select(
      "organisation_id, user_id, status, profiles(full_name, email), organisations(name)",
    )
    .in("organisation_id", organisationIds)
    .eq("status", "active")
    .neq("user_id", user.id)
    .limit(500);

  if (error) {
    console.error("[messages] could not load members", error);
    return [];
  }

  const seen = new Set<string>();

  return (data ?? []).flatMap((row) => {
    const profile = singleRelation(row.profiles);
    const organisation = singleRelation(row.organisations);
    if (!profile) return [];
    const key = `${row.organisation_id}:${row.user_id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [
      {
        userId: row.user_id,
        name: displayName(profile),
        email: profile.email,
        organisationId: row.organisation_id,
        organisationName: organisation?.name ?? "Organisation",
      },
    ];
  });
}

export async function listConversations(
  userId: string,
): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data: memberships, error: membershipError } = await supabase
    .from("conversation_participants")
    .select("conversation_id, last_read_at")
    .eq("user_id", userId);

  if (membershipError) {
    console.error("[messages] could not load conversations", membershipError);
    return [];
  }

  const conversationIds = (memberships ?? []).map((row) => row.conversation_id);
  if (conversationIds.length === 0) return [];

  const lastReadByConversation = new Map(
    (memberships ?? []).map((row) => [row.conversation_id, row.last_read_at]),
  );

  const [{ data: conversations, error }, { data: participantRows }] =
    await Promise.all([
      supabase
        .from("conversations")
        .select(
          "id, subject, organisation_id, last_message_at, last_message_preview, last_message_sender_id, organisations(name)",
        )
        .in("id", conversationIds)
        .order("last_message_at", { ascending: false }),
      supabase
        .from("conversation_participants")
        .select("conversation_id, user_id, profiles(full_name, email)")
        .in("conversation_id", conversationIds),
    ]);

  if (error) {
    console.error("[messages] could not load conversation details", error);
    return [];
  }

  const { data: recentMessages } = await supabase
    .from("messages")
    .select("conversation_id, sender_id, created_at")
    .in("conversation_id", conversationIds)
    .order("created_at", { ascending: false })
    .limit(1000);

  const participantsByConversation = new Map<
    string,
    ConversationParticipant[]
  >();
  const nameByUser = new Map<string, string>();

  for (const row of participantRows ?? []) {
    const profile = singleRelation(row.profiles);
    if (!profile) continue;
    const name = displayName(profile);
    nameByUser.set(row.user_id, name);
    const list = participantsByConversation.get(row.conversation_id) ?? [];
    list.push({ userId: row.user_id, name, email: profile.email });
    participantsByConversation.set(row.conversation_id, list);
  }

  const unreadByConversation = new Map<string, number>();
  for (const message of recentMessages ?? []) {
    if (message.sender_id === userId) continue;
    const lastReadAt = lastReadByConversation.get(message.conversation_id);
    if (lastReadAt && message.created_at <= lastReadAt) continue;
    unreadByConversation.set(
      message.conversation_id,
      (unreadByConversation.get(message.conversation_id) ?? 0) + 1,
    );
  }

  return (conversations ?? []).map((conversation) => {
    const organisation = singleRelation(conversation.organisations);
    return {
      id: conversation.id,
      subject: conversation.subject,
      organisationId: conversation.organisation_id,
      organisationName: organisation?.name ?? "Organisation",
      lastMessageAt: conversation.last_message_at,
      lastMessagePreview: conversation.last_message_preview,
      lastMessageSenderName: conversation.last_message_sender_id
        ? nameByUser.get(conversation.last_message_sender_id) ?? null
        : null,
      unreadCount: unreadByConversation.get(conversation.id) ?? 0,
      participants: participantsByConversation.get(conversation.id) ?? [],
    };
  });
}

export async function getConversation(
  conversationId: string,
  userId: string,
): Promise<ConversationDetail | null> {
  const supabase = await createClient();
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select("id, subject, organisation_id, organisations(name)")
    .eq("id", conversationId)
    .maybeSingle();

  if (error || !conversation) {
    if (error) console.error("[messages] could not load conversation", error);
    return null;
  }

  const [{ data: participantRows }, { data: messageRows }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("user_id, profiles(full_name, email)")
      .eq("conversation_id", conversationId),
    supabase
      .from("messages")
      .select("id, sender_id, body, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  const participants = (participantRows ?? []).flatMap((row) => {
    const profile = singleRelation(row.profiles);
    if (!profile) return [];
    return [
      {
        userId: row.user_id,
        name: displayName(profile),
        email: profile.email,
      },
    ];
  });
  const nameByUser = new Map(
    participants.map((participant) => [participant.userId, participant.name]),
  );
  const organisation = singleRelation(conversation.organisations);

  return {
    id: conversation.id,
    subject: conversation.subject,
    organisationId: conversation.organisation_id,
    organisationName: organisation?.name ?? "Organisation",
    participants,
    messages: (messageRows ?? []).map((message) => ({
      id: message.id,
      senderId: message.sender_id,
      senderName: nameByUser.get(message.sender_id) ?? "Member",
      body: message.body,
      createdAt: message.created_at,
      mine: message.sender_id === userId,
    })),
  };
}

export async function countUnreadMessages(userId: string): Promise<number> {
  const conversations = await listConversations(userId);
  return conversations.reduce(
    (total, conversation) => total + conversation.unreadCount,
    0,
  );
}
