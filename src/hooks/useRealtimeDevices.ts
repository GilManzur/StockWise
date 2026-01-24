import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Device, DeviceWithStatus } from '@/types';

const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

export const getDeviceStatus = (device: Device): { status: 'online' | 'warning' | 'offline'; statusText: string } => {
  const now = Date.now();
  const lastUpdate = device.last_update * 1000; // Convert from Unix timestamp
  const timeDiff = now - lastUpdate;

  if (!device.is_online || timeDiff > OFFLINE_THRESHOLD_MS) {
    return { status: 'offline', statusText: 'Offline' };
  }

  if (device.battery < 20) {
    return { status: 'warning', statusText: 'Low Battery' };
  }

  return { status: 'online', statusText: 'Online' };
};

export const useRealtimeDevices = (restaurantId?: string) => {
  const [devices, setDevices] = useState<DeviceWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const devicesRef = ref(database, 'devices');

    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const deviceList: DeviceWithStatus[] = [];

        Object.entries(data).forEach(([mac, deviceData]: [string, any]) => {
          if (!restaurantId || deviceData.restaurant_id === restaurantId) {
            const device: Device = {
              mac_address: mac,
              ...deviceData,
            };
            const { status, statusText } = getDeviceStatus(device);
            deviceList.push({ ...device, status, statusText });
          }
        });

        setDevices(deviceList);
      } else {
        setDevices([]);
      }
      setLoading(false);
    };

    const handleError = (err: Error) => {
      setError(err.message);
      setLoading(false);
    };

    onValue(devicesRef, handleData, handleError);

    return () => off(devicesRef);
  }, [restaurantId]);

  // Refresh status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDevices((prevDevices) =>
        prevDevices.map((device) => {
          const { status, statusText } = getDeviceStatus(device);
          return { ...device, status, statusText };
        })
      );
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { devices, loading, error };
};
