import { redirect } from "next/navigation";

/** The trainer area now lives at `/trainer`. */
export default function LegacyTrainerPage() {
  redirect("/trainer/certificates");
}