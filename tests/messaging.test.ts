import { describe, expect, it } from "vitest";

import {
  sendMessageSchema,
  startConversationSchema,
} from "@/lib/validation/messaging";

const organisationId = "11111111-1111-4111-8111-111111111111";
const participantId = "22222222-2222-4222-8222-222222222222";

describe("start conversation validation", () => {
  const base = {
    organisationId,
    participantIds: [participantId],
    subject: "Shift handover",
    body: "Please review the evening notes.",
  };

  it("accepts a valid conversation", () => {
    expect(startConversationSchema.safeParse(base).success).toBe(true);
  });

  it("requires at least one recipient", () => {
    expect(
      startConversationSchema.safeParse({ ...base, participantIds: [] }).success,
    ).toBe(false);
  });

  it("rejects too many recipients", () => {
    const participants = Array.from(
      { length: 21 },
      (_, index) =>
        `22222222-2222-4222-8222-${String(index).padStart(12, "0")}`,
    );
    expect(
      startConversationSchema.safeParse({
        ...base,
        participantIds: participants,
      }).success,
    ).toBe(false);
  });

  it("requires a subject and message", () => {
    expect(
      startConversationSchema.safeParse({ ...base, subject: "Hi" }).success,
    ).toBe(false);
    expect(
      startConversationSchema.safeParse({ ...base, body: "   " }).success,
    ).toBe(false);
  });
});

describe("send message validation", () => {
  it("trims the message body", () => {
    const parsed = sendMessageSchema.parse({
      conversationId: organisationId,
      body: "  Hello team  ",
    });
    expect(parsed.body).toBe("Hello team");
  });

  it("rejects an empty message", () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: organisationId,
        body: "   ",
      }).success,
    ).toBe(false);
  });

  it("rejects messages over 4000 characters", () => {
    expect(
      sendMessageSchema.safeParse({
        conversationId: organisationId,
        body: "a".repeat(4001),
      }).success,
    ).toBe(false);
  });
});
