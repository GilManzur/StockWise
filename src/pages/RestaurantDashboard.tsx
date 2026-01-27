import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import DashboardLayout from '@/components/layout/DashboardLayout';
import SummaryCards from '@/components/dashboard/SummaryCards';
import DeviceTable from '@/components/dashboard/DeviceTable';
import { useRealtimeDevices } from '@/hooks/useRealtimeDevices';
import { useAuth } from '@/contexts/AuthContext';
import { RestaurantData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Building2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface RestaurantWithId extends RestaurantData {
  id: string;
}

const RestaurantDashboard: React.FC = () => {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantWithId | null>(null);
  const [loadingRestaurant, setLoadingRestaurant] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const { devices, loading: loadingDevices } = useRealtimeDevices(restaurantId);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!restaurantId) return;

      try {
        const restaurantDoc = await getDoc(doc(firestore, 'restaurants', restaurantId));
        if (restaurantDoc.exists()) {
          setRestaurant({
            id: restaurantDoc.id,
            ...restaurantDoc.data(),
          } as RestaurantWithId);
        }
      } catch (error) {
        console.error('Error fetching restaurant:', error);
      } finally {
        setLoadingRestaurant(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  const handleCopyCode = async () => {
    if (restaurant?.restaurant_code) {
      await navigator.clipboard.writeText(restaurant.restaurant_code);
      setCopied(true);
      toast.success('Pairing code copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const hasMultipleRestaurants = (userProfile?.restaurants?.length || 0) > 1;

  if (loadingRestaurant) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            {hasMultipleRestaurants && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl lg:text-3xl font-bold">{restaurant?.name}</h1>
              </div>
              <p className="text-muted-foreground">
                {restaurant?.address}
              </p>
            </div>
          </div>

          {/* Pairing Code Card */}
          <Card className="lg:w-auto">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardDescription className="text-xs">Hardware Pairing Code</CardDescription>
            </CardHeader>
            <CardContent className="pb-4 px-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                  {restaurant?.restaurant_code || 'N/A'}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleCopyCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary & Devices */}
        <SummaryCards devices={devices} />
        <DeviceTable devices={devices} loading={loadingDevices} />
      </div>
    </DashboardLayout>
  );
};

export default RestaurantDashboard;
