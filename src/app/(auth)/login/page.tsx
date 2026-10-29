import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/features/auth/components/login-form";
import { InlineLoadingIndicator } from "@/components/feedback/inline-loading-indicator";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<InlineLoadingIndicator label="Loading sign in" />}>
      <LoginForm />
    </Suspense>
  );
}
