/**
 * ShelvesPage — CRUD shelves + slots + slot binding (node_id, sku_id, calibration).
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTenantStore } from '@/state';
import {
  subscribeShelves, createShelf,
  subscribeSlotConfigs, createSlot,
} from '@/services/firestore';
import type { ShelfConfig } from '@/domain/network';
import type { SlotConfig } from '@/domain/inventory';
import { Plus, Layers, Box } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function ShelvesPage() {
  const { activeNetworkId, activeLocationId } = useTenantStore();
  const [shelves, setShelves] = useState<ShelfConfig[]>([]);
  const [slots, setSlots] = useState<Map<string, SlotConfig>>(new Map());

  // Shelf creation
  const [shelfName, setShelfName] = useState('');
  const [shelfDialog, setShelfDialog] = useState(false);
  const [creatingSh, setCreatingSh] = useState(false);

  // Slot creation
  const [slotShelfId, setSlotShelfId] = useState('');
  const [slotName, setSlotName] = useState('');
  const [slotNodeId, setSlotNodeId] = useState('');
  const [slotSkuId, setSlotSkuId] = useState('');
  const [slotTare, setSlotTare] = useState('0');
  const [slotCalFactor, setSlotCalFactor] = useState('1');
  const [slotHysteresis, setSlotHysteresis] = useState('5');
  const [slotMinQty, setSlotMinQty] = useState('1');
  const [slotDialog, setSlotDialog] = useState(false);
  const [creatingSl, setCreatingSl] = useState(false);

  useEffect(() => {
    if (!activeNetworkId || !activeLocationId) return;
    const u1 = subscribeShelves(activeNetworkId, activeLocationId, setShelves);
    const u2 = subscribeSlotConfigs(activeNetworkId, activeLocationId, setSlots);
    return () => { u1(); u2(); };
  }, [activeNetworkId, activeLocationId]);

  const handleCreateShelf = async () => {
    if (!activeNetworkId || !activeLocationId || !shelfName.trim()) return;
    setCreatingSh(true);
    try {
      await createShelf(activeNetworkId, activeLocationId, { name: shelfName.trim(), orderIndex: shelves.length });
      toast({ title: 'Shelf created' });
      setShelfName('');
      setShelfDialog(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreatingSh(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!activeNetworkId || !activeLocationId || !slotShelfId || !slotName.trim()) return;
    setCreatingSl(true);
    try {
      await createSlot(activeNetworkId, activeLocationId, slotShelfId, {
        name: slotName.trim(),
        nodeId: slotNodeId,
        skuId: slotSkuId,
        tareG: Number(slotTare),
        calibrationFactor: Number(slotCalFactor),
        hysteresisG: Number(slotHysteresis),
        minQtyStep: Number(slotMinQty),
        status: 'provisioning',
      });
      toast({ title: 'Slot created' });
      setSlotName('');
      setSlotDialog(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreatingSl(false);
    }
  };

  const slotsByShelf = (shelfId: string) =>
    Array.from(slots.values()).filter((s) => s.shelfId === shelfId);

  return (
    <DashboardLayout>
      <TenantGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Shelves & Slots</h1>
              <p className="text-sm text-muted-foreground">Physical layout configuration</p>
            </div>
            <div className="flex gap-2">
              <Dialog open={shelfDialog} onOpenChange={setShelfDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Layers className="h-4 w-4 mr-2" />Add Shelf</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Create Shelf</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label>Shelf Name</Label>
                      <Input value={shelfName} onChange={(e) => setShelfName(e.target.value)} placeholder="Shelf A" />
                    </div>
                    <Button onClick={handleCreateShelf} disabled={creatingSh || !shelfName.trim()} className="w-full">
                      {creatingSh ? 'Creating…' : 'Create'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={slotDialog} onOpenChange={setSlotDialog}>
                <DialogTrigger asChild>
                  <Button><Plus className="h-4 w-4 mr-2" />Add Slot</Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader><DialogTitle>Create Slot</DialogTitle></DialogHeader>
                  <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
                    <div className="space-y-2">
                      <Label>Shelf</Label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                        value={slotShelfId}
                        onChange={(e) => setSlotShelfId(e.target.value)}
                      >
                        <option value="">Select shelf…</option>
                        {shelves.map((s) => (
                          <option key={s.shelfId} value={s.shelfId}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Slot Name</Label>
                      <Input value={slotName} onChange={(e) => setSlotName(e.target.value)} placeholder="Position 1" />
                    </div>
                    <div className="space-y-2">
                      <Label>Node MAC</Label>
                      <Input value={slotNodeId} onChange={(e) => setSlotNodeId(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
                    </div>
                    <div className="space-y-2">
                      <Label>SKU ID</Label>
                      <Input value={slotSkuId} onChange={(e) => setSlotSkuId(e.target.value)} placeholder="SKU document ID" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>Tare (g)</Label>
                        <Input type="number" value={slotTare} onChange={(e) => setSlotTare(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Cal Factor</Label>
                        <Input type="number" value={slotCalFactor} onChange={(e) => setSlotCalFactor(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Hysteresis (g)</Label>
                        <Input type="number" value={slotHysteresis} onChange={(e) => setSlotHysteresis(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Min Qty Step</Label>
                        <Input type="number" value={slotMinQty} onChange={(e) => setSlotMinQty(e.target.value)} />
                      </div>
                    </div>
                    <Button onClick={handleCreateSlot} disabled={creatingSl || !slotShelfId || !slotName.trim()} className="w-full">
                      {creatingSl ? 'Creating…' : 'Create'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {shelves.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Layers className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No shelves configured yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-3">
              {shelves.map((shelf) => {
                const shelfSlots = slotsByShelf(shelf.shelfId);
                return (
                  <AccordionItem key={shelf.shelfId} value={shelf.shelfId} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Layers className="h-4 w-4 text-primary" />
                        <span className="font-medium">{shelf.name}</span>
                        <Badge variant="secondary">{shelfSlots.length} slots</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {shelfSlots.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-4 text-center">No slots on this shelf.</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Slot</TableHead>
                              <TableHead>Node MAC</TableHead>
                              <TableHead>SKU ID</TableHead>
                              <TableHead>Tare</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {shelfSlots.map((s) => (
                              <TableRow key={s.slotId}>
                                <TableCell className="font-medium">{s.name}</TableCell>
                                <TableCell className="font-mono text-xs">{s.nodeId || '—'}</TableCell>
                                <TableCell className="font-mono text-xs">{s.skuId || '—'}</TableCell>
                                <TableCell className="font-mono">{s.tareG}g</TableCell>
                                <TableCell>
                                  <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </div>
      </TenantGuard>
    </DashboardLayout>
  );
}
