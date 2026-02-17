/**
 * SkusPage — CRUD for SKU configurations.
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useTenantStore } from '@/state';
import { subscribeSkus, createSku, deleteSku } from '@/services/firestore';
import type { SkuConfig } from '@/domain/inventory';
import { Plus, Package, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function SkusPage() {
  const { activeNetworkId, activeLocationId } = useTenantStore();
  const [skus, setSkus] = useState<Map<string, SkuConfig>>(new Map());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [name, setName] = useState('');
  const [unitWeight, setUnitWeight] = useState('100');
  const [tolerance, setTolerance] = useState('5');
  const [packaging, setPackaging] = useState('0');
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!activeNetworkId || !activeLocationId) return;
    const unsub = subscribeSkus(activeNetworkId, activeLocationId, setSkus);
    return unsub;
  }, [activeNetworkId, activeLocationId]);

  const handleCreate = async () => {
    if (!activeNetworkId || !activeLocationId || !name.trim()) return;
    setCreating(true);
    try {
      await createSku(activeNetworkId, activeLocationId, {
        name: name.trim(),
        unitWeightG: Number(unitWeight),
        toleranceG: Number(tolerance),
        packagingWeightG: Number(packaging),
        active,
      });
      toast({ title: 'SKU created' });
      setName('');
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (skuId: string) => {
    if (!activeNetworkId || !activeLocationId) return;
    try {
      await deleteSku(activeNetworkId, activeLocationId, skuId);
      toast({ title: 'SKU deleted' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const skuList = Array.from(skus.values());

  return (
    <DashboardLayout>
      <TenantGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">SKUs</h1>
              <p className="text-sm text-muted-foreground">Product definitions for weight-to-quantity mapping</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Add SKU</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create SKU</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Product Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tomato Sauce 500ml" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Unit Weight (g)</Label>
                      <Input type="number" value={unitWeight} onChange={(e) => setUnitWeight(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tolerance (g)</Label>
                      <Input type="number" value={tolerance} onChange={(e) => setTolerance(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Packaging (g)</Label>
                      <Input type="number" value={packaging} onChange={(e) => setPackaging(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={active} onCheckedChange={setActive} />
                    <Label>Active</Label>
                  </div>
                  <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
                    {creating ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {skuList.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Package className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No SKUs configured yet.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit Weight</TableHead>
                    <TableHead>Tolerance</TableHead>
                    <TableHead>Packaging</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {skuList.map((s) => (
                    <TableRow key={s.skuId}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="font-mono">{s.unitWeightG}g</TableCell>
                      <TableCell className="font-mono">±{s.toleranceG}g</TableCell>
                      <TableCell className="font-mono">{s.packagingWeightG}g</TableCell>
                      <TableCell>
                        <Badge variant={s.active ? 'default' : 'secondary'}>{s.active ? 'Active' : 'Inactive'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(s.skuId)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </TenantGuard>
    </DashboardLayout>
  );
}
