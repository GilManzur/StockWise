import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useToast } from '@/hooks/use-toast';
import { Plus, Building2, MapPin, Phone, Users, Cpu } from 'lucide-react';
import { z } from 'zod';

const restaurantSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  address: z.string().optional(),
  contact: z.string().optional(),
  adminEmail: z.string().email('Please enter a valid email'),
  adminPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

const AdminRestaurants: React.FC = () => {
  const { restaurants, loading, addRestaurant } = useRestaurants();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    contact: '',
    adminEmail: '',
    adminPassword: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const validation = restaurantSchema.safeParse(formData);
    if (!validation.success) {
      const errors: Record<string, string> = {};
      validation.error.errors.forEach(err => {
        if (err.path[0]) {
          errors[err.path[0] as string] = err.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await addRestaurant({
        name: formData.name,
        address: formData.address,
        contact: formData.contact,
        allowed_masters: [],
        users: [formData.adminEmail],
      });

      toast({
        title: 'Restaurant created',
        description: `${formData.name} has been added successfully.`,
      });

      setDialogOpen(false);
      setFormData({
        name: '',
        address: '',
        contact: '',
        adminEmail: '',
        adminPassword: '',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create restaurant. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Restaurants</h1>
            <p className="text-muted-foreground">
              Manage client restaurants and their admin accounts
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Restaurant
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Restaurant</DialogTitle>
                <DialogDescription>
                  Create a new restaurant and its admin account
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Restaurant Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Burger Salon"
                  />
                  {formErrors.name && (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="123 Main St, City"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contact Phone</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => handleInputChange('contact', e.target.value)}
                    placeholder="+1 234 567 8900"
                  />
                </div>

                <div className="border-t pt-4 mt-4">
                  <p className="text-sm font-medium mb-3">Admin Account</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="adminEmail">Admin Email *</Label>
                    <Input
                      id="adminEmail"
                      type="email"
                      value={formData.adminEmail}
                      onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      placeholder="admin@restaurant.com"
                    />
                    {formErrors.adminEmail && (
                      <p className="text-sm text-destructive">{formErrors.adminEmail}</p>
                    )}
                  </div>

                  <div className="space-y-2 mt-3">
                    <Label htmlFor="adminPassword">Admin Password *</Label>
                    <Input
                      id="adminPassword"
                      type="password"
                      value={formData.adminPassword}
                      onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                      placeholder="••••••••"
                    />
                    {formErrors.adminPassword && (
                      <p className="text-sm text-destructive">{formErrors.adminPassword}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Creating...' : 'Create Restaurant'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="glass-card">
                <CardContent className="p-6">
                  <div className="h-32 bg-muted/50 rounded animate-pulse" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No restaurants yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Restaurant
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((restaurant) => (
              <Card key={restaurant.id} className="glass-card hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {restaurant.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {restaurant.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {restaurant.address}
                    </div>
                  )}
                  {restaurant.contact && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {restaurant.contact}
                    </div>
                  )}
                  <div className="flex items-center gap-4 pt-2 border-t border-border">
                    <div className="flex items-center gap-1 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.users?.length || 0} users</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span>{restaurant.allowed_masters?.length || 0} devices</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminRestaurants;
