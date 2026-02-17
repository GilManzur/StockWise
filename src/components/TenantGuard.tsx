/**
 * TenantGuard — renders children only when a network + location are selected.
 * Otherwise shows a prompt to select them.
 */
import React from 'react';
import { useTenantStore } from '@/state';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin } from 'lucide-react';

interface TenantGuardProps {
  /** Require location too (default true). Set false for network-only pages. */
  requireLocation?: boolean;
  children: React.ReactNode;
}

export function TenantGuard({ requireLocation = true, children }: TenantGuardProps) {
  const { activeNetworkId, activeLocationId } = useTenantStore();

  if (!activeNetworkId || (requireLocation && !activeLocationId)) {
    return (
      <Card className="max-w-md mx-auto mt-12">
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="p-3 rounded-full bg-primary/10">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold text-lg">No {!activeNetworkId ? 'network' : 'location'} selected</h3>
            <p className="text-sm text-muted-foreground">
              Go to <span className="font-medium text-foreground">Networks</span> to select
              {!activeNetworkId ? ' a network' : ' a location'} first.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
