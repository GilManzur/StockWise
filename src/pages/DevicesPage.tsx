/**
 * DevicesPage — list brains (ESP32) with Firestore config + RTDB live overlay.
 */
import React, { useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeviceStatusBadge } from '@/components/StatusBadge';
import { useTenantStore, useDevicesStore, type BrainViewModel } from '@/state';
import { createDevice, decommissionDevice } from '@/services/firestore';
import { Cpu, Plus, Power } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { formatDateWithTimezone } from '@/lib/dateUtils';

export default function DevicesPage() {
  const { activeNetworkId, activeLocationId } = useTenantStore();
  const { brains, loading, subscribe, unsubscribe } = useDevicesStore();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [fwVersion, setFwVersion] = React.useState('');
  const [ipAddress, setIpAddress] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  useEffect(() => {
    if (activeNetworkId && activeLocationId) {
      subscribe(activeNetworkId, activeLocationId);
    }
    return () => unsubscribe();
  }, [activeNetworkId, activeLocationId]);

  const handleCreate = async () => {
    if (!activeNetworkId || !activeLocationId) return;
    setCreating(true);
    try {
      await createDevice(activeNetworkId, activeLocationId, {
        status: 'provisioning',
        firmware_version: fwVersion,
        ip_address: ipAddress,
      });
      toast({ title: 'Brain registered' });
      setDialogOpen(false);
      setFwVersion('');
      setIpAddress('');
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDecommission = async (brainId: string) => {
    if (!activeNetworkId || !activeLocationId) return;
    try {
      await decommissionDevice(activeNetworkId, activeLocationId, brainId);
      toast({ title: 'Brain decommissioned' });
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
              <h1 className="text-2xl font-semibold">Devices (Brains)</h1>
              <p className="text-sm text-muted-foreground">ESP32 gateway controllers</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Register Brain</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Register Brain</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Firmware Version</Label>
                    <Input value={fwVersion} onChange={(e) => setFwVersion(e.target.value)} placeholder="1.0.0" />
                  </div>
                  <div className="space-y-2">
                    <Label>IP Address</Label>
                    <Input value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} placeholder="192.168.1.100" />
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? 'Registering…' : 'Register'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {brains.length === 0 && !loading ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <Cpu className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No brains registered at this location.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brain ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Firmware</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Queue</TableHead>
                    <TableHead>Errors</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="w-[80px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brains.map((b) => (
                    <TableRow key={b.brainId}>
                      <TableCell className="font-mono text-xs">{b.brainId.slice(0, 8)}…</TableCell>
                      <TableCell>
                        <DeviceStatusBadge
                          online={b.isOnline}
                          label={b.status === 'decommissioned' ? 'Decommissioned' : b.isOnline ? 'Online' : b.status}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.live?.firmware_version || b.firmwareVersion || '—'}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {b.live?.ip || b.ipAddress || '—'}
                      </TableCell>
                      <TableCell className="font-mono">{b.live?.queue_depth ?? '—'}</TableCell>
                      <TableCell className="font-mono">{b.live?.error_count ?? '—'}</TableCell>
                      <TableCell className="text-xs">
                        {b.live?.last_seen ? formatDateWithTimezone(new Date(b.live.last_seen)) : '—'}
                      </TableCell>
                      <TableCell>
                        {b.status !== 'decommissioned' && (
                          <Button variant="ghost" size="icon" onClick={() => handleDecommission(b.brainId)}>
                            <Power className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
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
