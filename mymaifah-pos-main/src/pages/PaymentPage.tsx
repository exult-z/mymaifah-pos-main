import { motion } from 'framer-motion';
import { Banknote, Smartphone } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartItem } from '@/data/menu';
import { useSales, useCart } from '@/hooks/useStore';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addSale } = useSales();
  const { clearCart } = useCart();
  const { cart, cartTotal } = (location.state as { cart: CartItem[]; cartTotal: number }) || { cart: [], cartTotal: 0 };

  const handlePayment = (method: 'cash' | 'cashless') => {
    const sale = {
      id: Date.now().toString(),
      items: cart,
      total: cartTotal,
      paymentMethod: method,
      date: new Date().toISOString(),
    };
    addSale(sale);
    clearCart();
    navigate('/receipt', { state: { sale } });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 gap-6">
      <h1 className="text-2xl font-bold text-foreground">Select Payment</h1>
      <p className="text-3xl font-black text-primary">₱{cartTotal.toLocaleString()}</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePayment('cash')}
          className="w-full p-6 rounded-2xl gradient-orange shadow-float flex items-center gap-4"
        >
          <Banknote className="w-10 h-10 text-primary-foreground" />
          <div className="text-left">
            <span className="text-lg font-bold text-primary-foreground">Cash</span>
            <p className="text-sm text-primary-foreground/70">Pay with cash</p>
          </div>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handlePayment('cashless')}
          className="w-full p-6 rounded-2xl bg-card border border-border shadow-card flex items-center gap-4"
        >
          <Smartphone className="w-10 h-10 text-primary" />
          <div className="text-left">
            <span className="text-lg font-bold text-foreground">Cashless</span>
            <p className="text-sm text-muted-foreground">GCash / Digital payment</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
};

export default PaymentPage;
