import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { ResidentStatus } from "@/types/database";

export type FamilyResidentSummary = {
  residentId: string;
  relationship: string | null;
  accessLevel: "summary" | "full";
  firstName: string;
  lastName: string;
  preferredName: string | null;
  roomNumber: string | null;
  status: ResidentStatus;
  admissionDate: string;
  careLevel: string | null;
  facilityName: string;
};

export async function listFamilyResidents(): Promise<FamilyResidentSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("family_resident_summaries");

  if (error || !data) return [];

  return data.map((row) => ({
    residentId: row.resident_id,
    relationship: row.relationship,
    accessLevel: row.access_level === "full" ? "full" : "summary",
    firstName: row.first_name,
    lastName: row.last_name,
    preferredName: row.preferred_name,
    roomNumber: row.room_number,
    status: row.status as ResidentStatus,
    admissionDate: row.admission_date,
    careLevel: row.care_level,
    facilityName: row.facility_name,
  }));
}
