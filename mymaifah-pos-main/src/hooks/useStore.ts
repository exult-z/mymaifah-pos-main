import { useSyncExternalStore, useCallback } from 'react';
import { CartItem, SaleRecord, Expense } from '@/data/menu';
import { isSameDay } from 'date-fns';

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
      // Use alert instead of toast to avoid circular dependency
      alert('Storage quota exceeded. Please clear some data.');
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

function useStoreData<T>(store: { get: () => T; subscribe: (l: Listener) => () => void }): T {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export function useSales() {
  const sales = useStoreData(salesStore);

  const addSale = useCallback((sale: SaleRecord) => {
    salesStore.set(prev => [sale, ...prev]);
  }, []);

  const today = new Date();
  const todaySales = sales.filter(s => isSameDay(new Date(s.date), today));
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
  const todayOrders = todaySales.length;

  const getCashierPerformance = () => {
    const cashierStats: Record<string, { name: string; sales: number; orders: number; items: number }> = {};
    
    todaySales.forEach(sale => {
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
      const dayLabel = d.toLocaleDateString('en', { weekday: 'short' });
      const revenue = sales
        .filter(s => isSameDay(new Date(s.date), d))
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
  };
}

export function useExpenses() {
  const expenses = useStoreData(expensesStore);

  const addExpense = useCallback((expense: Expense) => {
    if (expense.amount <= 0) {
      console.error('Amount must be greater than 0');
      return;
    }
    expensesStore.set(prev => [expense, ...prev]);
  }, []);

  const updateExpense = useCallback((updated: Expense) => {
    if (updated.amount <= 0) {
      console.error('Amount must be greater than 0');
      return;
    }
    expensesStore.set(prev => prev.map(e => e.id === updated.id ? updated : e));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    expensesStore.set(prev => prev.filter(e => e.id !== id));
  }, []);

  const today = new Date();
  const todayExpenses = expenses.filter(e => isSameDay(new Date(e.date), today));
  const todayExpenseTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);

  return { expenses, addExpense, updateExpense, deleteExpense, todayExpenses, todayExpenseTotal };
}

export function useCart() {
  const cart = useStoreData(cartStore);

  const addToCart = useCallback((item: { id: string; name: string; price: number; category: string }) => {
    if (item.price < 0) return;
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

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      cartStore.set(prev => prev.filter(c => c.id !== id));
    } else {
      cartStore.set(prev => prev.map(c => c.id === id ? { ...c, quantity } : c));
    }
  }, []);

  const clearCart = useCallback(() => cartStore.set([]), []);

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  return { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount };
}