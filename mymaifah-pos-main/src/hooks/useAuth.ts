import { useState, useEffect } from 'react';
import { User, DEFAULT_ADMIN } from '@/types/user';

interface AuthState {
  user: User | null;
  users: User[];
  login: (email: string, password: string) => { success: boolean; user?: User; error?: string };
  signup: (fullName: string, email: string, password: string, role: 'admin' | 'cashier') => { success: boolean; error?: string };
  logout: () => void;
  setUsers: (users: User[]) => void;
  isAuthenticated: boolean;
  canAccess: (requiredOperation: string) => boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(() => {
    const stored = localStorage.getItem('users');
    if (stored) return JSON.parse(stored);
    return [DEFAULT_ADMIN];
  });

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) setUser(JSON.parse(storedUser));
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
    
    const newUser: User = {
      id: Date.now().toString(),
      fullName,
      email,
      password,
      role,
      assignedOperation: null, // Will be set on first login
      createdAt: new Date().toISOString(),
    };
    
    setUsers([...users, newUser]);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const canAccess = (requiredOperation: string): boolean => {
    if (!user) return false;
    
    // Admin has full access
    if (user.role === 'admin') return true;
    
    // Cashier can only access POS
    if (user.role === 'cashier') {
      return requiredOperation === 'cashier';
    }
    
    return false;
  };

  return {
    user,
    users,
    login,
    signup,
    logout,
    setUsers,
    isAuthenticated: !!user,
    canAccess,
  };
}