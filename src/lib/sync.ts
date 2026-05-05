/**
 * sync.ts  –  Singleton Socket.io client for Maifah POS real-time sync
 *
 * HOW TO CONFIGURE
 * ─────────────────
 * Set SERVER_URL below to your deployed server address.
 *
 * Options:
 *   Free cloud (Railway):  'https://your-app.up.railway.app'
 *   Free cloud (Render):   'https://your-app.onrender.com'
 *   Local (same WiFi):     'http://192.168.1.xx:3001'   ← your PC's local IP
 */

import { io, Socket } from 'socket.io-client';

// ⚠️  CHANGE THIS to your deployed server URL
export const SERVER_URL = 'https://maifah-pos-main-production.up.railway.app';

export type SyncRole = 'admin' | 'cashier';

export type MenuAction = 'add_item' | 'edit_item' | 'delete_item' | 'full_sync';

export interface MenuUpdatedPayload {
  action: MenuAction;
  item: Record<string, unknown> | null;
  menuItems: Record<string, unknown>[];
  updatedBy?: string;
  timestamp?: string;
}

export interface InventoryUpdatePayload {
  action: string;
  cashierName: string;
  item: unknown;
  timestamp?: string;
}

export interface ModeChangedPayload {
  mode: 'inventory' | 'cashier';
  assignedBy: string;
  message: string;
  timestamp: string;
}

export interface CashierPresencePayload {
  cashierId: string;
  cashierName: string;
  timestamp: string;
  /** Full shift record — only present on cashier_offline */
  shift?: ShiftPayload;
}

export interface CashierStatusListPayload {
  cashierId: string;
  cashierName: string;
}

export interface OrderPayload {
  id: string;
  orderNumber: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  paymentMethod: string;
  date: string;
  cashierName?: string;
  cashierId?: string;
}

export interface NewOrderPayload {
  order: OrderPayload;
  cashierName: string;
  timestamp: string;
}

export interface ShiftPayload {
  id: string;
  cashierId: string;
  cashierName: string;
  cashierCode?: string;
  shiftStart: string;
  shiftEnd: string;
  totalSales: number;
  totalOrders: number;
  totalItems: number;
  salesBreakdown: { id: string; items: { name: string; quantity: number; price: number }[]; total: number; date: string }[];
  isRead: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────

type Listener<T = unknown> = (data: T) => void;

class SyncManager {
  private socket: Socket | null = null;
  private registeredUserId: string | null = null;
  private listeners = new Map<string, Set<Listener>>();

  /** Connect and register with the server. Safe to call multiple times. */
  connect(userId: string, role: SyncRole, name: string) {
    if (this.socket?.connected && this.registeredUserId === userId) return;

    if (this.socket?.connected) {
      this.socket.emit('register', { userId, role, name });
      this.registeredUserId = userId;
      return;
    }

    this.socket = io(SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Sync] Connected to server');
      this.socket!.emit('register', { userId, role, name });
      this.registeredUserId = userId;
    });

    this.socket.on('disconnect', () => {
      console.log('[Sync] Disconnected — will auto-reconnect');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Sync] Connection error:', err.message);
    });

    // ── Incoming events ────────────────────────────────────────────────
    this.socket.on('menu_updated',       (d) => this._emit('menu_updated', d));
    this.socket.on('mode_changed',       (d) => this._emit('mode_changed', d));
    this.socket.on('cashier_online',     (d) => this._emit('cashier_online', d));
    this.socket.on('cashier_offline',    (d) => this._emit('cashier_offline', d));
    this.socket.on('cashier_status_list',(d) => this._emit('cashier_status_list', d));
    this.socket.on('assign_confirmed',   (d) => this._emit('assign_confirmed', d));
    this.socket.on('registered',         (d) => this._emit('registered', d));
    this.socket.on('new_order',          (d) => this._emit('new_order', d));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.registeredUserId = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // ── Subscribe to events ────────────────────────────────────────────────
  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
    return () => {
      this.listeners.get(event)?.delete(listener as Listener);
    };
  }

  private _emit(event: string, data: unknown) {
    this.listeners.get(event)?.forEach((l) => l(data));
  }

  // ── Emit menu changes to server (admin calls these) ────────────────────

  menuItemAdded(item: Record<string, unknown>) {
    this.socket?.emit('menu_change', { action: 'add_item', item });
  }

  menuItemUpdated(item: Record<string, unknown>) {
    this.socket?.emit('menu_change', { action: 'edit_item', item });
  }

  menuItemDeleted(itemId: string) {
    this.socket?.emit('menu_change', { action: 'delete_item', item: { id: itemId } });
  }

  /** Admin: put cashier into inventory mode */
  assignInventory(cashierId: string, cashierName: string) {
    this.socket?.emit('assign_inventory', { cashierId, cashierName });
  }

  /** Admin: switch cashier back to cashier mode */
  assignCashier(cashierId: string, cashierName: string) {
    this.socket?.emit('assign_cashier', { cashierId, cashierName });
  }

  // ── Cashier lifecycle events ───────────────────────────────────────────

  /**
   * Cashier clicked the Login button — notify admin they are online.
   * Call this AFTER a successful login(), not on app open.
   */
  cashierLogin(cashierId: string, cashierName: string) {
    this.socket?.emit('cashier_login', {
      cashierId,
      cashierName,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cashier clicked End Shift — sends full shift report to admin.
   * Call this when the cashier confirms the end-shift dialog.
   */
  cashierEndShift(shift: ShiftPayload) {
    this.socket?.emit('cashier_end_shift', { shift });
  }

  /**
   * Cashier completed a sale — notify admin in real-time.
   * Call this right after addSale() in PaymentPage.
   */
  newOrder(order: OrderPayload) {
    this.socket?.emit('new_order', { order });
  }
}

// Singleton — import this everywhere
export const syncManager = new SyncManager();
