import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MenuItem as MenuItemType } from '@/data/menu';
import { getMenuImage } from '@/data/menuImages';

interface MenuItemProps {
  item: MenuItemType;
  quantity: number;
  onAdd: (item: MenuItemType) => void;
  index: number;
}

const MenuItem = ({ item, quantity, onAdd, index }: MenuItemProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const menuImage = getMenuImage(item.id);
  const fallbackColor = menuImage?.fallbackColor || '#FF6B35';
  const emoji = menuImage?.emoji || '🍽️';

  // Preload image
  useEffect(() => {
    if (menuImage?.imageUrl) {
      const img = new Image();
      img.src = menuImage.imageUrl;
      img.onload = () => setImageLoading(false);
      img.onerror = () => {
        setImageError(true);
        setImageLoading(false);
      };
    }
  }, [menuImage]);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onAdd(item)}
      className="relative bg-card rounded-2xl shadow-card border border-border text-left overflow-hidden hover:shadow-lg transition-all"
    >
      {/* Image Container */}
      <div className="relative h-32 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        {!imageError && menuImage?.imageUrl && (
          <img
            src={menuImage.imageUrl}
            alt={item.name}
            className={`w-full h-full object-cover transition-all duration-300 ${
              imageLoading ? 'opacity-0' : 'opacity-100 hover:scale-105'
            }`}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        )}
        
        {(imageError || !menuImage?.imageUrl) && (
          <div 
            className="w-full h-full flex flex-col items-center justify-center"
            style={{ backgroundColor: fallbackColor }}
          >
            <span className="text-5xl mb-2">{emoji}</span>
            <span className="text-white font-bold text-xs text-center px-2 line-clamp-2">
              {item.name}
            </span>
          </div>
        )}
        
        {/* Quantity Badge */}
        {quantity > 0 && (
          <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full gradient-orange text-primary-foreground text-xs font-bold flex items-center justify-center shadow-float border-2 border-white z-10">
            {quantity}
          </div>
        )}
        
        {/* Price Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-1 z-10">
          <span className="text-white font-bold text-xs">₱{item.price}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3">
        <p className="font-bold text-foreground text-sm leading-tight line-clamp-2 min-h-[40px]">
          {item.name}
        </p>
      </div>
    </motion.button>
  );
};

export default MenuItem;