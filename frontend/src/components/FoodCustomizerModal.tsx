import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, ShoppingBag, Flame, Sparkles, Check } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import toast from 'react-hot-toast';
import { resolveMealImageUrl } from '@/lib/media';

export interface FoodItem {
  id: number;
  name: string;
  price: number;
  description: string;
  category: { id: number; name: string };
  image_url: string | null;
}

interface FoodCustomizerModalProps {
  food: FoodItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ADDONS = [
  { id: 'beef', name: 'Extra Beef', price: 500 },
  { id: 'chicken', name: 'Extra Fried Chicken', price: 700 },
  { id: 'plantain', name: 'Fried Plantain (Dodo)', price: 300 },
  { id: 'egg', name: 'Fried Egg', price: 200 },
  { id: 'zobo', name: 'Chilled Zobo Drink', price: 350 },
  { id: 'water', name: 'Bottled Water', price: 200 },
];

const SPICE_LEVELS = ['Mild', 'Medium Spicy', 'Extra Hot'];

export default function FoodCustomizerModal({ food, isOpen, onClose }: FoodCustomizerModalProps) {
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>('Medium Spicy');
  const [instructions, setInstructions] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  const addItem = useCartStore((state) => state.addItem);

  if (!isOpen || !food) return null;

  const toggleAddon = (addonName: string) => {
    setSelectedAddons((prev) =>
      prev.includes(addonName) ? prev.filter((a) => a !== addonName) : [...prev, addonName]
    );
  };

  // Calculate extra cost
  const addonCost = selectedAddons.reduce((sum, name) => {
    const found = DEFAULT_ADDONS.find((a) => a.name === name);
    return sum + (found ? found.price : 0);
  }, 0);

  const unitPrice = food.price + addonCost;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    const customizations = [...selectedAddons];
    if (spiceLevel) customizations.push(`Spice: ${spiceLevel}`);

    addItem({
      food_id: food.id,
      name: food.name,
      price: unitPrice,
      quantity,
      image: resolveMealImageUrl(food.image_url) || undefined,
      customizations,
      instructions: instructions.trim() || undefined,
    });

    toast.success(`Added ${quantity}x ${food.name} to cart!`);
    onClose();
    // reset state
    setSelectedAddons([]);
    setSpiceLevel('Medium Spicy');
    setInstructions('');
    setQuantity(1);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
        >
          {/* Header Image */}
          <div className="relative h-48 bg-gradient-to-tr from-orange-500 to-amber-400 overflow-hidden">
            {food.image_url ? (
              <img src={resolveMealImageUrl(food.image_url)} alt={food.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/80">
                <ShoppingBag className="w-16 h-16" />
              </div>
            )}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/40 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-md transition"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              {food.category.name}
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 overflow-y-auto flex-grow space-y-6">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-gray-900">{food.name}</h2>
                <span className="text-2xl font-bold text-orange-600">₦{food.price.toLocaleString()}</span>
              </div>
              <p className="text-gray-600 text-sm mt-1">{food.description}</p>
            </div>

            {/* Add-ons Selection */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Select Extra Add-ons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DEFAULT_ADDONS.map((addon) => {
                  const isSelected = selectedAddons.includes(addon.name);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddon(addon.name)}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-medium transition ${
                        isSelected
                          ? 'border-orange-500 bg-orange-50/70 text-orange-900'
                          : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border ${
                            isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span>{addon.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500">+₦{addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spice Preference */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Spice Level
              </h3>
              <div className="flex gap-2">
                {SPICE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSpiceLevel(level)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                      spiceLevel === level
                        ? 'bg-red-50 border-red-500 text-red-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
                Special Kitchen Instructions
              </label>
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="E.g., Extra pepper on top, packaging separate, less salt..."
                rows={2}
                className="w-full p-3 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
            <div className="flex items-center border border-gray-200 rounded-full bg-white px-3 py-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-1 text-gray-600 hover:text-orange-600 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-bold text-gray-900 text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="p-1 text-gray-600 hover:text-orange-600 transition"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3.5 px-6 rounded-full font-bold shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition transform active:scale-95"
            >
              <ShoppingBag className="w-5 h-5" />
              Add to Cart • ₦{totalPrice.toLocaleString()}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
