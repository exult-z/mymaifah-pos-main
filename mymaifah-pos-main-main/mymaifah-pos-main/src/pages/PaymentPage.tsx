import { useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, Smartphone, ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CartItem } from '@/data/menu';
import { useSales, useCart } from '@/hooks/useStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Global order counter persisted in localStorage
function getNextOrderNumber(): number {
  const stored = localStorage.getItem('pos_order_counter');
  const next = stored ? parseInt(stored, 10) + 1 : 1;
  localStorage.setItem('pos_order_counter', next.toString());
  return next;
}

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addSale } = useSales();
  const { clearCart } = useCart();
  const { user, updateCashierStats } = useAuth();
  const { cart, cartTotal } = (location.state as { cart: CartItem[]; cartTotal: number }) || { cart: [], cartTotal: 0 };

  const [selectedMethod, setSelectedMethod] = useState<'cash' | 'cashless' | null>(null);
  const [cashTendered, setCashTendered] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const cashAmount = parseFloat(cashTendered) || 0;
  const change = cashAmount - cartTotal;
  const canConfirmCash = cashAmount >= cartTotal;

  const handleConfirm = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }
    if (selectedMethod === 'cash' && !canConfirmCash) {
      toast.error('Insufficient cash tendered');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      const orderNumber = getNextOrderNumber();
      const sale = {
        id: Date.now().toString(),
        items: cart,
        total: cartTotal,
        paymentMethod: selectedMethod,
        date: new Date().toISOString(),
        cashierName: user?.fullName || 'Cashier',
        cashierId: user?.id,
        cashierCode: user?.cashierCode,
      };
      
      addSale(sale);
      
      if (user?.id) {
        updateCashierStats(user.id, cartTotal);
      }
      
      clearCart();
      
      toast.success('Payment successful!');
      
      navigate('/receipt', {
        state: {
          sale,
          orderNumber,
          cashierName: user?.fullName || 'Cashier',
          cashierCode: user?.cashierCode,
          cashTendered: selectedMethod === 'cash' ? cashAmount : undefined,
          change: selectedMethod === 'cash' ? change : undefined,
        },
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // If cart is empty, redirect back to POS
  if (cart.length === 0) {
    toast.error('Cart is empty');
    navigate('/pos');
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <div className="w-full max-w-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-primary transition-colors"
          disabled={isProcessing}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Cart
        </button>

        {/* Cashier Info */}
        <div className="bg-secondary/50 rounded-xl p-3 mb-4">
          <p className="text-xs text-muted-foreground">Processing by</p>
          <p className="font-semibold text-foreground">{user?.fullName}</p>
          {user?.cashierCode && (
            <p className="text-xs text-primary">Code: {user.cashierCode}</p>
          )}
        </div>

        <h1 className="text-2xl font-bold text-foreground text-center mb-2">Select Payment</h1>
        <p className="text-4xl font-black text-primary text-center mb-6">₱{cartTotal.toLocaleString()}</p>

        {/* Payment Options - More Visible */}
        <div className="flex flex-col gap-4 mb-6">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setSelectedMethod('cash'); setCashTendered(''); }}
            disabled={isProcessing}
            className={`w-full p-6 rounded-2xl flex items-center gap-4 border-2 transition-all ${
              selectedMethod === 'cash'
                ? 'gradient-orange border-primary shadow-float scale-[1.02]'
                : 'bg-card border-border shadow-card hover:shadow-lg'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              selectedMethod === 'cash' ? 'bg-white/20' : 'bg-primary/10'
            }`}>
              <Banknote className={`w-8 h-8 ${selectedMethod === 'cash' ? 'text-white' : 'text-primary'}`} />
            </div>
            <div className="flex-1 text-left">
              <span className={`text-xl font-bold ${selectedMethod === 'cash' ? 'text-white' : 'text-foreground'}`}>Cash</span>
              <p className={`text-sm ${selectedMethod === 'cash' ? 'text-white/80' : 'text-muted-foreground'}`}>Pay with cash</p>
            </div>
            {selectedMethod === 'cash' && (
              <CheckCircle className="w-6 h-6 text-white" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedMethod('cashless')}
            disabled={isProcessing}
            className={`w-full p-6 rounded-2xl flex items-center gap-4 border-2 transition-all ${
              selectedMethod === 'cashless'
                ? 'gradient-orange border-primary shadow-float scale-[1.02]'
                : 'bg-card border-border shadow-card hover:shadow-lg'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
              selectedMethod === 'cashless' ? 'bg-white/20' : 'bg-primary/10'
            }`}>
              <Smartphone className={`w-8 h-8 ${selectedMethod === 'cashless' ? 'text-white' : 'text-primary'}`} />
            </div>
            <div className="flex-1 text-left">
              <span className={`text-xl font-bold ${selectedMethod === 'cashless' ? 'text-white' : 'text-foreground'}`}>GCash / Digital</span>
              <p className={`text-sm ${selectedMethod === 'cashless' ? 'text-white/80' : 'text-muted-foreground'}`}>Pay via GCash or other e-wallets</p>
            </div>
            {selectedMethod === 'cashless' && (
              <CheckCircle className="w-6 h-6 text-white" />
            )}
          </motion.button>
        </div>

        {/* Cash Tendered Input */}
        {selectedMethod === 'cash' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border-2 border-primary p-5 shadow-card mb-6 space-y-3"
          >
            <label className="text-sm font-semibold text-foreground">Cash Tendered</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-muted-foreground">₱</span>
              <input
                type="number"
                value={cashTendered}
                onChange={e => setCashTendered(e.target.value)}
                placeholder="0.00"
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-border bg-background text-foreground text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                min={0}
                step="0.01"
                autoFocus
                disabled={isProcessing}
              />
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-base text-muted-foreground">Change</span>
              <span className={`text-2xl font-black ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                ₱{change >= 0 ? change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
              </span>
            </div>
            {!canConfirmCash && cashAmount > 0 && (
              <p className="text-sm text-destructive">Amount is less than total (₱{cartTotal.toLocaleString()})</p>
            )}
            {canConfirmCash && cashAmount > 0 && (
              <p className="text-sm text-success">✓ Ready to process payment</p>
            )}
          </motion.div>
        )}

        {/* GCash Info */}
        {selectedMethod === 'cashless' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-2xl border-2 border-green-500 p-5 shadow-card mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-6 h-6 text-green-600" />
              <h3 className="font-bold text-green-700 dark:text-green-400">GCash Details</h3>
            </div>
            <p className="text-sm text-foreground mb-1">Account Name: <span className="font-semibold">Maifah Bong's Tea Cafe</span></p>
            <p className="text-sm text-foreground mb-3">Account Number: <span className="font-semibold">09123456789</span></p>
            <div className="mt-2 p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="text-xs text-green-800 dark:text-green-300 text-center">
                Scan QR code or send payment to the number above
              </p>
            </div>
          </motion.div>
        )}

        {/* Confirm Button */}
        {selectedMethod && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleConfirm}
            disabled={(selectedMethod === 'cash' && !canConfirmCash) || isProcessing}
            className={`w-full py-5 rounded-2xl gradient-orange text-primary-foreground font-bold text-xl shadow-float disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
              selectedMethod === 'cash' && canConfirmCash ? 'animate-pulse' : ''
            }`}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : (
              `Confirm ${selectedMethod === 'cash' ? `₱${cashAmount.toLocaleString()}` : 'Payment'}`
            )}
          </motion.button>
        )}

        {/* Order Summary */}
        <div className="mt-6 p-4 bg-secondary/30 rounded-xl">
          <p className="text-xs text-muted-foreground mb-2">Order Summary</p>
          <div className="space-y-1">
            {cart.slice(0, 3).map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>₱{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
            {cart.length > 3 && (
              <p className="text-xs text-muted-foreground">+{cart.length - 3} more items</p>
            )}
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₱{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;