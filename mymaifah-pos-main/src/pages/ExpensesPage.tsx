import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import { useExpenses, useSales } from '@/hooks/useStore';
import { expenseCategories } from '@/data/menu';
import BottomNav from '@/components/BottomNav';

const ExpensesPage = () => {
  const { expenses, addExpense, updateExpense, deleteExpense, todayExpenses, todayExpenseTotal } = useExpenses();
  const { todayRevenue } = useSales();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(expenseCategories[0]);
  const [date, setDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });

  const netProfit = todayRevenue - todayExpenseTotal;

  const resetForm = () => {
    setDesc('');
    setAmount('');
    setCategory(expenseCategories[0]);
    const now = new Date();
    setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    setEditingId(null);
  };

  const openAdd = () => {
    resetForm();
    setSheetOpen(true);
  };

  const openEdit = (expense: { id: string; description: string; amount: number; category: string; date: string }) => {
    setEditingId(expense.id);
    setDesc(expense.description);
    setAmount(expense.amount.toString());
    setCategory(expense.category);
    setDate(new Date(expense.date).toISOString().split('T')[0]);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    if (!desc || !amount) return;
    const expenseData = {
      id: editingId || Date.now().toString(),
      description: desc,
      amount: parseFloat(amount),
      category,
      date: new Date(date + 'T12:00:00').toString(),
    };

    if (editingId) {
      updateExpense(expenseData);
    } else {
      addExpense(expenseData);
    }

    resetForm();
    setSheetOpen(false);
  };

  const categoryCounts: Record<string, number> = {};
  todayExpenses.forEach(e => {
    categoryCounts[e.category] = (categoryCounts[e.category] || 0) + e.amount;
  });

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="gradient-red px-4 pt-6 pb-6 rounded-b-3xl">
        <h1 className="text-xl font-bold text-destructive-foreground mb-1">Expenses</h1>
        <p className="text-sm text-destructive-foreground/70">Track your spending</p>
        <div className="mt-4 bg-destructive-foreground/20 backdrop-blur-sm rounded-2xl p-4">
          <p className="text-sm text-destructive-foreground/70">Today's Expenses</p>
          <p className="text-3xl font-black text-destructive-foreground">₱{todayExpenseTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Summary */}
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

        {/* Category Breakdown */}
        {Object.keys(categoryCounts).length > 0 && (
          <div className="mb-4">
            <h2 className="font-bold text-foreground mb-2">By Category</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(categoryCounts).map(([cat, total]) => (
                <span key={cat} className="px-3 py-1 rounded-full bg-expense/10 text-expense text-xs font-bold">
                  {cat}: ₱{total.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Expense List */}
        <h2 className="font-bold text-foreground mb-2">All Expenses</h2>
        {expenses.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">No expenses recorded</p>
        ) : (
          <div className="space-y-2">
            {expenses.map(expense => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-xl border border-border p-3 shadow-card flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-foreground text-sm">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">{expense.category} • {new Date(expense.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-expense mr-1">₱{expense.amount.toLocaleString()}</p>
                  <button onClick={() => openEdit(expense)} className="p-1.5 rounded-full hover:bg-primary/10">
                    <Pencil className="w-4 h-4 text-primary" />
                  </button>
                  <button onClick={() => deleteExpense(expense.id)} className="p-1.5 rounded-full hover:bg-expense/10">
                    <Trash2 className="w-4 h-4 text-expense" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openAdd}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full gradient-red shadow-float flex items-center justify-center z-40"
      >
        <Plus className="w-6 h-6 text-destructive-foreground" />
      </motion.button>

      {/* Add/Edit Expense Sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-foreground/30 z-50"
              onClick={() => { setSheetOpen(false); resetForm(); }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-foreground">
                  {editingId ? 'Edit Expense' : 'Add Expense'}
                </h2>
                <button onClick={() => { setSheetOpen(false); resetForm(); }} className="p-2 rounded-full hover:bg-secondary">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  placeholder="Description"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground outline-none text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground outline-none text-sm"
                />
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground outline-none text-sm"
                >
                  {expenseCategories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-secondary text-foreground outline-none text-sm"
                />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-2xl gradient-red text-destructive-foreground font-bold text-lg"
                >
                  {editingId ? 'Update Expense' : 'Add Expense'}
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
};

export default ExpensesPage;
