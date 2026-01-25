export interface Restaurant {
  id: string;
  name: string;
  address?: string;
  contact?: string;
  allowed_masters: string[];
  users: string[];
  createdAt?: number;
}

export interface Device {
  mac_address: string;
  weight: number;
  battery: number;
  is_online: boolean;
  last_update: number;
  restaurant_id: string;
  alias?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName?: string;
  lastName?: string;
  country?: string;
  phone?: string;
  role: 'super_admin' | 'client';
  restaurants: string[];
  displayName?: string;
  createdAt?: string;
}

export interface RestaurantData {
  id?: string;
  name: string;
  address: string;
  chainName?: string;
  ownerUid: string;
  status: string;
  masterController: string;
  allowed_masters: string[];
  users: string[];
  createdAt: string;
}

export interface Alert {
  id: string;
  device_mac: string;
  type: 'low_weight' | 'low_battery' | 'offline';
  threshold: number;
  enabled: boolean;
  notify_email?: boolean;
  notify_sms?: boolean;
}

export interface DeviceWithStatus extends Device {
  status: 'online' | 'warning' | 'offline';
  statusText: string;
}
