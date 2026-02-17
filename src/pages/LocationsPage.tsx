/**
 * LocationsPage — list / create / select locations for the active network.
 */
import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { TenantGuard } from '@/components/TenantGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useTenantStore } from '@/state';
import { subscribeLocations, createLocation } from '@/services/firestore';
import type { LocationConfig } from '@/domain/network';
import { Plus, MapPin, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function LocationsPage() {
  const { activeNetworkId, activeLocationId, setActiveLocation } = useTenantStore();
  const [locations, setLocations] = useState<LocationConfig[]>([]);
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!activeNetworkId) return;
    const unsub = subscribeLocations(activeNetworkId, (list) => setLocations(list));
    return unsub;
  }, [activeNetworkId]);

  const handleCreate = async () => {
    if (!activeNetworkId || !name.trim()) return;
    setCreating(true);
    try {
      await createLocation(activeNetworkId, { name: name.trim(), timezone });
      toast({ title: 'Location created' });
      setName('');
      setDialogOpen(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardLayout>
      <TenantGuard requireLocation={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Locations</h1>
              <p className="text-sm text-muted-foreground">Sites within this network</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />New Location</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Create Location</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Location Name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Main Kitchen" />
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
                  </div>
                  <Button onClick={handleCreate} disabled={creating || !name.trim()} className="w-full">
                    {creating ? 'Creating…' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {locations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-12">
                <MapPin className="h-10 w-10 text-muted-foreground" />
                <p className="text-muted-foreground">No locations yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {locations.map((loc) => {
                const isActive = loc.locationId === activeLocationId;
                return (
                  <Card
                    key={loc.locationId}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary/40',
                      isActive && 'border-primary ring-1 ring-primary/30',
                    )}
                    onClick={() => setActiveLocation(loc.locationId)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{loc.name}</CardTitle>
                        {isActive && <Check className="h-5 w-5 text-primary" />}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <Badge variant={loc.status === 'active' ? 'default' : 'secondary'}>{loc.status}</Badge>
                      <p className="text-xs text-muted-foreground">{loc.timezone}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </TenantGuard>
    </DashboardLayout>
  );
}
