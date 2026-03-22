import { useState, useCallback, useSyncExternalStore } from 'react';

export interface AppUser {
  email: string;
  fullName: string;
  role: 'Cashier' | 'Manager' | 'Owner';
}

interface StoredUser extends AppUser {
  password: string;
}

type Listener = () => void;

// In-memory user store
const listeners = new Set<Listener>();
let users: StoredUser[] = [
  { email: 'admin@maifah.com', password: 'admin123', fullName: 'Admin', role: 'Owner' },
];
let currentUser: AppUser | null = null;

function notify() {
  listeners.forEach(l => l());
}

function subscribe(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSnapshot() {
  return currentUser;
}

export function useAuth() {
  const user = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const login = useCallback((email: string, password: string): AppUser | null => {
    const found = users.find(u => u.email === email && u.password === password);
    if (!found) return null;
    const { password: _, ...appUser } = found;
    currentUser = appUser;
    notify();
    return appUser;
  }, []);

  const register = useCallback((fullName: string, email: string, password: string, role: AppUser['role']): { success: boolean; error?: string } => {
    if (users.find(u => u.email === email)) {
      return { success: false, error: 'Email already exists' };
    }
    users.push({ email, password, fullName, role });
    const appUser: AppUser = { email, fullName, role };
    currentUser = appUser;
    notify();
    return { success: true };
  }, []);

  const logout = useCallback(() => {
    currentUser = null;
    notify();
  }, []);

  return { user, login, register, logout };
}
