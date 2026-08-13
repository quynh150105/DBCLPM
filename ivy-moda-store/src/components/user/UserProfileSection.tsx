import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, Save, ArrowLeft, Shield, Lock } from 'lucide-react';
import { UserSession } from '../../types';

interface UserProfileSectionProps {
  currentUser: UserSession | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  setShowUserProfile: (show: boolean) => void;
  triggerAlert: (type: 'success' | 'error' | 'info', text: string) => void;
}

export default function UserProfileSection({
  currentUser,
  setCurrentUser,
  setShowUserProfile,
  triggerAlert,
}: UserProfileSectionProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Nam' as 'Nam' | 'Nữ' | 'Khác' | '',
    birthday: '',
    address: '',
  });

  // Change Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    if (newPassword.length < 6) {
      triggerAlert('error', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      triggerAlert('error', 'Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/users/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đổi mật khẩu thất bại.');
      }

      triggerAlert('success', 'Đổi mật khẩu thành công! Một email thông báo đã được gửi đến bạn.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      triggerAlert('error', err.message);
    } finally {
      setChangingPassword(false);
    }
  };

  // Pull latest full profile details from server on mount
  useEffect(() => {
    if (currentUser?.email) {
      setLoading(true);
      fetch(`/api/users/profile?email=${encodeURIComponent(currentUser.email)}`)
        .then(res => {
          if (!res.ok) throw new Error();
          return res.json();
        })
        .then(data => {
          setFormData({
            name: data.name || currentUser.name || '',
            email: data.email || currentUser.email || '',
            phone: data.phone || currentUser.phone || '',
            gender: data.gender || 'Nam',
            birthday: data.birthday || '',
            address: data.address || '',
          });
          // Update global session with retrieved role/details
          setCurrentUser(prev => prev ? { ...prev, ...data } : null);
        })
        .catch(() => {
          // Fallback to currently cached session details
          setFormData({
            name: currentUser.name || '',
            email: currentUser.email || '',
            phone: currentUser.phone || '',
            gender: currentUser.gender || 'Nam',
            birthday: currentUser.birthday || '',
            address: currentUser.address || '',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [currentUser?.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.email) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂÂÊÔƠƯưăâêôơưẠ-ỹ\s]{2,50}$/;

    if (!formData.name.trim()) {
      triggerAlert('error', 'Vui lòng điền họ và tên.');
      return;
    }
    if (!nameRegex.test(formData.name.trim())) {
      triggerAlert('error', 'Họ tên không hợp lệ. Vui lòng chỉ nhập chữ cái và khoảng trắng (từ 2 đến 50 ký tự).');
      return;
    }

    if (!formData.email.trim()) {
      triggerAlert('error', 'Vui lòng điền địa chỉ email.');
      return;
    }
    if (!emailRegex.test(formData.email.trim())) {
      triggerAlert('error', 'Địa chỉ email không đúng định dạng Gmail (ví dụ: name@gmail.com).');
      return;
    }

    if (!formData.phone.trim()) {
      triggerAlert('error', 'Vui lòng điền số điện thoại.');
      return;
    }
    if (!phoneRegex.test(formData.phone.trim())) {
      triggerAlert('error', 'Số điện thoại Việt Nam không hợp lệ. Vui lòng nhập đúng 10 chữ số.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/users/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUser.uid,
          originalEmail: currentUser.email,
          ...formData,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Cập nhật thất bại');
      }

      // Sync state back to app context
      setCurrentUser(prev => prev ? { ...prev, ...result.user } : null);
      triggerAlert('success', 'Đã lưu thông tin hồ sơ thành công vào cơ sở dữ liệu!');
    } catch (err: any) {
      console.error(err);
      triggerAlert('error', err.message || 'Lỗi kết nối khi cập nhật hồ sơ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50 py-10 px-4 md:px-12 text-left" id="user-profile-section">
      <div className="max-w-2xl mx-auto">
        {/* Back navigation button */}
        <button
          onClick={() => setShowUserProfile(false)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-500 hover:text-black mb-6 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại cửa hàng
        </button>

        {/* Profile Card wrapper */}
        <div className="bg-white border-2 border-black p-6 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-200 pb-6 mb-8 gap-4">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-wider text-black flex items-center gap-2">
                HỒ SƠ THÀNH VIÊN
              </h1>
              <p className="text-xs text-zinc-500 mt-1">Cập nhật thông tin nhận hàng và tùy chỉnh tài khoản mua sắm IVY.</p>
            </div>
            
            {currentUser?.role === 'admin' && (
              <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-700 border border-amber-500/30 px-3 py-1.5 rounded">
                <Shield className="w-3.5 h-3.5" /> Quản trị viên
              </span>
            )}
          </div>

          {loading && !formData.name ? (
            <div className="py-12 text-center text-xs font-bold uppercase tracking-wider text-zinc-500 animate-pulse">
              Đang kết nối cơ sở dữ liệu...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Profile Fields Group */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Full name input field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Họ và Tên</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-black p-3 pl-10 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] transition"
                      placeholder="Nguyễn Văn A"
                    />
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Account email address */}
                <div className="space-y-1.5 opacity-100">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Email đăng ký</label>
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 border rounded ${
                      currentUser?.emailVerified 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-red-50 text-red-700 border-red-300'
                    }`}>
                      {currentUser?.emailVerified ? '✓ Đã xác thực' : '⚠ Chưa xác thực'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full border border-black p-3 pl-10 text-xs font-medium bg-zinc-100 text-zinc-500 cursor-not-allowed outline-none transition"
                      placeholder="example@gmail.com"
                    />
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Telephone phone input field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Số điện thoại</label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full border border-black p-3 pl-10 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] transition"
                      placeholder="Ví dụ: 0912345678"
                    />
                    <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Date of Birth / Birthday field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Ngày sinh</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.birthday}
                      onChange={e => setFormData({ ...formData, birthday: e.target.value })}
                      className="w-full border border-black p-3 pl-10 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] transition"
                    />
                    <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                  </div>
                </div>

                {/* Gender toggle selector options */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Giới tính</label>
                  <div className="flex gap-4">
                    {['Nam', 'Nữ', 'Khác'].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormData({ ...formData, gender: g as any })}
                        className={`flex-1 border-2 py-3 text-xs font-bold uppercase transition cursor-pointer text-center ${
                          formData.gender === g
                            ? 'border-black bg-black text-white'
                            : 'border-zinc-200 bg-white text-zinc-700 hover:border-black'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Standard default shipping Address location */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Địa chỉ giao hàng mặc định</label>
                  <div className="relative">
                    <textarea
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full border border-black p-3 pl-10 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] h-24 resize-none transition"
                      placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố..."
                    />
                    <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-4" />
                  </div>
                </div>

              </div>

              {/* Submit Save Profile Button */}
              <div className="pt-4 border-t border-zinc-100 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-black hover:bg-zinc-800 text-white font-black uppercase tracking-wider text-xs px-6 py-3.5 flex items-center gap-2 transition cursor-pointer border-2 border-black disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>

            </form>
          )}

          {/* Change Password Form */}
          {currentUser && (
            <div className="border-t-2 border-dashed border-zinc-200 pt-8 mt-8">
              <h3 className="text-sm font-black uppercase tracking-wider text-black mb-4 flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#b41b1b]" /> THAY ĐỔI MẬT KHẨU
              </h3>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Mật khẩu mới *</label>
                    <input
                      type="password"
                      required
                      placeholder="Nhập mật khẩu mới"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full border border-black p-3 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] transition"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-zinc-400 block">Xác nhận mật khẩu mới *</label>
                    <input
                      type="password"
                      required
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full border border-black p-3 text-xs font-medium bg-white outline-none focus:border-[#b41b1b] transition"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="bg-[#b41b1b] hover:bg-red-800 text-white font-black uppercase tracking-wider text-[10px] px-5 py-3 transition cursor-pointer border border-[#b41b1b] disabled:opacity-50"
                  >
                    {changingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới'}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
