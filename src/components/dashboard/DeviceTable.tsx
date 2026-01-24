import React, { useState } from 'react';
import { Battery, Wifi, WifiOff, AlertTriangle, Edit2, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DeviceWithStatus } from '@/types';
import { cn } from '@/lib/utils';
import { ref, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';

interface DeviceTableProps {
  devices: DeviceWithStatus[];
  loading: boolean;
}

const DeviceTable: React.FC<DeviceTableProps> = ({ devices, loading }) => {
  const [editingMac, setEditingMac] = useState<string | null>(null);
  const [aliasValue, setAliasValue] = useState('');

  const handleEditAlias = (device: DeviceWithStatus) => {
    setEditingMac(device.mac_address);
    setAliasValue(device.alias || '');
  };

  const handleSaveAlias = async (mac: string) => {
    try {
      const deviceRef = ref(database, `devices/${mac}`);
      await update(deviceRef, { alias: aliasValue });
      setEditingMac(null);
    } catch (error) {
      console.error('Error updating alias:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingMac(null);
    setAliasValue('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-status-online" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-status-warning" />;
      default:
        return <WifiOff className="h-4 w-4 text-status-offline" />;
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-status-online';
    if (battery > 20) return 'text-status-warning';
    return 'text-status-offline';
  };

  const formatWeight = (weight: number) => {
    if (weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`;
    }
    return `${weight} g`;
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Weighing Stations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Weighing Stations</span>
          <span className="text-sm font-normal text-muted-foreground">
            Real-time updates
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No devices connected</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop header */}
            <div className="hidden lg:grid lg:grid-cols-5 gap-4 px-4 py-2 text-sm text-muted-foreground font-medium">
              <span>Station</span>
              <span>Weight</span>
              <span>Battery</span>
              <span>Status</span>
              <span>Last Update</span>
            </div>

            {devices.map((device) => (
              <div
                key={device.mac_address}
                className={cn(
                  "rounded-lg border p-4 transition-all",
                  device.status === 'offline'
                    ? "bg-status-offline/5 border-status-offline/30"
                    : device.status === 'warning'
                    ? "bg-status-warning/5 border-status-warning/30"
                    : "bg-card border-border hover:border-primary/30"
                )}
              >
                {/* Mobile layout */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {editingMac === device.mac_address ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={aliasValue}
                            onChange={(e) => setAliasValue(e.target.value)}
                            className="h-8 w-32"
                            placeholder="Station name"
                          />
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveAlias(device.mac_address)}>
                            <Check className="h-4 w-4 text-status-online" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <span className="font-medium">
                            {device.alias || device.mac_address.slice(-5)}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => handleEditAlias(device)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className={cn("status-badge", `status-${device.status}`)}>
                      {getStatusIcon(device.status)}
                      <span>{device.statusText}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                      <span className="font-mono text-lg font-semibold">
                        {formatWeight(device.weight)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Battery className={cn("h-4 w-4", getBatteryColor(device.battery))} />
                        <span className={getBatteryColor(device.battery)}>{device.battery}%</span>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDistanceToNow(device.last_update * 1000, { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Desktop layout */}
                <div className="hidden lg:grid lg:grid-cols-5 gap-4 items-center">
                  <div className="flex items-center gap-2">
                    {editingMac === device.mac_address ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={aliasValue}
                          onChange={(e) => setAliasValue(e.target.value)}
                          className="h-8 w-32"
                          placeholder="Station name"
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleSaveAlias(device.mac_address)}>
                          <Check className="h-4 w-4 text-status-online" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="font-medium">
                          {device.alias || device.mac_address.slice(-5)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleEditAlias(device)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                  </div>
                  <span className="font-mono text-lg font-semibold">
                    {formatWeight(device.weight)}
                  </span>
                  <div className="flex items-center gap-2">
                    <Battery className={cn("h-4 w-4", getBatteryColor(device.battery))} />
                    <span className={getBatteryColor(device.battery)}>{device.battery}%</span>
                  </div>
                  <div className={cn("status-badge w-fit", `status-${device.status}`)}>
                    {getStatusIcon(device.status)}
                    <span>{device.statusText}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(device.last_update * 1000, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DeviceTable;
