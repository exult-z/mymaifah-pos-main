import { motion } from 'framer-motion';
import { Printer } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SaleRecord } from '@/data/menu';

interface ReceiptState {
  sale: SaleRecord;
  orderNumber: number;
  cashierName: string;
  cashTendered?: number;
  change?: number;
}

const dashes = '- - - - - - - - - - - - - - -';
const solidLine = '─────────────────────────────';

const ReceiptPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReceiptState | null;

  console.log('Receipt page received state:', state);

  if (!state?.sale) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">No receipt data</p>
      </div>
    );
  }

  const { sale, orderNumber, cashierName, cashTendered, change } = state;
  const date = new Date(sale.date);
  const dateStr = date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  const orderNo = `#${String(orderNumber).padStart(4, '0')}`;
  const isCash = sale.paymentMethod === 'cash';

  return (
    <div className="min-h-screen bg-muted/50 flex flex-col items-center px-4 py-8 print:bg-white print:p-0">
      {/* Receipt Paper */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        id="receipt-content"
        className="w-full max-w-[320px] bg-white rounded-lg shadow-xl p-6 font-mono text-[13px] leading-relaxed text-neutral-800 print:shadow-none print:rounded-none print:max-w-none print:w-full"
      >
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-3xl">☕</div>
          <p className="font-bold text-base">Maifah Bong's Tea Cafe</p>
          <p className="text-[11px] text-neutral-500">Cook As You Order</p>
          <p className="text-[10px] text-neutral-400">Brgy. Sample, City, Philippines</p>
          <p className="text-[11px] text-neutral-500">{dateStr} &nbsp; {timeStr}</p>
        </div>

        <p className="text-center text-neutral-300 my-3 tracking-widest text-[11px]">{dashes}</p>

        {/* Order Details */}
        <p className="text-center font-bold text-xs tracking-wider mb-1">ORDER DETAILS</p>
        <p className="text-center text-neutral-300 tracking-widest text-[11px]">{dashes}</p>

        <div className="mt-3 space-y-2">
          {sale.items.map(item => (
            <div key={item.id}>
              <div className="flex justify-between">
                <span className="truncate max-w-[200px]">{item.name}</span>
                <span className="text-neutral-500 ml-2 shrink-0">x{item.quantity}</span>
              </div>
              <div className="text-right text-neutral-600">
                ₱{(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-neutral-300 my-3 tracking-widest text-[11px]">{dashes}</p>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>₱{sale.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>₱0.00</span>
          </div>
          <p className="text-neutral-300 text-[11px]">{solidLine}</p>
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>₱{sale.total.toFixed(2)}</span>
          </div>
          <p className="text-neutral-300 text-[11px]">{solidLine}</p>

          {isCash ? (
            <>
              <div className="flex justify-between">
                <span>Cash Tendered:</span>
                <span>₱{(cashTendered ?? sale.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change:</span>
                <span>₱{(change ?? 0).toFixed(2)}</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>GCash</span>
              </div>
              <div className="flex justify-between">
                <span>Reference No:</span>
                <span>GC-{String(orderNumber).padStart(6, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="font-bold">PAID</span>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-neutral-300 my-3 tracking-widest text-[11px]">{dashes}</p>

        {/* Order Info */}
        <div className="space-y-1 text-[12px]">
          <div className="flex justify-between">
            <span>Order No:</span>
            <span className="font-bold">{orderNo}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{dateStr}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{timeStr}</span>
          </div>
        </div>

        <p className="text-center text-neutral-300 my-3 tracking-widest text-[11px]">{dashes}</p>

        {/* Footer */}
        <div className="text-center space-y-1 text-[11px] text-neutral-500">
          <p className="font-semibold">Thank you for dining with us!</p>
          <p>Please come again!</p>
          <p className="text-[10px] text-neutral-400 mt-2">Powered by Maifah POS</p>
        </div>

        <p className="text-center text-neutral-300 mt-3 tracking-widest text-[11px]">{dashes}</p>
      </motion.div>

      {/* Action Buttons — hidden when printing */}
      <div className="flex flex-col gap-3 mt-6 w-full max-w-[320px] print:hidden">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => window.print()}
          className="w-full py-3 rounded-2xl gradient-orange text-primary-foreground flex items-center justify-center gap-2 font-bold shadow-float"
        >
          <Printer className="w-5 h-5" />
          Print Receipt
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/pos')}
          className="w-full py-3 rounded-2xl bg-white border-2 border-primary text-primary font-bold"
        >
          New Order
        </motion.button>
      </div>
    </div>
  );
};

export default ReceiptPage;