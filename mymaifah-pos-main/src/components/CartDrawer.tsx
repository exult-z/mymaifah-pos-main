import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '@/data/menu';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  cart: CartItem[];
  cartTotal: number;
  onAdd: (item: CartItem) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

const CartDrawer = ({ open, onClose, cart, cartTotal, onAdd, onRemove, onCheckout }: CartDrawerProps) => {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/30 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-card rounded-t-3xl z-50 max-h-[80vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Your Order</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Cart is empty</p>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-secondary/50 rounded-xl p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground text-sm">{item.name}</p>
                      <p className="text-primary font-bold text-sm">₱{item.price * item.quantity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                      <button
                        onClick={() => onAdd(item)}
                        className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3 text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-border">
                <div className="flex justify-between mb-3">
                  <span className="font-semibold text-foreground">Total</span>
                  <span className="font-black text-primary text-xl">₱{cartTotal.toLocaleString()}</span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCheckout}
                  className="w-full py-4 rounded-2xl gradient-orange text-primary-foreground font-bold text-lg shadow-float"
                >
                  Checkout
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
