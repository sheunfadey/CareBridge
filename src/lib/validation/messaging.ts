import { z } from "zod";

export const MESSAGE_BODY_MAX = 4000;

export const startConversationSchema = z.object({
  organisationId: z.string().uuid("Select an organisation"),
  participantIds: z
    .array(z.string().uuid())
    .min(1, "Select at least one recipient")
    .max(20, "Select at most 20 recipients"),
  subject: z
    .string()
    .trim()
    .min(3, "Enter a subject of at least 3 characters")
    .max(160, "Keep the subject under 160 characters"),
  body: z
    .string()
    .trim()
    .min(1, "Write a message")
    .max(MESSAGE_BODY_MAX, "Keep messages under 4000 characters"),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid(),
  body: z
    .string()
    .trim()
    .min(1, "Write a message")
    .max(MESSAGE_BODY_MAX, "Keep messages under 4000 characters"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
