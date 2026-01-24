import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SummaryCards from '@/components/dashboard/SummaryCards';
import DeviceTable from '@/components/dashboard/DeviceTable';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import { useAuth } from '@/contexts/AuthContext';

const ClientDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { devices, loading } = useRealtimeDevices(userProfile?.restaurant_id);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of your weighing stations
          </p>
        </div>

        <SummaryCards devices={devices} />
        <DeviceTable devices={devices} loading={loading} />
      </div>
    </DashboardLayout>
  );
};

export default ClientDashboard;
