import { useState, useEffect } from 'react';

export interface Supply {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string;
  daysUntilExpiry: number;
  status: 'good' | 'warning' | 'expired';
  addedBy: string;
  addedAt: string;
}

export function useSupplies() {
  const [supplies, setSupplies] = useState<Supply[]>(() => {
    const stored = localStorage.getItem('supplies');
    return stored ? JSON.parse(stored) : [];
  });

  // Update days until expiry and status daily
  useEffect(() => {
    const updateExpiryStatus = () => {
      const today = new Date();
      const updated = supplies.map(supply => {
        const expiryDate = new Date(supply.expiryDate);
        const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'good' | 'warning' | 'expired';
        if (daysUntil < 0) status = 'expired';
        else if (daysUntil <= 7) status = 'warning';
        else status = 'good';
        
        return { ...supply, daysUntilExpiry: daysUntil, status };
      });
      
      setSupplies(updated);
    };
    
    updateExpiryStatus();
    const interval = setInterval(updateExpiryStatus, 24 * 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [supplies]);

  const addSupply = (supply: Omit<Supply, 'id' | 'daysUntilExpiry' | 'status' | 'addedAt'>) => {
    const newSupply: Supply = {
      ...supply,
      id: Date.now().toString(),
      daysUntilExpiry: 0,
      status: 'good',
      addedAt: new Date().toISOString(),
    };
    const updatedSupplies = [...supplies, newSupply];
    setSupplies(updatedSupplies);
    localStorage.setItem('supplies', JSON.stringify(updatedSupplies));
  };

  const deleteSupply = (id: string) => {
    const updated = supplies.filter(s => s.id !== id);
    setSupplies(updated);
    localStorage.setItem('supplies', JSON.stringify(updated));
  };

  const getExpiringSoon = () => {
    return supplies.filter(s => s.status === 'warning');
  };

  const getExpired = () => {
    return supplies.filter(s => s.status === 'expired');
  };

  return {
    supplies,
    addSupply,
    deleteSupply,
    getExpiringSoon,
    getExpired,
  };
}