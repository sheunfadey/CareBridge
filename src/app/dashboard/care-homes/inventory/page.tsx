import type { Metadata } from "next";

import { CareNav } from "@/components/care/care-nav";
import { FacilitySelect } from "@/components/care/facility-select";
import { EmptyState } from "@/components/feedback/empty-state";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  InventoryItemDialogForm,
  MovementDialogForm,
  SupplierDialogForm,
} from "@/features/care/components/care-forms";
import { formatDateTime } from "@/lib/format";
import { inventoryMovementTypeLabels } from "@/lib/validation/care";
import { userHasPermission } from "@/server/auth/current-user";
import { requireCarePage } from "@/server/care/access";
import {
  listInventory,
  listInventoryMovements,
  listSuppliers,
} from "@/server/care/queries";

export const metadata: Metadata = {
  title: "Inventory",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ organisation?: string; facility?: string; q?: string }>;
}) {
  const params = await searchParams;
  const context = await requireCarePage({
    permission: "inventory_view",
    requestedOrganisation: params.organisation,
    requestedFacility: params.facility,
    redirectTo: "/dashboard/care-homes/inventory",
  });

  const [items, suppliers, movements] = await Promise.all([
    listInventory(context.workspace, {
      facilityId: context.facility?.id,
      search: params.q,
    }),
    listSuppliers(context.workspace),
    listInventoryMovements(context.workspace),
  ]);

  const canManage = userHasPermission(context.user, "inventory_manage");

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        eyebrow="Care operations"
        title="Inventory"
        description="Stock levels are derived from append-only movements. A balance cannot change without a movement row."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Care homes", href: "/dashboard/care-homes" },
          { label: "Inventory" },
        ]}
        actions={
          <>
            <FacilitySelect facilities={context.facilities} value={context.facility?.id ?? ""} />
            {canManage ? (
              <>
                <SupplierDialogForm organisationId={context.workspace.organisationId} />
                <InventoryItemDialogForm
                  organisationId={context.workspace.organisationId}
                  facilities={context.facilities}
                  defaultFacilityId={context.facility?.id}
                />
              </>
            ) : null}
          </>
        }
      />

      <CareNav
        user={context.user}
        organisationId={context.workspace.organisationId}
        facilityId={context.facility?.id}
        active="/inventory"
      />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border p-4">
          <form className="flex gap-2" method="get">
            <input type="hidden" name="organisation" value={context.workspace.organisationId} />
            {context.facility ? (
              <input type="hidden" name="facility" value={context.facility.id} />
            ) : null}
            <input
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Search item or SKU"
              className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
            />
            <button
              type="submit"
              className="h-9 rounded-md border border-input px-3 text-sm font-medium hover:bg-muted"
            >
              Search
            </button>
          </form>
        </div>
        {items.length === 0 ? (
          <EmptyState
            title="No inventory items"
            description="Add an item and record its opening balance to start tracking stock."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">In stock</TableHead>
                <TableHead className="text-right">Reorder at</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.itemId}>
                  <TableCell className="font-medium text-brand-strong">{item.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.category ?? "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-brand-strong">
                    {item.currentQuantity} {item.unit}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                    {item.reorderLevel}
                  </TableCell>
                  <TableCell>
                    {item.belowReorder ? (
                      <StatusBadge status="low" label="Reorder" />
                    ) : (
                      <StatusBadge status="ok" label="In stock" />
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canManage ? (
                      <MovementDialogForm
                        organisationId={context.workspace.organisationId}
                        itemId={item.itemId}
                        itemName={item.name}
                        unit={item.unit}
                      />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <div className="grid gap-4 lg:gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Recent stock movements
          </h2>
          {movements.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No movements recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {movements.slice(0, 20).map((movement) => (
                <li key={movement.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-brand-strong">{movement.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {inventoryMovementTypeLabels[movement.movementType]} ·{" "}
                      {formatDateTime(movement.createdAt)}
                      {movement.reason ? ` · ${movement.reason}` : ""}
                    </p>
                  </div>
                  <span
                    className={
                      movement.quantityDelta >= 0
                        ? "font-medium tabular-nums text-brand-teal"
                        : "font-medium tabular-nums text-brand-error"
                    }
                  >
                    {movement.quantityDelta > 0 ? "+" : ""}
                    {movement.quantityDelta}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-4">
          <h2 className="font-heading text-lg font-semibold text-brand-strong">
            Suppliers
          </h2>
          {suppliers.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No suppliers recorded.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {suppliers.map((supplier) => (
                <li key={supplier.id} className="py-2.5 text-sm">
                  <p className="font-medium text-brand-strong">{supplier.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[supplier.contactName, supplier.phone, supplier.email]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
