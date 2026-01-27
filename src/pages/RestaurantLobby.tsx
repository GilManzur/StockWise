import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, documentId } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Building2, MapPin, Plus, LogOut, Loader2 } from 'lucide-react';
import { RestaurantData } from '@/types';

interface RestaurantWithId extends RestaurantData {
  id: string;
}

const RestaurantLobby: React.FC = () => {
  const { userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [restaurants, setRestaurants] = useState<RestaurantWithId[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!userProfile?.restaurants?.length) {
        setLoading(false);
        return;
      }

      try {
        const restaurantsRef = collection(firestore, 'restaurants');
        const q = query(restaurantsRef, where(documentId(), 'in', userProfile.restaurants));
        const snapshot = await getDocs(q);
        
        const restaurantList: RestaurantWithId[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        } as RestaurantWithId));

        setRestaurants(restaurantList);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [userProfile]);

  const handleSelectRestaurant = (restaurantId: string) => {
    navigate(`/dashboard/${restaurantId}`);
  };

  const handleAddRestaurant = () => {
    navigate('/dashboard/add-restaurant');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="font-semibold text-lg">ScaleSync</span>
            <p className="text-xs text-muted-foreground">Restaurant Lobby</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {userProfile?.firstName}!
            </h1>
            <p className="text-muted-foreground">
              Select a restaurant to view its monitoring dashboard.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <Card 
                key={restaurant.id}
                className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 group"
                onClick={() => handleSelectRestaurant(restaurant.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                      <Building2 className="h-8 w-8 text-primary" />
                    </div>
                    {restaurant.chainName && (
                      <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded">
                        {restaurant.chainName}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                    {restaurant.name}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {restaurant.address}
                  </CardDescription>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground font-mono">
                      Code: <span className="font-bold text-foreground">{restaurant.restaurant_code || 'N/A'}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Add Restaurant Card */}
            <Card 
              className="cursor-pointer border-2 border-dashed hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 flex items-center justify-center min-h-[200px]"
              onClick={handleAddRestaurant}
            >
              <CardContent className="flex flex-col items-center text-center p-6">
                <div className="p-4 bg-secondary rounded-full mb-4">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="font-medium text-muted-foreground">Add New Restaurant</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RestaurantLobby;
