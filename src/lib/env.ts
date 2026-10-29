import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  EMAIL_PROVIDER: z.enum(["resend", "console"]).optional(),
  EMAIL_PROVIDER_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM_ADDRESS: z.string().email().optional(),
  EMAIL_FROM_NAME: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().min(1).optional(),
  PAYSTACK_MODE: z.enum(["sandbox", "live"]).optional(),
  PAYSTACK_TRANSFERS_ENABLED: z.enum(["true", "false"]).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function formatErrors(error: z.ZodError) {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid public environment configuration. Copy .env.example to .env.local and set the required values:\n${formatErrors(
        parsed.error,
      )}`,
    );
  }

  return parsed.data;
}

export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || undefined,
    EMAIL_PROVIDER_API_KEY: process.env.EMAIL_PROVIDER_API_KEY || undefined,
    EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || undefined,
    EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || undefined,
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY || undefined,
    PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET || undefined,
    PAYSTACK_MODE:
      process.env.PAYSTACK_MODE === "live" ||
      process.env.PAYSTACK_MODE === "sandbox"
        ? process.env.PAYSTACK_MODE
        : undefined,
    PAYSTACK_TRANSFERS_ENABLED:
      process.env.PAYSTACK_TRANSFERS_ENABLED === "true" ||
      process.env.PAYSTACK_TRANSFERS_ENABLED === "false"
        ? process.env.PAYSTACK_TRANSFERS_ENABLED
        : undefined,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${formatErrors(parsed.error)}`,
    );
  }

  return parsed.data;
}

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
