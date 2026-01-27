import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { firestore, doc, updateDoc, arrayUnion, addDoc, collection } from '@/lib/firebase';
import { generateUniqueRestaurantCode } from '@/lib/restaurantCode';
import { formatDateWithTimezone } from '@/lib/dateUtils';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, MapPin, Link2, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const restaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  address: z.string().min(5, 'Address is required'),
  chainName: z.string().optional(),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

const AddRestaurant: React.FC = () => {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

  const form = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      name: '',
      address: '',
      chainName: '',
    },
  });

  const onSubmit = async (data: RestaurantFormData) => {
    if (!user || !userProfile) return;

    setIsCreating(true);
    try {
      const restaurantCode = await generateUniqueRestaurantCode();
      const createdAt = formatDateWithTimezone();

      const restaurantData = {
        name: data.name,
        address: data.address,
        chainName: data.chainName || '',
        ownerUid: user.uid,
        restaurant_code: restaurantCode,
        status: '',
        masterController: '',
        allowed_masters: [],
        users: [userProfile.email],
        createdAt,
      };

      const restaurantRef = await addDoc(collection(firestore, 'restaurants'), restaurantData);

      await updateDoc(doc(firestore, 'users', user.uid), {
        restaurants: arrayUnion(restaurantRef.id),
      });

      setCreatedCode(restaurantCode);
      toast.success('Restaurant created successfully!');
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast.error('Failed to create restaurant', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (createdCode) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-12">
          <Card className="border-2 border-primary/20">
            <CardContent className="pt-8 text-center">
              <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Restaurant Created!</h2>
              <p className="text-muted-foreground mb-6">
                Your unique hardware pairing code is:
              </p>
              <div className="bg-secondary p-6 rounded-xl mb-6">
                <p className="text-4xl font-mono font-bold tracking-widest text-primary">
                  {createdCode}
                </p>
              </div>
              <p className="text-sm text-muted-foreground mb-8">
                Use this code to pair your ESP32 devices with this restaurant.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  Go to Lobby
                </Button>
                <Button 
                  className="flex-1"
                  onClick={() => {
                    setCreatedCode(null);
                    form.reset();
                  }}
                >
                  Add Another
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Lobby
        </Button>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Add New Restaurant
            </CardTitle>
            <CardDescription>
              Create a new restaurant location and receive a unique pairing code.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Restaurant Name *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="My Restaurant" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="123 Main St, City" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="chainName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain Name (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                            {...field} 
                            placeholder="שם הרשת" 
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  size="lg"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Restaurant'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AddRestaurant;
