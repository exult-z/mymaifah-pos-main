import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Image as ImageIcon, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAllItems, putItem, updateItem, deleteItem } from '@/lib/indexedDB';
import { menuItems as staticMenuItems } from '@/data/menu';
import { syncManager, type MenuUpdatedPayload } from '@/lib/sync';

const categories = ['Sulit Meals', 'Silog Meals', 'Rice Toppings', 'A La Carte', 'Finger Foods', 'Beverages', 'Coffee', 'Others'];

function generateId() {
  return 'menu-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
}

export default function MenuManager() {
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isOpen, setIsOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [synced, setSynced] = useState(syncManager.isConnected());

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '',
    description: '',
    image: '',
  });

  // ── Load from IndexedDB and filter locally ─────────────────────────────
  const loadItems = async () => {
    try {
      let all = await getAllItems('menu_items');
      if (all.length === 0) {
        // Seed on first load
        await Promise.all(staticMenuItems.map(i => putItem('menu_items', i)));
        all = staticMenuItems;
      }

      let filtered = all;
      if (selectedCategory !== 'All') {
        filtered = filtered.filter(i => i.category === selectedCategory);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(i =>
          i.name?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
        );
      }
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      setItems(filtered);
    } catch (err) {
      console.error('loadItems error:', err);
    }
  };

  useEffect(() => {
    loadItems();
  }, [searchQuery, selectedCategory]);

  // ── Listen for real-time menu updates from other devices ───────────────
  useEffect(() => {
    const unsub = syncManager.on<MenuUpdatedPayload>('menu_updated', async (payload) => {
      console.log('[MenuManager] menu_updated received:', payload.action);

      // Sync the full authoritative list from server into local IndexedDB
      if (payload.menuItems && payload.menuItems.length >= 0) {
        await Promise.all((payload.menuItems as any[]).map(i => putItem('menu_items', i)));

        // For deletes, also remove from local IndexedDB
        if (payload.action === 'delete_item' && payload.item?.id) {
          try { await deleteItem('menu_items', payload.item.id as string); } catch {}
        }
      }

      setSynced(syncManager.isConnected());
      loadItems();
    });

    // Poll connection status
    const interval = setInterval(() => setSynced(syncManager.isConnected()), 3000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [searchQuery, selectedCategory]);

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '', description: '', image: '' });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price || !formData.category) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const itemPayload = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        description: formData.description || '',
        image: formData.image.trim() || null,
      };

      if (editingItem) {
        // Update in local IndexedDB
        await updateItem('menu_items', editingItem.id, itemPayload);
        const updated = { ...editingItem, ...itemPayload };

        // Push to server → server broadcasts to all connected devices
        syncManager.menuItemUpdated(updated);
        toast.success('Item updated — syncing to all devices…');
      } else {
        const newItem = {
          id: generateId(),
          ...itemPayload,
          createdAt: new Date().toISOString(),
          isAvailable: true,
        };

        // Save locally first
        await putItem('menu_items', newItem);

        // Push to server → server broadcasts to all connected devices
        syncManager.menuItemAdded(newItem);
        toast.success('Item added — syncing to all devices…');
      }

      setIsOpen(false);
      resetForm();
      loadItems();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category,
      description: item.description || '',
      image: item.image || '',
    });
    setIsOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteItem('menu_items', id);
      syncManager.menuItemDeleted(id);
      toast.success('Item deleted — syncing to all devices…');
      loadItems();
    } catch (err) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">Menu Management</h1>
          {/* Sync status badge */}
          <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
            synced ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-500'
          }`}>
            {synced ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {synced ? 'Live Sync ON' : 'Offline'}
          </span>
        </div>

        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Item Name *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>

              <div>
                <Label>Price (₱) *</Label>
                <Input type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} required />
              </div>

              <div>
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={formData.image}
                  onChange={(e) => setFormData({...formData, image: e.target.value})}
                />
                {formData.image && (
                  <div className="mt-2">
                    <img src={formData.image} alt="preview" className="w-32 h-32 object-cover rounded border" onError={(e) => e.currentTarget.style.display = 'none'} />
                  </div>
                )}
              </div>

              <div>
                <Label>Description</Label>
                <Input value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
              </div>

              <Button type="submit" className="w-full">
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col gap-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Search menu items..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-full" />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Item Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded border" onError={(e) => e.currentTarget.style.display = 'none'} />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell className="text-right">₱{Number(item.price).toFixed(2)}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}