import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { footerColumns, primarySiteNav } from "@/config/site-navigation";

const appDir = join(process.cwd(), "src", "app", "(site)");

function routeToPageFile(href: string): string {
  const segment = href.replace(/^\//, "");
  if (segment === "") {
    return join(appDir, "page.tsx");
  }
  return join(appDir, segment, "page.tsx");
}

const allLinks = [
  ...primarySiteNav.flatMap((group) => group.links),
  ...footerColumns.flatMap((column) => column.links),
];

describe("site navigation integrity", () => {
  it("contains no duplicate hrefs across header and footer", () => {
    const seen = new Map<string, number>();
    for (const link of allLinks) {
      seen.set(link.href, (seen.get(link.href) ?? 0) + 1);
    }
    const hrefs = [...seen.keys()];
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("every navigation link resolves to a real page under (site)", () => {
    const missing = allLinks
      .map((link) => link.href)
      .filter((href) => !existsSync(routeToPageFile(href)));

    expect(missing).toEqual([]);
  });
});
