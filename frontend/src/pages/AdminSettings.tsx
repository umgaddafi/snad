import { useState, useEffect } from 'react';
import { Save, Loader2, Wrench, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const FacebookIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
  </svg>
);
const TwitterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
  </svg>
);
const InstagramIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    store_status: 'open',
    maintenance_mode: 'false',
    maintenance_message:
      'Snad Kitchen is currently undergoing scheduled platform upgrades to make your food ordering experience faster and smoother.',
    delivery_fee: '500',
    announcement_text: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings');
      return res.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData((prev) => ({
        ...prev,
        ...settings,
      }));
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return api.post('/settings', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Platform settings & maintenance mode updated!');
    },
    onError: () => {
      toast.error('Failed to save settings.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  const isMaintenanceActive = formData.maintenance_mode === 'true';

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Platform Settings</h2>
        <p className="text-sm text-gray-500 font-medium">Configure store availability, maintenance mode, and announcements</p>
      </div>

      {/* Maintenance Mode Toggle Card */}
      <div
        className={`p-6 sm:p-8 rounded-3xl border transition shadow-sm ${
          isMaintenanceActive
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-950'
            : 'bg-white border-gray-100'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200/60 pb-6 mb-6">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-2xl ${
                isMaintenanceActive ? 'bg-amber-500 text-white' : 'bg-orange-100 text-orange-600'
              }`}
            >
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                System Maintenance Mode
                {isMaintenanceActive && (
                  <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                    ACTIVE NOW
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                When enabled, public customers will see the Maintenance Page while developers work on the site. Admins retain full dashboard access.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setFormData((prev) => ({
                ...prev,
                maintenance_mode: prev.maintenance_mode === 'true' ? 'false' : 'true',
              }))
            }
            className={`relative inline-flex h-8 w-16 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isMaintenanceActive ? 'bg-amber-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isMaintenanceActive ? 'translate-x-8' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isMaintenanceActive && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs font-bold text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Maintenance Mode is currently enabled. Regular site visitors will be greeted with the Maintenance Page.
            </span>
          </div>
        )}

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
            Custom Maintenance Banner Message
          </label>
          <textarea
            rows={3}
            value={formData.maintenance_message}
            onChange={(e) => setFormData({ ...formData, maintenance_message: e.target.value })}
            placeholder="Explain why the platform is down or when it will be back online..."
            className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          />
        </div>
      </div>

      {/* General Store Configuration Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4">Store Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
              Store Status
            </label>
            <select
              value={formData.store_status}
              onChange={(e) => setFormData({ ...formData, store_status: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value="open">🟢 Open (Accepting Orders)</option>
              <option value="closed">🔴 Closed (Pause Orders)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
              Announcement Ticker Text (Homepage Banner)
            </label>
            <input
              type="text"
              placeholder="E.g., 📢 Hot Amala & Fresh Jollof available today at Male Hostel B!"
              value={formData.announcement_text}
              onChange={(e) => setFormData({ ...formData, announcement_text: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <h3 className="text-xl font-black text-gray-900 border-b border-gray-100 pb-4 mt-8">
          Social Media Links (Footer)
        </h3>
        <div className="space-y-4">
          <div className="relative">
            <FacebookIcon />
            <input
              type="url"
              placeholder="https://facebook.com/snadkitchen"
              value={formData.facebook_url}
              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <TwitterIcon />
            <input
              type="url"
              placeholder="https://twitter.com/snadkitchen"
              value={formData.twitter_url}
              onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div className="relative">
            <InstagramIcon />
            <input
              type="url"
              placeholder="https://instagram.com/snadkitchen"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={() => saveMutation.mutate(formData)}
            disabled={saveMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold transition flex items-center space-x-2 w-full sm:w-auto justify-center disabled:opacity-70 shadow-lg shadow-orange-200 text-sm"
          >
            {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            <span>Save Platform Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
