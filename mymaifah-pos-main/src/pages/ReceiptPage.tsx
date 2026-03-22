import { motion } from 'framer-motion';
import { CheckCircle, Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SaleRecord } from '@/data/menu';

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { sale } = (location.state as { sale: SaleRecord }) || { sale: null };

  if (!sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No receipt data</p>
      </div>
    );
  }

  const date = new Date(sale.date);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-6 py-8">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-6">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-foreground">Payment Successful!</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 shadow-card space-y-4">
          <div className="text-center border-b border-border pb-3">
            <p className="font-bold text-foreground">Maifah Bong's Tea Cafe</p>
            <p className="text-xs text-muted-foreground">{date.toLocaleDateString()} {date.toLocaleTimeString()}</p>
          </div>

          <div className="space-y-2">
            {sale.items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground">
                  {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                </span>
                <span className="font-semibold text-foreground">₱{(item.price * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 flex justify-between">
            <span className="font-bold text-foreground text-lg">Total</span>
            <span className="font-black text-primary text-lg">₱{sale.total.toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Payment</span>
            <span className="font-semibold capitalize">{sale.paymentMethod}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.print()}
            className="w-full py-3 rounded-2xl bg-card border border-border flex items-center justify-center gap-2 font-bold text-foreground"
          >
            <Printer className="w-5 h-5" />
            Print Receipt
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/pos')}
            className="w-full py-4 rounded-2xl gradient-orange text-primary-foreground font-bold text-lg shadow-float"
          >
            New Order
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReceiptPage;
