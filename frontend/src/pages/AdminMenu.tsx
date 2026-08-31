import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import { resolveMealImageUrl } from '@/lib/media';
import Pagination from '@/components/common/Pagination';

interface Category {
  id: number;
  name: string;
}

interface Food {
  id: number;
  name: string;
  price: number;
  description: string;
  is_available: boolean;
  category: Category;
  image_url: string | null;
}

const ITEMS_PER_PAGE = 10;

export default function AdminMenu() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    image: null as File | null,
    is_available: true
  });

  // Queries
  const { data: foods, isLoading: loadingFoods } = useQuery({
    queryKey: ['adminFoods'],
    queryFn: async () => {
      const res = await api.get('/foods');
      return res.data.data as Food[];
    }
  });

  const foodsList = foods || [];
  const totalPages = Math.ceil(foodsList.length / ITEMS_PER_PAGE);
  const paginatedFoods = foodsList.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data as Category[];
    }
  });

  // Mutations
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = new FormData();
      payload.append('name', data.name);
      payload.append('category_id', data.category_id);
      payload.append('price', data.price);
      payload.append('description', data.description);
      payload.append('is_available', data.is_available ? '1' : '0');
      
      if (data.image) {
        payload.append('image', data.image);
      }

      if (editingFood) {
        payload.append('_method', 'PUT');
        return api.post(`/foods/${editingFood.id}`, payload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      return api.post('/foods', payload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFoods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/foods/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminFoods'] });
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });

  const resetForm = () => {
    setEditingFood(null);
    setFormData({
      name: '',
      category_id: '',
      price: '',
      description: '',
      image: null,
      is_available: true
    });
  };

  const openModalForNew = () => {
    resetForm();
    if (categories && categories.length > 0) {
      setFormData(prev => ({ ...prev, category_id: categories[0].id.toString() }));
    }
    setIsModalOpen(true);
  };

  const openModalForEdit = (food: Food) => {
    setEditingFood(food);
    setFormData({
      name: food.name,
      category_id: food.category.id.toString(),
      price: food.price.toString(),
      description: food.description || '',
      image: null,
      is_available: food.is_available
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Menu & Inventory</h2>
        <button 
          onClick={openModalForNew}
          className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Meal</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Meal Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Category</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Price</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loadingFoods && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading meals...
                  </td>
                </tr>
              )}
              {paginatedFoods?.map(food => (
                <tr key={food.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                      {food.image_url ? <img src={resolveMealImageUrl(food.image_url)} alt="" className="w-full h-full object-cover" /> : '🍲'}
                    </div>
                    <span>{food.name}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{food.category?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">₦{Number(food.price).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${food.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {food.is_available ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openModalForEdit(food)} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-5 h-5 inline-block" /></button>
                    <button 
                      onClick={() => setDeletingId(food.id)}
                      className="text-gray-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-5 h-5 inline-block" />
                    </button>
                  </td>
                </tr>
              ))}
              {foodsList.length === 0 && !loadingFoods && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No meals found. Click Add New Meal to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={foodsList.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">{editingFood ? 'Edit Meal' : 'Add New Meal'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-grow">
              <form id="food-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Meal Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₦)</label>
                    <input required type="number" min="0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select required value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none">
                      <option value="">Select Category</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none"></textarea>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Image Upload (Optional)</label>
                  <input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files ? e.target.files[0] : null})} className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                  {editingFood && editingFood.image_url && !formData.image && (
                    <p className="text-xs text-gray-500 mt-2">Current image: {editingFood.image_url.split('/').pop()}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input type="checkbox" id="is_available" checked={formData.is_available} onChange={e => setFormData({...formData, is_available: e.target.checked})} className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" />
                  <label htmlFor="is_available" className="text-sm text-gray-700">Currently Available in Stock</label>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition">Cancel</button>
              <button type="submit" form="food-form" disabled={saveMutation.isPending} className="px-6 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition flex items-center">
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {editingFood ? 'Save Changes' : 'Create Meal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center space-y-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-8 h-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Meal?</h3>
              <p className="text-gray-500">Are you sure you want to delete this meal? This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
              <button 
                onClick={() => {
                  deleteMutation.mutate(deletingId);
                  setDeletingId(null);
                }} 
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
