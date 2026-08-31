import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
  slug: string;
  is_active: boolean;
}

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ['adminCategories'],
    queryFn: async () => {
      const res = await api.get('/categories');
      return res.data as Category[];
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = name.toLowerCase().replace(/\s+/g, '-');
      if (editingCategory) {
        return api.put(`/categories/${editingCategory.id}`, { name });
      }
      return api.post('/categories', { name, slug, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      toast.success(editingCategory ? 'Category updated!' : 'Category created!');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
      toast.success('Category deleted!');
    }
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setName('');
  };

  const openNew = () => {
    setEditingCategory(null);
    setName('');
    setIsModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Menu Categories</h2>
        <button onClick={openNew} className="bg-gray-900 text-white px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">ID</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Slug</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading...
                  </td>
                </tr>
              )}
              {categories?.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 text-gray-500 font-medium">#{cat.id}</td>
                  <td className="px-6 py-4 font-bold text-gray-900">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => openEdit(cat)} className="text-gray-400 hover:text-blue-600 transition"><Edit2 className="w-5 h-5 inline-block" /></button>
                    <button onClick={() => setDeletingId(cat.id)} className="text-gray-400 hover:text-red-600 transition"><Trash2 className="w-5 h-5 inline-block" /></button>
                  </td>
                </tr>
              ))}
              {categories?.length === 0 && !isLoading && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No categories found. Click Add Category to create one.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Breakfast" className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:outline-none" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="px-6 py-2 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition">Cancel</button>
                <button type="submit" disabled={saveMutation.isPending} className="px-6 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-700 transition flex items-center">
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingCategory ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Category?</h3>
              <p className="text-gray-500">This will also affect meals in this category. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeletingId(null)} className="flex-1 px-4 py-3 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition">Cancel</button>
              <button 
                onClick={() => { deleteMutation.mutate(deletingId); setDeletingId(null); }} 
                className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition"
              >Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
