import { useState, useEffect } from 'react';
import { ref, onValue, off, push, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import { Restaurant } from '@/types';

export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const restaurantsRef = ref(database, 'restaurants');

    const handleData = (snapshot: any) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const restaurantList: Restaurant[] = Object.entries(data).map(([id, restaurantData]: [string, any]) => ({
          id,
          ...restaurantData,
          allowed_masters: restaurantData.allowed_masters || [],
          users: restaurantData.users || [],
        }));
        setRestaurants(restaurantList);
      } else {
        setRestaurants([]);
      }
      setLoading(false);
    };

    onValue(restaurantsRef, handleData, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => off(restaurantsRef);
  }, []);

  const addRestaurant = async (restaurant: Omit<Restaurant, 'id'>) => {
    const restaurantsRef = ref(database, 'restaurants');
    const newRef = push(restaurantsRef);
    await set(newRef, {
      ...restaurant,
      createdAt: Date.now(),
    });
    return newRef.key;
  };

  const updateRestaurant = async (id: string, updates: Partial<Restaurant>) => {
    const restaurantRef = ref(database, `restaurants/${id}`);
    await update(restaurantRef, updates);
  };

  const addMasterDevice = async (restaurantId: string, macAddress: string) => {
    const restaurant = restaurants.find(r => r.id === restaurantId);
    if (restaurant) {
      const updatedMasters = [...(restaurant.allowed_masters || []), macAddress];
      await updateRestaurant(restaurantId, { allowed_masters: updatedMasters });
    }
  };

  return { restaurants, loading, error, addRestaurant, updateRestaurant, addMasterDevice };
};
