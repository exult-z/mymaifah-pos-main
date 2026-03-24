export interface Supply {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  expiryDate: string; // ISO date string
  daysUntilExpiry: number;
  status: 'good' | 'warning' | 'expired';
  addedBy: string;
  addedAt: string;
}

export interface SupplyReminder {
  id: string;
  supplyId: string;
  supplyName: string;
  daysRemaining: number;
  expiryDate: string;
  notified: boolean;
}