/**
 * NodesPage — list ESP8266 nodes with config + RTDB live overlay.
 */
import React, { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeviceStatusBadge } from '@/components/StatusBadge';
import { useTenantStore, useDevicesStore } from '@/state';
import { registerNode, updateNode } from '@/services/firestore';
import { Radio, Plus, Signal } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDateWithTimezone } from '@/lib/dateUtils';

export default function NodesPage() {
  const { activeNetworkId, activeLocationId } = useTenantStore();
  const { nodes, brains, loading, subscribe, unsubscribe } = useDevicesStore();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [mac, setMac] = React.useState('');
  const [brainId, setBrainId] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  useEffect(() => {
    if (activeNetworkId && activeLocationId) subscribe(activeNetworkId, activeLocationId);
    return () => unsubscribe();
  }, [activeNetworkId, activeLocationId]);

  const handleRegister = async () => {
    if (!activeNetworkId || !activeLocationId || !mac.trim()) return;
    setCreating(true);
    try {
      await registerNode(activeNetworkId, activeLocationId, mac.trim(), {
        paired_to_brain: brainId || '',
        firmware_version: '',
        status: 'provisioning',
      });
      toast({ title: 'Node registered' });
      setDialogOpen(false);
      setMac('');
      setBrainId('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handlePairBrain = async (nodeId: string, newBrainId: string) => {
    if (!activeNetworkId || !activeLocationId) return;
    try {
      await updateNode(activeNetworkId, activeLocationId, nodeId, { paired_to_brain: newBrainId });
      toast({ title: 'Node paired to brain' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  return (
    <DashboardLayout>
      <TenantGuard>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Nodes</h1>
              <p className="text-sm text-muted-foreground">ESP8266 sensor nodes</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Register Node</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register Node</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>MAC Address</Label>
                    <Input value={mac} onChange={(e) => setMac(e.target.value)} placeholder="AA:BB:CC:DD:EE:FF" />
                  </div>
                  <div className="space-y-2">
                    <Label>Pair to Brain (optional)</Label>
                    <Select value={brainId} onValueChange={setBrainId}>
                      <SelectTrigger><SelectValue placeholder="Select brain…" /></SelectTrigger>
                      <SelectContent>
                        {brains.map((b) => (
                          <SelectItem key={b.brainId} value={b.brainId}>
                            {b.brainId.slice(0, 8)}… ({b.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleRegister} disabled={creating || !mac.trim()} className="w-full">
                    {creating ? 'Registering…' : 'Register'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {nodes.length === 0 && !loading ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Radio className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No nodes registered at this location.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Node (MAC)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paired Brain</TableHead>
                    <TableHead>RSSI</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Battery</TableHead>
                    <TableHead>Last Seen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {nodes.map((n) => (
                    <TableRow key={n.nodeId}>
                      <TableCell className="font-mono text-xs">{n.nodeId}</TableCell>
                      <TableCell>
                        <DeviceStatusBadge online={n.isOnline} label={n.isOnline ? 'Online' : n.status} />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={n.pairedToBrain || ''}
                          onValueChange={(v) => handlePairBrain(n.nodeId, v)}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Unpaired" />
                          </SelectTrigger>
                          <SelectContent>
                            {brains.map((b) => (
                              <SelectItem key={b.brainId} value={b.brainId}>
                                {b.brainId.slice(0, 8)}…
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-mono">
                        {n.live ? (
                          <span className="flex items-center gap-1">
                            <Signal className="h-3 w-3" />
                            {n.live.rssi} dBm
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="font-mono">{n.live?.error_count ?? '—'}</TableCell>
                      <TableCell className="font-mono">
                        {n.live?.battery != null ? `${n.live.battery}%` : '—'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {n.live?.last_seen ? formatDateWithTimezone(new Date(n.live.last_seen)) : '—'}
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
