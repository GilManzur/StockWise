import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Database, Bell } from 'lucide-react';

const AdminSettings: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold mb-2">System Settings</h1>
          <p className="text-muted-foreground">
            Configure global system settings and security rules
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Firebase Security Rules</CardTitle>
                <CardDescription>
                  Security rules are deployed separately via Firebase Console
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Ensure your Firebase Realtime Database rules are configured to:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-muted-foreground">
              <li>Validate that users can only access their restaurant's data</li>
              <li>Check that device MAC addresses are in the allowed_masters list</li>
              <li>Prevent cross-restaurant data access</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Database Backup</CardTitle>
                <CardDescription>
                  Configure automatic backups in Firebase Console
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Firebase Realtime Database supports automatic backups on the Blaze plan.
              Configure backup schedules in your Firebase project settings.
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Global Notifications</CardTitle>
                <CardDescription>
                  System-wide notification settings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure email/SMS notification providers to enable alerts for restaurant owners.
              Integration with services like SendGrid or Twilio can be added here.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
