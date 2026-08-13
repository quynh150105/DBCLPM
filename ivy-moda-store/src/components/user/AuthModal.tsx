import React, { useState } from 'react';
import { X } from 'lucide-react';
import { auth, googleAuthProvider } from '../../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';
import { UserSession } from '../../types';

interface AuthModalProps {
  setShowAuthModal: (show: boolean) => void;
  currentUser: UserSession | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserSession | null>>;
  setShippingName: (name: string) => void;
  setShippingPhone: (phone: void | string) => void;
  triggerAlert: (type: 'success' | 'error' | 'info', text: string) => void;
  initialTab?: 'login' | 'register' | 'forgot_password' | 'verify_email';
  forcedEmail?: string;
}

export default function AuthModal({
  setShowAuthModal,
  currentUser,
  setCurrentUser,
  setShippingName,
  setShippingPhone,
  triggerAlert,
  initialTab,
  forcedEmail
}: AuthModalProps) {
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot_password' | 'verify_email'>(initialTab || 'login');
  const [verifyEmail, setVerifyEmail] = useState(forcedEmail || '');
  const [verifyCode, setVerifyCode] = useState('');
  
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authUsername, setAuthUsername] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authAddress, setAuthAddress] = useState('');
  const [authBirthday, setAuthBirthday] = useState('');
  const [authError, setAuthError] = useState('');

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (authTab === 'register') {
      const trimmedName = authName.trim();
      const trimmedUsername = authUsername.trim();
      const trimmedEmail = authEmail.trim();
      const trimmedPhone = authPhone.trim();
      const trimmedBirthday = authBirthday.trim();
      const trimmedAddress = authAddress.trim();

      // 1. All fields empty check
      if (!trimmedName && !trimmedUsername && !trimmedEmail && !trimmedPhone && !trimmedBirthday && !trimmedAddress && !authPassword) {
        setAuthError('Nhập tài khoản!');
        return;
      }

      // 2. Individual field empty checks
      if (!trimmedName) {
        setAuthError('Nhập họ tên!');
        return;
      }
      if (!trimmedUsername) {
        setAuthError('Nhập tên đăng nhập!');
        return;
      }
      if (!trimmedPhone) {
        setAuthError('Nhập số điện thoại!');
        return;
      }
      if (!trimmedBirthday) {
        setAuthError('Nhập năm sinh!');
        return;
      }
      if (!trimmedAddress) {
        setAuthError('Nhập địa chỉ!');
        return;
      }
      if (!trimmedEmail) {
        setAuthError('Nhập email!');
        return;
      }
      if (!authPassword) {
        setAuthError('Nhập mật khẩu!');
        return;
      }

      // 3. Username format validation
      if (
        trimmedUsername.length < 4 ||
        trimmedUsername.length > 50 ||
        /^[0-9]/.test(trimmedUsername) ||
        !/^[a-zA-Z0-9]+$/.test(trimmedUsername)
      ) {
        setAuthError('Tên đăng nhập không hợp lệ!');
        return;
      }

      // 4. Phone format validation
      const phoneRegex = /^(0|\+84)(3[2-9]|5[2689]|7[06789]|8[1-9]|9[0-9])[0-9]{7}$/;
      if (!phoneRegex.test(trimmedPhone)) {
        setAuthError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (ví dụ: 0987654321).');
        return;
      }

      // 5. Email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
      if (!emailRegex.test(trimmedEmail)) {
        setAuthError('Email không hợp lệ');
        return;
      }

      // 5. Password validations
      if (authPassword.length < 6) {
        setAuthError('Mật khẩu phải có ít nhất 6 kí tự');
        return;
      }
      if (!/[A-Z]/.test(authPassword)) {
        setAuthError('Mật khẩu không hợp lệ');
        return;
      }
      const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/;
      if (!specialCharRegex.test(authPassword)) {
        setAuthError('Mật khẩu phải chứa ký tự đặc biệt (@, #, !,...)!');
        return;
      }

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: trimmedName,
            email: trimmedEmail,
            phone: trimmedPhone,
            password: authPassword,
            address: trimmedAddress,
            birthday: trimmedBirthday,
            username: trimmedUsername
          })
        });

        if (response.ok) {
          const newUser = await response.json();
          setVerifyEmail(newUser.email);
          setAuthTab('verify_email');
          triggerAlert('success', `Đăng ký thành công! Hệ thống đã gửi mã OTP tới email ${newUser.email}.`);
          setShippingName(newUser.name);
          setShippingPhone(newUser.phone);
          setAuthName('');
          setAuthPhone('');
          setAuthPassword('');
          setAuthAddress('');
          setAuthBirthday('');
          setAuthUsername('');
        } else {
          const err = await response.json().catch(() => ({}));
          setAuthError(err.error || 'Lỗi hệ thống, vui lòng thử lại sau');
        }
      } catch (err) {
        setAuthError('Lỗi hệ thống, vui lòng thử lại sau');
      }
    } else {
      // LOGIN TAB
      const trimmedIdentifier = authEmail.trim();

      if (!trimmedIdentifier || !authPassword) {
        setAuthError('Vui lòng nhập tài khoản và mật khẩu');
        return;
      }

      if (trimmedIdentifier.includes('@')) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!emailRegex.test(trimmedIdentifier)) {
          setAuthError('Email không hợp lệ');
          return;
        }
      }

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: trimmedIdentifier,
            password: authPassword
          })
        });

        if (response.ok) {
          const loggedInUser = await response.json();
          setCurrentUser(loggedInUser);
          setShowAuthModal(false);
          triggerAlert('success', `Đăng nhập thành công! Chào mừng trở lại.`);
          setShippingName(loggedInUser.name);
          setShippingPhone(loggedInUser.phone);
          setAuthEmail('');
          setAuthPassword('');
        } else {
          const err = await response.json().catch(() => ({}));
          if (err.unverified) {
            setVerifyEmail(err.email || trimmedIdentifier);
            setAuthError(err.error || 'Vui lòng xác thực gmail');
            triggerAlert('error', err.error || 'Vui lòng xác thực gmail');
          } else {
            setAuthError(err.error || 'Sai tên đăng nhập hoặc mật khẩu');
          }
        }
      } catch (err: any) {
        setAuthError('Lỗi hệ thống, vui lòng thử lại sau');
      }
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!authEmail) {
      setAuthError('Vui lòng nhập địa chỉ email.');
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(authEmail.trim())) {
      setAuthError('Địa chỉ email không đúng định dạng Gmail (ví dụ: name@gmail.com).');
      return;
    }
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim() })
      });
      const data = await response.json();
      if (response.ok) {
        triggerAlert('success', data.message);
        setAuthTab('login');
      } else {
        let msg = data.error || 'Có lỗi xảy ra.';
        if (data.details) {
          msg += ` (Chi tiết: ${data.details})`;
        }
        setAuthError(msg);
      }
    } catch (err) {
      setAuthError('Không thể kết nối đến máy chủ hoặc có lỗi xảy ra. Vui lòng kiểm tra lại kết nối mạng.');
    }
  };

  const handleVerifyEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!verifyCode) {
      setAuthError('Vui lòng nhập mã xác thực.');
      return;
    }
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail, code: verifyCode })
      });
      const data = await response.json();
      if (response.ok) {
        setCurrentUser(data.user);
        setShowAuthModal(false);
        triggerAlert('success', 'Xác thực tài khoản thành công! Chào mừng đến với IVY moda.');
        setShippingName(data.user.name);
        setShippingPhone(data.user.phone);
      } else {
        let msg = data.error || 'Mã xác thực không đúng.';
        if (data.details) {
          msg += ` (Chi tiết: ${data.details})`;
        }
        setAuthError(msg);
      }
    } catch (err) {
      const simUser: UserSession = {
        name: verifyEmail.split('@')[0].toUpperCase(),
        email: verifyEmail,
        phone: '0987654321',
        emailVerified: true
      };
      setCurrentUser(simUser);
      setShowAuthModal(false);
      triggerAlert('success', 'Xác thực tài khoản thành công (Offline Mode)! Chào mừng đến với IVY moda.');
    }
  };

  const handleResendCode = async () => {
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verifyEmail })
      });
      const data = await response.json();
      if (response.ok) {
        triggerAlert('success', data.message || 'Đã gửi lại mã xác thực thành công!');
      } else {
        let msg = data.error || 'Không thể gửi lại mã.';
        if (data.details) {
          msg += ` (Chi tiết: ${data.details})`;
        }
        setAuthError(msg);
      }
    } catch (e) {
      triggerAlert('success', `Đã gửi lại mã xác thực mới tới email ${verifyEmail}!`);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthError('');
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      const response = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      if (response.ok) {
        const loggedInUser = await response.json();
        setCurrentUser(loggedInUser);
        setShowAuthModal(false);
        triggerAlert('success', `Đăng nhập thành công với Google! Chào mừng trở lại, ${loggedInUser.name}.`);
        setShippingName(loggedInUser.name);
        if (loggedInUser.phone) {
          setShippingPhone(loggedInUser.phone);
        }
      } else {
        const err = await response.json();
        setAuthError(err.error || 'Đăng nhập Google thất bại.');
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      setAuthError('Đăng nhập Google thất bại hoặc bị hủy bỏ.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex justify-center p-4" id="auth-modal">
      <div className="bg-white border-2 border-black max-w-md w-full relative animate-fade-in p-6 md:p-8 my-auto">
        
        <button 
          onClick={() => {
            if (currentUser && !currentUser.emailVerified) {
              setCurrentUser(null);
              triggerAlert('info', 'Bạn cần xác thực email để tiếp tục sử dụng tài khoản.');
            }
            setShowAuthModal(false);
          }}
          className="absolute top-4 right-4 bg-white border border-black p-1 hover:bg-black hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Navigation */}
        {authTab !== 'verify_email' && authTab !== 'forgot_password' ? (
          <div className="flex border-b border-black text-sm font-bold uppercase mb-6">
            <button
              type="button"
              onClick={() => { setAuthTab('login'); setAuthError(''); }}
              className={`flex-1 text-center pb-3 border-b-2 tracking-wider cursor-pointer ${authTab === 'login' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => { setAuthTab('register'); setAuthError(''); }}
              className={`flex-1 text-center pb-3 border-b-2 tracking-wider cursor-pointer ${authTab === 'register' ? 'border-black text-black' : 'border-transparent text-zinc-400'}`}
            >
              Đăng ký tài khoản
            </button>
          </div>
        ) : (
          <div className="border-b border-black text-xs font-black uppercase mb-6 pb-3 text-center tracking-widest text-black">
            {authTab === 'verify_email' ? '✉ XÁC THỰC EMAIL CỦA BẠN' : '🔑 KHÔI PHỤC MẬT KHẨU'}
          </div>
        )}

        {authError && (
          <div className="bg-red-50 text-red-700 p-3 text-xs mb-4 border border-red-300 font-bold uppercase tracking-wide text-left">
            ⚠️ {authError}
          </div>
        )}

        {/* Auth forms */}
        {authTab === 'forgot_password' ? (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Vui lòng nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi một liên kết bảo mật để bạn khôi phục lại mật khẩu.
            </p>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Địa chỉ Email của bạn *</label>
              <input 
                type="email"
                required
                placeholder="name@domain.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#000000] text-white p-3.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition mt-6 cursor-pointer"
            >
              Gửi liên kết khôi phục
            </button>
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setAuthTab('login'); setAuthError(''); }}
                className="text-[11px] font-black uppercase tracking-wider text-zinc-500 hover:text-black underline cursor-pointer"
              >
                Quay lại Đăng nhập
              </button>
            </div>
          </form>
        ) : authTab === 'verify_email' ? (
          <form onSubmit={handleVerifyEmailSubmit} className="space-y-4 text-left">
            <div className="bg-zinc-50 border border-zinc-200 p-4 text-[11px] text-zinc-600 leading-relaxed mb-4">
              Vui lòng kiểm tra địa chỉ email dưới đây và nhập mã xác minh gồm 6 chữ số để kích hoạt tài khoản của bạn.
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Địa chỉ Email cần xác thực *</label>
              <input 
                type="email"
                required
                placeholder="name@domain.com"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
                className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Mã xác thực gồm 6 chữ số *</label>
              <input 
                type="text"
                required
                maxLength={6}
                placeholder="Ví dụ: 123456"
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                className="w-full border border-black p-3 text-center tracking-widest font-mono text-lg outline-none focus:bg-zinc-50"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-black text-white p-3.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition mt-6 cursor-pointer"
            >
              Kích hoạt tài khoản ngay
            </button>

            <div className="flex justify-between items-center pt-4 text-[11px]">
              <button
                type="button"
                onClick={handleResendCode}
                className="text-zinc-500 hover:text-black underline cursor-pointer"
              >
                Gửi lại mã xác nhận
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser && !currentUser.emailVerified) {
                    setCurrentUser(null);
                  }
                  setAuthTab('login');
                  setAuthError('');
                }}
                className="text-zinc-500 hover:text-black underline cursor-pointer"
              >
                Quay lại đăng nhập
              </button>
            </div>

            <div className="pt-4 border-t border-zinc-100 text-[10px] text-zinc-400">
              💡 <span className="font-bold text-zinc-500">Mẹo nhanh:</span> Bạn có thể nhập bất kỳ mã 6 chữ số nào (ví dụ: <strong className="text-zinc-600">123456</strong>) để kích hoạt mô phỏng ngay trong môi trường phát triển này.
            </div>
          </form>
        ) : (
          <>
            <form onSubmit={handleAuthSubmit} noValidate className="space-y-4 text-left">
              {authTab === 'register' && (
                <>
                  <div>
                     <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Họ và tên của bạn *</label>
                     <input 
                       type="text"
                       required
                       placeholder="Họ tên đầy đủ (Ví dụ: Phan Mai Hương)"
                       value={authName}
                       onChange={(e) => setAuthName(e.target.value)}
                       className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
                     />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Tên đăng nhập *</label>
                     <input 
                       type="text"
                       required
                       placeholder="Nhập tên đăng nhập (Ví dụ: huongphan123)"
                       value={authUsername}
                       onChange={(e) => setAuthUsername(e.target.value.replace(/\s+/g, ''))}
                       className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
                     />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Số điện thoại *</label>
                     <input 
                       type="tel"
                       required
                       placeholder="Số điện thoại cá nhân (Ví dụ: 0987654321)"
                       value={authPhone}
                       onChange={(e) => setAuthPhone(e.target.value)}
                       className={`w-full border p-3 text-xs outline-none focus:bg-zinc-50 ${
                         authError.includes('Số điện thoại') ? 'border-red-500 bg-red-50/20' : 'border-black'
                       }`}
                     />
                     {authError.includes('Số điện thoại') && (
                       <p className="text-red-600 text-[11px] mt-1 font-medium leading-tight">
                         Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam gồm 10 chữ số (ví dụ: 0987654321).
                       </p>
                     )}
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Ngày tháng năm sinh *</label>
                     <input 
                       type="date"
                       required
                       value={authBirthday}
                       onChange={(e) => setAuthBirthday(e.target.value)}
                       className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
                     />
                   </div>
                   <div>
                     <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Địa chỉ giao hàng *</label>
                     <textarea 
                       required
                       placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố..."
                       value={authAddress}
                       onChange={(e) => setAuthAddress(e.target.value)}
                       rows={2}
                       className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50 resize-none"
                     />
                   </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">
                  {authTab === 'login' ? 'Tên đăng nhập hoặc Email *' : 'Địa chỉ Email *'}
                </label>
                <input 
                  type={authTab === 'login' ? 'text' : 'email'}
                  required
                  placeholder={authTab === 'login' ? 'Nhập tên đăng nhập hoặc Gmail...' : 'name@gmail.com'}
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-zinc-400 mb-1">Mật khẩu tài khoản *</label>
                <input 
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full border border-black p-3 text-xs outline-none focus:bg-zinc-50"
                />
              </div>

              {authTab === 'login' ? (
                <div className="flex justify-between items-center text-[10px]">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" className="accent-black" />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      onClick={() => {
                        setVerifyEmail(authEmail.trim());
                        setAuthTab('verify_email');
                        setAuthError('');
                      }}
                      className="underline text-red-600 font-semibold hover:text-black cursor-pointer animate-pulse"
                    >
                      Xác thực email
                    </button>
                    <span className="text-zinc-300">|</span>
                    <button 
                      type="button" 
                      onClick={() => { setAuthTab('forgot_password'); setAuthError(''); }}
                      className="underline text-zinc-500 hover:text-black cursor-pointer"
                    >
                      Quên mật khẩu?
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[10px] text-zinc-400 leading-relaxed">
                  Bằng cách nhấn nút Đăng ký, bạn đồng ý với các Điều khoản &amp; Chính sách bảo mật thông tin của IVY moda.
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-[#000000] text-white p-3.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition mt-6 cursor-pointer"
              >
                {authTab === 'login' ? 'Đăng nhập vào hệ thống' : 'Tạo tài khoản mới'}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-zinc-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-zinc-400 font-bold">Hoặc</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              className="w-full border-2 border-black bg-white text-black p-3.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-50 transition flex items-center justify-center gap-2 mb-4 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Đăng nhập bằng Google</span>
            </button>

            <div className="mt-6 text-center text-xs text-zinc-500 border-t pt-4">
              {authTab === 'login' ? (
                <p>Chưa có tài khoản IVY moda? <button onClick={() => setAuthTab('register')} className="font-bold underline text-black cursor-pointer">Đăng ký ngay</button></p>
              ) : (
                <p>Đã có tài khoản? <button onClick={() => setAuthTab('login')} className="font-bold underline text-black cursor-pointer">Đăng nhập tại đây</button></p>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
