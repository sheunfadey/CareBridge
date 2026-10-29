import type { Metadata } from "next";

import { DesignSystemShowcase } from "@/app/design-system/showcase";

export const metadata: Metadata = {
  title: "Design system",
  description: "CareBridge brand tokens, primitives and dashboard components.",
};

export default function DesignSystemPage() {
  return <DesignSystemShowcase />;
}
