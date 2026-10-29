import { afterEach, describe, expect, it, vi } from "vitest";

// The admin service imports "server-only", which throws outside a React server
// environment. Stub it so we can exercise the pure availability logic.
vi.mock("server-only", () => ({}));

describe("adminService availability contract", () => {
  const original = process.env.SUPABASE_SERVICE_ROLE_KEY;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    } else {
      process.env.SUPABASE_SERVICE_ROLE_KEY = original;
    }
    vi.resetModules();
  });

  it("reports unavailable (without throwing) when no service-role key is set", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { adminService } = await import("@/server/admin/admin-service");

    expect(adminService.isAvailable()).toBe(false);
    const result = await adminService.listProfiles();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("UNAVAILABLE");
      expect(result.message).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    }
  });

  it("returns UNAVAILABLE for writes too, never a silent success", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { adminService } = await import("@/server/admin/admin-service");

    const result = await adminService.setAccountStatus(
      "8f14e45f-ceea-4a1a-9e3b-1c2d3e4f5a6b",
      "deactivated",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("UNAVAILABLE");
    }
  });

  it("reports UNAVAILABLE for every organisation operation when unconfigured", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const { adminService } = await import("@/server/admin/admin-service");

    const results = await Promise.all([
      adminService.listOrganisations(),
      adminService.listPendingOrganisations(),
      adminService.setOrganisationStatus("org-id", "active"),
      adminService.setOrganisationVerification("org-id", "verified", "user-id"),
      adminService.listAuditLogs(),
    ]);

    for (const result of results) {
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("UNAVAILABLE");
        expect(result.message).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
      }
    }
  });
});
