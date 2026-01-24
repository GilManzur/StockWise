import React from 'react';
import { Scale, Battery, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { DeviceWithStatus } from '@/types';
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
  devices: DeviceWithStatus[];
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ devices }) => {
  const activeDevices = devices.filter(d => d.status === 'online').length;
  const lowBatteryDevices = devices.filter(d => d.battery < 20).length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const totalWeight = devices.reduce((sum, d) => sum + (d.weight || 0), 0);

  const cards = [
    {
      title: 'Active Scales',
      value: activeDevices,
      total: devices.length,
      icon: Wifi,
      color: 'text-status-online',
      bgColor: 'bg-status-online/10',
    },
    {
      title: 'Low Battery',
      value: lowBatteryDevices,
      icon: Battery,
      color: lowBatteryDevices > 0 ? 'text-status-warning' : 'text-muted-foreground',
      bgColor: lowBatteryDevices > 0 ? 'bg-status-warning/10' : 'bg-muted/50',
    },
    {
      title: 'Offline Devices',
      value: offlineDevices,
      icon: WifiOff,
      color: offlineDevices > 0 ? 'text-status-offline' : 'text-muted-foreground',
      bgColor: offlineDevices > 0 ? 'bg-status-offline/10' : 'bg-muted/50',
    },
    {
      title: 'Total Weight',
      value: `${(totalWeight / 1000).toFixed(1)} kg`,
      icon: Scale,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="glass-card animate-fade-in">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                <p className={cn("data-value", card.color)}>
                  {card.value}
                  {card.total !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{card.total}
                    </span>
                  )}
                </p>
              </div>
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <card.icon className={cn("h-5 w-5", card.color)} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SummaryCards;
