/**
 * StatusBadge — renders a coloured pill for any SlotStatus or device status.
 */
import { cn } from '@/lib/utils';
import { SlotStatus } from '@/domain/inventory';

const statusStyles: Record<SlotStatus, string> = {
  [SlotStatus.OK]:            'bg-status-online/20 text-status-online',
  [SlotStatus.LOW]:           'bg-status-warning/20 text-status-warning',
  [SlotStatus.EMPTY]:         'bg-status-offline/20 text-status-offline',
  [SlotStatus.ERROR_SENSOR]:  'bg-status-offline/20 text-status-offline',
  [SlotStatus.OFFLINE_NODE]:  'bg-muted text-muted-foreground',
  [SlotStatus.STALE]:         'bg-status-warning/20 text-status-warning',
  [SlotStatus.UNCALIBRATED]:  'bg-status-neutral/20 text-status-neutral',
  [SlotStatus.CALIBRATING]:   'bg-primary/20 text-primary',
};

interface StatusBadgeProps {
  status: SlotStatus;
  label: string;
  className?: string;
}

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        statusStyles[status],
        className,
      )}
    >
      <span className={cn(
        'h-1.5 w-1.5 rounded-full',
        status === SlotStatus.OK ? 'bg-status-online' :
        status === SlotStatus.LOW || status === SlotStatus.STALE ? 'bg-status-warning' :
        status === SlotStatus.EMPTY || status === SlotStatus.ERROR_SENSOR ? 'bg-status-offline' :
        status === SlotStatus.CALIBRATING ? 'bg-primary' :
        'bg-muted-foreground'
      )} />
      {label}
    </span>
  );
}

/** Simple online/offline badge for devices. */
export function DeviceStatusBadge({ online, label }: { online: boolean; label?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
      online ? 'bg-status-online/20 text-status-online' : 'bg-muted text-muted-foreground',
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', online ? 'bg-status-online' : 'bg-muted-foreground')} />
      {label ?? (online ? 'Online' : 'Offline')}
    </span>
  );
}
