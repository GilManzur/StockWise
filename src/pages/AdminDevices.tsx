import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import { useToast } from '@/hooks/use-toast';
import { Plus, Cpu, Building2, Battery, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { z } from 'zod';
import { ref, set } from 'firebase/database';
import { database } from '@/lib/firebase';

const macAddressSchema = z.string().regex(
  /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/,
  'Please enter a valid MAC address (e.g., 24:6F:28:XX:XX:XX)'
);

const AdminDevices: React.FC = () => {
  const { restaurants } = useRestaurants();
  const { devices, loading } = useRealtimeDevices();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [macAddress, setMacAddress] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const macValidation = macAddressSchema.safeParse(macAddress.toUpperCase());
    if (!macValidation.success) {
      setFormError(macValidation.error.errors[0].message);
      return;
    }

    if (!selectedRestaurant) {
      setFormError('Please select a restaurant');
      return;
    }

    setSubmitting(true);
    try {
      // Add device to database
      const deviceRef = ref(database, `devices/${macAddress.toUpperCase().replace(/[:-]/g, ':')}`);
      await set(deviceRef, {
        weight: 0,
        battery: 100,
        is_online: false,
        last_update: Math.floor(Date.now() / 1000),
        restaurant_id: selectedRestaurant,
      });

      // Add to restaurant's allowed_masters
      const restaurant = restaurants.find(r => r.id === selectedRestaurant);
      if (restaurant) {
        const restaurantRef = ref(database, `restaurants/${selectedRestaurant}/allowed_masters`);
        const updatedMasters = [...(restaurant.allowed_masters || []), macAddress.toUpperCase()];
        await set(restaurantRef, updatedMasters);
      }

      toast({
        title: 'Device registered',
        description: `Master device ${macAddress} has been assigned.`,
      });

      setDialogOpen(false);
      setMacAddress('');
      setSelectedRestaurant('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to register device. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getRestaurantName = (restaurantId: string) => {
    return restaurants.find(r => r.id === restaurantId)?.name || 'Unassigned';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Device Management</h1>
            <p className="text-muted-foreground">
              Register and assign master controllers to restaurants
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Register Device
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Register Master Device</DialogTitle>
                <DialogDescription>
                  Enter the MAC address printed on the device and assign it to a restaurant
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="mac">MAC Address *</Label>
                  <Input
                    id="mac"
                    value={macAddress}
                    onChange={(e) => {
                      setMacAddress(e.target.value);
                      setFormError('');
                    }}
                    placeholder="24:6F:28:XX:XX:XX"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    Find this on the label attached to the ESP32 device
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurant">Assign to Restaurant *</Label>
                  <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a restaurant" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurants.map((restaurant) => (
                        <SelectItem key={restaurant.id} value={restaurant.id}>
                          {restaurant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formError && (
                  <p className="text-sm text-destructive">{formError}</p>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Register Device'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="h-16 bg-muted/50 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : devices.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No devices registered yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Register Your First Device
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Registered Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Desktop header */}
                <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-4 py-2 text-sm text-muted-foreground font-medium">
                  <span>MAC Address</span>
                  <span>Restaurant</span>
                  <span>Battery</span>
                  <span>Status</span>
                  <span>Last Seen</span>
                </div>

                {devices.map((device) => (
                  <div
                    key={device.mac_address}
                    className={cn(
                      "rounded-lg border p-4 transition-all",
                      device.status === 'offline'
                        ? "bg-status-offline/5 border-status-offline/30"
                        : "bg-card border-border"
                    )}
                  >
                    {/* Mobile layout */}
                    <div className="lg:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-medium">{device.mac_address}</span>
                        {device.status === 'online' ? (
                          <Wifi className="h-4 w-4 text-status-online" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-status-offline" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        {getRestaurantName(device.restaurant_id)}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className={cn(
                          "h-4 w-4",
                          device.battery > 50 ? "text-status-online" :
                          device.battery > 20 ? "text-status-warning" : "text-status-offline"
                        )} />
                        {device.battery}%
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-center">
                      <span className="font-mono">{device.mac_address}</span>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        {getRestaurantName(device.restaurant_id)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Battery className={cn(
                          "h-4 w-4",
                          device.battery > 50 ? "text-status-online" :
                          device.battery > 20 ? "text-status-warning" : "text-status-offline"
                        )} />
                        {device.battery}%
                      </div>
                      <div className={cn(
                        "status-badge w-fit",
                        `status-${device.status}`
                      )}>
                        {device.status === 'online' ? (
                          <Wifi className="h-3 w-3" />
                        ) : (
                          <WifiOff className="h-3 w-3" />
                        )}
                        <span className="capitalize">{device.status}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(device.last_update * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDevices;
