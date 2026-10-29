import { describe, expect, it } from "vitest";

import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  PRIVILEGED_ROLES,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  permissionsForRoles,
} from "@/lib/permissions/registry";
import type { RoleKey } from "@/types/database";

const ROLE_KEYS = Object.keys(ROLE_PERMISSIONS) as RoleKey[];

describe("permission registry", () => {
  it("defines a label and permission set for every role", () => {
    for (const role of ROLE_KEYS) {
      expect(ROLE_LABELS[role], `missing label for ${role}`).toBeTruthy();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
    }
  });

  it("only references permissions that exist in the registry", () => {
    const known = new Set(ALL_PERMISSIONS);
    for (const role of ROLE_KEYS) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(known.has(permission), `${role} -> unknown ${permission}`).toBe(
          true,
        );
      }
    }
  });

  it("gives super_admin every permission", () => {
    expect(new Set(ROLE_PERMISSIONS.super_admin)).toEqual(new Set(ALL_PERMISSIONS));
  });

  it("keeps privileged roles out of the self-service role labels used for invites", () => {
    for (const role of PRIVILEGED_ROLES) {
      expect(ROLE_LABELS[role]).toBeTruthy();
    }
    expect(PRIVILEGED_ROLES).not.toContain("caregiver");
    expect(PRIVILEGED_ROLES).not.toContain("care_staff");
  });

  it("does not grant organisation administration to an ordinary caregiver", () => {
    const permissions = permissionsForRoles(["caregiver"]);
    expect(permissions.has("course_view")).toBe(true);
    expect(permissions.has("job_apply")).toBe(true);
    expect(permissions.has("user_role_assign")).toBe(false);
    expect(permissions.has("organisation_delete")).toBe(false);
    expect(permissions.has("platform_settings_manage")).toBe(false);
  });

  it("unions permissions across multiple roles", () => {
    const permissions = permissionsForRoles(["caregiver", "care_staff"]);
    expect(permissions.has("course_view")).toBe(true);
    expect(permissions.has("resident_view")).toBe(true);
  });

  it("maps each permission to a known category", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(typeof PERMISSIONS[permission]).toBe("string");
      expect(PERMISSIONS[permission].length).toBeGreaterThan(0);
    }
  });
});
