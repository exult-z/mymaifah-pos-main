import { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingBag, ArrowLeft, LogOut, Users, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { menuItems, categories } from '@/data/menu';
import { useCart } from '@/hooks/useStore';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';
import MenuItem from '@/components/MenuItem';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import AccountSwitcher from '@/components/AccountSwitcher';

const POSPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const { theme, toggleTheme, setUserThemePreference } = useTheme();

  // Redirect if not logged in - using useEffect
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, user, navigate]);

  const filteredItems = useMemo(() => {
    let items = menuItems;
    if (selectedCategory !== 'All') {
      items = items.filter(i => i.category === selectedCategory);
    }
    if (search) {
      items = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    return items;
  }, [selectedCategory, search]);

  const getItemQty = (id: string) => cart.find(c => c.id === id)?.quantity || 0;

  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/payment', { state: { cart, cartTotal } });
  };

  const handleLogout = () => {
    logout();
    // useEffect will handle redirect to login
  };

  const handleThemeToggle = () => {
    toggleTheme();
    if (user?.id) {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setUserThemePreference(user.id, newTheme);
    }
  };

  const goBack = () => {
    if (user?.role === 'cashier') {
      navigate('/cashier-dashboard', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POS System...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!user) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background pb-32">
        {/* Header */}
        <div className="gradient-orange px-4 pt-6 pb-4 rounded-b-3xl sticky top-0 z-10">
          <div className="flex justify-between items-center mb-3">
            <button
              onClick={goBack}
              className="p-2 rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-primary-foreground" />
            </button>
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-primary-foreground">Point of Sale</h1>
              <p className="text-xs text-primary-foreground/70">Cashier: {user.fullName}</p>
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-foreground/50" />
            <input
              type="text"
              placeholder="Search menu..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 outline-none text-sm font-medium backdrop-blur-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="sticky top-[140px] z-10 bg-background px-4 py-3 overflow-x-auto border-b border-border">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'gradient-orange text-primary-foreground shadow-card'
                    : 'bg-secondary text-secondary-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="px-4 py-3">
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map((item, i) => (
              <MenuItem
                key={item.id}
                item={item}
                quantity={getItemQty(item.id)}
                onAdd={addToCart}
                index={i}
              />
            ))}
          </div>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No items found</p>
              <p className="text-sm text-muted-foreground">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Floating Cart Button */}
        {cartCount > 0 && (
          <motion.button
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="fixed bottom-20 left-4 right-4 max-w-md mx-auto gradient-orange rounded-2xl py-4 px-6 flex items-center justify-between shadow-float z-40"
          >
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
              <span className="text-primary-foreground font-bold">{cartCount} items</span>
            </div>
            <span className="text-primary-foreground font-black text-lg">₱{cartTotal.toLocaleString()}</span>
          </motion.button>
        )}

        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          cart={cart}
          cartTotal={cartTotal}
          onAdd={addToCart}
          onRemove={removeFromCart}
          onCheckout={handleCheckout}
        />

        <BottomNav />
      </div>

      <AccountSwitcher 
        isOpen={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
      />
    </>
  );
};

export default POSPage;