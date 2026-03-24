import { useState, useEffect } from 'react';
import { User, DEFAULT_ADMIN } from '@/types/user';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => { success: boolean; user?: User; error?: string };
  signup: (fullName: string, email: string, password: string, role: 'admin' | 'cashier') => { success: boolean; error?: string };
  logout: () => void;
  setUsers: (users: User[]) => void;
  deleteUser: (userId: string) => boolean;
  isAuthenticated: boolean;
  canAccess: (requiredOperation: string) => boolean;
  assignOperation: (userId: string, operation: 'cashier' | 'inventory') => boolean;
  switchToCashier: (cashierId: string) => User | null;
  getCashiers: () => User[];
  updateCashierStats: (cashierId: string, amount: number) => void;
}

const DEMO_CASHIERS: User[] = [
  {
    id: '2',
    fullName: 'Maria Santos',
    email: 'cashier1@maifah.com',
    password: 'cashier123',
    role: 'cashier',
    assignedOperation: 'cashier',
    cashierId: 'CASH001',
    cashierCode: 'MS001',
    createdAt: new Date().toISOString(),
    totalSales: 0,
    totalOrders: 0,
  },
  {
    id: '3',
    fullName: 'John Reyes',
    email: 'cashier2@maifah.com',
    password: 'cashier123',
    role: 'cashier',
    assignedOperation: 'cashier',
    cashierId: 'CASH002',
    cashierCode: 'JR002',
    createdAt: new Date().toISOString(),
    totalSales: 0,
    totalOrders: 0,
  },
  {
    id: '4',
    fullName: 'Anna Cruz',
    email: 'cashier3@maifah.com',
    password: 'cashier123',
    role: 'cashier',
    assignedOperation: 'cashier',
    cashierId: 'CASH003',
    cashierCode: 'AC003',
    createdAt: new Date().toISOString(),
    totalSales: 0,
    totalOrders: 0,
  },
];

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const stored = localStorage.getItem('users');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      return [DEFAULT_ADMIN, ...DEMO_CASHIERS];
    } catch (error) {
      console.error('Failed to parse users:', error);
      return [DEFAULT_ADMIN, ...DEMO_CASHIERS];
    }
  });

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const validUser = users.find(u => u.id === parsedUser.id);
        if (validUser) {
          setUser(validUser);
        } else {
          localStorage.removeItem('currentUser');
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string) => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (!foundUser) {
      return { success: false, error: 'Invalid email or password' };
    }
    
    setUser(foundUser);
    localStorage.setItem('currentUser', JSON.stringify(foundUser));
    return { success: true, user: foundUser };
  };

  const signup = (fullName: string, email: string, password: string, role: 'admin' | 'cashier') => {
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return { success: false, error: 'Email already registered' };
    }
    
    const cashierCount = users.filter(u => u.role === 'cashier').length + 1;
    const cashierCode = `CASH${String(cashierCount).padStart(3, '0')}`;
    const userCode = `${fullName.substring(0, 2).toUpperCase()}${cashierCount}`;
    
    const newUser: User = {
      id: Date.now().toString(),
      fullName,
      email,
      password,
      role,
      assignedOperation: role === 'cashier' ? 'cashier' : null,
      cashierId: role === 'cashier' ? cashierCode : undefined,
      cashierCode: role === 'cashier' ? userCode : undefined,
      createdAt: new Date().toISOString(),
      totalSales: 0,
      totalOrders: 0,
    };
    
    setUsers([...users, newUser]);
    return { success: true };
  };

  const deleteUser = (userId: string): boolean => {
    const userToDelete = users.find(u => u.id === userId);
    
    if (!userToDelete) {
      toast.error('User not found');
      return false;
    }
    
    if (userToDelete.role === 'admin') {
      toast.error('Cannot delete admin account');
      return false;
    }
    
    if (user?.id === userId) {
      toast.error('Cannot delete your own account');
      return false;
    }
    
    if (!confirm(`Remove ${userToDelete.fullName}?`)) return false;
    
    setUsers(users.filter(u => u.id !== userId));
    toast.success(`${userToDelete.fullName} removed`);
    return true;
  };

  const assignOperation = (userId: string, operation: 'cashier' | 'inventory'): boolean => {
    const userToUpdate = users.find(u => u.id === userId);
    if (userToUpdate?.assignedOperation) return false;
    
    const updatedUsers = users.map(u => 
      u.id === userId ? { ...u, assignedOperation: operation } : u
    );
    setUsers(updatedUsers);
    
    if (user?.id === userId) {
      const updatedUser = { ...user, assignedOperation: operation };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    }
    return true;
  };

  const switchToCashier = (cashierId: string): User | null => {
    if (user?.role !== 'admin') {
      toast.error('Only admins can switch to cashier accounts');
      return null;
    }
    
    const cashier = users.find(u => u.id === cashierId && u.role === 'cashier');
    if (!cashier) {
      toast.error('Cashier not found');
      return null;
    }
    
    // Store current admin to return later
    sessionStorage.setItem('adminUser', JSON.stringify(user));
    
    // Set new user
    setUser(cashier);
    localStorage.setItem('currentUser', JSON.stringify(cashier));
    toast.success(`Switched to ${cashier.fullName}`);
    
    return cashier;
  };

  const getCashiers = (): User[] => users.filter(u => u.role === 'cashier');

  const updateCashierStats = (cashierId: string, amount: number) => {
    setUsers(users.map(u => 
      u.id === cashierId 
        ? { ...u, totalSales: (u.totalSales || 0) + amount, totalOrders: (u.totalOrders || 0) + 1 }
        : u
    ));
  };

  const logout = () => {
    // Check if we're in a cashier session that was switched from admin
    const adminUser = sessionStorage.getItem('adminUser');
    
    if (adminUser && user?.role === 'cashier') {
      // Return to admin
      const admin = JSON.parse(adminUser);
      setUser(admin);
      localStorage.setItem('currentUser', JSON.stringify(admin));
      sessionStorage.removeItem('adminUser');
      toast.info('Returned to admin mode');
    } else {
      // Normal logout
      setUser(null);
      localStorage.removeItem('currentUser');
      toast.info('Logged out successfully');
    }
  };

  const canAccess = (requiredOperation: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return requiredOperation === 'cashier';
  };

  return {
    user,
    users,
    isLoading,
    login,
    signup,
    logout,
    setUsers,
    deleteUser,
    isAuthenticated: !!user,
    canAccess,
    assignOperation,
    switchToCashier,
    getCashiers,
    updateCashierStats,
  };
}