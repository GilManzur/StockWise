import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Bell, UserPlus, AlertTriangle } from 'lucide-react';

const ClientSettings: React.FC = () => {
  const { toast } = useToast();
  const [lowWeightThreshold, setLowWeightThreshold] = useState('2000');
  const [lowBatteryAlert, setLowBatteryAlert] = useState(true);
  const [offlineAlert, setOfflineAlert] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');

  const handleSaveAlerts = () => {
    toast({
      title: 'Settings saved',
      description: 'Your alert preferences have been updated.',
    });
  };

  const handleAddUser = () => {
    if (!newUserEmail) return;
    toast({
      title: 'User invited',
      description: `Invitation sent to ${newUserEmail}`,
    });
    setNewUserEmail('');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Configure alerts and manage team access
          </p>
        </div>

        {/* Alert Configuration */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Alert Configuration</CardTitle>
                <CardDescription>Set up notifications for your scales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium">Low Battery Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when device battery drops below 20%
                  </p>
                </div>
                <Switch
                  checked={lowBatteryAlert}
                  onCheckedChange={setLowBatteryAlert}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium">Offline Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Notify when a device goes offline for more than 5 minutes
                  </p>
                </div>
                <Switch
                  checked={offlineAlert}
                  onCheckedChange={setOfflineAlert}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="font-medium">Low Weight Threshold</Label>
                    <p className="text-sm text-muted-foreground">
                      Alert when weight drops below this value (grams)
                    </p>
                  </div>
                </div>
                <Input
                  type="number"
                  value={lowWeightThreshold}
                  onChange={(e) => setLowWeightThreshold(e.target.value)}
                  placeholder="2000"
                  className="max-w-[200px]"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive alert notifications via email
                  </p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
            </div>

            <Button onClick={handleSaveAlerts} className="w-full sm:w-auto">
              Save Alert Settings
            </Button>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserPlus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Team Access</CardTitle>
                <CardDescription>Invite team members to view your dashboard</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="colleague@restaurant.com"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddUser}>
                Invite
              </Button>
            </div>
            <div className="flex items-start gap-2 p-3 bg-status-warning/10 rounded-lg border border-status-warning/30">
              <AlertTriangle className="h-4 w-4 text-status-warning mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Invited users will have read-only access to your dashboard. Contact support for admin privileges.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ClientSettings;
