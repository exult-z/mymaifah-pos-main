import { useSyncExternalStore, useCallback } from 'react';
import { CartItem, SaleRecord, Expense } from '@/data/menu';

// --- Global store with localStorage persistence ---

type Listener = () => void;

function createStore<T>(key: string, fallback: T) {
  let data: T = fallback;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        data = parsed;
      } catch (e) {
        console.error(`Failed to parse ${key} from localStorage:`, e);
        data = fallback;
      }
    }
  } catch (e) {
    console.error(`Failed to read ${key} from localStorage:`, e);
  }

  const listeners = new Set<Listener>();

  function get(): T {
    return data;
  }

  function set(updater: T | ((prev: T) => T)) {
    const newData = typeof updater === 'function' ? (updater as (prev: T) => T)(data) : updater;
    data = newData;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error(`Failed to save ${key} to localStorage:`, e);
    }
    listeners.forEach(l => l());
  }

  function subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }

  return { get, set, subscribe };
}

const salesStore = createStore<SaleRecord[]>('pos_sales', []);
const expensesStore = createStore<Expense[]>('pos_expenses', []);
const cartStore = createStore<CartItem[]>('pos_cart_temp', []);

// Use React 18's useSyncExternalStore for reliable reactivity
function useStoreData<T>(store: { get: () => T; subscribe: (l: Listener) => () => void }): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

// --- Hooks ---

export function useSales() {
  const sales = useStoreData(salesStore);

  const addSale = useCallback((sale: SaleRecord) => {
    salesStore.set(prev => [sale, ...prev]);
  }, []);

  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayOrders = todaySales.length;

  const getCashierPerformance = () => {
    const cashierStats: Record<string, { name: string; sales: number; orders: number; items: number }> = {};
    
    sales.forEach(sale => {
      if (sale.cashierName) {
        if (!cashierStats[sale.cashierName]) {
          cashierStats[sale.cashierName] = { name: sale.cashierName, sales: 0, orders: 0, items: 0 };
        }
        cashierStats[sale.cashierName].sales += sale.total;
        cashierStats[sale.cashierName].orders += 1;
        cashierStats[sale.cashierName].items += sale.items.reduce((sum, i) => sum + i.quantity, 0);
      }
    });
    
    return Object.values(cashierStats).sort((a, b) => b.sales - a.sales);
  };

  const getTodayCashierSales = () => {
    const cashierStats: Record<string, { name: string; sales: number; orders: number }> = {};
    
    todaySales.forEach(sale => {
      if (sale.cashierName) {
        if (!cashierStats[sale.cashierName]) {
          cashierStats[sale.cashierName] = { name: sale.cashierName, sales: 0, orders: 0 };
        }
        cashierStats[sale.cashierName].sales += sale.total;
        cashierStats[sale.cashierName].orders += 1;
      }
    });
    
    return Object.values(cashierStats).sort((a, b) => b.sales - a.sales);
  };

  const getBestSeller = () => {
    const itemCounts: Record<string, { name: string; count: number }> = {};
    todaySales.forEach(sale => {
      sale.items.forEach(item => {
        if (!itemCounts[item.id]) itemCounts[item.id] = { name: item.name, count: 0 };
        itemCounts[item.id].count += item.quantity;
      });
    });
    const sorted = Object.values(itemCounts).sort((a, b) => b.count - a.count);
    return sorted[0]?.name || 'N/A';
  };

  const getLast7DaysRevenue = () => {
    const days: { day: string; revenue: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toDateString();
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const revenue = sales
        .filter(s => new Date(s.date).toDateString() === dayStr)
        .reduce((sum, s) => sum + s.total, 0);
      days.push({ day: dayLabel, revenue });
    }
    return days;
  };

  return { 
    sales, 
    addSale, 
    todaySales, 
    todayRevenue, 
    todayOrders, 
    getBestSeller, 
    getLast7DaysRevenue,
    getCashierPerformance,
    getTodayCashierSales
  };
}

export function useExpenses() {
  const expenses = useStoreData(expensesStore);

  const addExpense = useCallback((expense: Expense) => {
    expensesStore.set(prev => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback((updated: Expense) => {
    expensesStore.set(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    expensesStore.set(prev => prev.filter(e => e.id !== id));
  }, []);

  const today = new Date().toDateString();
  const todayExpenses = expenses.filter(e => new Date(e.date).toDateString() === today);
  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return { expenses, addExpense, updateExpense, deleteExpense, todayExpenses, todayExpenseTotal };
}

export function useCart() {
  const cart = useStoreData(cartStore);

  const addToCart = useCallback((item: { id: string; name: string; price: number; category: string }) => {
    cartStore.set(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((id: string) => {
    cartStore.set(prev => {
      const existing = prev.find(c => c.id === id);
      if (existing && existing.quantity > 1) {
        return prev.map(c => c.id === id ? { ...c, quantity: c.quantity - 1 } : c);
      }
      return prev.filter(c => c.id !== id);
    });
  }, []);

  const clearCart = useCallback(() => cartStore.set([]), []);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return { cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount };
}