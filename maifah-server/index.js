const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors());
app.use(express.json());

const DATA_FILE   = path.join(__dirname, 'menu_data.json');
const ORDERS_FILE = path.join(__dirname, 'orders_data.json');
const SHIFTS_FILE = path.join(__dirname, 'shifts_data.json');

function loadJSON(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (e) { console.warn('[Data] Could not load', path.basename(filePath), e.message); }
  return fallback;
}
function saveJSON(filePath, data) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8'); }
  catch (e) { console.warn('[Data] Could not save', path.basename(filePath), e.message); }
}

let menuItems = loadJSON(DATA_FILE, []);
let orders    = loadJSON(ORDERS_FILE, []);
let shifts    = loadJSON(SHIFTS_FILE, []);

// socketId -> { userId, role, name, socket, loggedIn }
const clients = new Map();

// ── REST API ──────────────────────────────────────────────────────────────
app.get('/menu', (req, res) => res.json(menuItems));

app.post('/menu', (req, res) => {
  const item = req.body;
  if (!item || !item.id || !item.name || !item.price || !item.category)
    return res.status(400).json({ error: 'Missing required fields' });
  if (menuItems.find(i => i.id === item.id)) return res.status(409).json({ error: 'Item already exists' });
  menuItems.push(item);
  saveJSON(DATA_FILE, menuItems);
  io.emit('menu_updated', { action: 'add_item', item, menuItems });
  res.status(201).json(item);
});

app.put('/menu/:id', (req, res) => {
  const idx = menuItems.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  menuItems[idx] = { ...menuItems[idx], ...req.body };
  saveJSON(DATA_FILE, menuItems);
  io.emit('menu_updated', { action: 'edit_item', item: menuItems[idx], menuItems });
  res.json(menuItems[idx]);
});

app.delete('/menu/:id', (req, res) => {
  const idx = menuItems.findIndex(i => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Item not found' });
  const deleted = menuItems.splice(idx, 1)[0];
  saveJSON(DATA_FILE, menuItems);
  io.emit('menu_updated', { action: 'delete_item', item: deleted, menuItems });
  res.json({ ok: true });
});

app.post('/menu/seed', (req, res) => {
  if (!Array.isArray(req.body)) return res.status(400).json({ error: 'Expected array' });
  if (menuItems.length > 0) return res.json({ seeded: false, count: menuItems.length });
  menuItems = req.body;
  saveJSON(DATA_FILE, menuItems);
  io.emit('menu_updated', { action: 'full_sync', item: null, menuItems });
  res.json({ seeded: true, count: menuItems.length });
});

app.get('/orders', (req, res) => res.json(orders.slice(0, 100)));
app.get('/shifts', (req, res) => res.json(shifts));

app.get('/', (req, res) => {
  const connected = [];
  clients.forEach(({ userId, role, name, loggedIn }) => connected.push({ userId, role, name, loggedIn }));
  res.json({ status: 'online', menuItemCount: menuItems.length, orderCount: orders.length, shiftCount: shifts.length, connectedClients: connected.length, clients: connected });
});

// ── WebSocket ─────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[+] Socket connected:', socket.id);

  // 1. REGISTER — app opened / reconnected (does NOT mark cashier online)
  socket.on('register', ({ userId, role, name }) => {
    if (!userId || !role || !name) return;
    clients.set(socket.id, { userId, role, name, socket, loggedIn: false });
    console.log('  Registered ->', name, '[' + role + ']');
    socket.emit('registered', { ok: true, userId, role, name });
    socket.emit('menu_updated', { action: 'full_sync', item: null, menuItems });
    if (role === 'admin') {
      const online = [];
      clients.forEach(c => { if (c.role === 'cashier' && c.loggedIn) online.push({ cashierId: c.userId, cashierName: c.name }); });
      socket.emit('cashier_status_list', online);
    }
  });

  // 2. CASHIER LOGIN — cashier pressed the Login button
  socket.on('cashier_login', ({ cashierId, cashierName, timestamp }) => {
    const client = clients.get(socket.id);
    if (!client) return;
    client.loggedIn = true;
    console.log('  [LOGIN]', cashierName, 'started shift');
    broadcastToAdmins('cashier_online', { cashierId, cashierName, timestamp: timestamp || new Date().toISOString() });
  });

  // 3. CASHIER END SHIFT — cashier pressed End Shift button
  socket.on('cashier_end_shift', ({ shift }) => {
    const client = clients.get(socket.id);
    if (!client) return;
    client.loggedIn = false;
    console.log('  [END SHIFT]', client.name);
    shifts.unshift(shift);
    if (shifts.length > 1000) shifts = shifts.slice(0, 1000);
    saveJSON(SHIFTS_FILE, shifts);
    broadcastToAdmins('cashier_offline', {
      cashierId: shift.cashierId,
      cashierName: shift.cashierName,
      timestamp: shift.shiftEnd,
      shift,
    });
  });

  // 4. NEW ORDER — cashier completed a sale
  socket.on('new_order', ({ order }) => {
    const client = clients.get(socket.id);
    if (!client) return;
    console.log('  [ORDER]', client.name, '->', order.orderNumber, 'P' + order.total);
    orders.unshift(order);
    if (orders.length > 500) orders = orders.slice(0, 500);
    saveJSON(ORDERS_FILE, orders);
    broadcastToAdmins('new_order', { order, cashierName: client.name, timestamp: new Date().toISOString() });
  });

  // 5. MENU CHANGES (admin)
  socket.on('menu_change', ({ action, item }) => {
    const sender = clients.get(socket.id);
    if (!sender) return;
    console.log('  [MENU]', sender.name, '->', action, ':', item?.name ?? item?.id ?? '');
    if (action === 'add_item') {
      const idx = menuItems.findIndex(i => i.id === item.id);
      if (idx === -1) menuItems.push(item); else menuItems[idx] = { ...menuItems[idx], ...item };
    } else if (action === 'edit_item') {
      const idx = menuItems.findIndex(i => i.id === item.id);
      if (idx !== -1) menuItems[idx] = { ...menuItems[idx], ...item };
    } else if (action === 'delete_item') {
      menuItems = menuItems.filter(i => i.id !== item.id);
    }
    saveJSON(DATA_FILE, menuItems);
    io.emit('menu_updated', { action, item, menuItems, updatedBy: sender.name, timestamp: new Date().toISOString() });
  });

  // 6. ASSIGN INVENTORY MODE
  socket.on('assign_inventory', ({ cashierId, cashierName }) => {
    const sender = clients.get(socket.id);
    if (!sender || sender.role !== 'admin') return;
    broadcastToCashier(cashierId, 'mode_changed', { mode: 'inventory', assignedBy: sender.name, message: `${sender.name} assigned you to Inventory Mode.`, timestamp: new Date().toISOString() });
    socket.emit('assign_confirmed', { cashierId, cashierName, mode: 'inventory' });
  });

  // 7. ASSIGN CASHIER MODE
  socket.on('assign_cashier', ({ cashierId, cashierName }) => {
    const sender = clients.get(socket.id);
    if (!sender || sender.role !== 'admin') return;
    broadcastToCashier(cashierId, 'mode_changed', { mode: 'cashier', assignedBy: sender.name, message: `${sender.name} switched you back to Cashier Mode.`, timestamp: new Date().toISOString() });
    socket.emit('assign_confirmed', { cashierId, cashierName, mode: 'cashier' });
  });

  // 8. DISCONNECT — does NOT send cashier_offline (only end_shift does)
  socket.on('disconnect', () => {
    const client = clients.get(socket.id);
    if (client) {
      console.log('[-] Disconnected:', client.name, '[' + client.role + ']');
      clients.delete(socket.id);
    }
  });
});

function broadcastToAdmins(event, data) {
  clients.forEach(({ role, socket: s }) => { if (role === 'admin') s.emit(event, data); });
}
function broadcastToCashier(cashierId, event, data) {
  clients.forEach(({ userId, socket: s }) => { if (userId === cashierId) s.emit(event, data); });
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log('\n Maifah POS Sync Server running on port', PORT);
  console.log('   Health: http://localhost:' + PORT + '/');
  console.log('   Menu items loaded:', menuItems.length, '\n');
});
