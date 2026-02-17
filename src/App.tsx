import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Legacy routes (kept for migration)
import ClientDashboard from "./pages/ClientDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import AddRestaurant from "./pages/AddRestaurant";
import ClientSettings from "./pages/ClientSettings";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRestaurants from "./pages/AdminRestaurants";
import AdminDevices from "./pages/AdminDevices";
import AdminSettings from "./pages/AdminSettings";

// Phase 4: Admin management pages
import NetworksPage from "./pages/NetworksPage";
import LocationsPage from "./pages/LocationsPage";
import MembersPage from "./pages/MembersPage";
import DevicesPage from "./pages/DevicesPage";
import NodesPage from "./pages/NodesPage";
import ShelvesPage from "./pages/ShelvesPage";
import SkusPage from "./pages/SkusPage";

// Phase 5: Live dashboard
import InventoryDashboard from "./pages/InventoryDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            {/* ─── New StockWise routes (Phase 4 + 5) ─── */}
            <Route path="/networks" element={
              <ProtectedRoute><NetworksPage /></ProtectedRoute>
            } />
            <Route path="/locations" element={
              <ProtectedRoute><LocationsPage /></ProtectedRoute>
            } />
            <Route path="/members" element={
              <ProtectedRoute><MembersPage /></ProtectedRoute>
            } />
            <Route path="/devices" element={
              <ProtectedRoute><DevicesPage /></ProtectedRoute>
            } />
            <Route path="/nodes" element={
              <ProtectedRoute><NodesPage /></ProtectedRoute>
            } />
            <Route path="/shelves" element={
              <ProtectedRoute><ShelvesPage /></ProtectedRoute>
            } />
            <Route path="/skus" element={
              <ProtectedRoute><SkusPage /></ProtectedRoute>
            } />
            <Route path="/inventory" element={
              <ProtectedRoute><InventoryDashboard /></ProtectedRoute>
            } />

            {/* ─── Legacy routes (kept for migration) ─── */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="client"><ClientDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/:restaurantId" element={
              <ProtectedRoute requiredRole="client"><RestaurantDashboard /></ProtectedRoute>
            } />
            <Route path="/dashboard/add-restaurant" element={
              <ProtectedRoute requiredRole="client"><AddRestaurant /></ProtectedRoute>
            } />
            <Route path="/dashboard/settings" element={
              <ProtectedRoute requiredRole="client"><ClientSettings /></ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute requiredRole="super_admin"><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/restaurants" element={
              <ProtectedRoute requiredRole="super_admin"><AdminRestaurants /></ProtectedRoute>
            } />
            <Route path="/admin/devices" element={
              <ProtectedRoute requiredRole="super_admin"><AdminDevices /></ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute requiredRole="super_admin"><AdminSettings /></ProtectedRoute>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
