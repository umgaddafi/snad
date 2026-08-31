import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Edit, Trash2, Eye, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import Pagination from '@/components/common/Pagination';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  orders_count: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCustomers() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    }
  });

  const customers = users?.filter(u => u.role === 'customer') || [];
  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = customers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      toast.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsEditing(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to update user')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to delete user')
  });

  const handleEdit = (user: User) => {
    setEditForm({ name: user.name, phone: user.phone || '', role: user.role });
    setSelectedUser(user);
    setIsEditing(true);
  };

  const submitEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: editForm });
    }
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Email & Phone</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Orders</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" /> Loading users...
                  </td>
                </tr>
              )}
              {paginatedCustomers?.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.phone || 'No phone'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                      user.role === 'rider' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{user.orders_count || 0}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button 
                      onClick={() => { setSelectedUser(user); setIsEditing(false); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleEdit(user)}
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition" title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={customers.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* View/Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {isEditing ? 'Edit User' : 'User Details'}
              </h3>
              <button onClick={() => { setSelectedUser(null); setIsEditing(false); }} className="p-2 hover:bg-gray-200 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6">
              {isEditing ? (
                <form onSubmit={submitEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input 
                      type="text" 
                      required
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input 
                      type="text" 
                      value={editForm.phone}
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select 
                      value={editForm.role}
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="customer">Customer</option>
                      <option value="rider">Rider</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <button 
                    type="submit"
                    disabled={updateMutation.isPending}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition mt-4 disabled:opacity-70"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Name</p>
                    <p className="text-lg font-medium text-gray-900">{selectedUser.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Email</p>
                    <p className="text-lg font-medium text-gray-900">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Phone</p>
                    <p className="text-lg font-medium text-gray-900">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Role</p>
                    <p className="text-lg font-medium text-gray-900 capitalize">{selectedUser.role}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Joined Date</p>
                    <p className="text-lg font-medium text-gray-900">{new Date(selectedUser.created_at).toLocaleString()}</p>
                  </div>
                </div>
              )}
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete User?</h3>
              <p className="text-gray-500">Are you sure you want to delete this user? This action cannot be undone.</p>
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
