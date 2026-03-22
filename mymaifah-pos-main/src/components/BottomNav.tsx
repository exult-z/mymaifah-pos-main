import { ShoppingCart, BarChart3, Receipt } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/pos', icon: ShoppingCart, label: 'POS' },
  { path: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { path: '/expenses', icon: Receipt, label: 'Expenses' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border safe-bottom z-50">
      <div className="max-w-md mx-auto flex items-center justify-around h-16">
        {tabs.map(tab => {
          const active = location.pathname === tab.path;
          return (
            <motion.button
              key={tab.path}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{tab.label}</span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
