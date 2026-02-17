/**
 * InventoryDashboard — Phase 5: real-time live inventory grid.
 *
 * Subscribes via useInventoryStore, groups SlotViewModels by shelf,
 * renders SlotCards with StatusBadge overlays + diagnostics drawer.
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { SlotCard } from '@/components/SlotCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useTenantStore, useInventoryStore } from '@/state';
import { subscribeShelves } from '@/services/firestore';
import type { ShelfConfig } from '@/domain/network';
import type { SlotViewModel } from '@/domain/inventory';
import { SlotStatus, STATUS_LABELS, FLAGS } from '@/domain/inventory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, Layers, Activity } from 'lucide-react';
import { formatDateWithTimezone } from '@/lib/dateUtils';

export default function InventoryDashboard() {
  const { activeNetworkId, activeLocationId } = useTenantStore();
  const { slots, loading, subscribe, unsubscribe } = useInventoryStore();
  const [shelves, setShelves] = useState<ShelfConfig[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotViewModel | null>(null);

  useEffect(() => {
    if (!activeNetworkId || !activeLocationId) return;
    subscribe(activeNetworkId, activeLocationId);
    const unsub = subscribeShelves(activeNetworkId, activeLocationId, setShelves);
    return () => { unsubscribe(); unsub(); };
  }, [activeNetworkId, activeLocationId]);

  // Group slots by shelf
  const slotsByShelf = shelves.map((shelf) => ({
    shelf,
    slots: slots.filter((s) => s.shelfId === shelf.shelfId),
  }));

  // Unassigned slots (shelf not found)
  const assignedShelfIds = new Set(shelves.map((s) => s.shelfId));
  const unassigned = slots.filter((s) => !assignedShelfIds.has(s.shelfId));

  // Summary counts
  const statusCounts = slots.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <DashboardLayout>
      <TenantGuard>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-semibold">Live Inventory</h1>
            <p className="text-sm text-muted-foreground">Real-time stock levels across all shelves</p>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-mono font-semibold">{slots.length}</p>
                  <p className="text-xs text-muted-foreground">Total Slots</p>
                </div>
              </CardContent>
            </Card>
            {([SlotStatus.OK, SlotStatus.LOW, SlotStatus.EMPTY, SlotStatus.OFFLINE_NODE] as const).map((st) => (
              <Card key={st}>
                <CardContent className="p-4 flex items-center gap-3">
                  <StatusBadge status={st} label={STATUS_LABELS[st]} />
                  <span className="font-mono text-lg font-semibold ml-auto">{statusCounts[st] || 0}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}

          {/* Slot grid by shelf */}
          {!loading && slotsByShelf.map(({ shelf, slots: shelfSlots }) => (
            <div key={shelf.shelfId} className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="text-lg font-semibold">{shelf.name}</h2>
                <Badge variant="secondary">{shelfSlots.length}</Badge>
              </div>
              {shelfSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground pl-6">No active slots on this shelf.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {shelfSlots.map((slot) => (
                    <SlotCard key={slot.slotId} slot={slot} onClick={setSelectedSlot} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Unassigned */}
          {unassigned.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-muted-foreground">Unassigned Slots</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {unassigned.map((slot) => (
                  <SlotCard key={slot.slotId} slot={slot} onClick={setSelectedSlot} />
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && slots.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Activity className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No inventory data. Configure shelves and slots first.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Diagnostics drawer */}
        <Sheet open={!!selectedSlot} onOpenChange={(open) => !open && setSelectedSlot(null)}>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            {selectedSlot && (
              <>
                <SheetHeader>
                  <SheetTitle>{selectedSlot.slotName}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Status */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                    <StatusBadge status={selectedSlot.status} label={selectedSlot.statusLabel} />
                  </div>

                  <Separator />

                  {/* Inventory */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Inventory</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Quantity</p>
                        <p className="font-mono text-xl font-semibold">{selectedSlot.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Net Weight</p>
                        <p className="font-mono text-xl font-semibold">{selectedSlot.netWeightG.toFixed(1)}g</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Confidence</p>
                        <p className="font-mono">{(selectedSlot.confidence * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">SKU</p>
                        <p className="text-sm">{selectedSlot.skuName || '—'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Flags */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Flags (0x{selectedSlot.flags.toString(16).padStart(2, '0')})</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <FlagRow label="Stable Weight" active={selectedSlot.isWeightStable} />
                      <FlagRow label="Overload" active={selectedSlot.isOverloaded} warn />
                      <FlagRow label="Sensor Error" active={selectedSlot.hasError} warn />
                      <FlagRow label="Calibrating" active={selectedSlot.isCalibrating} />
                    </div>
                  </div>

                  <Separator />

                  {/* Hardware refs */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hardware</p>
                    <div className="space-y-2 text-sm">
                      <InfoRow label="Node MAC" value={selectedSlot.nodeId || '—'} mono />
                      <InfoRow label="Slot ID" value={selectedSlot.slotId} mono />
                      <InfoRow label="Shelf ID" value={selectedSlot.shelfId} mono />
                      <InfoRow label="Sequence" value={String(selectedSlot.seq)} mono />
                      <InfoRow
                        label="Last Update"
                        value={selectedSlot.updatedAt ? formatDateWithTimezone(new Date(selectedSlot.updatedAt)) : '—'}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </TenantGuard>
    </DashboardLayout>
  );
}

function FlagRow({ label, active, warn }: { label: string; active: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${active ? (warn ? 'bg-status-offline' : 'bg-status-online') : 'bg-muted'}`} />
      <span className={active && warn ? 'text-status-offline' : ''}>{label}</span>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={mono ? 'font-mono text-xs' : ''}>{value}</span>
    </div>
  );
}
