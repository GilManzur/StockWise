/**
 * RoleBoundary — hides children if the user's network role is insufficient.
 *
 * Reads current member role from the members service.
 * Falls back to hiding content if role is unknown / loading.
 */
import React from 'react';
import type { MemberRole } from '@/domain/network';

const ROLE_LEVELS: Record<MemberRole, number> = {
  viewer: 0,
  manager: 1,
  network_admin: 2,
};

interface RoleBoundaryProps {
  /** Minimum role required to see children. */
  minRole: MemberRole;
  /** Current user's role in the active network. */
  currentRole: MemberRole | null;
  children: React.ReactNode;
  /** Optional fallback when access is denied. */
  fallback?: React.ReactNode;
}

export function RoleBoundary({ minRole, currentRole, children, fallback = null }: RoleBoundaryProps) {
  if (!currentRole) return <>{fallback}</>;
  if (ROLE_LEVELS[currentRole] < ROLE_LEVELS[minRole]) return <>{fallback}</>;
  return <>{children}</>;
}
