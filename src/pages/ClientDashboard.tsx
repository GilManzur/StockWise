import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import WelcomePage from './WelcomePage';
import RestaurantLobby from './RestaurantLobby';

/**
 * Smart Dashboard Router
 * - 0 restaurants: Show WelcomePage (create first restaurant)
 * - 1 restaurant: Redirect to that restaurant's dashboard
 * - 2+ restaurants: Show RestaurantLobby (selection screen)
 */
const ClientDashboard: React.FC = () => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    const restaurantCount = userProfile?.restaurants?.length || 0;

    if (restaurantCount === 1) {
      // Single restaurant - redirect directly to its dashboard
      navigate(`/dashboard/${userProfile!.restaurants[0]}`, { replace: true });
    } else {
      // 0 or multiple restaurants - show appropriate component
      setChecking(false);
    }
  }, [userProfile, loading, navigate]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const restaurantCount = userProfile?.restaurants?.length || 0;

  if (restaurantCount === 0) {
    return <WelcomePage />;
  }

  // Multiple restaurants
  return <RestaurantLobby />;
};

export default ClientDashboard;
