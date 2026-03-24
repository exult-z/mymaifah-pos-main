import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSales, useExpenses } from '@/hooks/useStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Star, FileText, Package, Users, AlertTriangle, ArrowLeft, Calendar, Download, Award, UserCheck, Moon, Sun, LogOut, Plus, Trash2, RefreshCw } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { generateDailyReport } from '@/lib/generateReport';
import { toast } from 'sonner';
import SuppliesManager from '@/components/SuppliesManager';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import AccountSwitcher from '@/components/AccountSwitcher';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'expenses' | 'supplies' | 'cashiers' | 'users'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const { user, isAuthenticated, isLoading, logout, getCashiers, deleteUser, switchToCashier } = useAuth();
  const { theme, toggleTheme, setUserThemePreference } = useTheme();
  const navigate = useNavigate();
  
  const { 
    todayRevenue, 
    todayOrders, 
    getBestSeller, 
    getLast7DaysRevenue, 
    todaySales, 
    sales,
    getCashierPerformance,
  } = useSales();
  const { todayExpenseTotal, todayExpenses, expenses } = useExpenses();
  const chartData = getLast7DaysRevenue();
  const netProfit = todayRevenue - todayExpenseTotal;
  
  // Redirect if not admin - using useEffect
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        navigate('/login', { replace: true });
      } else if (user?.role !== 'admin') {
        navigate('/pos', { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, navigate]);

  // Safely get cashier performance
  let cashierPerformance: { name: string; sales: number; orders: number; items: number }[] = [];
  try {
    cashierPerformance = getCashierPerformance ? getCashierPerformance() : [];
  } catch (error) {
    console.error('Error getting cashier performance:', error);
    cashierPerformance = [];
  }
  
  const cashiers = getCashiers ? getCashiers() : [];

  const handleThemeToggle = () => {
    toggleTheme();
    if (user?.id) {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setUserThemePreference(user.id, newTheme);
    }
  };

  const handleLogout = () => {
    logout();
    // useEffect will handle redirect
  };

  const handleSwitchToCashier = (cashierId: string) => {
    const cashier = switchToCashier(cashierId);
    if (cashier) {
      toast.success(`Switched to ${cashier.fullName}`);
      navigate('/pos', { replace: true });
    }
  };

  // Calculate category sales
  const getCategorySales = () => {
    const categories: Record<string, number> = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        categories[item.category] = (categories[item.category] || 0) + (item.price * item.quantity);
      });
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  };

  const categoryData = getCategorySales();
  const COLORS = ['#FF6B35', '#FF8C42', '#FFA559', '#FFB347', '#FFC46B', '#FFD58C', '#FFE4A0', '#FFEDB5'];

  // Calculate month-to-date revenue
  const getMonthToDateRevenue = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear;
      })
      .reduce((sum, sale) => sum + sale.total, 0);
  };

  const monthToDateRevenue = getMonthToDateRevenue();

  // Calculate weekly data
  const getWeeklyData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = days.map(day => ({ day, revenue: 0, orders: 0 }));
    
    sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      const dayName = days[saleDate.getDay()];
      const dayData = weeklyData.find(d => d.day === dayName);
      if (dayData) {
        dayData.revenue += sale.total;
        dayData.orders += 1;
      }
    });
    
    return weeklyData;
  };

  const weeklyData = getWeeklyData();

  const handleGenerateReport = () => {
    generateDailyReport(todaySales, todayExpenses, todayRevenue, todayExpenseTotal, getBestSeller());
    toast.success('Report downloaded successfully');
  };

  // Get top performer
  const topPerformer = cashierPerformance.length > 0 ? cashierPerformance[0] : null;
  const totalCashierSales = cashierPerformance.reduce((sum, c) => sum + c.sales, 0);
  const cashierSalesPercentage = totalCashierSales > 0 ? (topPerformer?.sales / totalCashierSales) * 100 : 0;

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
  
  // Don't render if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="gradient-orange px-4 pt-6 pb-6 rounded-b-3xl sticky top-0 z-10">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-primary-foreground" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-primary-foreground mb-1">Admin Dashboard</h1>
                <p className="text-sm text-primary-foreground/70">Welcome, {user?.fullName}</p>
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
          
          {/* Date Range Selector */}
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' }
            ].map(range => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  dateRange === range.value
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-primary-foreground/20 text-primary-foreground'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 bg-primary-foreground/20 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-sm text-primary-foreground/70">Today's Revenue</p>
            <p className="text-3xl font-black text-primary-foreground">₱{todayRevenue.toLocaleString()}</p>
          </div>
        </div>

        <div className="px-4 -mt-2 pb-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <DollarSign className="w-5 h-5 text-success mb-2" />
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="font-bold text-success text-lg">₱{todayRevenue.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <TrendingUp className="w-5 h-5 text-expense mb-2" />
              <p className="text-xs text-muted-foreground">Expenses</p>
              <p className="font-bold text-expense text-lg">₱{todayExpenseTotal.toLocaleString()}</p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <DollarSign className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Net Profit</p>
              <p className={`font-bold text-lg ${netProfit >= 0 ? 'text-success' : 'text-expense'}`}>
                ₱{netProfit.toLocaleString()}
              </p>
            </div>
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <ShoppingBag className="w-5 h-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Orders Today</p>
              <p className="font-bold text-foreground text-lg">{todayOrders}</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { id: 'sales', label: 'Sales Analytics', icon: TrendingUp },
              { id: 'expenses', label: 'Expenses', icon: DollarSign },
              { id: 'supplies', label: 'Supplies', icon: Package },
              { id: 'cashiers', label: 'Cashiers', icon: Users },
              { id: 'users', label: 'Users', icon: UserCheck }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl font-medium whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'gradient-orange text-primary-foreground shadow-md'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">7-Day Revenue Trend</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">Weekly Orders</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={weeklyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="orders" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {categoryData.length > 0 && (
                <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                  <h2 className="font-bold text-foreground mb-3">Sales by Category</h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`₱${value.toLocaleString()}`, 'Sales']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                  <Star className="w-5 h-5 text-yellow-500 mb-2" />
                  <p className="text-xs text-muted-foreground">Best Seller</p>
                  <p className="font-bold text-foreground text-sm">{getBestSeller()}</p>
                </div>
                <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                  <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
                  <p className="text-xs text-muted-foreground">MTD Revenue</p>
                  <p className="font-bold text-foreground text-sm">₱{monthToDateRevenue.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={handleGenerateReport}
                className="w-full gradient-orange text-primary-foreground font-bold py-3 rounded-2xl flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Generate Daily Report
              </button>

              <div>
                <h2 className="font-bold text-foreground mb-3">Recent Sales</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todaySales.slice(0, 10).map(sale => (
                    <div key={sale.id} className="bg-card rounded-xl border border-border p-3">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-semibold text-sm">
                            {sale.items.slice(0, 2).map(i => i.name).join(', ')}
                            {sale.items.length > 2 && ` +${sale.items.length - 2}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{sale.cashierName} • {new Date(sale.date).toLocaleTimeString()}</p>
                        </div>
                        <p className="font-bold text-primary">₱{sale.total.toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div className="space-y-4">
              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">Today's Expenses</h2>
                {todayExpenses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No expenses today</p>
                ) : (
                  <div className="space-y-2">
                    {todayExpenses.map(expense => (
                      <div key={expense.id} className="flex justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{expense.description}</p>
                          <p className="text-xs text-muted-foreground">{expense.category}</p>
                        </div>
                        <p className="font-bold text-expense">₱{expense.amount.toLocaleString()}</p>
                      </div>
                    ))}
                    <div className="pt-2 font-bold flex justify-between">
                      <span>Total</span>
                      <span className="text-expense">₱{todayExpenseTotal.toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">Recent Expenses</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {expenses.slice(0, 20).map(expense => (
                    <div key={expense.id} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">{expense.description}</p>
                        <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                      </div>
                      <p className="font-bold text-expense text-sm">₱{expense.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Supplies Tab */}
          {activeTab === 'supplies' && <SuppliesManager />}

          {/* Cashiers Tab */}
          {activeTab === 'cashiers' && (
            <div className="space-y-4">
              {topPerformer && topPerformer.sales > 0 && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl p-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-6 h-6" />
                    <span className="font-bold">Top Performer Today</span>
                  </div>
                  <p className="text-2xl font-bold">{topPerformer.name}</p>
                  <p className="text-sm">₱{topPerformer.sales.toLocaleString()} sales • {topPerformer.orders} orders</p>
                  <div className="mt-2 w-full bg-white/20 rounded-full h-2">
                    <div className="bg-white rounded-full h-2" style={{ width: `${Math.min(cashierSalesPercentage, 100)}%` }} />
                  </div>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">Cashier Performance</h2>
                <div className="space-y-3">
                  {cashierPerformance.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No sales recorded today</p>
                  ) : (
                    cashierPerformance.map((cashier, idx) => (
                      <div key={idx} className="bg-secondary/30 rounded-xl p-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{cashier.name}</p>
                            <p className="text-xs text-muted-foreground">{cashier.orders} orders • {cashier.items} items</p>
                          </div>
                          <p className="text-lg font-bold text-primary">₱{cashier.sales.toLocaleString()}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
                <h2 className="font-bold text-foreground mb-3">Recent Activity</h2>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {todaySales.slice(0, 10).map(sale => (
                    <div key={sale.id} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="text-sm font-medium">{sale.cashierName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">{new Date(sale.date).toLocaleTimeString()} • {sale.items.length} items</p>
                      </div>
                      <p className="font-bold text-primary">₱{sale.total.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <h2 className="font-bold text-foreground mb-3">User Management</h2>
              <div className="space-y-3">
                <div className="bg-primary/10 rounded-xl p-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">Admin User</p>
                      <p className="text-xs text-muted-foreground">admin@maifah.com</p>
                    </div>
                    <span className="px-2 py-1 rounded-full bg-primary/20 text-primary text-xs">Admin</span>
                  </div>
                </div>
                {cashiers.map(cashier => (
                  <div key={cashier.id} className="bg-secondary/50 rounded-xl p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{cashier.fullName}</p>
                        <p className="text-xs text-muted-foreground">{cashier.email}</p>
                        <p className="text-xs text-primary">Code: {cashier.cashierCode}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSwitchToCashier(cashier.id)}
                          className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors"
                          title="Switch to this account"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${cashier.fullName}?`)) {
                              deleteUser(cashier.id);
                              toast.success(`${cashier.fullName} removed`);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors"
                          title="Remove this account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/signup')}
                className="w-full mt-4 py-2 rounded-xl gradient-orange text-white font-bold flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create New Account
              </button>
              <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-blue-500 inline mr-2" />
                <span className="text-xs text-blue-700">Cashiers can only access POS and their personal dashboard</span>
              </div>
            </div>
          )}
        </div>

        <BottomNav />
      </div>

      <AccountSwitcher isOpen={showAccountSwitcher} onClose={() => setShowAccountSwitcher(false)} />
    </>
  );
};

export default DashboardPage;