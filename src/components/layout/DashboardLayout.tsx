import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantStore } from '@/state';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  LayoutDashboard,
  Network,
  MapPin,
  Users,
  Cpu,
  Radio,
  Layers,
  Package,
  Activity,
  Settings,
  LogOut,
  Scale,
  Menu,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { userProfile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { activeNetworkId, activeLocationId } = useTenantStore();

  const isSuperAdmin = userProfile?.role === 'super_admin';
  const hasLocation = !!activeNetworkId && !!activeLocationId;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // New StockWise navigation
  const stockwiseNav = [
    { section: 'Organization', items: [
      { path: '/networks', label: 'Networks', icon: Network },
      { path: '/locations', label: 'Locations', icon: MapPin },
      { path: '/members', label: 'Members', icon: Users },
    ]},
    { section: 'Hardware', items: [
      { path: '/devices', label: 'Brains', icon: Cpu, needsLocation: true },
      { path: '/nodes', label: 'Nodes', icon: Radio, needsLocation: true },
    ]},
    { section: 'Configuration', items: [
      { path: '/shelves', label: 'Shelves & Slots', icon: Layers, needsLocation: true },
      { path: '/skus', label: 'SKUs', icon: Package, needsLocation: true },
    ]},
    { section: 'Monitoring', items: [
      { path: '/inventory', label: 'Live Inventory', icon: Activity, needsLocation: true },
    ]},
  ];

  // Legacy admin nav
  const legacyNav = isSuperAdmin ? [
    { path: '/admin', label: 'Legacy Dashboard', icon: LayoutDashboard },
    { path: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ] : [
    { path: '/dashboard', label: 'Legacy Dashboard', icon: LayoutDashboard },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Scale className="h-6 w-6 text-primary" />
          <span className="font-semibold">StockWise</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:transform-none overflow-y-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "pt-16 lg:pt-0"
        )}
      >
        <div className="flex flex-col h-full p-4">
          {/* Logo */}
          <div className="hidden lg:flex items-center gap-3 px-2 py-4 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Scale className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-lg">StockWise</h1>
              <p className="text-xs text-muted-foreground">IoT Inventory</p>
            </div>
          </div>

          {/* Tenant context indicator */}
          {activeNetworkId && (
            <div className="px-3 py-2 mb-3 rounded-lg bg-secondary/50 text-xs space-y-0.5">
              <p className="text-muted-foreground">Network: <span className="font-mono text-foreground">{activeNetworkId.slice(0, 8)}…</span></p>
              {activeLocationId && (
                <p className="text-muted-foreground">Location: <span className="font-mono text-foreground">{activeLocationId.slice(0, 8)}…</span></p>
              )}
            </div>
          )}

          {/* StockWise Navigation */}
          <nav className="flex-1 space-y-5">
            {stockwiseNav.map((group) => (
              <div key={group.section}>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.section}
                </p>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const disabled = item.needsLocation && !hasLocation;
                    return (
                      <Link
                        key={item.path}
                        to={disabled ? '#' : item.path}
                        onClick={() => !disabled && setSidebarOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : disabled
                            ? "text-muted-foreground/40 cursor-not-allowed"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legacy section */}
            <div>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Legacy
              </p>
              <div className="space-y-0.5">
                {legacyNav.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* User info & logout */}
          <div className="pt-4 border-t border-border">
            <div className="hidden lg:flex items-center justify-between px-3 mb-3">
              <span className="text-xs text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <div className="px-3 py-2 mb-2">
              <p className="text-sm font-medium truncate">
                {userProfile?.displayName || userProfile?.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {userProfile?.role?.replace('_', ' ')}
              </p>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
