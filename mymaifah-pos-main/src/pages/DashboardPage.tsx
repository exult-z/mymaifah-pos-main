import { useSales, useExpenses } from '@/hooks/useStore';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, ShoppingBag, DollarSign, Star } from 'lucide-react';
import BottomNav from '@/components/BottomNav';

const DashboardPage = () => {
  const { todayRevenue, todayOrders, getBestSeller, getLast7DaysRevenue, todaySales } = useSales();
  const { todayExpenseTotal } = useExpenses();
  const chartData = getLast7DaysRevenue();
  const netProfit = todayRevenue - todayExpenseTotal;

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-orange px-4 pt-6 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold text-primary-foreground mb-1">Dashboard</h1>
        <p className="text-sm text-primary-foreground/70">Today's Overview</p>
        <div className="mt-4 bg-primary-foreground/20 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-primary-foreground/70">Today's Revenue</p>
          <p className="text-3xl font-black text-primary-foreground">₱{todayRevenue.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Summary Bar */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-card mb-4 flex justify-between text-center">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-bold text-success text-sm">₱{todayRevenue.toLocaleString()}</p>
          </div>
          <div className="border-l border-border px-4">
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="font-bold text-expense text-sm">₱{todayExpenseTotal.toLocaleString()}</p>
          </div>
          <div className="border-l border-border pl-4">
            <p className="text-xs text-muted-foreground">Net Profit</p>
            <p className={`font-bold text-sm ${netProfit >= 0 ? 'text-success' : 'text-expense'}`}>
              ₱{netProfit.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { icon: DollarSign, label: 'Total Sales', value: `₱${todayRevenue.toLocaleString()}`, color: 'text-success' },
            { icon: ShoppingBag, label: 'Orders Today', value: todayOrders.toString(), color: 'text-primary' },
            { icon: TrendingUp, label: 'Revenue', value: `₱${todayRevenue.toLocaleString()}`, color: 'text-primary' },
            { icon: Star, label: 'Best Seller', value: getBestSeller(), color: 'text-primary' },
          ].map((stat, i) => (
            <div key={i} className="bg-card rounded-2xl border border-border p-4 shadow-card">
              <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="font-bold text-foreground text-sm truncate">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 7-Day Chart */}
        <div className="bg-card rounded-2xl border border-border p-4 shadow-card mb-4">
          <h2 className="font-bold text-foreground mb-3">7-Day Revenue</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Sales */}
        <div className="mb-4">
          <h2 className="font-bold text-foreground mb-3">Recent Sales</h2>
          {todaySales.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No sales today</p>
          ) : (
            <div className="space-y-2">
              {todaySales.slice(0, 10).map(sale => (
                <div key={sale.id} className="bg-card rounded-xl border border-border p-3 shadow-card flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-foreground text-sm">
                      {sale.items.map(i => i.name).join(', ').slice(0, 40)}...
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{sale.paymentMethod} • {new Date(sale.date).toLocaleTimeString()}</p>
                  </div>
                  <p className="font-bold text-primary">₱{sale.total.toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default DashboardPage;
