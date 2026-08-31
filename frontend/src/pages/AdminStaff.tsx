import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Edit, Trash2, Eye, X, UserPlus, Shield, ChefHat, Bike } from 'lucide-react';
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

export default function AdminStaff() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [editForm, setEditForm] = useState({ name: '', phone: '', role: '' });
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'kitchen',
  });

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => {
      const res = await api.get('/users');
      return res.data as User[];
    }
  });

  const staff = users?.filter(u => u.role !== 'customer') || [];
  const totalPages = Math.ceil(staff.length / ITEMS_PER_PAGE);
  const paginatedStaff = staff.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const createMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return api.post('/users', data);
    },
    onSuccess: () => {
      toast.success('New staff member added successfully!');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsAdding(false);
      setCreateForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'kitchen',
      });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add staff member');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      return api.put(`/users/${id}`, data);
    },
    onSuccess: () => {
      toast.success('Staff details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsEditing(false);
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to update staff member')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      toast.success('Staff member deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setSelectedUser(null);
    },
    onError: () => toast.error('Failed to delete staff member')
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

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleDelete = (id: number) => {
    setDeletingId(id);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Snad Staff Management</h2>
          <p className="text-sm text-gray-500">Add, manage, and assign roles for your kitchen, riders, and administrative team.</p>
        </div>

        <button
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-3 rounded-2xl transition flex items-center gap-2 shadow-lg shadow-orange-500/25"
        >
          <UserPlus className="w-5 h-5" />
          <span>Add New Staff</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Email & Phone</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Role</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500">Orders Managed</th>
                <th className="px-6 py-4 text-sm font-semibold text-gray-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-orange-500" /> Loading staff members...
                  </td>
                </tr>
              )}
              {paginatedStaff?.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition">
                  <td className="px-6 py-4 font-bold text-gray-900">{user.name}</td>
                  <td className="px-6 py-4">
                    <p className="text-gray-900 font-medium">{user.email}</p>
                    <p className="text-xs text-gray-500">{user.phone || 'No phone provided'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                      user.role === 'rider' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role === 'admin' && <Shield className="w-3 h-3" />}
                      {user.role === 'kitchen' && <ChefHat className="w-3 h-3" />}
                      {user.role === 'rider' && <Bike className="w-3 h-3" />}
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
              {staff?.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">No staff members found. Click "Add New Staff" to create one.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => setCurrentPage(page)}
          totalItems={staff.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {/* Add Staff Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-orange-500" />
                Add New Staff Member
              </h3>
              <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.name}
                  onChange={e => setCreateForm({...createForm, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. staff@snadkitchen.com"
                  value={createForm.email}
                  onChange={e => setCreateForm({...createForm, email: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Minimum 8 characters"
                  value={createForm.password}
                  onChange={e => setCreateForm({...createForm, password: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="text" 
                  placeholder="080XXXXXXXX"
                  value={createForm.phone}
                  onChange={e => setCreateForm({...createForm, phone: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">Assign Staff Role</label>
                <select 
                  value={createForm.role}
                  onChange={e => setCreateForm({...createForm, role: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold"
                >
                  <option value="kitchen">Kitchen Chef (Manages Cooking & Incoming Orders)</option>
                  <option value="rider">Delivery Rider (Pickups & Campus Deliveries)</option>
                  <option value="admin">Administrator (Full System Access)</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={createMutation.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3.5 rounded-xl transition mt-4 disabled:opacity-70 text-sm shadow-md"
              >
                {createMutation.isPending ? 'Creating Account...' : 'Create Staff Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">
                {isEditing ? 'Edit Staff Member' : 'Staff Details'}
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
              <p className="text-gray-500">Are you sure you want to delete this staff member? This action cannot be undone.</p>
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
