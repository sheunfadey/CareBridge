"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FacilitySelect({
  facilities,
  value,
}: {
  facilities: { id: string; name: string }[];
  value: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (facilities.length <= 1) {
    return null;
  }

  return (
    <Select
      value={value}
      onValueChange={(facilityId) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("facility", facilityId);
        router.push(`${pathname}?${params.toString()}`);
      }}
    >
      <SelectTrigger className="w-[220px]" aria-label="Facility">
        <SelectValue placeholder="Select facility" />
      </SelectTrigger>
      <SelectContent>
        {facilities.map((facility) => (
          <SelectItem key={facility.id} value={facility.id}>
            {facility.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
