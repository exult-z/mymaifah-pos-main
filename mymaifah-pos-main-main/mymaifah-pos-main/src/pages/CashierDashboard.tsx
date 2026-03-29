import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Coffee, Receipt, Clock, ArrowLeft, LogOut, Users, TrendingUp, DollarSign, Star, Moon, Sun, Package, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useSales } from '@/hooks/useStore';
import { useTheme } from '@/hooks/useTheme';
import AccountSwitcher from '@/components/AccountSwitcher';
import { toast } from 'sonner';

const CashierDashboard = () => {
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { theme, toggleTheme, setUserThemePreference } = useTheme();
  const { todayRevenue, todayOrders, getBestSeller, todaySales } = useSales();
  
  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Redirect if not cashier - using useEffect
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (user?.role !== 'cashier') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Calculate current cashier's stats
  const mySales = todaySales.filter(sale => sale.cashierName === user?.fullName);
  const myTotalSales = mySales.reduce((sum, sale) => sum + sale.total, 0);
  const myOrderCount = mySales.length;
  const myItemsSold = mySales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );
  const myAverageOrder = myOrderCount > 0 ? myTotalSales / myOrderCount : 0;

  const averageOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;
  const recentOrders = mySales.slice(0, 5);
  const totalItemsSold = todaySales.reduce((sum, sale) => 
    sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
  );

  const handleLogout = () => {
    logout();
    // useEffect will handle redirect
  };

  const handleThemeToggle = () => {
    toggleTheme();
    if (user?.id) {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setUserThemePreference(user.id, newTheme);
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render if not cashier
  if (!isAuthenticated || user?.role !== 'cashier') {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="gradient-orange px-4 pt-6 pb-6 rounded-b-3xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/pos')}
                className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground">Cashier Dashboard</h1>
                <p className="text-sm text-primary-foreground/70">Welcome back, {user.fullName}!</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleThemeToggle}
                className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Sun className="w-5 h-5 text-primary-foreground" />
                )}
              </button>
              <button
                onClick={() => setShowAccountSwitcher(true)}
                className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
              >
                <Users className="w-5 h-5 text-primary-foreground" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
              >
                <LogOut className="w-5 h-5 text-primary-foreground" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-foreground/70">{dateStr}</p>
            <p className="text-sm font-semibold text-primary-foreground">{timeStr}</p>
          </div>
        </div>

        <div className="px-4 -mt-2 pb-4">
          {/* Today's Overall Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <DollarSign className="w-5 h-5 text-success mb-2" />
              <p className="text-xs text-muted-foreground">Today's Total Sales</p>
              <p className="font-bold text-success text-lg">₱{todayRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <ShoppingBag className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Total Orders Today</p>
              <p className="font-bold text-foreground text-lg">{todayOrders}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <Star className="w-5 h-5 text-yellow-500 mb-2" />
              <p className="text-xs text-muted-foreground">Best Seller</p>
              <p className="font-bold text-foreground text-sm truncate">{getBestSeller()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
              <p className="text-xs text-muted-foreground">Avg. Order Value</p>
              <p className="font-bold text-foreground text-sm">₱{averageOrderValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Your Performance Card */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-5 text-white mb-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5" />
              <p className="text-sm font-semibold">YOUR PERFORMANCE TODAY</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold">₱{myTotalSales.toLocaleString()}</p>
                <p className="text-xs opacity-90">Total Sales</p>
              </div>
              <div className="text-center border-l border-white/30">
                <p className="text-2xl font-bold">{myOrderCount}</p>
                <p className="text-xs opacity-90">Orders</p>
              </div>
              <div className="text-center border-l border-white/30">
                <p className="text-2xl font-bold">{myItemsSold}</p>
                <p className="text-xs opacity-90">Items Sold</p>
              </div>
            </div>
            {myOrderCount > 0 && (
              <div className="mt-3 pt-2 border-t border-white/30 text-center">
                <p className="text-xs opacity-90">Average Order: ₱{myAverageOrder.toLocaleString()}</p>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <Clock className="w-5 h-5 text-blue-500 mb-2" />
              <p className="text-xs text-muted-foreground">Peak Hour</p>
              <p className="font-bold text-foreground text-sm">12:00 - 2:00 PM</p>
              <p className="text-xs text-muted-foreground mt-1">Busiest time of day</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <Package className="w-5 h-5 text-orange-500 mb-2" />
              <p className="text-xs text-muted-foreground">Total Items Sold</p>
              <p className="font-bold text-foreground text-lg">{totalItemsSold}</p>
              <p className="text-xs text-muted-foreground mt-1">All cashiers combined</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-4">
            <h2 className="font-bold text-foreground mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/pos')}
                className="bg-card border border-border rounded-2xl p-4 text-left shadow-card hover:border-primary/30 hover:shadow-lg transition-all"
              >
                <ShoppingBag className="w-6 h-6 text-primary mb-2" />
                <p className="font-bold text-foreground">New Order</p>
                <p className="text-xs text-muted-foreground">Start a new transaction</p>
              </motion.button>
              
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.print()}
                className="bg-card border border-border rounded-2xl p-4 text-left shadow-card hover:border-primary/30 transition-all"
              >
                <Receipt className="w-6 h-6 text-primary mb-2" />
                <p className="font-bold text-foreground">Print Receipt</p>
                <p className="text-xs text-muted-foreground">Reprint last receipt</p>
              </motion.button>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-foreground">Your Recent Orders</h2>
              <span className="text-xs text-muted-foreground">{myOrderCount} total orders</span>
            </div>
            {recentOrders.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center shadow-card">
                <Coffee className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No orders yet today</p>
                <p className="text-xs text-muted-foreground mt-1">Start by creating a new order</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {recentOrders.map(order => (
                  <div key={order.id} className="bg-card rounded-xl border border-border p-3 shadow-card">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {order.items.slice(0, 2).map(i => i.name).join(', ')}
                          {order.items.length > 2 && ` +${order.items.length - 2} more`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.paymentMethod} • {new Date(order.date).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="font-bold text-primary ml-2">₱{order.total.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-muted-foreground">
                        {order.items.reduce((sum, i) => sum + i.quantity, 0)} items
                      </span>
                      <button
                        onClick={() => toast.info('Receipt reprint coming soon')}
                        className="text-xs text-primary hover:underline"
                      >
                        Reprint
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tips */}
          <div className="mb-4">
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950 dark:to-yellow-950 rounded-2xl p-4 border border-orange-100 dark:border-orange-800">
              <h3 className="font-bold text-orange-800 dark:text-orange-300 mb-2">💡 Quick Tips</h3>
              <ul className="text-xs text-orange-700 dark:text-orange-400 space-y-1">
                <li>• Use the search bar to find items quickly</li>
                <li>• Click on items to add them to cart</li>
                <li>• Swipe up cart to view and edit order</li>
                <li>• Multiple payment methods available (Cash/GCash)</li>
                <li>• Always double-check change before giving</li>
              </ul>
            </div>
          </div>

          {/* Performance Note */}
          <div className="mb-4">
            <div className="bg-blue-50 dark:bg-blue-950 rounded-2xl p-3 border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                You've processed {myOrderCount} orders today totaling ₱{myTotalSales.toLocaleString()}.
                {myOrderCount > 0 && ` You've sold ${myItemsSold} items!`} Keep up the great work!
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>

      <AccountSwitcher 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </>
  );
};

export default CashierDashboard;