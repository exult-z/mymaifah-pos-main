import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

const SelectOperationPage = () => {
  const navigate = useNavigate();
  const { user, users, setUsers } = useAuth();

  // If user already has assigned operation, redirect immediately
  useEffect(() => {
    if (user?.assignedOperation) {
      if (user.assignedOperation === 'cashier') {
        navigate('/pos', { replace: true });
      } else if (user.assignedOperation === 'inventory') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSelectOperation = (operation: 'cashier' | 'inventory') => {
    if (!user) return;
    
    // Save the selected operation permanently
    const updatedUser = { ...user, assignedOperation: operation };
    const updatedUsers = users.map(u => 
      u.id === user.id ? updatedUser : u
    );
    
    // Update in localStorage and state
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    
    setUsers(updatedUsers);
    
    // Navigate to the selected operation
    if (operation === 'cashier') {
      navigate('/pos');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">☕</div>
        <h1 className="text-3xl font-bold text-gray-800">Welcome, {user?.fullName}!</h1>
        <p className="text-gray-500 mt-2">Please select your operation</p>
        <p className="text-sm text-orange-500 mt-1">⚠️ This choice will be permanent for your account</p>
      </div>

      <div className="flex flex-col gap-6 w-full max-w-sm">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSelectOperation('cashier')}
          className="w-full p-6 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-left flex items-center gap-4 shadow-lg"
        >
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <div>
            <div className="text-xl font-bold">Cashier Mode</div>
            <div className="text-sm text-white/80">Process orders, accept payments, print receipts</div>
          </div>
        </motion.button>

        {user?.role === 'admin' && (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelectOperation('inventory')}
            className="w-full p-6 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white text-left flex items-center gap-4 shadow-lg"
          >
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xl font-bold">Inventory & Sales</div>
              <div className="text-sm text-white/80">View reports, manage expenses, track inventory</div>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default SelectOperationPage;