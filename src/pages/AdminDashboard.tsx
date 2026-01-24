import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SummaryCards from '@/components/dashboard/SummaryCards';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import { useRestaurants } from '@/hooks/useRestaurants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Cpu, Users } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { devices, loading: devicesLoading } = useRealtimeDevices();
  const { restaurants, loading: restaurantsLoading } = useRestaurants();

  const totalUsers = restaurants.reduce((sum, r) => sum + (r.users?.length || 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Admin Overview</h1>
          <p className="text-muted-foreground">
            System-wide monitoring and management
          </p>
        </div>

        <SummaryCards devices={devices} />

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Restaurants
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="data-value text-primary">
                {restaurantsLoading ? '—' : restaurants.length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Devices
              </CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="data-value text-primary">
                {devicesLoading ? '—' : devices.length}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="data-value text-primary">
                {restaurantsLoading ? '—' : totalUsers}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent activity could go here */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Activity feed will appear here when devices report data.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
