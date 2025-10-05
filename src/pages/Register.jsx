import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../utils/defaultData';
import Input from '../components/ui/Input';
import AuthLayout from '../components/auth/AuthLayout';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!email || !password) return setError('Email dan password harus diisi.');
    if (password.length < 6) return setError('Password minimal harus 6 karakter.');
    
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const batch = writeBatch(db);

      DEFAULT_EXPENSE_CATEGORIES.forEach(categoryName => {
        const docRef = doc(collection(db, 'categories'));
        batch.set(docRef, {
          userId: user.uid,
          name: categoryName,
          type: 'expense'
        });
      });

      DEFAULT_INCOME_CATEGORIES.forEach(categoryName => {
        const docRef = doc(collection(db, 'categories'));
        batch.set(docRef, {
          userId: user.uid,
          name: categoryName,
          type: 'income'
        });
      });

      await batch.commit();

      setSuccess('Akun berhasil dibuat! Silakan login.');
      setEmail('');
      setPassword('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Alamat email ini sudah terdaftar.');
      } else {
        setError('Terjadi kesalahan saat mendaftar.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Create Account">
      <form onSubmit={handleRegister}>
        <div className="py-4">
          <Input name="email" type="email" placeholder="Alamat Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="py-4">
          <Input isPassword name="password" placeholder="Password (min. 6 karakter)" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        
        {error && <p className="text-red-500 text-sm text-center py-2">{error}</p>}
        {success && <p className="text-green-500 text-sm text-center py-2">{success}</p>}

        <div className="flex gap-4 pt-4">
          <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300">
            {loading ? 'Mendaftar...' : 'Sign Up'}
          </button>
          <Link to="/login" className="w-full border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-300 text-md p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-center">
            Login
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
