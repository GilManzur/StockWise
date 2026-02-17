/**
 * useTenantStore — persists the user's active network + location selection.
 *
 * Stored in localStorage so it survives page reloads.
 * No Firebase imports — purely client-side navigation state.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantState {
  activeNetworkId: string | null;
  activeLocationId: string | null;

  setActiveNetwork: (networkId: string | null) => void;
  setActiveLocation: (locationId: string | null) => void;
  /** Convenience: set both at once (e.g. deep-link). */
  setTenant: (networkId: string | null, locationId: string | null) => void;
  clear: () => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      activeNetworkId: null,
      activeLocationId: null,

      setActiveNetwork: (networkId) =>
        set({ activeNetworkId: networkId, activeLocationId: null }),

      setActiveLocation: (locationId) =>
        set({ activeLocationId: locationId }),

      setTenant: (networkId, locationId) =>
        set({ activeNetworkId: networkId, activeLocationId: locationId }),

      clear: () =>
        set({ activeNetworkId: null, activeLocationId: null }),
    }),
    { name: 'stockwise-tenant' },
  ),
);
