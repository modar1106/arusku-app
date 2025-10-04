import { useState } from 'react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth'; // <-- 1. Import fungsi baru
import { auth } from '../services/firebase';
import Input from '../components/ui/Input';
import AuthLayout from '../components/auth/AuthLayout';
import { Link } from 'react-router-dom';
import Modal from '../components/ui/Modal'; // <-- 2. Import komponen Modal

export default function LoginPage() {
  // State untuk form login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // --- 3. State baru untuk modal Lupa Password ---
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [modalMessage, setModalMessage] = useState({ type: '', text: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Email dan password harus diisi.');

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      if (err.code === 'auth/invalid-credential') {
        setError('Email atau password yang Anda masukkan salah.');
      } else {
        setError('Terjadi kesalahan saat mencoba login.');
      }
    }
  };

  // --- 4. Fungsi baru untuk handle Lupa Password ---
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setModalMessage({ type: '', text: '' });
    if (!resetEmail) {
      setModalMessage({ type: 'error', text: 'Email harus diisi.' });
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setModalMessage({ type: 'success', text: 'Link reset password telah dikirim! Silakan periksa inbox email Anda.' });
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setModalMessage({ type: 'error', text: 'Email tidak terdaftar.' });
      } else {
        setModalMessage({ type: 'error', text: 'Gagal mengirim email reset.' });
      }
    }
  };

 return (
    <AuthLayout title="Hello, Welcome!">
      <form onSubmit={handleLogin}>
        <div className="py-4">
          <Input name="email" type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="py-4">
          <Input isPassword name="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>

        {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}

        <div className="flex justify-between w-full py-4 text-sm text-gray-800 dark:text-gray-300">
          <label className="flex items-center">
            <input type="checkbox" name="ch" className="mr-1" />
            Ingat saya
          </label>
          <span onClick={() => setIsForgotModalOpen(true)} className="font-bold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
            Lupa password?
          </span>
        </div>

        <div className="flex gap-4">
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Login
          </button>
          <Link to="/register" className="w-full border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 text-md p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-center">
            Sign Up
          </Link>
        </div>
      </form>

      {/* --- 6. Render Modal --- */}
      <Modal isOpen={isForgotModalOpen} onClose={() => setIsForgotModalOpen(false)} title="Reset Password">
        <form onSubmit={handleForgotPassword} className="space-y-4">
          <p className="text-sm text-gray-600">Masukkan alamat email Anda. Kami akan mengirimkan link untuk mereset password Anda.</p>
          <Input
            name="resetEmail" type="email" placeholder="Alamat Email"
            value={resetEmail} onChange={(e) => setResetEmail(e.target.value)}
          />

          {modalMessage.text && (
            <p className={`${modalMessage.type === 'success' ? 'text-green-500' : 'text-red-500'} text-sm text-center`}>
              {modalMessage.text}
            </p>
          )}

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
            Kirim Link Reset
          </button>
        </form>
      </Modal>
    </AuthLayout>
  );
}