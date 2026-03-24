import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, AlertTriangle, Clock, Trash2, Plus } from 'lucide-react';
import { useSupplies } from '../hooks/useSupplies';

const SuppliesManager = () => {
  const { supplies, addSupply, deleteSupply, getExpiringSoon, getExpired } = useSupplies();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSupply, setNewSupply] = useState({
    name: '',
    category: 'Ingredients',
    quantity: 0,
    unit: 'kg',
    expiryDate: '',
  });

  const expiringSoon = getExpiringSoon();
  const expired = getExpired();

  const handleAddSupply = () => {
    if (!newSupply.name || !newSupply.expiryDate) return;
    
    addSupply({
      name: newSupply.name,
      category: newSupply.category,
      quantity: newSupply.quantity,
      unit: newSupply.unit,
      expiryDate: newSupply.expiryDate,
      addedBy: 'Admin',
    });
    
    setNewSupply({ name: '', category: 'Ingredients', quantity: 0, unit: 'kg', expiryDate: '' });
    setShowAddForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'expired': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const getStatusText = (status: string, daysUntilExpiry: number) => {
    switch (status) {
      case 'expired': return 'Expired';
      case 'warning': return `Expires in ${daysUntilExpiry} days`;
      default: return 'Good';
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banner for Expiring Items */}
      {(expiringSoon.length > 0 || expired.length > 0) && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-orange-700">Expiry Alerts</h3>
          </div>
          <div className="mt-2 space-y-1">
            {expiringSoon.map(supply => (
              <div key={supply.id} className="text-sm text-orange-600">
                ⚠️ {supply.name} expires in {supply.daysUntilExpiry} days
              </div>
            ))}
            {expired.map(supply => (
              <div key={supply.id} className="text-sm text-red-600">
                ❌ {supply.name} has expired!
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Supply Button */}
      <button
        onClick={() => setShowAddForm(!showAddForm)}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Add New Supply
      </button>

      {/* Add Supply Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-4 space-y-3 overflow-hidden"
          >
            <input
              type="text"
              placeholder="Supply name"
              value={newSupply.name}
              onChange={e => setNewSupply({ ...newSupply, name: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <select
              value={newSupply.category}
              onChange={e => setNewSupply({ ...newSupply, category: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option>Ingredients</option>
              <option>Supplies</option>
              <option>Packaging</option>
              <option>Cleaning</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Quantity"
                value={newSupply.quantity}
                onChange={e => setNewSupply({ ...newSupply, quantity: parseFloat(e.target.value) })}
                className="flex-1 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                value={newSupply.unit}
                onChange={e => setNewSupply({ ...newSupply, unit: e.target.value })}
                className="w-24 p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option>kg</option>
                <option>g</option>
                <option>L</option>
                <option>pcs</option>
                <option>bags</option>
              </select>
            </div>
            <input
              type="date"
              value={newSupply.expiryDate}
              onChange={e => setNewSupply({ ...newSupply, expiryDate: e.target.value })}
              className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleAddSupply}
              className="w-full py-3 rounded-xl bg-green-500 text-white font-bold"
            >
              Save Supply
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Supplies List */}
      <div className="space-y-3">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-5 h-5" />
          Inventory List
        </h3>
        
        {supplies.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No supplies added yet</p>
        ) : (
          supplies.map(supply => (
            <div key={supply.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold">{supply.name}</h4>
                  <p className="text-sm text-gray-500">
                    {supply.quantity} {supply.unit} • {supply.category}
                  </p>
                </div>
                <button onClick={() => deleteSupply(supply.id)} className="text-red-500">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mt-2 flex justify-between items-center">
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(supply.status)}`}>
                  {getStatusText(supply.status, supply.daysUntilExpiry)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Expires: {new Date(supply.expiryDate).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SuppliesManager;