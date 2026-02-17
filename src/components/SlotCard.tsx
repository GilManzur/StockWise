/**
 * SlotCard — renders a single slot's live state as a compact card.
 */
import type { SlotViewModel } from '@/domain/inventory';
import { SlotStatus } from '@/domain/inventory';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Package, AlertTriangle, WifiOff, Clock } from 'lucide-react';

interface SlotCardProps {
  slot: SlotViewModel;
  onClick?: (slot: SlotViewModel) => void;
}

export function SlotCard({ slot, onClick }: SlotCardProps) {
  const hasOverlay = slot.isOffline || slot.isStale || slot.hasError;

  return (
    <Card
      className={cn(
        'relative cursor-pointer transition-all hover:shadow-md hover:border-primary/30',
        hasOverlay && 'opacity-80',
      )}
      onClick={() => onClick?.(slot)}
    >
      {/* Overlay icons for problem states */}
      {slot.isOffline && (
        <div className="absolute top-2 right-2">
          <WifiOff className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      {slot.isStale && !slot.isOffline && (
        <div className="absolute top-2 right-2">
          <Clock className="h-4 w-4 text-status-warning" />
        </div>
      )}
      {slot.hasError && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className="h-4 w-4 text-status-offline" />
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{slot.slotName}</p>
            <p className="text-xs text-muted-foreground truncate">{slot.skuName || 'No SKU'}</p>
          </div>
        </div>

        {/* Quantity */}
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-2xl font-semibold tracking-tight">
            {slot.status === SlotStatus.OFFLINE_NODE ? '—' : slot.quantity}
          </span>
          {slot.status !== SlotStatus.OFFLINE_NODE && (
            <span className="text-xs text-muted-foreground">items</span>
          )}
        </div>

        {/* Weight + confidence */}
        {slot.status !== SlotStatus.OFFLINE_NODE && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="font-mono">{slot.netWeightG.toFixed(0)}g</span>
            <span>·</span>
            <span>{(slot.confidence * 100).toFixed(0)}% conf</span>
          </div>
        )}

        {/* Status badge */}
        <StatusBadge status={slot.status} label={slot.statusLabel} />

        {/* Flags row */}
        {(slot.isOverloaded || slot.isCalibrating) && (
          <div className="flex gap-1.5 flex-wrap">
            {slot.isOverloaded && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-offline/10 text-status-offline font-medium">
                OVERLOAD
              </span>
            )}
            {slot.isCalibrating && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                CALIBRATING
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
