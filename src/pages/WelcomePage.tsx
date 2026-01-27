import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { firestore, doc, updateDoc, arrayUnion, addDoc, collection } from '@/lib/firebase';
import { generateUniqueRestaurantCode } from '@/lib/restaurantCode';
import { formatDateWithTimezone } from '@/lib/dateUtils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building2, MapPin, Link2, ArrowRight, Scale, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const restaurantSchema = z.object({
  name: z.string().min(2, 'Restaurant name is required'),
  address: z.string().min(5, 'Address is required'),
  chainName: z.string().optional(),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

const WelcomePage: React.FC = () => {
  const { userProfile, user } = useAuth();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

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
      // Generate unique restaurant code
      const restaurantCode = await generateUniqueRestaurantCode();
      const createdAt = formatDateWithTimezone();

      // Create restaurant document
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

      // Update user's restaurants array
      await updateDoc(doc(firestore, 'users', user.uid), {
        restaurants: arrayUnion(restaurantRef.id),
      });

      toast.success('Restaurant created successfully!', {
        description: `Pairing code: ${restaurantCode}`,
      });

      // Reload page to trigger smart routing
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating restaurant:', error);
      toast.error('Failed to create restaurant', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Scale className="h-6 w-6 text-primary" />
          </div>
          <span className="font-semibold text-lg">ScaleSync</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome, {userProfile?.firstName}! 👋</h1>
            <p className="text-muted-foreground">
              Let's set up your first restaurant to start monitoring your scales.
            </p>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Create Your First Restaurant
              </CardTitle>
              <CardDescription>
                Enter your restaurant details. You'll receive a unique pairing code for your hardware.
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
                      <>
                        Create Restaurant
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default WelcomePage;
