import { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Save, Loader2, Camera, Trash2, ShieldCheck, FileCheck, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { compressImageTo100KB } from '@/lib/imageCompressor';
import { resolveAvatarUrl } from '@/lib/media';

export default function CustomerProfile() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setAvatarPreview(resolveAvatarUrl(user.avatar) || null);
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      try {
        setIsCompressing(true);
        const { file: compressedFile, originalSize, compressedSize, isCompressed } =
          await compressImageTo100KB(file, `passport_${user?.id || 'user'}`);

        setAvatarFile(compressedFile);

        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(compressedFile);

        const compressedKB = (compressedSize / 1024).toFixed(1);
        if (isCompressed) {
          const originalKB = (originalSize / 1024).toFixed(0);
          toast.success(
            `Passport compressed from ${originalKB}KB to ${compressedKB}KB (renamed to ${compressedFile.name})!`,
            { duration: 5000 }
          );
        } else {
          toast.success(`Passport loaded (${compressedKB}KB, renamed to ${compressedFile.name})`);
        }
      } catch (err: any) {
        console.error('Passport compression error:', err);
        toast.error('Failed to process passport image.');
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleRemovePhoto = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter your full name');
      return;
    }

    try {
      setIsSaving(true);

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('phone', phone.trim());

      if (avatarFile) {
        formData.append('avatar', avatarFile);
        if (avatarPreview && avatarPreview.startsWith('data:image')) {
          formData.append('avatar_base64', avatarPreview);
        }
      } else if (avatarPreview === null) {
        formData.append('avatar', '');
      }

      const res = await api.post('/auth/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        setUser(res.data);
        if (res.data.avatar) {
          setAvatarPreview(resolveAvatarUrl(res.data.avatar) || null);
        }
      }
      toast.success('Profile photo and details updated successfully!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-36 sm:pb-16">
      {/* Profile Header Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative group shrink-0">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white/40 shadow-xl overflow-hidden bg-white/20 flex items-center justify-center text-white font-black text-3xl sm:text-4xl backdrop-blur-md">
            {avatarPreview ? (
              <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
            ) : (
              <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white text-orange-600 p-2.5 rounded-full shadow-lg hover:bg-orange-50 transition transform hover:scale-110"
            title="Upload Profile Photo"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center sm:text-left">
          <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-2 inline-block">
            {user?.role === 'admin'
              ? 'Administrator Account'
              : user?.role === 'rider'
              ? 'Delivery Rider'
              : user?.role === 'kitchen'
              ? 'Kitchen Chef'
              : 'Valued Customer'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-black">{name || 'Your Name'}</h1>
          <p className="text-orange-100 text-xs sm:text-sm font-medium">{user?.email}</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-black text-gray-900">Personal Profile Settings</h2>
            <p className="text-xs text-gray-500 font-medium">Update your account picture, name and contact details</p>
          </div>
          <div className="flex items-center space-x-1 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Management Row */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-600 font-black text-xl flex items-center justify-center overflow-hidden shrink-0 border border-orange-200">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : 'U'}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Passport / Profile Photo</p>
                <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Max 100KB limit (Auto-compressed & renamed in browser)
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="flex-1 sm:flex-none bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {isCompressing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                <span>{isCompressing ? 'Compressing...' : 'Upload Passport'}</span>
              </button>

              {avatarPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-orange-500" /> Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-orange-500" /> Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 font-semibold text-sm focus:outline-none cursor-not-allowed"
                disabled
              />
              <p className="text-[11px] text-gray-400 mt-1">Email is linked to your campus portal account.</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2 flex items-center">
                <Phone className="w-4 h-4 mr-2 text-orange-500" /> Phone Number
              </label>
              <input
                type="tel"
                placeholder="E.g., 08012345678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              onClick={() => {
                useAuthStore.getState().logout();
                window.location.href = '/login';
              }}
              className="w-full sm:w-auto bg-red-50 hover:bg-red-100 text-red-600 font-bold px-6 py-3.5 rounded-2xl text-sm transition flex items-center justify-center space-x-2 border border-red-200"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout of Account</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600 text-white px-8 py-3.5 rounded-2xl font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-orange-200 disabled:opacity-70 text-sm"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
