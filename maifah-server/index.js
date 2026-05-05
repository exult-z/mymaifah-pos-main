const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

// ── Persist menu to disk so it survives server restarts ───────────────────
const DATA_FILE = path.join(__dirname, 'menu_data.json');

function loadMenuFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('[Data] Could not load menu_data.json:', e.message);
  }
  return [];
}

function saveMenuToDisk(items) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(items, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Data] Could not save menu_data.json:', e.message);
  }
}

// In-memory menu store (authoritative source for all connected devices)
let menuItems = loadMenuFromDisk();

// ── In-memory session store ────────────────────────────────────────────────
// socketId -> { userId, role, name, socket }
const clients = new Map();

// ── REST API for menu (fallback / initial load) ───────────────────────────

// GET all menu items
app.get('/menu', (req, res) => {
  res.json(menuItems);
});

// POST add item (admin only via REST — socket is preferred)
app.post('/menu', (req, res) => {
  const item = req.body;
  if (!item || !item.id || !item.name || !item.price || !item.category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const exists = menuItems.find(i => i.id === item.id);
  if (exists) return res.status(409).json({ error: 'Item already exists' });
  menuItems.push(item);
  saveMenuToDisk(menuItems);
  io.emit('menu_updated', { action: 'add_item', item, menuItems });
  res.status(201).json(item);
});

// PUT update item
app.put('/menu/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const idx = menuItems.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  menuItems[idx] = { ...menuItems[idx], ...updates };
  saveMenuToDisk(menuItems);
  io.emit('menu_updated', { action: 'edit_item', item: menuItems[idx], menuItems });
  res.json(menuItems[idx]);
});

// DELETE item
app.delete('/menu/:id', (req, res) => {
  const { id } = req.params;
  const idx = menuItems.findIndex(i => i.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const deleted = menuItems[idx];
  menuItems.splice(idx, 1);
  saveMenuToDisk(menuItems);
  io.emit('menu_updated', { action: 'delete_item', item: deleted, menuItems });
  res.json({ ok: true });
});

// POST bulk seed (used on first run to push static menu up to server)
app.post('/menu/seed', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected array' });
  if (menuItems.length > 0) {
    // Already seeded — don't overwrite
    return res.json({ seeded: false, count: menuItems.length });
  }
  menuItems = items;
  saveMenuToDisk(menuItems);
  io.emit('menu_updated', { action: 'full_sync', item: null, menuItems });
  res.json({ seeded: true, count: menuItems.length });
});

// ── Health check ──────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  const connected = [];
  clients.forEach(({ userId, role, name }) => connected.push({ userId, role, name }));
  res.json({
    status: 'online',
    menuItemCount: menuItems.length,
    connectedClients: connected.length,
    clients: connected,
  });
});

// ── WebSocket logic ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  // ── 1. REGISTER ──────────────────────────────────────────────────────
  socket.on('register', ({ userId, role, name }) => {
    if (!userId || !role || !name) return;

    clients.set(socket.id, { userId, role, name, socket });
    console.log(`  Registered → ${name} [${role}]`);

    socket.emit('registered', { ok: true, userId, role, name });

    // Send current full menu to newly connected device immediately
    socket.emit('menu_updated', { action: 'full_sync', item: null, menuItems });

    if (role === 'cashier') {
      broadcastToAdmins('cashier_online', {
        cashierId: userId,
        cashierName: name,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // ── 2. MENU ITEM CHANGES (from admin) ────────────────────────────────
  // Payload: { action, item }
  // action: 'add_item' | 'edit_item' | 'delete_item'
  socket.on('menu_change', ({ action, item }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;

    console.log(`  [MENU] ${sender.name} → ${action}: ${item?.name ?? item?.id ?? ''}`);

    if (action === 'add_item') {
      const exists = menuItems.find(i => i.id === item.id);
      if (!exists) {
        menuItems.push(item);
      } else {
        // Update in place if already exists (idempotent)
        const idx = menuItems.findIndex(i => i.id === item.id);
        menuItems[idx] = { ...menuItems[idx], ...item };
      }
    } else if (action === 'edit_item') {
      const idx = menuItems.findIndex(i => i.id === item.id);
      if (idx !== -1) menuItems[idx] = { ...menuItems[idx], ...item };
    } else if (action === 'delete_item') {
      menuItems = menuItems.filter(i => i.id !== item.id);
    }

    saveMenuToDisk(menuItems);

    // Broadcast the change + full updated list to ALL connected devices
    io.emit('menu_updated', {
      action,
      item,
      menuItems,
      updatedBy: sender.name,
      timestamp: new Date().toISOString(),
    });
  });

  // ── 3. ADMIN → ASSIGN CASHIER TO INVENTORY MODE ──────────────────────
  socket.on('assign_inventory', ({ cashierId, cashierName }) => {
    const sender = clients.get(socket.id);
    if (!sender || sender.role !== 'admin') return;

    broadcastToCashier(cashierId, 'mode_changed', {
      mode: 'inventory',
      assignedBy: sender.name,
      message: `${sender.name} assigned you to Inventory Mode.`,
      timestamp: new Date().toISOString(),
    });

    socket.emit('assign_confirmed', { cashierId, cashierName, mode: 'inventory' });
  });

  // ── 4. ADMIN → ASSIGN CASHIER BACK TO CASHIER MODE ───────────────────
  socket.on('assign_cashier', ({ cashierId, cashierName }) => {
    const sender = clients.get(socket.id);
    if (!sender || sender.role !== 'admin') return;

    broadcastToCashier(cashierId, 'mode_changed', {
      mode: 'cashier',
      assignedBy: sender.name,
      message: `${sender.name} switched you back to Cashier Mode.`,
      timestamp: new Date().toISOString(),
    });

    socket.emit('assign_confirmed', { cashierId, cashierName, mode: 'cashier' });
  });

  // ── 5. DISCONNECT ─────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const client = clients.get(socket.id);
    if (client) {
      console.log(`[-] Disconnected: ${client.name} [${client.role}]`);
      if (client.role === 'cashier') {
        broadcastToAdmins('cashier_offline', {
          cashierId: client.userId,
          cashierName: client.name,
          timestamp: new Date().toISOString(),
        });
      }
      clients.delete(socket.id);
    }
  });
});

// ── Helpers ───────────────────────────────────────────────────────────────
function broadcastToAdmins(event, data) {
  clients.forEach(({ role, socket: s }) => {
    if (role === 'admin') s.emit(event, data);
  });
}

function broadcastToCashier(cashierId, event, data) {
  clients.forEach(({ userId, socket: s }) => {
    if (userId === cashierId) s.emit(event, data);
  });
}

// ── Start ─────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🍵 Maifah POS Sync Server running on port ${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/`);
  console.log(`   Menu:   http://localhost:${PORT}/menu`);
  console.log(`   Menu items loaded: ${menuItems.length}\n`);
});