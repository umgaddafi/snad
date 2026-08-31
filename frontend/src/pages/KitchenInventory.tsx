import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import api from '@/lib/axios';

interface Food {
  id: number;
  name: string;
  is_available: boolean;
}

export default function KitchenInventory() {
  const { data: foods, isLoading } = useQuery({
    queryKey: ['inventoryFoods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return res.data.data as Food[];
    }
  });

  if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;

  const outOfStock = foods?.filter(f => !f.is_available) || [];
  const inStock = foods?.filter(f => f.is_available) || [];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Kitchen Inventory Alerts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-red-50 border border-red-100 p-6 rounded-3xl h-fit">
          <h3 className="text-red-800 font-bold mb-4 text-lg border-b border-red-200 pb-2">Critical Low / Out of Stock</h3>
          {outOfStock.length === 0 ? (
            <p className="text-red-600/70 text-sm italic">All items are currently stocked.</p>
          ) : (
            <ul className="space-y-2">
              {outOfStock.map(f => (
                <li key={f.id} className="text-red-700 font-medium text-sm flex items-center before:content-['•'] before:mr-2 before:text-red-400">{f.name}</li>
              ))}
            </ul>
          )}
        </div>
        
        <div className="bg-green-50 border border-green-100 p-6 rounded-3xl h-fit">
          <h3 className="text-green-800 font-bold mb-4 text-lg border-b border-green-200 pb-2">Healthy Stock</h3>
          {inStock.length === 0 ? (
            <p className="text-green-600/70 text-sm italic">No items available.</p>
          ) : (
            <ul className="space-y-2">
              {inStock.map(f => (
                <li key={f.id} className="text-green-700 font-medium text-sm flex items-center before:content-['•'] before:mr-2 before:text-green-400">{f.name}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
