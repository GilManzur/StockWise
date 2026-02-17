/**
 * NetworksPage — list / create / select networks.
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTenantStore } from '@/state';
import { subscribeNetworks, createNetwork } from '@/services/firestore';
import type { NetworkConfig } from '@/domain/network';
import { Plus, Network, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function NetworksPage() {
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [newName, setNewName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { activeNetworkId, setActiveNetwork } = useTenantStore();

  useEffect(() => {
    const unsub = subscribeNetworks((list) => setNetworks(list));
    return unsub;
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const id = await createNetwork(newName.trim());
      toast({ title: 'Network created', description: `ID: ${id}` });
      setNewName('');
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Networks</h1>
            <p className="text-sm text-muted-foreground">Manage your StockWise networks</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Network</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Network</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Network Name</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="My Network" />
                </div>
                <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full">
                  {creating ? 'Creating…' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {networks.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <Network className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No networks yet. Create one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {networks.map((n) => {
              const isActive = n.networkId === activeNetworkId;
              return (
                <Card
                  key={n.networkId}
                  className={cn(
                    'cursor-pointer transition-all hover:border-primary/40',
                    isActive && 'border-primary ring-1 ring-primary/30',
                  )}
                  onClick={() => setActiveNetwork(n.networkId)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{n.name}</CardTitle>
                      {isActive && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Badge variant={n.status === 'active' ? 'default' : 'secondary'}>{n.status}</Badge>
                    <p className="text-xs text-muted-foreground font-mono truncate">{n.networkId}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
