import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  X,
  Building2,
  Banknote,
} from 'lucide-react';
import api from '@/lib/axios';
import toast from 'react-hot-toast';

interface LocationItem {
  id: number;
  name: string;
  delivery_fee: number;
  is_active: boolean;
  created_at?: string;
}

export default function AdminLocations() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationItem | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | string>(500);
  const [isActive, setIsActive] = useState(true);

  // Fetch all locations (Admin view)
  const { data: locations, isLoading } = useQuery({
    queryKey: ['adminLocations'],
    queryFn: async () => {
      const res = await api.get('/admin/locations');
      return res.data as LocationItem[];
    },
  });

  // Create location mutation
  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; delivery_fee: number; is_active: boolean }) => {
      return api.post('/locations', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocations'] });
      toast.success('Campus delivery location added successfully!');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create location');
    },
  });

  // Update location mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; delivery_fee: number; is_active: boolean };
    }) => {
      return api.put(`/locations/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocations'] });
      toast.success('Location updated successfully!');
      closeModal();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update location');
    },
  });

  // Delete location mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.delete(`/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminLocations'] });
      toast.success('Location deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete location');
    },
  });

  const openAddModal = () => {
    setEditingLocation(null);
    setName('');
    setDeliveryFee(500);
    setIsActive(true);
    setIsAddModalOpen(true);
  };

  const openEditModal = (loc: LocationItem) => {
    setEditingLocation(loc);
    setName(loc.name);
    setDeliveryFee(loc.delivery_fee);
    setIsActive(loc.is_active);
    setIsAddModalOpen(true);
  };

  const closeModal = () => {
    setIsAddModalOpen(false);
    setEditingLocation(null);
    setName('');
    setDeliveryFee(500);
    setIsActive(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a location name');
      return;
    }

    const numericFee = Number(deliveryFee);
    if (isNaN(numericFee) || numericFee < 0) {
      toast.error('Please enter a valid delivery fee');
      return;
    }

    const payload = {
      name: name.trim(),
      delivery_fee: numericFee,
      is_active: isActive,
    };

    if (editingLocation) {
      updateMutation.mutate({ id: editingLocation.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number, locName: string) => {
    if (confirm(`Are you sure you want to delete "${locName}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredLocations =
    locations?.filter((loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 inline-block">
            Campus Logistics Configuration
          </span>
          <h1 className="text-3xl font-black mb-1">Campus Delivery Locations & Fees</h1>
          <p className="text-orange-100 text-sm max-w-xl">
            Configure campus spots, hostels, and academic faculties along with their specific delivery rates for customers.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="bg-white text-orange-600 hover:bg-orange-50 font-black px-6 py-3.5 rounded-2xl shadow-lg transition flex items-center space-x-2 text-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Location</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search campus location or hostel name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs font-bold text-gray-500">
          <span>Total Spots:</span>
          <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-black text-sm">
            {locations?.length || 0}
          </span>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center text-orange-500">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-medium">
            No campus delivery locations found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  <th className="py-4 px-6">Location Spot</th>
                  <th className="py-4 px-6">Delivery Fee</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-sm">
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50/80 transition">
                    <td className="py-4 px-6 font-bold text-gray-900 flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <span>{loc.name}</span>
                    </td>
                    <td className="py-4 px-6 font-black text-orange-600 text-base">
                      ₦{Number(loc.delivery_fee).toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {loc.is_active ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Disabled
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => openEditModal(loc)}
                          className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition"
                          title="Edit Fee & Name"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Delete Spot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-500" />
                {editingLocation ? 'Edit Delivery Location' : 'Add Campus Delivery Spot'}
              </h3>
              <button onClick={closeModal} className="p-1 hover:bg-gray-200 rounded-full transition">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-orange-500" /> Location / Hostel / Faculty Name
                </label>
                <input
                  type="text"
                  placeholder="E.g., Hostel Block B (Female Hostel)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-bold text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-orange-500" /> Delivery Fee (₦)
                </label>
                <input
                  type="number"
                  placeholder="E.g., 500"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  min={0}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-black text-orange-600"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  This fee will automatically apply at checkout when customers choose this spot.
                </p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="text-sm font-bold text-gray-800 cursor-pointer">
                  Active for Customer Checkout
                </label>
              </div>

              <div className="pt-4 flex items-center space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-2xl transition text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="w-1/2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-2xl transition text-sm flex items-center justify-center space-x-2 shadow-lg shadow-orange-200 disabled:opacity-70"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingLocation ? 'Save Changes' : 'Create Spot'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
