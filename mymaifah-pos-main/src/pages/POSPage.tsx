import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag } from 'lucide-react';
import { menuItems, categories } from '@/data/menu';
import { useCart } from '@/hooks/useStore';
import CartDrawer from '@/components/CartDrawer';
import BottomNav from '@/components/BottomNav';
import { useNavigate } from 'react-router-dom';

const POSPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [cartOpen, setCartOpen] = useState(false);
  const { cart, addToCart, removeFromCart, clearCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="gradient-orange px-4 pt-6 pb-4 rounded-b-3xl">
        <h1 className="text-xl font-bold text-primary-foreground mb-3">Point of Sale</h1>
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
      <div className="flex gap-2 px-4 py-3 overflow-x-auto no-scrollbar">
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

      {/* Product Grid */}
      <div className="px-4 grid grid-cols-2 gap-3">
        {filteredItems.map((item, i) => {
          const qty = getItemQty(item.id);
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => addToCart(item)}
              className="relative bg-card rounded-2xl p-4 shadow-card border border-border text-left"
            >
              {qty > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full gradient-orange text-primary-foreground text-xs font-bold flex items-center justify-center shadow-float">
                  {qty}
                </span>
              )}
              <p className="font-bold text-foreground text-sm leading-tight">{item.name}</p>
              <p className="text-primary font-black text-base mt-2">₱{item.price}</p>
            </motion.button>
          );
        })}
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
  );
};

export default POSPage;
